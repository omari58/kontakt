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
import { CardResponseDto } from './dto/card-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/dto/auth.dto';

@Controller('me')
export class MyCardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('cards')
  @UseGuards(JwtAuthGuard)
  async findMyCards(@CurrentUser() user: JwtPayload): Promise<CardResponseDto[]> {
    const cards = await this.cardsService.findAllByUser(user.sub);
    return cards.map(CardResponseDto.fromCard);
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
  ): Promise<CardResponseDto> {
    const card = await this.cardsService.create(user.sub, dto);
    return CardResponseDto.fromCard(card);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<CardResponseDto> {
    const card = await this.cardsService.findBySlug(slug);
    return CardResponseDto.fromCard(card);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<CardResponseDto> {
    const isAdmin = user.role === 'ADMIN';
    const card = await this.cardsService.findOne(id, user.sub, isAdmin);
    return CardResponseDto.fromCard(card);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCardDto,
  ): Promise<CardResponseDto> {
    const isAdmin = user.role === 'ADMIN';
    const card = await this.cardsService.update(id, user.sub, dto, isAdmin);
    return CardResponseDto.fromCard(card);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    const isAdmin = user.role === 'ADMIN';
    await this.cardsService.delete(id, user.sub, isAdmin);
  }
}
