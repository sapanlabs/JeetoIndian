import { Module } from '@nestjs/common';
import { WinnerController } from './winner.controller';
import { WinnerService } from './winner.service';

@Module({
  controllers: [WinnerController],
  providers: [WinnerService],
  exports: [WinnerService],
})
export class WinnerModule {}
