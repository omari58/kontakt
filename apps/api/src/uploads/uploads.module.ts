import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { CardsModule } from '../cards/cards.module';
import { CardsService } from '../cards/cards.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [CardsModule],
  controllers: [UploadsController],
  providers: [
    {
      provide: UploadsService,
      useFactory: (cardsService: CardsService, prisma: PrismaService, configService: ConfigService) => {
        const uploadDir = configService.get<string>('UPLOAD_DIR', './uploads');
        return new UploadsService(cardsService, prisma, uploadDir);
      },
      inject: [CardsService, PrismaService, ConfigService],
    },
  ],
})
export class UploadsModule {}
