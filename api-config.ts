// ==============================================
// Configuración de API - SukaDex Backend
// ==============================================

/**
 * URL base del backend
 * Cambiar en producción a la URL del servidor desplegado
 */
export const API_CONFIG = {
  BASE_URL: 'http://localhost:2727',
  API_VERSION: 'v1',
  TIMEOUT: 30000, // 30 segundos
};

/**
 * Construir URL completa del endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}${endpoint}`;
};

// ==============================================
// Endpoints disponibles
// ==============================================

export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },

  // Usuarios
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    ME: '/users/me',
    BY_ID: (id: number) => `/users/${id}`,
    UPDATE: (id: number) => `/users/${id}`,
    DELETE: (id: number) => `/users/${id}`,
  },

  // Pokemon
  POKEMON: {
    ALL: '/pokemon/all',
    LIST: '/pokemon',
    BY_ID: (id: number) => `/pokemon/${id}`,
    COUNT: '/pokemon/count',
    BY_GENERATION: (id: number) => `/pokemon/generation/${id}`,
    GENERATION_COUNT: (id: number) => `/pokemon/generation/${id}/count`,
  },

  // Generaciones
  GENERATIONS: {
    LIST: '/generations',
    BY_ID: (id: number) => `/generations/${id}`,
    POKEMON: (id: number) => `/generations/${id}/pokemon`,
    COUNT: (id: number) => `/generations/${id}/count`,
  },

  // Health
  HEALTH: {
    STATUS: '/health',
    DATABASE: '/health/db',
  },
};

// ==============================================
// Clase de servicio API
// ==============================================

export class ApiService {
  private static baseUrl = API_CONFIG.BASE_URL;
  private static apiVersion = API_CONFIG.API_VERSION;

  /**
   * Obtener token de autenticación del localStorage
   */
  private static getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Headers por defecto
   */
  private static getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Método GET genérico
   */
  static async get<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(requiresAuth),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Método POST genérico
   */
  static async post<T>(
    endpoint: string,
    data: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(requiresAuth),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Método PATCH genérico
   */
  static async patch<T>(
    endpoint: string,
    data: any,
    requiresAuth: boolean = true
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(requiresAuth),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Método DELETE genérico
   */
  static async delete<T>(endpoint: string, requiresAuth: boolean = true): Promise<T> {
    const url = getApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(requiresAuth),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

// ==============================================
// Servicios específicos por recurso
// ==============================================

/**
 * Servicio de Pokemon
 */
export const PokemonService = {
  /**
   * Obtener todos los Pokemon (1,025)
   */
  getAll: async () => {
    return ApiService.get<any>(API_ENDPOINTS.POKEMON.ALL);
  },

  /**
   * Obtener Pokemon paginados
   */
  getList: async (params?: {
    page?: number;
    limit?: number;
    generation?: number;
    search?: string;
    sortBy?: 'id' | 'name' | 'base_experience';
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.generation) queryParams.append('generation', params.generation.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `${API_ENDPOINTS.POKEMON.LIST}?${queryParams.toString()}`;
    return ApiService.get<any>(endpoint);
  },

  /**
   * Obtener Pokemon por ID
   */
  getById: async (id: number) => {
    return ApiService.get<any>(API_ENDPOINTS.POKEMON.BY_ID(id));
  },

  /**
   * Obtener conteo total de Pokemon
   */
  getCount: async () => {
    return ApiService.get<any>(API_ENDPOINTS.POKEMON.COUNT);
  },

  /**
   * Obtener Pokemon por generación
   */
  getByGeneration: async (generation: number) => {
    return ApiService.get<any>(API_ENDPOINTS.POKEMON.BY_GENERATION(generation));
  },
};

/**
 * Servicio de Generaciones
 */
export const GenerationsService = {
  /**
   * Obtener todas las generaciones
   */
  getAll: async () => {
    return ApiService.get<any>(API_ENDPOINTS.GENERATIONS.LIST);
  },

  /**
   * Obtener generación por ID con sus Pokemon
   */
  getById: async (id: number) => {
    return ApiService.get<any>(API_ENDPOINTS.GENERATIONS.BY_ID(id));
  },

  /**
   * Obtener solo Pokemon de una generación
   */
  getPokemon: async (id: number) => {
    return ApiService.get<any>(API_ENDPOINTS.GENERATIONS.POKEMON(id));
  },

  /**
   * Obtener conteo de Pokemon en una generación
   */
  getCount: async (id: number) => {
    return ApiService.get<any>(API_ENDPOINTS.GENERATIONS.COUNT(id));
  },
};

/**
 * Servicio de Autenticación
 */
export const AuthService = {
  /**
   * Registrar nuevo usuario
   */
  register: async (data: { email: string; password: string; username: string }) => {
    const response = await ApiService.post<any>(API_ENDPOINTS.AUTH.REGISTER, data);
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
    }
    return response;
  },

  /**
   * Iniciar sesión
   */
  login: async (data: { email: string; password: string }) => {
    const response = await ApiService.post<any>(API_ENDPOINTS.AUTH.LOGIN, data);
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
    }
    return response;
  },

  /**
   * Cerrar sesión
   */
  logout: async () => {
    await ApiService.post<any>(API_ENDPOINTS.AUTH.LOGOUT, {}, true);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Obtener usuario actual
   */
  getCurrentUser: async () => {
    return ApiService.get<any>(API_ENDPOINTS.AUTH.ME, true);
  },

  /**
   * Refrescar token
   */
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await ApiService.post<any>(API_ENDPOINTS.AUTH.REFRESH, {
      refresh_token: refreshToken,
    });
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
    }
    return response;
  },
};

/**
 * Servicio de Health Check
 */
export const HealthService = {
  /**
   * Verificar estado del servidor
   */
  checkStatus: async () => {
    return ApiService.get<any>(API_ENDPOINTS.HEALTH.STATUS);
  },

  /**
   * Verificar estado de la base de datos
   */
  checkDatabase: async () => {
    return ApiService.get<any>(API_ENDPOINTS.HEALTH.DATABASE);
  },
};

// ==============================================
// Ejemplos de uso
// ==============================================

/*
// Ejemplo 1: Obtener todos los Pokemon
const { data, total } = await PokemonService.getAll();
console.log(`Total: ${total} Pokemon`);

// Ejemplo 2: Obtener Pokemon paginados
const result = await PokemonService.getList({
  page: 1,
  limit: 50,
  generation: 1,
  sortBy: 'name',
  sortOrder: 'ASC'
});

// Ejemplo 3: Obtener Pokemon por ID
const pikachu = await PokemonService.getById(25);
console.log(pikachu.name); // "pikachu"

// Ejemplo 4: Obtener generaciones
const { data: generations } = await GenerationsService.getAll();

// Ejemplo 5: Obtener Pokemon de Kanto
const { data: kantoPokemons } = await GenerationsService.getPokemon(1);

// Ejemplo 6: Login
await AuthService.login({
  email: 'usuario@example.com',
  password: 'password123'
});

// Ejemplo 7: Obtener usuario actual
const user = await AuthService.getCurrentUser();
console.log(user.email);
*/

export default {
  API_CONFIG,
  API_ENDPOINTS,
  ApiService,
  PokemonService,
  GenerationsService,
  AuthService,
  HealthService,
  getApiUrl,
};
