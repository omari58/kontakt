import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CardsService } from './cards.service';
import { CardsController, MyCardsController } from './cards.controller';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

@Module({
  imports: [AuthModule],
  controllers: [CardsController, MyCardsController, QrController],
  providers: [CardsService, QrService],
  exports: [CardsService],
})
export class CardsModule {}
