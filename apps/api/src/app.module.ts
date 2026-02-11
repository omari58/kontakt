import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CardsModule } from './cards/cards.module';
import { UploadsModule } from './uploads/uploads.module';
import { RenderModule } from './render/render.module';
import { ContactsModule } from './contacts/contacts.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SettingsModule } from './settings/settings.module';
import { SignaturesModule } from './signatures/signatures.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '..', '..', '.env'),
        '.env',
      ],
    }),
    StorageModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CardsModule,
    UploadsModule,
    RenderModule,
    ContactsModule,
    AnalyticsModule,
    SettingsModule,
    SignaturesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
