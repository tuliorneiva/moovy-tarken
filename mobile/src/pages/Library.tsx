import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import MovieCard from '../components/MovieCard';
import { API_ENDPOINTS } from '../config/api';
import * as FileSystem from 'expo-file-system';

type LibraryMovie = {
  id: number;        
  movieId: string;    
  title: string;
  year?: number;
  image?: string;
  rating?: string;
  type?: string;
};

export default function Library() {
  const [movies, setMovies] = useState<LibraryMovie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLibraryMovies();
  }, []);

  const fetchLibraryMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.library);

      if (!response.ok) {
        throw new Error('Erro ao buscar filmes da biblioteca');
      }

      const result = await response.json();

      if (result.success) {
        setMovies(result.data);
      } else {
        throw new Error('Erro na resposta do servidor');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const renderMovieCard = ({ item }: { item: LibraryMovie }) => (
    <MovieCard
      movie={{
        id: item.movieId,
        title: item.title,
        year: new Date(item.createdAt).getFullYear(),
        image: item.image,
        rating: item.rating,
        type: 'movie',
      }}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Carregando filmes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minha Biblioteca</Text>
      </View>

      {movies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sua biblioteca está vazia</Text>
          <Text style={styles.emptyText}>
            Adicione filmes da página de busca para vê-los aqui
          </Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderMovieCard}
          keyExtractor={(item) => item.id.toString()}
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
}); 