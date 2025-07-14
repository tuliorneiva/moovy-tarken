# Pipeline de Áudio Review: Mobile, Backend e Banco de Dados

## Visão Geral

Este documento detalha o fluxo completo de gravação, upload e armazenamento de áudios de review de filmes no app Moovy, cobrindo a integração entre o app mobile (React Native/Expo), o backend (NestJS) e o banco de dados (PostgreSQL).

---

## 1. Fluxo Geral

1. **Usuário grava um áudio review no app mobile.**
2. **O áudio é salvo localmente no dispositivo mobile.**
3. **O app faz upload do áudio para o backend via HTTP (endpoint REST).**
4. **O backend salva o arquivo de áudio no servidor (PC) e atualiza o banco de dados com o caminho do arquivo.**
5. **O app pode buscar e reproduzir o áudio review posteriormente, baixando do backend.**

---

## 2. Pipeline Detalhado

### **A. Mobile (React Native/Expo)**

#### **Principais arquivos/funções:**
- `MovieCard.tsx`: Componente responsável por gravar, parar, reproduzir e deletar áudios.
- `uploadAudio.ts`: Função utilitária para upload do áudio para o backend.
- `Library.tsx`: Página que exibe os filmes salvos na biblioteca do usuário.
- `Search.tsx`: Página de busca de filmes.
- `App.tsx`: Configuração de navegação.

#### **Etapas no Mobile:**

1. **Gravação do Áudio**
   - O usuário pressiona o botão de gravação no `MovieCard`.
   - A função `startRecording` solicita permissão e inicia a gravação usando `expo-av`.
   - O áudio é gravado localmente no dispositivo.

2. **Parar e Salvar o Áudio**
   - Ao parar a gravação (`stopRecording`), o áudio é salvo em uma pasta local do app (`FileSystem.documentDirectory + 'audio_reviews/'`).
   - O caminho local do arquivo é armazenado no estado do componente.

3. **Upload para o Backend**
   - Após salvar localmente, a função `uploadAudioReview` é chamada.
   - Ela envia o arquivo via HTTP PUT para o endpoint `/library/:movieId/audio` do backend, usando `multipart/form-data`.
   - O parâmetro `movieId` é o identificador único do filme (ex: tt0079788).

4. **Reprodução e Exclusão**
   - O usuário pode reproduzir o áudio localmente usando `expo-av`.
   - Pode deletar o áudio localmente; se desejar, pode implementar exclusão remota também.

#### **Funções-chave:**
- `startRecording`: Inicia a gravação de áudio.
- `stopRecording`: Para a gravação, salva localmente e faz upload para o backend.
- `uploadAudioReview`: Faz o upload do arquivo para o backend.
- `playAudio`/`pauseAudio`: Reproduz/pausa o áudio local.
- `deleteAudio`: Remove o arquivo local.

---

### **B. Backend (NestJS)**

#### **Principais arquivos/funções:**
- `library.controller.ts`: Define os endpoints REST para upload, download e gerenciamento de filmes e áudios.
- `library.service.ts`: Lógica de negócio para manipulação dos registros no banco.
- `library.entity.ts`: Define a estrutura da tabela `library` no banco.
- `main.ts`/`app.module.ts`/`library.module.ts`: Configuração do servidor e módulos.

#### **Endpoints relevantes:**
- `PUT /library/:movieId/audio`: Recebe o upload do áudio review.
- `GET /library/:movieId/audio`: Permite baixar/streamar o áudio.
- `POST /library`: Adiciona um filme à biblioteca.
- `DELETE /library/:movieId`: Remove um filme (e pode remover o áudio associado).

#### **Fluxo no Backend:**

1. **Recebimento do Upload**
   - O endpoint `PUT /library/:movieId/audio` recebe o arquivo via `multipart/form-data`.
   - Usa o `FileInterceptor` (Multer) para salvar o arquivo em `backend/uploads/audio_reviews/` com o nome `${movieId}.m4a`.

2. **Atualização do Banco de Dados**
   - Após salvar o arquivo, chama `updateAudioReview(movieId, audioPath)` no service.
   - Atualiza o campo `audio_review` do registro correspondente na tabela `library` com o caminho do arquivo.

3. **Download/Reprodução**
   - O endpoint `GET /library/:movieId/audio` retorna o arquivo salvo para o app mobile ou web.

#### **Funções-chave:**
- `updateAudioReview(movieId, audioPath)`: Atualiza o caminho do áudio no banco.
- `getAudioReview(movieId)`: Busca o registro para download.

---

### **C. Banco de Dados (PostgreSQL)**

#### **Tabela `library`**
- Campos principais:
  - `id`: Chave primária (auto-incremento)
  - `movieId`: Identificador único do filme (string, ex: tt0079788)
  - `title`, `year`, `image`, `rating`, `type`: Dados do filme
  - `audio_review`: Caminho do arquivo de áudio review (ex: `uploads/audio_reviews/tt0079788.m4a`)
  - `createdAt`, `updatedAt`: Datas de criação/atualização

#### **Como o banco é atualizado:**
- Ao adicionar um filme, um novo registro é criado.
- Ao fazer upload do áudio, o campo `audio_review` é atualizado com o caminho do arquivo.
- Ao remover um filme, o registro (e opcionalmente o arquivo de áudio) é removido.

---

## 3. Exemplo de Pipeline Completo

1. Usuário busca e adiciona um filme à biblioteca pelo app mobile.
2. O app salva o filme no backend (`POST /library`). O backend retorna o registro salvo.
3. Usuário grava um áudio review para o filme.
4. Ao parar a gravação, o app salva o áudio localmente e faz upload para o backend (`PUT /library/:movieId/audio`).
5. O backend salva o arquivo no PC e atualiza o campo `audio_review` no banco.
6. O app pode buscar o áudio para reprodução via `GET /library/:movieId/audio`.
7. Se o filme for removido, o registro e o áudio podem ser removidos do backend e do banco.

---

## 4. Observações Importantes

- O app mobile **NÃO** salva arquivos diretamente no PC; o upload para o backend é obrigatório.
- O campo `movieId` é a chave para associar o áudio ao filme.
- O backend é responsável por garantir que o arquivo seja salvo e o banco atualizado corretamente.
- O app pode implementar lógica para tentar o upload novamente caso falhe (ex: offline).

---

## 5. Resumo das Responsabilidades

- **Mobile:** Grava, salva localmente, faz upload, reproduz e deleta áudios.
- **Backend:** Recebe uploads, salva arquivos, atualiza banco, serve arquivos para download.
- **Banco:** Armazena metadados dos filmes e o caminho do áudio review.

---

## 6. Possíveis Extensões
- Sincronização offline/online de áudios.
- Exclusão automática do arquivo de áudio ao remover o filme.
- Permitir múltiplos reviews por filme/usuário.
- Autenticação de usuário para uploads/downloads.

---

**Dúvidas ou sugestões? Consulte este pipeline para entender o fluxo completo do áudio review no Moovy!** 