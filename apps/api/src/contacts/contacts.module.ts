import { Module } from '@nestjs/common';
import { CardsModule } from '../cards/cards.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [CardsModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
