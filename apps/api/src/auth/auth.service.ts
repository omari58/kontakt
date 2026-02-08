import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as oidc from 'openid-client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationUrlResult, AuthResult } from './dto/auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private oidcConfig!: oidc.Configuration;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    const issuer = this.configService.getOrThrow<string>('OIDC_ISSUER');
    const clientId = this.configService.getOrThrow<string>('OIDC_CLIENT_ID');
    const clientSecret = this.configService.getOrThrow<string>('OIDC_CLIENT_SECRET');

    this.logger.log(`Discovering OIDC issuer: ${issuer}`);

    this.oidcConfig = await oidc.discovery(
      new URL(issuer),
      clientId,
      clientSecret,
    );

    this.logger.log('OIDC discovery complete');
  }

  async getAuthorizationUrl(): Promise<AuthorizationUrlResult> {
    const redirectUri = this.configService.getOrThrow<string>('OIDC_CALLBACK_URL');

    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
    const state = oidc.randomState();

    const parameters: Record<string, string> = {
      redirect_uri: redirectUri,
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    };

    const redirectTo = oidc.buildAuthorizationUrl(this.oidcConfig, parameters);

    return {
      url: redirectTo.href,
      codeVerifier,
      state,
    };
  }

  async handleCallback(
    currentUrl: URL,
    codeVerifier: string,
  ): Promise<AuthResult> {
    const tokens = await oidc.authorizationCodeGrant(
      this.oidcConfig,
      currentUrl,
      { pkceCodeVerifier: codeVerifier },
    );

    const claims = tokens.claims() as Record<string, unknown>;
    const sub = claims.sub as string;
    const email = (claims.email as string) ?? '';
    const name = (claims.name as string) ?? '';
    const role = this.extractRole(claims);

    const user = await this.prisma.user.upsert({
      where: { oidcSub: sub },
      create: {
        oidcSub: sub,
        email,
        name,
        role,
      },
      update: {
        email,
        name,
        role,
      },
    });

    const token = this.generateToken(user);

    return { user, token };
  }

  generateToken(user: { id: string; email: string; name: string; role: string }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }

  extractRole(claims: Record<string, unknown>): Role {
    const claimPath = this.configService.get<string>('OIDC_ADMIN_CLAIM', '');
    const claimValue = this.configService.get<string>('OIDC_ADMIN_CLAIM_VALUE', '');

    if (!claimPath || !claimValue) {
      return Role.USER;
    }

    const resolved = this.resolveClaimPath(claims, claimPath);

    if (resolved === undefined || resolved === null) {
      return Role.USER;
    }

    if (Array.isArray(resolved)) {
      return resolved.includes(claimValue) ? Role.ADMIN : Role.USER;
    }

    return String(resolved) === claimValue ? Role.ADMIN : Role.USER;
  }

  private resolveClaimPath(
    obj: Record<string, unknown>,
    path: string,
  ): unknown {
    const segments = path.split('.');
    let current: unknown = obj;

    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
