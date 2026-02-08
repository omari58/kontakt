import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as oidc from 'openid-client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthorizationUrlResult, AuthResult, OidcClaims } from './dto/auth.dto';

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

    const claims = tokens.claims() as OidcClaims;

    const user = await this.prisma.user.upsert({
      where: { oidcSub: claims.sub },
      create: {
        oidcSub: claims.sub,
        email: claims.email ?? '',
        name: claims.name ?? '',
      },
      update: {
        email: claims.email ?? '',
        name: claims.name ?? '',
      },
    });

    const token = this.generateToken(user);

    return { user, token };
  }

  generateToken(user: { id: string; email: string; role: string }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
