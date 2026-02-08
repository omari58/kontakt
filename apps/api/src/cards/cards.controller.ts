import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/dto/auth.dto';
import { Card } from '@prisma/client';

@Controller('me')
export class MyCardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('cards')
  @UseGuards(JwtAuthGuard)
  async findMyCards(@CurrentUser() user: JwtPayload): Promise<Card[]> {
    return this.cardsService.findAllByUser(user.sub);
  }
}

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCardDto,
  ): Promise<Card> {
    return this.cardsService.create(user.sub, dto);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<Card> {
    return this.cardsService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Card> {
    return this.cardsService.findOne(id, user.sub);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCardDto,
  ): Promise<Card> {
    return this.cardsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.cardsService.delete(id, user.sub);
  }
}
