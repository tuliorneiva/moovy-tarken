import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { uploadAudioReview } from '../utils/uploadAudio';

const Star = () => (
  <Text style={{ color: '#FFD700', fontSize: 18, marginRight: 4 }}>★</Text>
);

type Movie = {
  id: string;
  title: string;
  year: number;
  image: string;
  rating: string;
  type: string;
};

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playbackDuration, setPlaybackDuration] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const audioFilePath = `${FileSystem.documentDirectory}audio_reviews/${movie.id}.m4a`;

  useEffect(() => {
    checkLibraryStatus();
    loadAudioIfExists();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [movie.id]);

  // Atualiza timer durante gravação
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording) {
      interval = setInterval(async () => {
        const status = await recording.getStatusAsync();
        if (status.isRecording) {
          setRecordingDuration(status.durationMillis || 0);
        }
      }, 200);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [recording]);

  // Atualiza timer durante reprodução
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && sound) {
      interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPlaybackDuration(status.positionMillis || 0);
        }
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sound]);

  const loadAudioIfExists = async () => {
    try {
      const info = await FileSystem.getInfoAsync(audioFilePath);
      if (info.exists) {
        setAudioUri(audioFilePath);
      } else {
        setAudioUri(null);
      }
    } catch (e) {
      setAudioUri(null);
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissão negada', 'É necessário permitir acesso ao microfone.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        // Garante que a pasta existe
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'audio_reviews/', { intermediates: true });
        await FileSystem.moveAsync({ from: uri, to: audioFilePath });
        setAudioUri(audioFilePath);
  
        // Faz o upload imediatamente usando audioFilePath
        if (isInLibrary) {
          try {
            console.log("movie.id: ", movie.id);
            await uploadAudioReview(movie.id, audioFilePath, API_BASE_URL);
          } catch (error) {
            console.error('Erro ao enviar áudio:', error);
          }
        }
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o áudio.');
    } finally {
      setRecording(null);
      setRecordingDuration(0);
    }
  };

  const playAudio = async () => {
    if (!audioUri) return;
    try {
      const { sound: playbackObj } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      setSound(playbackObj);
      setIsPlaying(true);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível reproduzir o áudio.');
    }
  };

  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPlaybackDuration(0);
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
    }
  };

  const deleteAudio = async () => {
    setIsDeleting(true);
    try {
      await FileSystem.deleteAsync(audioFilePath, { idempotent: true });
      setAudioUri(null);
      setPlaybackDuration(0);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível deletar o áudio.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatMillis = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const min = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const sec = (totalSeconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };


  const checkLibraryStatus = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.libraryCheck(movie.id));
      const data = await response.json();
      setIsInLibrary(data.isInLibrary);
    } catch (error) {
      console.error('Erro ao verificar status da biblioteca:', error);
    }
  };

  const handleAddToLibrary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.library, {
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
      });
      const data = await response.json();
      const movieId = data.data.id;
      setIsInLibrary(true);
    } catch (error) {
      // Silenciar erro
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    setIsLoading(true);
    try {
      await fetch(API_ENDPOINTS.libraryRemove(movie.id), {
        method: 'DELETE',
      });
      setIsInLibrary(false);
    } catch (error) {
      // Silenciar erro
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLibrary = () => {
    if (isInLibrary) {
      Alert.alert(
        'Remover da Biblioteca',
        `Tem certeza que deseja remover "${movie.title}" da sua biblioteca?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: handleRemoveFromLibrary,
          },
        ]
      );
    } else {
      handleAddToLibrary();
    }
  };

  return (
    <View style={styles.card}>
      {/* Poster */}
      <View style={styles.posterContainer}>
        {movie.image ? (
          <Image source={{ uri: movie.image }} style={styles.poster} resizeMode="cover" />
        ) : (
          <View style={styles.noPoster}>
            <Text style={styles.noPosterText}>Sem poster</Text>
          </View>
        )}
      </View>

      {/* Informações do filme */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {movie.title}
        </Text>
        <View style={styles.ratingContainer}>
          <Star />
          <Text style={styles.rating}>{movie.rating}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.button,
            isInLibrary ? styles.removeButton : styles.addButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={toggleLibrary}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {isInLibrary ? 'Remover' : 'Salvar'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Áudio Review - só se estiver na biblioteca */}
        {isInLibrary && (
          <View style={{ alignItems: 'center', marginTop: 18 }}>
            {/* Gravação em andamento */}
            {recording ? (
              <View style={styles.audioControls}>
                <Text style={styles.recordingText}>Gravando... {formatMillis(recordingDuration)}</Text>
                <TouchableOpacity style={styles.audioButton} onPress={stopRecording}>
                  <Text style={{ fontSize: 28, color: '#e53935' }}>■</Text>
                </TouchableOpacity>
              </View>
            ) : audioUri ? (
              <View style={styles.audioControls}>
                <Text style={styles.audioTime}>{isPlaying ? formatMillis(playbackDuration) : formatMillis(recordingDuration || 0)}</Text>
                <TouchableOpacity style={styles.audioButton} onPress={isPlaying ? pauseAudio : playAudio}>
                  <Text style={{ fontSize: 28 }}>{isPlaying ? '⏸️' : '▶️'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.audioButton} onPress={deleteAudio} disabled={isDeleting}>
                  <Text style={{ fontSize: 28, color: '#e53935' }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.audioButton} onPress={startRecording}>
                <Text style={{ fontSize: 28, color: '#43a047' }}>⏺️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
    marginRight: 24,
    marginVertical: 16,
    width: 220,
    alignItems: 'center',
    paddingBottom: 18,
  },
  posterContainer: {
    width: 200,
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poster: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  noPoster: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPosterText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22223b',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fbbf24',
  },
  button: {
    minWidth: 90,
    paddingVertical: 7,
    paddingHorizontal: 0,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2563eb',
  },
  removeButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 8,
  },
  audioButton: {
    marginHorizontal: 8,
    padding: 8,
  },
  recordingText: {
    color: '#e53935',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  audioTime: {
    color: '#222',
    fontSize: 16,
    marginRight: 8,
    minWidth: 48,
    textAlign: 'center',
  },
}); 