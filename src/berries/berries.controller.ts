import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { BerriesService } from './berries.service';
import { BerryQueryDto } from './dto/berry.dto';

@Controller('berries')
export class BerriesController {
  constructor(private readonly berriesService: BerriesService) {}

  /**
   * GET /berries
   * Obtener lista de berries con filtros y paginación
   */
  @Get()
  async findAll(@Query() query: BerryQueryDto) {
    return this.berriesService.findAll(query);
  }

  /**
   * GET /berries/firmnesses
   * Obtener todas las firmezas disponibles
   */
  @Get('firmnesses')
  async getFirmnesses() {
    return this.berriesService.getFirmnesses();
  }

  /**
   * GET /berries/flavors
   * Obtener todos los sabores disponibles
   */
  @Get('flavors')
  async getFlavors() {
    return this.berriesService.getFlavors();
  }

  /**
   * GET /berries/:id
   * Obtener una berry específica por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.berriesService.findOne(id);
  }
}
