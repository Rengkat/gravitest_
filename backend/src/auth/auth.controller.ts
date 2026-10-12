import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type Redis from 'ioredis';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiTooManyRequestsResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser, UserId } from './decorators/current-user.decorator';

import {
  ForgotPasswordDto,
  LoginDto,
  RegisterUserDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailOtpDto,
} from './dto/auth.dto';
import { AuthService, RefreshTokenContext } from './auth.service';
import { SessionService } from './session.service';
import { GoogleAuthGuard, FacebookAuthGuard } from './guards/oauth.guard';
import { isGoogleOAuthConfigured, isFacebookOAuthConfigured } from './strategies/oauth-config.util';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────
  // PUBLIC ROUTES
  // ─────────────────────────────────────────────

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new user account with email, password, and profile information. Sends a verification OTP to the provided email.',
  })
  @ApiBody({ type: RegisterUserDto })
  @ApiCreatedResponse({
    description: 'User registered successfully. Verification email sent.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Registration successful. Please verify your email.',
        },
        userId: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        email: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation failed',
  })
  @ApiConflictResponse({
    description: 'Email already registered',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many registration attempts from this IP',
  })
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns access token, refresh token, and user profile. Includes device and location information for session management.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: 'JWT access token',
          example: 'eyJhbGciOiJIUzI1NiIs...',
        },
        refreshToken: {
          type: 'string',
          description: 'JWT refresh token',
          example: 'eyJhbGciOiJIUzI1NiIs...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            isVerified: { type: 'boolean' },
          },
        },
        expiresIn: { type: 'number', example: 3600 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials or input data',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many login attempts. Account temporarily locked.',
  })
  @ApiResponse({
    status: 403,
    description: 'Email not verified',
  })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  // ═══════════════════════════════════════════════
  // SOCIAL LOGIN (Google / Facebook)
  // ═══════════════════════════════════════════════
  //
  // Flow: GET /auth/google redirects to Google's consent screen ->
  // Google redirects back to GET /auth/google/callback with the user's
  // profile already verified by Passport -> we find-or-create the local
  // User and issue real tokens -> rather than putting those tokens
  // directly in the callback redirect URL (they'd leak via browser
  // history, the Referer header, and server access logs), we stash them
  // in Redis behind a random one-time code with a 60-second TTL and
  // redirect to the frontend with just that code -> the frontend calls
  // POST /auth/social/exchange once to trade the code for the real
  // tokens, and the code is deleted immediately whether it succeeds or not.

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Start Google OAuth login — redirects to Google' })
  googleLogin() {
    // Guard handles the redirect to Google; this body never runs.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback — redirects to the frontend with a one-time exchange code' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.completeSocialLogin(req, res);
  }

  @Public()
  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Start Facebook OAuth login — redirects to Facebook' })
  facebookLogin() {
    // Guard handles the redirect to Facebook; this body never runs.
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'Facebook OAuth callback — redirects to the frontend with a one-time exchange code' })
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    return this.completeSocialLogin(req, res);
  }

  @Public()
  @Get('providers')
  @ApiOperation({ summary: 'Which social login providers are actually configured on this server' })
  @ApiOkResponse({ schema: { example: { google: false, facebook: false } } })
  getAvailableProviders() {
    return {
      google: isGoogleOAuthConfigured(),
      facebook: isFacebookOAuthConfigured(),
    };
  }

  private async completeSocialLogin(req: Request, res: Response) {
    const frontendUrl = this.configService.get<string>('appConfig.frontendUrl') ?? 'http://localhost:3000';
    try {
      const authResponse = await this.authService.handleSocialLogin(req.user as any, req);

      const code = crypto.randomBytes(32).toString('hex');
      await this.redis.set(`oauth_exchange:${code}`, JSON.stringify(authResponse), 'EX', 60);

      res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
    } catch (err: any) {
      const message = encodeURIComponent(err?.message ?? 'Social login failed. Please try again.');
      res.redirect(`${frontendUrl}/auth/callback?error=${message}`);
    }
  }

  @Public()
  @Post('social/exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a one-time OAuth code for real tokens',
    description: 'The code is single-use and expires after 60 seconds — see the /auth/google/callback flow above.',
  })
  @ApiBody({ schema: { type: 'object', required: ['code'], properties: { code: { type: 'string' } } } })
  @ApiOkResponse({ description: 'Tokens retrieved' })
  @ApiBadRequestResponse({ description: 'Code is invalid, already used, or expired' })
  async exchangeSocialCode(@Body('code') code: string) {
    if (!code) throw new BadRequestException('Missing code');
    const key = `oauth_exchange:${code}`;
    const raw = await this.redis.get(key);
    await this.redis.del(key); // one-time use, regardless of outcome

    if (!raw) {
      throw new BadRequestException('This sign-in link has expired or was already used. Please try again.');
    }
    return JSON.parse(raw);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with OTP',
    description:
      'Verify user email address using the OTP sent during registration. Required before first login.',
  })
  @ApiBody({ type: VerifyEmailOtpDto })
  @ApiOkResponse({
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email verified successfully.' },
        verified: { type: 'boolean', example: true },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired OTP',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many verification attempts',
  })
  verifyEmail(@Body() dto: VerifyEmailOtpDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification OTP',
    description:
      'Request a new verification OTP if the previous one expired or was not received. Rate limited to prevent abuse.',
  })
  @ApiBody({ type: ResendVerificationDto })
  @ApiOkResponse({
    description: 'Verification OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Verification OTP sent to your email.',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
  })
  @ApiNotFoundResponse({
    description: 'No account found with this email',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many OTP requests. Please wait before requesting again.',
  })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.sendEmailVerificationOtp(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      "Send a password reset link to the user's email. The link contains a time-limited token for password reset.",
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({
    description: 'Password reset email sent if account exists',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'If an account with that email exists, a password reset link has been sent.',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid email format',
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many password reset requests',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Reset user password using the token received via email. Token expires after a set period for security.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({
    description: 'Password reset successful',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Password reset successful. You can now login with your new password.',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired reset token',
  })
  @ApiResponse({
    status: 400,
    description: 'New password cannot be the same as old password',
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ─────────────────────────────────────────────
  // REFRESH  (uses the refresh guard, not access guard)
  // ─────────────────────────────────────────────

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchange a valid refresh token for a new access token and refresh token pair. The old refresh token is invalidated after use (token rotation).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Valid refresh token',
          example: 'eyJhbGciOiJIUzI1NiIs...',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: 'New JWT access token',
          example: 'eyJhbGciOiJIUzI1NiIs...',
        },
        refreshToken: {
          type: 'string',
          description: 'New JWT refresh token',
          example: 'eyJhbGciOiJIUzI1NiIs...',
        },
        expiresIn: { type: 'number', example: 3600 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired, or revoked refresh token',
  })
  @ApiBadRequestResponse({
    description: 'Missing refresh token in request body',
  })
  refresh(@CurrentUser() ctx: RefreshTokenContext, @Req() req: Request) {
    return this.authService.refreshTokens(ctx, req);
  }

  // ─────────────────────────────────────────────
  // AUTHENTICATED ROUTES
  // ─────────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieve the profile of the currently authenticated user. Includes user details, roles, and account status.',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        email: { type: 'string', example: 'user@example.com' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        role: { type: 'string', example: 'STUDENT' },
        isVerified: { type: 'boolean', example: true },
        avatar: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or token is invalid/expired',
  })
  getProfile(@UserId() userId: string) {
    return this.authService.getProfile(userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout (current session)',
    description:
      "Revoke the current session by invalidating the access token's JTI. The refresh token will also be invalidated.",
  })
  @ApiOkResponse({
    description: 'Logged out successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully.' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or token is invalid',
  })
  logout(@CurrentUser() user: { id: string; jti: string }) {
    return this.authService.logout(user.id, user.jti);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout from all devices',
    description:
      'Revoke all active sessions for the current user. This invalidates all access and refresh tokens across all devices.',
  })
  @ApiOkResponse({
    description: 'Logged out from all devices successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logged out from all devices successfully.',
        },
        sessionsRevoked: { type: 'number', example: 3 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated or token is invalid',
  })
  logoutAll(@UserId() userId: string) {
    return this.authService.logoutAll(userId);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List my active sessions',
    description: 'All non-expired, non-revoked sessions for the current user — powers the "Active Sessions" list in account security settings.',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  listSessions(@UserId() userId: string, @CurrentUser() user: { jti: string }) {
    return this.sessionService.listActive(userId).then((sessions) =>
      sessions.map((s) => ({
        id: s.id,
        deviceName: s.deviceName,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        isCurrent: s.jti === user.jti,
      })),
    );
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sign out of one specific device/session',
    description: 'Revokes a single session by id. Scoped to the caller — you can only revoke your own sessions.',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  async revokeSession(@UserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    await this.sessionService.revokeOwnSession(userId, id);
    return { message: 'Session revoked.' };
  }
}
