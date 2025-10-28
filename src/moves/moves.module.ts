import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovesController } from './moves.controller';
import { MovesService } from './moves.service';
import { Pokemon } from '../pokemon/entities/pokemon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pokemon])],
  controllers: [MovesController],
  providers: [MovesService],
  exports: [MovesService],
})
export class MovesModule {}
