import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PokemonController } from './pokemon.controller';
// import { PokemonService } from './pokemon.service'; // Servicio original (desactivado)
import { PokemonServiceOptimized as PokemonService } from './pokemon.service.optimized'; // Servicio optimizado con vistas materializadas
import { Pokemon } from './entities/pokemon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pokemon])],
  controllers: [PokemonController],
  providers: [PokemonService],
  exports: [PokemonService],
})
export class PokemonModule {}
