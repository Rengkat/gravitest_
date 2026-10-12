import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Inject, Logger, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/auth/config/jwtConfig';
import { JwtAccessPayload } from 'src/auth/interfaces/jwt-payload.interface';

interface AuthenticatedSocket extends Socket {
  data: { userId: string; role: string };
}

// Rooms are prefixed by feature so one gateway/namespace can serve all
// three realtime use cases from the tech stack without traffic bleeding
// between them:
//   exam:{sessionId}        — CBT timer sync, auto-submit warnings
//   leaderboard:{scope}     — live game/exam leaderboard updates
//   whiteboard:{roomId}     — tldraw shape/cursor relay for tutor sessions
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly jwtConf: ConfigType<typeof jwtConfig>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        (client.handshake.headers.authorization?.toString().replace('Bearer ', ''));

      if (!token) throw new UnauthorizedException('Missing auth token');

      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.jwtConf.accessSecret,
        issuer: this.jwtConf.issuer,
        audience: this.jwtConf.audience,
      });

      client.data.userId = payload.sub;
      client.data.role = payload.role;
      this.logger.log(`Socket connected: user=${payload.sub} socket=${client.id}`);
    } catch (err) {
      this.logger.warn(`Rejected socket connection: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('exam:join')
  handleExamJoin(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { sessionId: string }) {
    client.join(`exam:${data.sessionId}`);
    return { joined: `exam:${data.sessionId}` };
  }

  @SubscribeMessage('leaderboard:join')
  handleLeaderboardJoin(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { scope: string }) {
    client.join(`leaderboard:${data.scope}`);
    return { joined: `leaderboard:${data.scope}` };
  }

  @SubscribeMessage('whiteboard:join')
  handleWhiteboardJoin(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { roomId: string }) {
    client.join(`whiteboard:${data.roomId}`);
    return { joined: `whiteboard:${data.roomId}` };
  }

  // Relays a whiteboard event to everyone else in the room. tldraw's
  // store-change events are the expected payload shape; this gateway
  // stays payload-agnostic and just fans it out.
  @SubscribeMessage('whiteboard:event')
  handleWhiteboardEvent(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; event: unknown },
  ) {
    client.to(`whiteboard:${data.roomId}`).emit('whiteboard:event', {
      userId: client.data.userId,
      event: data.event,
    });
  }

  /** Called by GamesService / QuestionsService, not by clients directly. */
  emitLeaderboardUpdate(scope: string, payload: unknown) {
    this.server.to(`leaderboard:${scope}`).emit('leaderboard:update', payload);
  }

  /** Called by the exam-session timer job to push tick/warning/auto-submit events. */
  emitExamTick(sessionId: string, payload: unknown) {
    this.server.to(`exam:${sessionId}`).emit('exam:tick', payload);
  }
}
