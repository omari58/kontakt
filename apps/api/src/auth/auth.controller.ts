import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { parseExpiryToMs, sessionCookieOptions, clearSessionCookieOptions } from './cookie-utils';
import { JwtAuthGuard, SESSION_COOKIE } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from './dto/auth.dto';

@Controller()
export class AuthController {
  private readonly sessionMaxAge: number;
  private readonly isProduction: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    const jwtExpiry = this.configService.get<string>('JWT_EXPIRY', '24h');
    this.sessionMaxAge = parseExpiryToMs(jwtExpiry);
    this.isProduction = this.configService.get<string>('NODE_ENV', 'development') === 'production';
  }

  @Get('auth/login')
  async login(@Res() res: Response): Promise<void> {
    const { url, codeVerifier, state } = await this.authService.getAuthorizationUrl();

    const oidcCookieOptions = {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax' as const,
      maxAge: 10 * 60 * 1000, // 10 minutes
    };

    res.cookie('oidc_code_verifier', codeVerifier, oidcCookieOptions);
    res.cookie('oidc_state', state, oidcCookieOptions);

    res.redirect(url);
  }

  @Get('auth/callback')
  async callback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const codeVerifier = req.cookies?.oidc_code_verifier;
    const storedState = req.cookies?.oidc_state;
    const returnedState = req.query?.state as string | undefined;

    if (!codeVerifier) {
      throw new UnauthorizedException('Missing OIDC code verifier');
    }

    if (!storedState || storedState !== returnedState) {
      throw new UnauthorizedException('Invalid OIDC state parameter');
    }

    const currentUrl = new URL(
      `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    );

    const { token } = await this.authService.handleCallback(currentUrl, codeVerifier, storedState);

    // Set session JWT in HTTP-only cookie with configured lifetime
    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(this.sessionMaxAge, this.isProduction));

    // Clean up OIDC flow cookies with matching options
    res.clearCookie('oidc_code_verifier', clearSessionCookieOptions(this.isProduction));
    res.clearCookie('oidc_state', clearSessionCookieOptions(this.isProduction));

    // Redirect to frontend dashboard
    res.redirect('/');
  }

  @Post('auth/logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res() res: Response): void {
    res.clearCookie(SESSION_COOKIE, clearSessionCookieOptions(this.isProduction));
    res.json({ message: 'Logged out' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: JwtPayload) {
    const user = await this.authService.getUserById(currentUser.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
