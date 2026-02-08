import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

export const SESSION_COOKIE = 'kontakt_session';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const token = request.cookies?.[SESSION_COOKIE];

    if (!token) {
      throw new UnauthorizedException('No session cookie');
    }

    try {
      const payload = this.jwtService.verify(token);
      (request as any).user = payload;

      this.refreshTokenIfNeeded(payload, response);

      return true;
    } catch {
      throw new UnauthorizedException('Invalid session');
    }
  }

  private refreshTokenIfNeeded(
    payload: { sub: string; email: string; name: string; role: string; iat?: number; exp?: number },
    response: Response,
  ): void {
    if (!payload.iat || !payload.exp) return;

    const now = Math.floor(Date.now() / 1000);
    const totalLifetime = payload.exp - payload.iat;
    const elapsed = now - payload.iat;

    if (elapsed > totalLifetime * 0.5) {
      const newToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      });

      response.cookie(SESSION_COOKIE, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: totalLifetime * 1000,
      });
    }
  }
}
