import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { Version } from './entities/version.entity';
import { VersionGroup } from './entities/version-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Version, VersionGroup])],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
