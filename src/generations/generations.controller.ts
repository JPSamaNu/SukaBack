import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PokemonServiceOptimized as PokemonService } from '../pokemon/pokemon.service.optimized';

@Controller('generations')
export class GenerationsController {
  constructor(private readonly pokemonService: PokemonService) {}

  /**
   * GET /generations
   * Obtener todas las generaciones de Pokemon
   */
  @Get()
  async getAllGenerations() {
    const generations = await this.pokemonService.getAllGenerations();
    return {
      data: generations,
      total: generations.length,
      message: 'Lista de todas las generaciones de Pokemon',
    };
  }

  /**
   * GET /generations/:id
   * Obtener información detallada de una generación
   */
  @Get(':id')
  async getGenerationInfo(@Param('id', ParseIntPipe) id: number) {
    const [info] = await this.pokemonService.getAllGenerations();
    const pokemon = await this.pokemonService.findByGeneration(id);
    
    return {
      generation: id,
      info,
      pokemonCount: pokemon.length,
      pokemon,
    };
  }

  /**
   * GET /generations/:id/pokemon
   * Obtener solo los Pokemon de una generación (sin info adicional)
   */
  @Get(':id/pokemon')
  async getGenerationPokemon(@Param('id', ParseIntPipe) id: number) {
    const pokemon = await this.pokemonService.findByGeneration(id);
    return {
      generation: id,
      data: pokemon,
      total: pokemon.length,
    };
  }

  /**
   * GET /generations/:id/count
   * Obtener el conteo de Pokemon en una generación
   */
  @Get(':id/count')
  async getGenerationCount(@Param('id', ParseIntPipe) id: number) {
    const count = await this.pokemonService.getGenerationCount(id);
    return {
      generation: id,
      count,
      message: `La generación ${id} tiene ${count} Pokemon`,
    };
  }
}
