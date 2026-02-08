import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const codeVerifier = req.cookies?.oidc_code_verifier;

    if (!codeVerifier) {
      throw new Error('Missing OIDC code verifier');
    }

    const currentUrl = new URL(
      `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    );

    const result = await this.authService.handleCallback(currentUrl, codeVerifier);
    return result;
  }
}
