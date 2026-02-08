import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Static assets and views for future Handlebars templates
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/public' });
  app.setBaseViewsDir(join(__dirname, '..', 'templates'));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Kontakt API running on http://localhost:${port}`);
}
bootstrap();
