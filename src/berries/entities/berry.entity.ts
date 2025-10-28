import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('pokemon_v2_berry')
export class Berry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'natural_gift_power' })
  naturalGiftPower: number;

  @Column()
  size: number;

  @Column({ name: 'max_harvest' })
  maxHarvest: number;

  @Column({ name: 'growth_time' })
  growthTime: number;

  @Column({ name: 'soil_dryness' })
  soilDryness: number;

  @Column()
  smoothness: number;

  @Column({ name: 'berry_firmness_id' })
  berryFirmnessId: number;

  @Column({ name: 'item_id' })
  itemId: number;

  @Column({ name: 'natural_gift_type_id' })
  naturalGiftTypeId: number;
}
