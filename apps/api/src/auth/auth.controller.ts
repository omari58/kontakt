import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard, SESSION_COOKIE } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('auth/login')
  async login(@Res() res: Response): Promise<void> {
    const { url, codeVerifier, state } = await this.authService.getAuthorizationUrl();

    // Store PKCE code verifier in an HTTP-only cookie for the callback
    res.cookie('oidc_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    res.cookie('oidc_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
    });

    res.redirect(url);
  }

  @Get('auth/callback')
  async callback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const codeVerifier = req.cookies?.oidc_code_verifier;

    if (!codeVerifier) {
      throw new UnauthorizedException('Missing OIDC code verifier');
    }

    const currentUrl = new URL(
      `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    );

    const { token } = await this.authService.handleCallback(currentUrl, codeVerifier);

    // Set session JWT in HTTP-only cookie
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Clean up OIDC flow cookies
    res.clearCookie('oidc_code_verifier');
    res.clearCookie('oidc_state');

    // Redirect to frontend dashboard
    res.redirect('/');
  }

  @Post('auth/logout')
  logout(@Res() res: Response): void {
    res.clearCookie(SESSION_COOKIE);
    res.json({ message: 'Logged out' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: any): Promise<any> {
    const user = await this.authService.getUserById(currentUser.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
