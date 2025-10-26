# 🎨 Guía de Sprites para Frontend - SukaDex

## 📦 Estructura de Sprites que Recibe el Frontend

Cada Pokemon tiene un objeto `sprites` con las siguientes propiedades:

```typescript
interface PokemonSprites {
  // Sprites frontales
  front_default: string | null;        // Sprite frontal normal
  front_shiny: string | null;          // Sprite frontal shiny
  front_female: string | null;         // Sprite frontal femenino
  front_shiny_female: string | null;   // Sprite frontal shiny femenino
  
  // Sprites traseros
  back_default: string | null;
  back_shiny: string | null;
  back_female: string | null;
  back_shiny_female: string | null;
  
  // Sprites de otros juegos (opcional)
  other?: {
    dream_world?: { front_default: string };
    home?: { front_default: string };
    "official-artwork"?: { front_default: string };
  };
  
  // Sprites de versiones específicas (opcional)
  versions?: any;
}
```

---

## 🎯 Ejemplo 1: Card de Pokemon Simple

```tsx
import React from 'react';

interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprites: {
    front_default: string;
    other?: {
      'official-artwork'?: {
        front_default: string;
      };
    };
  };
}

const PokemonCard: React.FC<{ pokemon: Pokemon }> = ({ pokemon }) => {
  // Usar artwork oficial si está disponible, sino sprite normal
  const imageUrl = pokemon.sprites?.other?.['official-artwork']?.front_default 
    || pokemon.sprites?.front_default
    || '/placeholder-pokemon.png';

  return (
    <div className="pokemon-card">
      <img 
        src={imageUrl} 
        alt={pokemon.name}
        loading="lazy"
        onError={(e) => {
          // Fallback si la imagen falla
          e.currentTarget.src = '/placeholder-pokemon.png';
        }}
      />
      <h3>{pokemon.name}</h3>
      <div className="types">
        {pokemon.types.map(type => (
          <span key={type} className={`type-badge ${type}`}>
            {type}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PokemonCard;
```

---

## 🎯 Ejemplo 2: Lista de Pokemon por Generación

```tsx
import React, { useEffect, useState } from 'react';
import { GenerationsService } from '../services/api-config';

const GenerationPokemonList: React.FC<{ generationId: number }> = ({ generationId }) => {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true);
        const response = await GenerationsService.getPokemon(generationId);
        setPokemon(response.data);
      } catch (error) {
        console.error('Error fetching pokemon:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [generationId]);

  if (loading) return <div>Cargando Pokemon...</div>;

  return (
    <div className="pokemon-grid">
      {pokemon.map((poke) => (
        <div key={poke.id} className="pokemon-item">
          <img 
            src={poke.sprites?.front_default || '/placeholder.png'}
            alt={poke.name}
            width="96"
            height="96"
            loading="lazy"
          />
          <p className="pokemon-number">#{poke.id.toString().padStart(3, '0')}</p>
          <p className="pokemon-name">{poke.name}</p>
        </div>
      ))}
    </div>
  );
};
```

---

## 🎯 Ejemplo 3: Selector de Variantes de Sprite

```tsx
import React, { useState } from 'react';

type SpriteVariant = 'front_default' | 'front_shiny' | 'back_default' | 'back_shiny';

const PokemonSpriteViewer: React.FC<{ pokemon: any }> = ({ pokemon }) => {
  const [variant, setVariant] = useState<SpriteVariant>('front_default');
  
  const spriteUrl = pokemon.sprites?.[variant] || pokemon.sprites?.front_default;

  return (
    <div className="sprite-viewer">
      <img src={spriteUrl} alt={`${pokemon.name} ${variant}`} />
      
      <div className="sprite-controls">
        <button onClick={() => setVariant('front_default')}>
          Normal
        </button>
        <button onClick={() => setVariant('front_shiny')}>
          Shiny
        </button>
        <button onClick={() => setVariant('back_default')}>
          Trasero
        </button>
        <button onClick={() => setVariant('back_shiny')}>
          Trasero Shiny
        </button>
      </div>
    </div>
  );
};
```

---

## 🎯 Ejemplo 4: Grid Optimizado con Lazy Loading

```tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GenerationsService } from '../services/api-config';

const PokemonGrid: React.FC<{ generationId: number }> = ({ generationId }) => {
  const [pokemon, setPokemon] = useState([]);
  const [displayCount, setDisplayCount] = useState(20);
  const observerRef = useRef<IntersectionObserver>();
  const lastPokemonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPokemon = async () => {
      const response = await GenerationsService.getPokemon(generationId);
      setPokemon(response.data);
    };
    fetchPokemon();
  }, [generationId]);

  // Infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setDisplayCount(prev => Math.min(prev + 20, pokemon.length));
      }
    });

    if (lastPokemonRef.current) {
      observerRef.current.observe(lastPokemonRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [pokemon.length]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {pokemon.slice(0, displayCount).map((poke, index) => {
        const isLast = index === displayCount - 1;
        
        return (
          <div 
            key={poke.id} 
            ref={isLast ? lastPokemonRef : null}
            className="pokemon-card"
          >
            <img 
              src={poke.sprites?.front_default}
              alt={poke.name}
              loading="lazy"
              className="w-24 h-24 mx-auto"
            />
            <p className="text-center font-bold">
              #{poke.id.toString().padStart(4, '0')}
            </p>
            <p className="text-center capitalize">{poke.name}</p>
          </div>
        );
      })}
    </div>
  );
};
```

---

## 🎯 Ejemplo 5: Hook Personalizado para Sprites

```tsx
import { useState, useEffect } from 'react';

interface UseSpritesOptions {
  preferArtwork?: boolean;
  fallbackUrl?: string;
}

const useSprite = (pokemon: any, options: UseSpritesOptions = {}) => {
  const { preferArtwork = true, fallbackUrl = '/placeholder.png' } = options;
  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!pokemon) return;

    let url = fallbackUrl;

    if (preferArtwork && pokemon.sprites?.other?.['official-artwork']?.front_default) {
      url = pokemon.sprites.other['official-artwork'].front_default;
    } else if (pokemon.sprites?.front_default) {
      url = pokemon.sprites.front_default;
    }

    // Pre-cargar imagen
    const img = new Image();
    img.onload = () => {
      setImageUrl(url);
      setIsLoading(false);
      setHasError(false);
    };
    img.onerror = () => {
      setImageUrl(fallbackUrl);
      setIsLoading(false);
      setHasError(true);
    };
    img.src = url;

  }, [pokemon, preferArtwork, fallbackUrl]);

  return { imageUrl, isLoading, hasError };
};

// Uso del hook
const PokemonImage: React.FC<{ pokemon: any }> = ({ pokemon }) => {
  const { imageUrl, isLoading, hasError } = useSprite(pokemon, {
    preferArtwork: true
  });

  if (isLoading) return <div className="skeleton w-24 h-24" />;
  if (hasError) return <div className="error-placeholder" />;

  return <img src={imageUrl} alt={pokemon.name} />;
};
```

---

## 🎯 Ejemplo 6: Componente de Imagen con Placeholder

```tsx
import React, { useState } from 'react';

interface PokemonImageProps {
  pokemon: {
    id: number;
    name: string;
    sprites: any;
  };
  variant?: 'sprite' | 'artwork';
  size?: 'sm' | 'md' | 'lg';
  showShiny?: boolean;
}

const PokemonImage: React.FC<PokemonImageProps> = ({ 
  pokemon, 
  variant = 'sprite',
  size = 'md',
  showShiny = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const getImageUrl = () => {
    if (variant === 'artwork') {
      return pokemon.sprites?.other?.['official-artwork']?.front_default;
    }
    
    const spriteKey = showShiny ? 'front_shiny' : 'front_default';
    return pokemon.sprites?.[spriteKey];
  };

  const imageUrl = getImageUrl() || '/placeholder-pokemon.png';

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Skeleton loader */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      {/* Imagen */}
      <img
        src={imageUrl}
        alt={pokemon.name}
        className={`
          ${sizeClasses[size]} 
          object-contain
          transition-opacity duration-300
          ${imageLoaded ? 'opacity-100' : 'opacity-0'}
        `}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(true);
        }}
        loading="lazy"
      />

      {/* Badge shiny */}
      {showShiny && (
        <div className="absolute top-0 right-0 bg-yellow-400 rounded-full p-1">
          ✨
        </div>
      )}
    </div>
  );
};

export default PokemonImage;
```

---

## 📊 URLs de Sprites Disponibles

### Sprites Normales (96x96px)
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/{id}.png
```

### Artwork Oficial (Alta Resolución)
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png
```

### Sprites Animados
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/{id}.gif
```

---

## 💡 Mejores Prácticas

### 1. **Lazy Loading**
```tsx
<img loading="lazy" src={sprite} alt={name} />
```

### 2. **Placeholder mientras carga**
```tsx
{isLoading ? <Skeleton /> : <img src={sprite} />}
```

### 3. **Manejo de Errores**
```tsx
<img 
  src={sprite}
  onError={(e) => e.currentTarget.src = '/fallback.png'}
/>
```

### 4. **Optimización con IntersectionObserver**
```tsx
// Solo cargar imágenes cuando sean visibles
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target as HTMLImageElement;
      img.src = img.dataset.src || '';
      observer.unobserve(img);
    }
  });
});
```

### 5. **Cache de Imágenes**
```tsx
// Service Worker o React Query para cachear sprites
const { data: pokemon } = useQuery(['pokemon', id], fetchPokemon, {
  staleTime: Infinity, // Los sprites no cambian
  cacheTime: Infinity
});
```

---

## 🎨 CSS para Sprites

```css
/* Card de Pokemon */
.pokemon-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.pokemon-card:hover {
  transform: translateY(-4px);
}

.pokemon-card img {
  image-rendering: pixelated; /* Para mantener pixels nítidos */
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* Skeleton loader */
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Grid responsive */
.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 16px;
}

@media (max-width: 640px) {
  .pokemon-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
}
```

---

## 🚀 Ejemplo Completo: Generación Viewer

```tsx
import React, { useEffect, useState } from 'react';
import { GenerationsService } from '../services/api-config';

const GenerationViewer: React.FC = () => {
  const [generations, setGenerations] = useState([]);
  const [selectedGen, setSelectedGen] = useState(1);
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar generaciones
  useEffect(() => {
    GenerationsService.getAll().then(res => {
      setGenerations(res.data);
    });
  }, []);

  // Cargar Pokemon de la generación seleccionada
  useEffect(() => {
    setLoading(true);
    GenerationsService.getPokemon(selectedGen)
      .then(res => setPokemon(res.data))
      .finally(() => setLoading(false));
  }, [selectedGen]);

  return (
    <div className="generation-viewer">
      {/* Selector de generaciones */}
      <div className="generation-tabs">
        {generations.map(gen => (
          <button
            key={gen.id}
            onClick={() => setSelectedGen(gen.id)}
            className={selectedGen === gen.id ? 'active' : ''}
          >
            {gen.region}
          </button>
        ))}
      </div>

      {/* Grid de Pokemon */}
      {loading ? (
        <div className="loading">Cargando Pokemon...</div>
      ) : (
        <div className="pokemon-grid">
          {pokemon.map(poke => (
            <div key={poke.id} className="pokemon-card">
              <img
                src={poke.sprites?.front_default || '/placeholder.png'}
                alt={poke.name}
                loading="lazy"
              />
              <p className="pokemon-id">#{poke.id.toString().padStart(4, '0')}</p>
              <h3 className="pokemon-name">{poke.name}</h3>
              <div className="pokemon-types">
                {poke.types?.map(type => (
                  <span key={type} className={`type-badge ${type}`}>
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenerationViewer;
```

---

## ✅ Resumen

El backend **YA está enviando todos los sprites** en cada Pokemon. El frontend solo necesita:

1. ✅ Hacer fetch a `/api/v1/generations/{id}/pokemon`
2. ✅ Acceder a `pokemon.sprites.front_default` para el sprite
3. ✅ Usar `<img src={pokemon.sprites.front_default} />` para mostrar
4. ✅ Implementar lazy loading para optimizar
5. ✅ Manejar errores con fallback images

**Todos los sprites ya están incluidos en la respuesta del API** 🎉
