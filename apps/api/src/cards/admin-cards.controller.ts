import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardResponseDto } from './dto/card-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/cards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ): Promise<{ data: CardResponseDto[]; total: number; page: number; limit: number }> {
    const result = await this.cardsService.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
    });

    return {
      data: result.data.map(CardResponseDto.fromCard),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
