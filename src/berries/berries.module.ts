import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BerriesController } from './berries.controller';
import { BerriesService } from './berries.service';
import { Berry } from './entities/berry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Berry])],
  controllers: [BerriesController],
  providers: [BerriesService],
  exports: [BerriesService],
})
export class BerriesModule {}
