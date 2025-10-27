import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PokemonServiceOptimized as PokemonService } from './pokemon.service.optimized';
import { PokemonQueryDto } from './dto/pokemon.dto';

@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  /**
   * GET /pokemon
   * Obtener lista de Pokemon con paginación y filtros
   */
  @Get()
  async findAll(@Query() query: PokemonQueryDto) {
    return this.pokemonService.findAll(query);
  }

  /**
   * GET /pokemon/all
   * Obtener TODOS los Pokemon sin paginación (1328 Pokemon)
   */
  @Get('all')
  async findAllNoPagination() {
    const pokemon = await this.pokemonService.findAllNoPagination();
    return {
      data: pokemon,
      total: pokemon.length,
      message: `Se obtuvieron ${pokemon.length} Pokemon correctamente`,
    };
  }

  /**
   * GET /pokemon/count
   * Obtener total de Pokemon en la base de datos
   */
  @Get('count')
  async getTotalCount() {
    const total = await this.pokemonService.getTotalCount();
    return {
      total,
      message: `Total de Pokemon en la base de datos: ${total}`,
    };
  }

  /**
   * GET /pokemon/generations
   * Obtener lista de todas las generaciones disponibles
   */
  @Get('generations')
  async getAllGenerations() {
    const generations = await this.pokemonService.getAllGenerations();
    return {
      data: generations,
      total: generations.length,
      message: 'Generaciones de Pokemon disponibles',
    };
  }

  /**
   * GET /pokemon/generation/:id
   * Obtener Pokemon por generación
   */
  @Get('generation/:id')
  async findByGeneration(@Param('id', ParseIntPipe) generation: number) {
    const pokemon = await this.pokemonService.findByGeneration(generation);
    return {
      data: pokemon,
      total: pokemon.length,
      generation,
      message: `Pokemon de la generación ${generation}`,
    };
  }

  /**
   * GET /pokemon/generation/:id/count
   * Obtener conteo de Pokemon por generación
   */
  @Get('generation/:id/count')
  async getGenerationCount(@Param('id', ParseIntPipe) generation: number) {
    const count = await this.pokemonService.getGenerationCount(generation);
    return {
      generation,
      count,
      message: `La generación ${generation} tiene ${count} Pokemon`,
    };
  }

  /**
   * GET /pokemon/:id
   * Obtener detalles de un Pokemon por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.findOne(id);
  }

  /**
   * GET /pokemon/:id/evolution
   * Obtener cadena de evolución de un Pokemon por ID
   */
  @Get(':id/evolution')
  async getEvolutionChain(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.getEvolutionChain(id);
  }
}
