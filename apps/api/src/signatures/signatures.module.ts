import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SignaturesService } from './signatures.service';
import { SignaturesController } from './signatures.controller';

@Module({
  imports: [AuthModule],
  controllers: [SignaturesController],
  providers: [SignaturesService],
})
export class SignaturesModule {}
