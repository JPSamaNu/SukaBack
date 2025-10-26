import { Module } from '@nestjs/common';
import { GenerationsController } from './generations.controller';
import { PokemonModule } from '../pokemon/pokemon.module';

@Module({
  imports: [PokemonModule],
  controllers: [GenerationsController],
})
export class GenerationsModule {}
