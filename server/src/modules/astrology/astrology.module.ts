import { Module, Global } from '@nestjs/common';
import { AstrologyService } from './astrology.service';

@Global()
@Module({
  providers: [AstrologyService],
  exports: [AstrologyService],
})
export class AstrologyModule {}
