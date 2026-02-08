import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController, MyCardsController } from './cards.controller';

@Module({
  controllers: [CardsController, MyCardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
