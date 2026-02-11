import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { SETTINGS_KEYS } from './settings/settings.constants';

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'OIDC_ISSUER',
  'OIDC_CLIENT_ID',
  'OIDC_CLIENT_SECRET',
  'OIDC_CALLBACK_URL',
];

function validateEnv(logger: Logger): void {
  const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    for (const name of missing) {
      logger.error(`Missing required environment variable: ${name}`);
    }
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

async function checkOidcDiscovery(logger: Logger): Promise<void> {
  const issuer = process.env.OIDC_ISSUER!;
  const discoveryUrl = `${issuer.replace(/\/+$/, '')}/.well-known/openid-configuration`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(discoveryUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      logger.warn(
        `OIDC discovery returned HTTP ${res.status} at ${discoveryUrl}`,
      );
    } else {
      logger.log('OIDC discovery endpoint is reachable');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(
      `OIDC discovery endpoint not reachable at ${discoveryUrl}: ${message}. The provider may start later.`,
    );
  }
}

async function seedDefaultSettings(
  prisma: PrismaService,
  logger: Logger,
): Promise<void> {
  const count = await prisma.setting.count();
  if (count > 0) {
    return;
  }

  const defaults = Object.values(SETTINGS_KEYS)
    .filter((s) => s.default !== null)
    .map((s) => ({ key: s.key, value: String(s.default) }));

  if (defaults.length === 0) {
    return;
  }

  await prisma.$transaction(
    defaults.map((d) =>
      prisma.setting.create({ data: { key: d.key, value: d.value } }),
    ),
  );

  logger.log(`Seeded ${defaults.length} default settings`);
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Validate required environment variables before starting the app
  validateEnv(logger);

  // Check OIDC discovery (warning only, non-blocking)
  await checkOidcDiscovery(logger);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', true);
  app.use(cookieParser());

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'c/(.*)', method: RequestMethod.GET }],
  });

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Static assets and views
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/public' });
  app.setBaseViewsDir(join(__dirname, '..', 'templates'));
  app.setViewEngine('hbs');

  // Enable graceful shutdown so NestJS properly closes the HTTP server
  // and runs OnModuleDestroy hooks (e.g. Prisma disconnect) on SIGTERM/SIGINT.
  // Skipped in watch mode: the watcher kills the old process before shutdown
  // completes, causing EADDRINUSE when the new process binds the same port.
  if (process.env.NODE_ENV === 'production') {
    app.enableShutdownHooks();
  }

  // Seed default settings on first run
  const prisma = app.get(PrismaService);
  await seedDefaultSettings(prisma, logger);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Kontakt API running on http://localhost:${port}`);
}
bootstrap();
