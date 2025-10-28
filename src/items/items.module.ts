import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { Pokemon } from '../pokemon/entities/pokemon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pokemon])],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
