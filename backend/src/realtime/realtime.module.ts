import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/auth/config/jwtConfig';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [ConfigModule.forFeature(jwtConfig), JwtModule.register({})],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
