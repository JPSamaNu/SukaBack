import { Entity, PrimaryGeneratedColumn, Column, ViewColumn, ViewEntity } from 'typeorm';

/**
 * Vista de Pokemon base con información esencial
 * Utiliza las tablas oficiales de PokeAPI v2
 */
@ViewEntity({
  expression: `
    SELECT 
      p.id,
      p.name,
      p.base_experience,
      p.height,
      p.weight,
      p.is_default,
      ps.id as species_id,
      ps.name as species_name,
      ps.generation_id,
      g.name as generation_name
    FROM pokemon_v2_pokemon p
    INNER JOIN pokemon_v2_pokemonspecies ps ON p.pokemon_species_id = ps.id
    INNER JOIN pokemon_v2_generation g ON ps.generation_id = g.id
    WHERE p.is_default = true
    ORDER BY p.id
  `,
})
export class PokemonView {
  @ViewColumn()
  id: number;

  @ViewColumn()
  name: string;

  @ViewColumn()
  base_experience: number;

  @ViewColumn()
  height: number;

  @ViewColumn()
  weight: number;

  @ViewColumn()
  is_default: boolean;

  @ViewColumn()
  species_id: number;

  @ViewColumn()
  species_name: string;

  @ViewColumn()
  generation_id: number;

  @ViewColumn()
  generation_name: string;
}

/**
 * Entidad completa de Pokemon con todos los datos
 */
@Entity('pokemon_v2_pokemon')
export class Pokemon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'pokemon_species_id' })
  pokemonSpeciesId: number;

  @Column({ name: 'base_experience', nullable: true })
  baseExperience: number;

  @Column()
  height: number;

  @Column()
  weight: number;

  @Column({ name: 'is_default' })
  isDefault: boolean;

  @Column({ default: 0 })
  order: number;
}
