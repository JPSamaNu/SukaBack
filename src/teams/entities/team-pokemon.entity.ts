import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('team_pokemons')
export class TeamPokemon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('Team', 'pokemons', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: any;

  @Column({ name: 'teamId' })
  teamId: string;

  @Column({ type: 'int' })
  pokemonId: number;

  @Column({ length: 100 })
  pokemonName: string;

  @Column({ type: 'int', comment: 'Position in team (1-6)' })
  position: number;

  @Column({ length: 100, nullable: true })
  nickname: string;

  @Column({ type: 'jsonb', nullable: true })
  moves: string[];

  @Column({ length: 100, nullable: true })
  ability: string;

  @Column({ length: 100, nullable: true })
  item: string;

  @Column({ length: 50, nullable: true })
  nature: string;

  @CreateDateColumn()
  createdAt: Date;
}
