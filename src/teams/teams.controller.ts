import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, AddPokemonToTeamDto, UpdateTeamPokemonDto } from './dto/team.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('teams')
@Controller('teams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo equipo' })
  @ApiResponse({ status: 201, description: 'Equipo creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Request() req: { user: { id: string } }, @Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(req.user.id, createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los equipos del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de equipos' })
  findAll(@Request() req: { user: { id: string } }) {
    return this.teamsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener equipo por ID' })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiResponse({ status: 200, description: 'Equipo encontrado' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  findOne(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.teamsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar equipo' })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiResponse({ status: 200, description: 'Equipo actualizado' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.update(id, req.user.id, updateTeamDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar equipo' })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiResponse({ status: 200, description: 'Equipo eliminado' })
  @ApiResponse({ status: 404, description: 'Equipo no encontrado' })
  remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.teamsService.remove(id, req.user.id);
  }

  @Post(':id/pokemons')
  @ApiOperation({ summary: 'Agregar Pokémon al equipo' })
  @ApiParam({ name: 'id', description: 'ID del equipo' })
  @ApiResponse({ status: 201, description: 'Pokémon agregado al equipo' })
  @ApiResponse({ status: 400, description: 'Equipo lleno o posición ocupada' })
  addPokemon(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() addPokemonDto: AddPokemonToTeamDto,
  ) {
    return this.teamsService.addPokemon(id, req.user.id, addPokemonDto);
  }

  @Patch(':teamId/pokemons/:pokemonId')
  @ApiOperation({ summary: 'Actualizar Pokémon del equipo' })
  @ApiParam({ name: 'teamId', description: 'ID del equipo' })
  @ApiParam({ name: 'pokemonId', description: 'ID del Pokémon en el equipo' })
  @ApiResponse({ status: 200, description: 'Pokémon actualizado' })
  @ApiResponse({ status: 404, description: 'Equipo o Pokémon no encontrado' })
  updatePokemon(
    @Param('teamId') teamId: string,
    @Param('pokemonId') pokemonId: string,
    @Request() req: { user: { id: string } },
    @Body() updatePokemonDto: UpdateTeamPokemonDto,
  ) {
    return this.teamsService.updatePokemon(teamId, pokemonId, req.user.id, updatePokemonDto);
  }

  @Delete(':teamId/pokemons/:pokemonId')
  @ApiOperation({ summary: 'Eliminar Pokémon del equipo' })
  @ApiParam({ name: 'teamId', description: 'ID del equipo' })
  @ApiParam({ name: 'pokemonId', description: 'ID del Pokémon en el equipo' })
  @ApiResponse({ status: 200, description: 'Pokémon eliminado del equipo' })
  @ApiResponse({ status: 404, description: 'Equipo o Pokémon no encontrado' })
  removePokemon(
    @Param('teamId') teamId: string,
    @Param('pokemonId') pokemonId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.teamsService.removePokemon(teamId, pokemonId, req.user.id);
  }
}
