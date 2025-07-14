import { useEffect, useState } from 'react'
import MovieCard from '../components/MovieCard'

type Movie = {
  id: string;
  title: string;
  year: number;
  image: string;
  rating: string;
  type: string;
}

type SearchResult = {
  id: string;
  title: string;
  year: number;
  image: string;
  rating: string;
  type: string;
}

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

function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/movies.json')
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar filmes')
        return res.json()
      })
      .then((data: Movie[]) => {
        setMovies(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Não foi possível carregar os filmes.')
        setLoading(false)
      })
  }, [])

  return { movies, error, loading }
}

function useSearchResults() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const searchMovies = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      setSearchError(null)
      
      // Fazer requisição para a API do IMDb
      const response = await fetch(`https://api.imdbapi.dev/search/titles?query=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar filmes')
      }

      const data: IMDbSearchResponse = await response.json()
      
      if (data.titles) {
        const formattedResults: SearchResult[] = data.titles
          .filter((item: IMDbTitle) => item.type === 'movie') // Filtrar apenas filmes
          .map((item: IMDbTitle) => ({
            id: item.id,
            title: item.primaryTitle,
            year: item.startYear || new Date().getFullYear(),
            image: item.primaryImage?.url || '',
            rating: item.rating?.aggregateRating?.toString() || 'N/A',
            type: 'movie'
          }))
        
        setSearchResults(formattedResults)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Erro na busca:', error)
      setSearchError('Erro ao buscar filmes. Tente novamente.')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  return { searchResults, searchLoading, searchError, searchMovies }
}

export default function Search() {
  const { movies, error, loading } = useMovies()
  const { searchResults, searchLoading, searchError, searchMovies } = useSearchResults()
  const [visibleCount, setVisibleCount] = useState(8)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Debounce para evitar muitas requisições
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true)
        searchMovies(searchQuery)
      } else {
        setIsSearching(false)
      }
    }, 500) // Aguarda 500ms após o usuário parar de digitar

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchMovies])

  // Função para detectar quando o usuário chegou próximo ao final da página
  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Se chegou a 100px do final da página e ainda há mais filmes para mostrar
      if (scrollTop + windowHeight >= documentHeight - 100 && visibleCount < movies.length) {
        setVisibleCount(prev => Math.min(prev + 8, movies.length))
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [visibleCount, movies.length])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Determinar quais filmes mostrar
  const displayMovies = isSearching ? searchResults : movies
  const displayLoading = isSearching ? searchLoading : loading
  const displayError = isSearching ? searchError : error

  if (displayLoading && !isSearching) {
    return <div className="text-center text-gray-500 mt-10">Carregando filmes...</div>
  }

  if (displayError && !isSearching) {
    return <div className="text-center text-red-500 mt-10">{displayError}</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Buscar Filmes</h1>
        
        {/* Barra de pesquisa */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Digite o nome do filme..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 pl-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          
          {searchError && (
            <p className="text-red-500 text-sm mt-2">{searchError}</p>
          )}
        </div>
        
        {/* Resultados */}
        {isSearching ? (
          // Resultados da pesquisa
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Resultados para "{searchQuery}"
            </h2>
            {searchResults.length === 0 && !searchLoading ? (
              <div className="text-center py-16">
                <p className="text-gray-500">Nenhum filme encontrado para "{searchQuery}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchResults.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Lista completa de filmes
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayMovies.slice(0, visibleCount).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
        
        {/* Indicador de carregamento */}
        {visibleCount < movies.length && !isSearching && (
          <div className="text-center text-gray-500 mt-8 mb-4">
            Carregando mais filmes...
          </div>
        )}
      </div>
    </div>
  )
}
