import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('library')
export class Library {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  movieId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  audio_review: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  rating: string;

  @Column({ default: 'movie' })
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 