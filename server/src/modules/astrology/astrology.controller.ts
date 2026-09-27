import { Controller, Get } from '@nestjs/common';
import { AstrologyService } from './astrology.service';

@Controller('astrology')
export class AstrologyController {
  constructor(private readonly astrology: AstrologyService) {}

  @Get('status')
  getStatus() {
    return this.astrology.getProviderStatus();
  }
}
