// Configuração da API
export const API_BASE_URL = 'http://192.168.0.10:3001';

// URLs específicas
export const API_ENDPOINTS = {
  library: `${API_BASE_URL}/library`,
  libraryCheck: (movieId: string) => `${API_BASE_URL}/library/${movieId}/check`,
  libraryRemove: (movieId: string) => `${API_BASE_URL}/library/${movieId}`,
};

// Configuração para desenvolvimento
export const DEV_CONFIG = {
  moviesJsonPath: '/movies.json',
  imdbApiUrl: 'https://api.imdbapi.dev/search/titles',
}; 