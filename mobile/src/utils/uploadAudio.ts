import * as FileSystem from 'expo-file-system';

// Função para fazer upload do áudio para o backend
export async function uploadAudioReview(movieId: string, localAudioUri: string, backendUrl: string) {
  const apiUrl = `${backendUrl}/library/${movieId}/audio`;

  const fileInfo = await FileSystem.getInfoAsync(localAudioUri);
  if (!fileInfo.exists) throw new Error('Arquivo de áudio não encontrado');

  const formData = new FormData();
  formData.append('file', {
    uri: localAudioUri,
    name: `${movieId}.m4a`,
    type: 'audio/m4a',
  } as any);

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Falha ao enviar áudio');
  }

  const data = await response.json();
  return data.audioPath;
}