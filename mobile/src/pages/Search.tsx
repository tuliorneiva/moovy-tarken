import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import MovieCard from '../components/MovieCard';
import { DEV_CONFIG } from '../config/api';

type Movie = {
  id: string;
  title: string;
  year: number;
  image: string;
  rating: string;
  type: string;
};

type SearchResult = {
  id: string;
  title: string;
  year: number;
  image: string;
  rating: string;
  type: string;
};

interface IMDbRating {
  aggregateRating: number;
  voteCount: number;
}

interface IMDbImage {
  url: string;
  width: number;
  height: number;
}

interface IMDbTitle {
  id: string;
  type: string;
  primaryTitle: string;
  primaryImage?: IMDbImage;
  startYear?: number;
  rating?: IMDbRating;
}

interface IMDbSearchResponse {
  titles: IMDbTitle[];
}

export default function Search() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Carregar filmes iniciais
  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      // No React Native, precisamos usar require para arquivos locais
      const data: Movie[] = require('../../movies.json');
      setMovies(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao carregar filmes');
    } finally {
      setLoading(false);
    }
  };

  // Buscar filmes na API do IMDb
  const searchMovies = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);

      const response = await fetch(
        `${DEV_CONFIG.imdbApiUrl}?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar filmes');
      }

      const data: IMDbSearchResponse = await response.json();

      if (data.titles) {
        const formattedResults: SearchResult[] = data.titles
          .filter((item: IMDbTitle) => item.type === 'movie')
          .map((item: IMDbTitle) => ({
            id: item.id,
            title: item.primaryTitle,
            year: item.startYear || new Date().getFullYear(),
            image: item.primaryImage?.url || '',
            rating: item.rating?.aggregateRating?.toString() || 'N/A',
            type: 'movie',
          }));

        setSearchResults(formattedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      setSearchError('Erro ao buscar filmes. Tente novamente.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        searchMovies(searchQuery);
      } else {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const renderMovieCard = ({ item }: { item: Movie | SearchResult }) => (
    <MovieCard movie={item} />
  );

  const displayMovies = isSearching ? searchResults : movies;
  const displayLoading = isSearching ? searchLoading : loading;
  const displayError = isSearching ? searchError : error;

  if (displayLoading && !isSearching) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Carregando filmes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (displayError && !isSearching) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{displayError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar Filmes</Text>
      </View>

      {/* Barra de pesquisa */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Digite o nome do filme..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#9ca3af"
        />
        {searchLoading && (
          <ActivityIndicator
            style={styles.searchLoading}
            size="small"
            color="#3b82f6"
          />
        )}
      </View>

      {searchError && (
        <Text style={styles.errorText}>{searchError}</Text>
      )}

      {/* Resultados */}
      {isSearching ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            Resultados para "{searchQuery}"
          </Text>
          {searchResults.length === 0 && !searchLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhum filme encontrado para "{searchQuery}"
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderMovieCard}
              keyExtractor={(item) => item.id}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={displayMovies}
          renderItem={renderMovieCard}
          keyExtractor={(item) => item.id}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  searchLoading: {
    marginLeft: 12,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    paddingLeft: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
}); 