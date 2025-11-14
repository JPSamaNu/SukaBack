import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamPokemon } from './entities/team-pokemon.entity';
import { CreateTeamDto, UpdateTeamDto, AddPokemonToTeamDto, UpdateTeamPokemonDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    @InjectRepository(TeamPokemon)
    private readonly teamPokemonsRepository: Repository<TeamPokemon>,
  ) {}

  async create(userId: string, createTeamDto: CreateTeamDto): Promise<Team> {
    const { name, description, pokemons } = createTeamDto;

    // Validar que no se exceda el límite de 6 pokémon
    if (pokemons && pokemons.length > 6) {
      throw new BadRequestException('Un equipo no puede tener más de 6 Pokémon');
    }

    // Validar que no haya posiciones duplicadas
    if (pokemons) {
      const positions = pokemons.map(p => p.position);
      const uniquePositions = new Set(positions);
      if (positions.length !== uniquePositions.size) {
        throw new BadRequestException('No puede haber posiciones duplicadas en el equipo');
      }
    }

    // Crear el equipo
    const team = this.teamsRepository.create({
      name,
      description,
      userId,
    });

    const savedTeam = await this.teamsRepository.save(team);

    // Agregar pokémon al equipo si se proporcionaron
    if (pokemons && pokemons.length > 0) {
      const teamPokemons = pokemons.map(pokemon =>
        this.teamPokemonsRepository.create({
          teamId: savedTeam.id,
          pokemonId: pokemon.pokemonId,
          pokemonName: pokemon.pokemonName,
          position: pokemon.position,
          nickname: pokemon.nickname,
          moves: pokemon.moves,
          ability: pokemon.ability,
          item: pokemon.item,
          nature: pokemon.nature,
        }),
      );

      savedTeam.pokemons = await this.teamPokemonsRepository.save(teamPokemons);
    }

    return savedTeam;
  }

  async findAll(userId: string): Promise<Team[]> {
    return this.teamsRepository.find({
      where: { userId },
      relations: ['pokemons'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['pokemons'],
    });

    if (!team) {
      throw new NotFoundException('Equipo no encontrado');
    }

    // Verificar que el equipo pertenece al usuario
    if (team.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este equipo');
    }

    return team;
  }

  async update(id: string, userId: string, updateTeamDto: UpdateTeamDto): Promise<Team> {
    const team = await this.findOne(id, userId);

    if (updateTeamDto.name) {
      team.name = updateTeamDto.name;
    }

    if (updateTeamDto.description !== undefined) {
      team.description = updateTeamDto.description;
    }

    return this.teamsRepository.save(team);
  }

  async remove(id: string, userId: string): Promise<void> {
    const team = await this.findOne(id, userId);
    await this.teamsRepository.remove(team);
  }

  async addPokemon(teamId: string, userId: string, addPokemonDto: AddPokemonToTeamDto): Promise<Team> {
    const team = await this.findOne(teamId, userId);

    // Verificar que el equipo no tenga ya 6 pokémon
    if (team.pokemons.length >= 6) {
      throw new BadRequestException('El equipo ya tiene 6 Pokémon (máximo permitido)');
    }

    // Verificar que la posición no esté ocupada
    const existingPosition = team.pokemons.find(p => p.position === addPokemonDto.position);
    if (existingPosition) {
      throw new BadRequestException(`La posición ${addPokemonDto.position} ya está ocupada`);
    }

    // Validar que no haya más de 4 movimientos
    if (addPokemonDto.moves && addPokemonDto.moves.length > 4) {
      throw new BadRequestException('Un Pokémon no puede tener más de 4 movimientos');
    }

    const teamPokemon = this.teamPokemonsRepository.create({
      teamId,
      pokemonId: addPokemonDto.pokemonId,
      pokemonName: addPokemonDto.pokemonName,
      position: addPokemonDto.position,
      nickname: addPokemonDto.nickname,
      moves: addPokemonDto.moves,
      ability: addPokemonDto.ability,
      item: addPokemonDto.item,
      nature: addPokemonDto.nature,
    });

    await this.teamPokemonsRepository.save(teamPokemon);

    return this.findOne(teamId, userId);
  }

  async updatePokemon(
    teamId: string,
    pokemonId: string,
    userId: string,
    updatePokemonDto: UpdateTeamPokemonDto,
  ): Promise<Team> {
    const team = await this.findOne(teamId, userId);

    const teamPokemon = team.pokemons.find(p => p.id === pokemonId);
    if (!teamPokemon) {
      throw new NotFoundException('Pokémon no encontrado en este equipo');
    }

    // Si se cambia la posición, verificar que no esté ocupada
    if (updatePokemonDto.position && updatePokemonDto.position !== teamPokemon.position) {
      const existingPosition = team.pokemons.find(
        p => p.position === updatePokemonDto.position && p.id !== pokemonId,
      );
      if (existingPosition) {
        throw new BadRequestException(`La posición ${updatePokemonDto.position} ya está ocupada`);
      }
    }

    // Validar que no haya más de 4 movimientos
    if (updatePokemonDto.moves && updatePokemonDto.moves.length > 4) {
      throw new BadRequestException('Un Pokémon no puede tener más de 4 movimientos');
    }

    Object.assign(teamPokemon, updatePokemonDto);
    await this.teamPokemonsRepository.save(teamPokemon);

    return this.findOne(teamId, userId);
  }

  async removePokemon(teamId: string, pokemonId: string, userId: string): Promise<Team> {
    const team = await this.findOne(teamId, userId);

    const teamPokemon = team.pokemons.find(p => p.id === pokemonId);
    if (!teamPokemon) {
      throw new NotFoundException('Pokémon no encontrado en este equipo');
    }

    await this.teamPokemonsRepository.remove(teamPokemon);

    return this.findOne(teamId, userId);
  }
}
