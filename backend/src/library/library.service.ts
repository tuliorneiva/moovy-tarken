import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Library } from './entities/library.entity';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(Library)
    private libraryRepository: Repository<Library>,
  ) {}

  async addToLibrary(movieData: {
    movieId: string;
    title: string;
    year?: number;
    image?: string;
    rating?: string;
    type?: string;
  }): Promise<Library> {
    // Verificar se o filme já está na biblioteca
    const existing = await this.libraryRepository.findOne({
      where: { movieId: movieData.movieId },
    });

    if (existing) {
      throw new Error('Filme já está na biblioteca');
    }

    const libraryItem = this.libraryRepository.create(movieData);
    return await this.libraryRepository.save(libraryItem);
  }

  async removeFromLibrary(movieId: string): Promise<void> {
    const result = await this.libraryRepository.delete({ movieId });
    
    if (result.affected === 0) {
      throw new Error('Filme não encontrado na biblioteca');
    }
  }

  async getLibrary(): Promise<Library[]> {
    return await this.libraryRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async isInLibrary(movieId: string): Promise<boolean> {
    const item = await this.libraryRepository.findOne({
      where: { movieId },
    });
    return !!item;
  }

  async updateAudioReview(movieId: string, audioPath: string) {
    await this.libraryRepository.update({ movieId }, { audio_review: audioPath });
  }

  async getAudioReview(movieId: string) {
    return await this.libraryRepository.findOne({ where: { movieId } });
  }
}