import React, { useRef, useState, useEffect } from 'react';
import MovieCard from '../components/MovieCard';

type LibraryMovie = {
  id: number;
  movieId: string;
  title: string;
  image: string;
  rating: string;
  createdAt: string;
}

type AudioReviewButtonProps = {
  audioUrl: string;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
};

function useLibraryMovies() {
  const [movies, setMovies] = useState<LibraryMovie[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLibraryMovies();
  }, []);

  const fetchLibraryMovies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/library');
      
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

  return { movies, error, loading };
}

const AudioReviewButton: React.FC<AudioReviewButtonProps> = ({ audioUrl, isPlaying, onPlay, onPause }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div style={{ marginTop: 8, textAlign: 'center' }}>
      <audio ref={audioRef} src={audioUrl} onEnded={onPause} style={{ display: 'none' }} />
      {isPlaying ? (
        <button
          onClick={onPause}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Pause
        </button>
      ) : (
        <button
          onClick={onPlay}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Play
        </button>
      )}
    </div>
  );
};

export default function Library() {
  const [audioExists, setAudioExists] = useState<{ [movieId: string]: boolean }>({});
  const { movies, error, loading } = useLibraryMovies();
  const [visibleCount, setVisibleCount] = useState(8);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Função para detectar quando o usuário chegou próximo ao final da página
  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Se chegou a 100px do final da página e ainda há mais filmes para mostrar
      if (scrollTop + windowHeight >= documentHeight - 100 && visibleCount < movies.length) {
        setVisibleCount(prev => Math.min(prev + 8, movies.length));
      }
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, movies.length]);

  useEffect(() => {
    const checkAudios = async () => {
      const checks = await Promise.all(
        movies.map(async (movie) => {
          const audioUrl = `http://localhost:3001/library/${movie.movieId}/audio`;
          try {
            const res = await fetch(audioUrl, { method: 'HEAD' });
            return [movie.movieId, res.ok];
          } catch {
            return [movie.movieId, false];
          }
        })
      );
      setAudioExists(Object.fromEntries(checks));
    };

    if (movies.length > 0) {
      checkAudios();
    }
  }, [movies]);

  if (loading) {
    return <div className="text-center text-gray-500 mt-10">Carregando filmes...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Minha Biblioteca</h1>
        
        {movies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">
              Sua biblioteca está vazia
            </p>
            <p className="text-gray-500">
              Adicione filmes da página de busca para vê-los aqui
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.slice(0, visibleCount).map((movie) => {
                const audioUrl = `http://localhost:3001/library/${movie.movieId}/audio`;

                return (
                  <div key={movie.id} className="relative">
                    <MovieCard
                      movie={{
                        id: movie.movieId,
                        title: movie.title,
                        year: new Date(movie.createdAt).getFullYear(),
                        image: movie.image,
                        rating: movie.rating,
                        type: 'movie'
                      }}
                    />
                    {audioExists[movie.movieId] && (
                      <AudioReviewButton
                        audioUrl={audioUrl}
                        isPlaying={playingId === movie.movieId}
                        onPlay={() => setPlayingId(movie.movieId)}
                        onPause={() => setPlayingId(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Indicador de carregamento */}
            {visibleCount < movies.length && (
              <div className="text-center text-gray-500 mt-8 mb-4">
                Carregando mais filmes...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
