import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { AuthModule } from '../auth/auth.module';
import { CardsModule } from '../cards/cards.module';

@Module({
  imports: [AuthModule, CardsModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
