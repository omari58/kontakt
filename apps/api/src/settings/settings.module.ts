import { Global, Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsUploadService } from './settings-upload.service';
import { SettingsController } from './settings.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsUploadService],
  exports: [SettingsService],
})
export class SettingsModule {}
