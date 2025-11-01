import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('pokemon_v2_versiongroup')
export class VersionGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  order: number;

  @Column({ name: 'generation_id' })
  generationId: number;
}
