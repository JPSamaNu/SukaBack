import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('version-groups')
  async getAllVersionGroups() {
    return await this.gamesService.getAllVersionGroups();
  }

  @Get('version-groups/:id')
  async getVersionGroupById(@Param('id', ParseIntPipe) id: number) {
    return await this.gamesService.getVersionGroupById(id);
  }

  @Get('version-groups/:id/pokedex')
  async getPokedexByVersionGroup(@Param('id', ParseIntPipe) id: number) {
    return await this.gamesService.getPokedexByVersionGroup(id);
  }

  @Get('versions')
  async getAllVersions() {
    return await this.gamesService.getAllVersions();
  }

  @Get('versions/:id')
  async getVersionById(@Param('id', ParseIntPipe) id: number) {
    return await this.gamesService.getVersionById(id);
  }
}
