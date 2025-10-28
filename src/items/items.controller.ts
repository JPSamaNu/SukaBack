import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsQueryDto } from './dto/items.dto';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  /**
   * GET /items
   * Obtener lista de items con paginación y filtros
   */
  @Get()
  async findAll(@Query() query: ItemsQueryDto) {
    return this.itemsService.findAll(query);
  }

  /**
   * GET /items/categories
   * Obtener todas las categorías disponibles para items
   */
  @Get('categories')
  async getCategories() {
    const categories = await this.itemsService.getCategories();
    return {
      data: categories,
      total: categories.length,
    };
  }

  /**
   * GET /items/:id
   * Obtener detalles de un item por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }
}
