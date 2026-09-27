import { Module, Global } from '@nestjs/common';
import { AstrologyService } from './astrology.service';
import { LocalAstrologyService } from './local-astrology.service';
import { AstrologyController } from './astrology.controller';

@Global()
@Module({
  controllers: [AstrologyController],
  providers: [AstrologyService, LocalAstrologyService],
  exports: [AstrologyService, LocalAstrologyService],
})
export class AstrologyModule {}
