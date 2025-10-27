# 🔄 Guía de Infinite Scroll - SukaDex Frontend

## 📋 Endpoint de Paginación

**URL Base:** `http://localhost:2727/api/v1/pokemon`

### Query Parameters:

```typescript
interface PokemonQueryParams {
  page?: number;        // Página actual (default: 1, min: 1)
  limit?: number;       // Items por página (default: 20, min: 1, max: 100)
  generation?: number;  // Filtrar por generación (1-9)
  type?: string;        // Filtrar por tipo
  search?: string;      // Buscar por nombre
  sortBy?: 'id' | 'name' | 'base_experience';  // Ordenar por
  sortOrder?: 'ASC' | 'DESC';  // Orden ascendente o descendente
}
```

### Respuesta:

```json
{
  "data": [
    {
      "id": 1,
      "name": "bulbasaur",
      "baseExperience": 64,
      "height": 7,
      "weight": 69,
      "speciesId": 1,
      "speciesName": "bulbasaur",
      "generationId": 1,
      "generationName": "generation-i",
      "types": ["grass", "poison"],
      "sprites": {
        "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
      }
    }
  ],
  "total": 1025,
  "page": 1,
  "limit": 20,
  "totalPages": 52
}
```

---

## 🎯 Ejemplo 1: Infinite Scroll con React (Básico)

```tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Pokemon {
  id: number;
  name: string;
  sprites: { front_default: string };
  types: string[];
}

const InfiniteScrollPokemon: React.FC = () => {
  const [pokemon, setPokemon] = useState<Pokemon[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver>();
  const lastPokemonRef = useRef<HTMLDivElement>(null);

  // Cargar Pokemon
  const loadPokemon = async (pageNumber: number) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:2727/api/v1/pokemon', {
        params: {
          page: pageNumber,
          limit: 20,
          sortBy: 'id',
          sortOrder: 'ASC'
        }
      });

      const { data, page: currentPage, totalPages } = response.data;

      setPokemon(prev => [...prev, ...data]);
      setHasMore(currentPage < totalPages);
    } catch (error) {
      console.error('Error loading pokemon:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar página inicial
  useEffect(() => {
    loadPokemon(1);
  }, []);

  // Intersection Observer para detectar scroll
  useEffect(() => {
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (lastPokemonRef.current) {
      observer.observe(lastPokemonRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore]);

  // Cargar siguiente página cuando cambia 'page'
  useEffect(() => {
    if (page > 1) {
      loadPokemon(page);
    }
  }, [page]);

  return (
    <div className="pokemon-container">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
        {pokemon.map((poke, index) => {
          const isLast = index === pokemon.length - 1;
          
          return (
            <div
              key={`${poke.id}-${index}`}
              ref={isLast ? lastPokemonRef : null}
              className="pokemon-card bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
            >
              <img
                src={poke.sprites.front_default}
                alt={poke.name}
                className="w-24 h-24 mx-auto"
                loading="lazy"
              />
              <p className="text-center font-bold mt-2">
                #{poke.id.toString().padStart(4, '0')}
              </p>
              <p className="text-center capitalize">{poke.name}</p>
              <div className="flex gap-1 justify-center mt-2">
                {poke.types?.map(type => (
                  <span
                    key={type}
                    className={`px-2 py-1 rounded text-xs text-white bg-${type}`}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Cargando más Pokemon...</p>
        </div>
      )}

      {!hasMore && (
        <div className="text-center py-4 text-gray-500">
          ¡Has visto todos los Pokemon! ({pokemon.length} total)
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollPokemon;
```

---

## 🎯 Ejemplo 2: Hook Personalizado para Infinite Scroll

```tsx
// hooks/useInfiniteScroll.ts
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface UseInfiniteScrollOptions {
  endpoint: string;
  initialPage?: number;
  limit?: number;
  sortBy?: 'id' | 'name' | 'base_experience';
  sortOrder?: 'ASC' | 'DESC';
  generation?: number;
  search?: string;
}

export const useInfiniteScroll = <T,>(options: UseInfiniteScrollOptions) => {
  const {
    endpoint,
    initialPage = 1,
    limit = 20,
    sortBy = 'id',
    sortOrder = 'ASC',
    generation,
    search
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<IntersectionObserver>();

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(endpoint, {
        params: {
          page,
          limit,
          sortBy,
          sortOrder,
          generation,
          search
        }
      });

      const { data: newData, page: currentPage, totalPages } = response.data;

      setData(prev => [...prev, ...newData]);
      setHasMore(currentPage < totalPages);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  };

  const lastElementRef = (node: HTMLElement | null) => {
    if (loading) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });

    if (node) {
      observerRef.current.observe(node);
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  // Reset cuando cambian filtros
  useEffect(() => {
    if (generation !== undefined || search !== undefined) {
      reset();
      loadMore();
    }
  }, [generation, search]);

  return {
    data,
    loading,
    error,
    hasMore,
    lastElementRef,
    reset
  };
};

// Uso del hook
const AllPokemonPage: React.FC = () => {
  const {
    data: pokemon,
    loading,
    hasMore,
    lastElementRef
  } = useInfiniteScroll<Pokemon>({
    endpoint: 'http://localhost:2727/api/v1/pokemon',
    limit: 30
  });

  return (
    <div className="grid grid-cols-6 gap-4 p-4">
      {pokemon.map((poke, index) => (
        <div
          key={poke.id}
          ref={index === pokemon.length - 1 ? lastElementRef : null}
          className="pokemon-card"
        >
          <img src={poke.sprites.front_default} alt={poke.name} />
          <p>{poke.name}</p>
        </div>
      ))}
      {loading && <div>Cargando...</div>}
      {!hasMore && <div>Fin de la lista</div>}
    </div>
  );
};
```

---

## 🎯 Ejemplo 3: Con React Query (Recomendado)

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import React, { useRef, useEffect } from 'react';

interface Pokemon {
  id: number;
  name: string;
  sprites: { front_default: string };
  types: string[];
}

interface PokemonResponse {
  data: Pokemon[];
  page: number;
  totalPages: number;
  total: number;
}

const fetchPokemon = async ({ pageParam = 1 }) => {
  const { data } = await axios.get<PokemonResponse>(
    'http://localhost:2727/api/v1/pokemon',
    {
      params: {
        page: pageParam,
        limit: 20,
        sortBy: 'id',
        sortOrder: 'ASC'
      }
    }
  );
  return data;
};

const InfiniteScrollWithReactQuery: React.FC = () => {
  const observerRef = useRef<IntersectionObserver>();
  const lastPokemonRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['pokemon'],
    queryFn: fetchPokemon,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages
        ? lastPage.page + 1
        : undefined;
    },
    initialPageParam: 1,
  });

  // Intersection Observer
  useEffect(() => {
    if (isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (lastPokemonRef.current) {
      observer.observe(lastPokemonRef.current);
    }

    return () => observer.disconnect();
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  if (status === 'pending') {
    return <div>Cargando Pokemon...</div>;
  }

  if (status === 'error') {
    return <div>Error cargando Pokemon</div>;
  }

  const allPokemon = data.pages.flatMap(page => page.data);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
        {allPokemon.map((pokemon, index) => {
          const isLast = index === allPokemon.length - 1;

          return (
            <div
              key={pokemon.id}
              ref={isLast ? lastPokemonRef : null}
              className="pokemon-card"
            >
              <img
                src={pokemon.sprites.front_default}
                alt={pokemon.name}
                loading="lazy"
              />
              <p>#{pokemon.id.toString().padStart(4, '0')}</p>
              <p className="capitalize">{pokemon.name}</p>
            </div>
          );
        })}
      </div>

      {isFetchingNextPage && (
        <div className="text-center py-4">
          Cargando más Pokemon...
        </div>
      )}

      {!hasNextPage && (
        <div className="text-center py-4">
          ¡Todos los Pokemon cargados! ({allPokemon.length})
        </div>
      )}
    </div>
  );
};

export default InfiniteScrollWithReactQuery;
```

---

## 🎯 Ejemplo 4: Con Filtros y Búsqueda

```tsx
import React, { useState } from 'react';

const PokemonListWithFilters: React.FC = () => {
  const [generation, setGeneration] = useState<number>();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'name'>('id');

  const {
    data: pokemon,
    loading,
    hasMore,
    lastElementRef,
    reset
  } = useInfiniteScroll<Pokemon>({
    endpoint: 'http://localhost:2727/api/v1/pokemon',
    limit: 24,
    generation,
    search,
    sortBy
  });

  const handleGenerationChange = (gen: number) => {
    setGeneration(gen);
    reset();
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    reset();
  };

  return (
    <div>
      {/* Filtros */}
      <div className="filters p-4 bg-gray-100 mb-4">
        <div className="flex gap-4">
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar Pokemon..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-4 py-2 border rounded"
          />

          {/* Generación */}
          <select
            value={generation || ''}
            onChange={(e) => handleGenerationChange(Number(e.target.value))}
            className="px-4 py-2 border rounded"
          >
            <option value="">Todas las generaciones</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(gen => (
              <option key={gen} value={gen}>Generación {gen}</option>
            ))}
          </select>

          {/* Ordenar */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'id' | 'name')}
            className="px-4 py-2 border rounded"
          >
            <option value="id">Por Número</option>
            <option value="name">Por Nombre</option>
          </select>
        </div>
      </div>

      {/* Grid de Pokemon */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
        {pokemon.map((poke, index) => (
          <div
            key={poke.id}
            ref={index === pokemon.length - 1 ? lastElementRef : null}
            className="pokemon-card"
          >
            <img src={poke.sprites.front_default} alt={poke.name} />
            <p>#{poke.id}</p>
            <p>{poke.name}</p>
          </div>
        ))}
      </div>

      {loading && <div>Cargando...</div>}
      {!hasMore && <div>Fin de la lista</div>}
    </div>
  );
};
```

---

## 📊 Servicio API Completo

```typescript
// services/pokemon.api.ts
import axios from 'axios';

const API_BASE = 'http://localhost:2727/api/v1';

export interface PokemonQueryParams {
  page?: number;
  limit?: number;
  generation?: number;
  search?: string;
  sortBy?: 'id' | 'name' | 'base_experience';
  sortOrder?: 'ASC' | 'DESC';
}

export const pokemonApi = {
  /**
   * Obtener Pokemon paginados
   */
  getPokemon: async (params: PokemonQueryParams) => {
    const { data } = await axios.get(`${API_BASE}/pokemon`, { params });
    return data;
  },

  /**
   * Obtener todos los Pokemon (sin paginación)
   */
  getAllPokemon: async () => {
    const { data } = await axios.get(`${API_BASE}/pokemon/all`);
    return data;
  },

  /**
   * Obtener Pokemon por generación
   */
  getPokemonByGeneration: async (generationId: number) => {
    const { data } = await axios.get(`${API_BASE}/generations/${generationId}/pokemon`);
    return data;
  },

  /**
   * Obtener un Pokemon por ID
   */
  getPokemonById: async (id: number) => {
    const { data } = await axios.get(`${API_BASE}/pokemon/${id}`);
    return data;
  }
};
```

---

## ✅ Uso Correcto del Endpoint

### ❌ Incorrecto:
```typescript
// No especificar parámetros (usa defaults)
fetch('http://localhost:2727/api/v1/pokemon')
```

### ✅ Correcto:
```typescript
// Especificar page y limit explícitamente
fetch('http://localhost:2727/api/v1/pokemon?page=1&limit=20')

// Con Axios
axios.get('http://localhost:2727/api/v1/pokemon', {
  params: {
    page: 1,
    limit: 20,
    sortBy: 'id',
    sortOrder: 'ASC'
  }
})
```

---

## 🚀 Mejores Prácticas

1. **Usa `limit` moderado**: Entre 20-50 items por página
2. **Implementa skeleton loaders**: Mejora UX durante carga
3. **Maneja errores**: Muestra mensajes amigables
4. **Lazy loading de imágenes**: Usa `loading="lazy"`
5. **Optimiza re-renders**: Usa `React.memo` para cards
6. **Cache con React Query**: Evita llamadas innecesarias

---

## 🐛 Solución al Error 400

El error ocurre porque:
1. Los query params no se están enviando correctamente
2. El backend espera números pero recibe strings

**Solución:**
```typescript
// Asegúrate de convertir a números
const params = {
  page: Number(page) || 1,
  limit: Number(limit) || 20,
  sortBy: sortBy || 'id',
  sortOrder: sortOrder || 'ASC'
};
```

O usa el hook que creé que ya maneja todo esto automáticamente. 🎉
