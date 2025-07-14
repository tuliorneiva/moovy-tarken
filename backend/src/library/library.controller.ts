import { Controller, Post, Delete, Get, Param, Body, HttpException,
 HttpStatus, UseInterceptors, UploadedFile, Put, Res } from '@nestjs/common';
import { LibraryService } from './library.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';


@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // Adicionar filme à biblioteca
  @Post()
  async addToLibrary(@Body() movieData: { 
    movieId: string;
    title: string;
    year?: number;
    image?: string;
    rating?: string;
    type?: string;
  }) {
    try {
      const result = await this.libraryService.addToLibrary(movieData);
      return { success: true, data: result };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao adicionar filme à biblioteca',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':movieId')
  async removeFromLibrary(@Param('movieId') movieId: string) {
    try {
      await this.libraryService.removeFromLibrary(movieId);
      return { success: true, message: 'Filme removido da biblioteca' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Erro ao remover filme da biblioteca',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async getLibrary() {
    try {
      const library = await this.libraryService.getLibrary();
      return { success: true, data: library };
    } catch (error) {
      throw new HttpException(
        'Erro ao buscar biblioteca',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':movieId/check')
  async checkInLibrary(@Param('movieId') movieId: string) {
    try {
      const isInLibrary = await this.libraryService.isInLibrary(movieId);
      return { success: true, isInLibrary };
    } catch (error) {
      throw new HttpException(
        'Erro ao verificar filme na biblioteca',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':movieId/audio')
async getAudio(@Param('movieId') movieId: string, @Res() res: Response) {
  const record = await this.libraryService.getAudioReview(movieId);
  if (!record?.audio_review) return res.status(404).send('Not found');
  const filePath = path.join(process.cwd(), record.audio_review);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  res.sendFile(filePath);
}

  @Put(':movieId/audio')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/audio_reviews',
      filename: (req, file, cb) => {
        const extension = extname(file.originalname);
          cb(null, `${req.params.movieId}${extension}`);
      }
    })
  }))
  async uploadAudio(
    @Param('movieId') movieId: string,
    @UploadedFile() file: any,
  ) {
    const audioPath = `uploads/audio_reviews/${file.filename}`;
    await this.libraryService.updateAudioReview(movieId, audioPath);
    return { success: true, audioPath};
  }
} 