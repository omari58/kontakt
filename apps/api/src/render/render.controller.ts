import {
  Controller,
  Get,
  Param,
  Render,
  UseFilters,
} from '@nestjs/common';
import { RenderService } from './render.service';
import { CardNotFoundFilter } from './card-not-found.filter';

@Controller('c')
@UseFilters(CardNotFoundFilter)
export class RenderController {
  constructor(private readonly renderService: RenderService) {}

  @Get(':slug')
  @Render('card')
  async renderCard(@Param('slug') slug: string) {
    return this.renderService.getCardViewData(slug);
  }

  @Get('404')
  @Render('card-404')
  renderCard404() {
    return { title: 'Card Not Found' };
  }
}
