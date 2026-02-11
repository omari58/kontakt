import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { CreateSignatureDto } from './dto/create-signature.dto';
import { UpdateSignatureDto } from './dto/update-signature.dto';
import { SignatureResponseDto } from './dto/signature-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/dto/auth.dto';

@Controller('me/signatures')
@UseGuards(JwtAuthGuard)
export class SignaturesController {
  constructor(private readonly signaturesService: SignaturesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSignatureDto,
  ): Promise<SignatureResponseDto> {
    const signature = await this.signaturesService.create(user.sub, dto);
    return SignatureResponseDto.fromSignature(signature);
  }

  @Get()
  async findAll(@CurrentUser() user: JwtPayload): Promise<SignatureResponseDto[]> {
    const signatures = await this.signaturesService.findAllByUser(user.sub);
    return signatures.map(SignatureResponseDto.fromSignature);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<SignatureResponseDto> {
    const signature = await this.signaturesService.findOne(id, user.sub);
    return SignatureResponseDto.fromSignature(signature);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSignatureDto,
  ): Promise<SignatureResponseDto> {
    const signature = await this.signaturesService.update(id, user.sub, dto);
    return SignatureResponseDto.fromSignature(signature);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.signaturesService.remove(id, user.sub);
  }
}
