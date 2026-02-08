import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.session;

    if (!token) {
      throw new UnauthorizedException('No session cookie');
    }

    try {
      const payload = this.jwtService.verify(token);
      (request as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid session');
    }
  }
}
