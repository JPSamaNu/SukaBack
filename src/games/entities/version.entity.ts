import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('pokemon_v2_version')
export class Version {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'version_group_id' })
  versionGroupId: number;
}
