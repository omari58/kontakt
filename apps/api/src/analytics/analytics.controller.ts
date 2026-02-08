import { Controller, Post, Param, Req, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';

@Controller('cards/:slug/view')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  @HttpCode(204)
  async recordView(@Param('slug') slug: string, @Req() req: Request): Promise<void> {
    const ip = req.ip || 'unknown';
    await this.analyticsService.recordView(slug, ip);
  }
}
