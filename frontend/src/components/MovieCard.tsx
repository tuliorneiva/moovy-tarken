import { useState, useEffect } from 'react'
import ConfirmationModal from './ConfirmationModal'

type Movie = {
  id: string;
  title: string;
  year: number;
  image: string;
  rating: string;
  type: string;
}

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [isInLibrary, setIsInLibrary] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)

  // Verificar se o filme está na biblioteca ao carregar a tela
  useEffect(() => {
    checkLibraryStatus()
  }, [movie.id])

  // Verifica se o filme está na biblioteca
  const checkLibraryStatus = async () => {
    try {
      const response = await fetch(`http://localhost:3001/library/${movie.id}/check`)
      const data = await response.json()
      setIsInLibrary(data.isInLibrary)
    } catch (error) {
      console.error('Erro ao verificar biblioteca:', error)
    }
  }

  const handleAddToLibrary = async () => {
    setIsLoading(true)
    try {
      await fetch('http://localhost:3001/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: movie.id,
          title: movie.title,
          year: movie.year,
          image: movie.image,
          rating: movie.rating,
          type: movie.type,
        }),
      })
      setIsInLibrary(true)
    } catch (error) {
      console.error('Erro ao adicionar à biblioteca:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFromLibrary = async () => {
    setIsLoading(true)
    try {
      await fetch(`http://localhost:3001/library/${movie.id}`, {
        method: 'DELETE',
      })
      setIsInLibrary(false)
    } catch (error) {
      console.error('Erro ao remover da biblioteca:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLibrary = () => {
    if (isInLibrary) {
      setShowRemoveModal(true)
    } else {
      handleAddToLibrary()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Poster */}
      <div className="h-64 bg-gray-200">
        {movie.image ? (
          <img 
            src={movie.image} 
            alt={movie.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>Sem poster</span>
          </div>
        )}
      </div>
      
      {/* Informações do filme */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {movie.title}
        </h3>
        
        {/* Rating */}
        {movie.rating && (
          <div className="flex items-center gap-1 text-yellow-600 font-semibold mb-3">
            <span role="img" aria-label="star">⭐</span>
            <span>{movie.rating}</span>
          </div>
        )}
        
        {/* Botão da biblioteca */}
        <button
          onClick={toggleLibrary}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isInLibrary
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            'Carregando...'
          ) : isInLibrary ? (
            'Remover da Biblioteca'
          ) : (
            'Adicionar à Biblioteca'
          )}
        </button>
      </div>
      
      {/* Modal de confirmação para remover da biblioteca */}
      <ConfirmationModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemoveFromLibrary}
        title="Remover da Biblioteca"
        message={`Tem certeza que deseja remover "${movie.title}" da sua biblioteca?`}
        confirmText="Remover"
        cancelText="Cancelar"
      />
    </div>
  )
}
 