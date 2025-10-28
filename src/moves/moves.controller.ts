import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { MovesService } from './moves.service';
import { MovesQueryDto } from './dto/moves.dto';

@Controller('moves')
export class MovesController {
  constructor(private readonly movesService: MovesService) {}

  /**
   * GET /moves
   * Obtener lista de movimientos con paginación y filtros
   */
  @Get()
  async findAll(@Query() query: MovesQueryDto) {
    return this.movesService.findAll(query);
  }

  /**
   * GET /moves/types
   * Obtener todos los tipos disponibles para movimientos
   */
  @Get('types')
  async getTypes() {
    const types = await this.movesService.getTypes();
    return {
      data: types,
      total: types.length,
    };
  }

  /**
   * GET /moves/damage-classes
   * Obtener todas las clases de daño
   */
  @Get('damage-classes')
  async getDamageClasses() {
    const classes = await this.movesService.getDamageClasses();
    return {
      data: classes,
      total: classes.length,
    };
  }

  /**
   * GET /moves/:id
   * Obtener detalles de un movimiento por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movesService.findOne(id);
  }
}
