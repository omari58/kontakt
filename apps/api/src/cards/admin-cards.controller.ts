import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { AdminCardResponseDto } from './dto/admin-card-response.dto';
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
    @Query('page') rawPage = '1',
    @Query('limit') rawLimit = '20',
    @Query('search') search?: string,
  ): Promise<{ data: AdminCardResponseDto[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, parseInt(rawPage, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 20));
    const result = await this.cardsService.findAll({
      page,
      limit,
      search,
    });

    return {
      data: result.data.map(AdminCardResponseDto.fromCardWithUser),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
