import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class MoviesFetcherService {
    private readonly keywords = [
        'zombie', 'green', 'thor', 'mission', 'x-men', 'red', 'batman', 'ocean', 'victory', 'king',
        'night', 'ultimate', 'captain', 'young', 'iron', 'earth', 'spider', 'power', 'love', 'war',
        'dark', 'queen', 'john', 'fast', 'action', 'harry'
    ];
  async fetchAndSaveMovies() {
    const allMovies = new Map<string, any>();
    for (const keyword of this.keywords) {
      let pageToken = '';
      let page = 1;
      do {
        const url = `https://api.imdbapi.dev/search/titles?query=${encodeURIComponent(keyword)}&pageSize=50${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(url, data);
        if (data.titles) {
          data.titles.forEach(movie => {
            if (movie.type !== 'movie') return; // só filmes
            if (!allMovies.has(movie.id)) {
              allMovies.set(movie.id, {
                id: movie.id,
                    title: movie.primaryTitle,
                    year: movie.startYear,
                    image: movie.primaryImage?.url || null,
                    rating: movie.rating?.aggregateRating ? String(movie.rating.aggregateRating) : null,
                    type: movie.type,
              });
            }
          });
        }
        pageToken = data.nextPageToken || '';
        page++;
      } while (pageToken && page <= 3); // Limite de 3 páginas por palavra-chave para não abusar da API
    }
    fs.writeFileSync('movies.json', JSON.stringify(Array.from(allMovies.values()), null, 2));
    console.log('Arquivo movies.json gerado com', allMovies.size, 'filmes.');
  }
}