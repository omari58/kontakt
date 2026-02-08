import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ContactsService } from './contacts.service';

@Controller('cards/:slug/vcf')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async getVCard(@Param('slug') slug: string, @Res() res: Response): Promise<void> {
    const { vcf, filename } = await this.contactsService.generateVCard(slug);

    res.set({
      'Content-Type': 'text/vcard',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(vcf);
  }
}
