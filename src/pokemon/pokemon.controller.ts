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
   * GET /pokemon/locations/all
   * Obtener ubicaciones de captura de TODOS los Pokémon
   * Endpoint optimizado que devuelve todas las ubicaciones agrupadas por Pokémon
   */
  @Get('locations/all')
  async getAllPokemonLocations() {
    const locations = await this.pokemonService.getAllPokemonLocations();
    
    return {
      total_pokemon: locations.length,
      data: locations.map(pokemon => ({
        pokemon_id: pokemon.pokemon_id,
        pokemon_name: pokemon.pokemon_name,
        total_encounters: parseInt(pokemon.total_encounters),
        total_versions: parseInt(pokemon.total_versions),
        encounters: pokemon.encounters
      })),
      message: `Ubicaciones de ${locations.length} Pokémon obtenidas correctamente`
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

  /**
   * GET /pokemon/:id/forms
   * Obtener formas alternativas de un Pokemon (mega evoluciones, formas regionales, etc.)
   */
  @Get(':id/forms')
  async getPokemonForms(@Param('id', ParseIntPipe) id: number) {
    return this.pokemonService.getPokemonForms(id);
  }

  /**
   * GET /pokemon/:id/locations
   * Obtener ubicaciones de captura de un Pokemon por videojuego
   */
  @Get(':id/locations')
  async getPokemonLocations(@Param('id', ParseIntPipe) id: number) {
    const locations = await this.pokemonService.getPokemonLocations(id);
    
    // Agrupar por videojuego
    interface GroupedVersions {
      [key: string]: {
        version: string;
        version_id: number;
        version_group: string;
        version_group_id: number;
        generation: string;
        encounters: any[];
      };
    }

    const groupedByVersion: GroupedVersions = locations.reduce((acc: GroupedVersions, loc: any) => {
      const version = loc.version || 'unknown';
      if (!acc[version]) {
        acc[version] = {
          version: version,
          version_id: loc.version_id,
          version_group: loc.version_group,
          version_group_id: loc.version_group_id,
          generation: loc.generation,
          encounters: []
        };
      }
      
      acc[version].encounters.push({
        location: loc.location,
        location_id: loc.location_id,
        location_area: loc.location_area,
        location_area_game_index: loc.location_area_game_index,
        min_level: loc.min_level,
        max_level: loc.max_level,
        encounter_method: loc.encounter_method,
        encounter_method_id: loc.encounter_method_id,
        rarity: loc.rarity
      });
      
      return acc;
    }, {});

    return {
      pokemon_id: id,
      total_encounters: locations.length,
      versions: Object.values(groupedByVersion),
      message: `Ubicaciones de captura encontradas: ${locations.length}`
    };
  }
}
