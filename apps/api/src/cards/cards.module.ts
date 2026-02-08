import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CardsService } from './cards.service';
import { CardsController, MyCardsController } from './cards.controller';

@Module({
  imports: [AuthModule],
  controllers: [CardsController, MyCardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
