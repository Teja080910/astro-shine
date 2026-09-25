import { Module, Global } from '@nestjs/common';
import { AstrologyService } from './astrology.service';
import { LocalAstrologyService } from './local-astrology.service';

@Global()
@Module({
  providers: [AstrologyService, LocalAstrologyService],
  exports: [AstrologyService],
})
export class AstrologyModule {}
