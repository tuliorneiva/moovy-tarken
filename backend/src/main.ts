import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para o frontend e mobile
  app.enableCors({
    origin: ['http://localhost:5173', 'http://192.168.0.10:5173'],
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    credentials: true,
  });
  
  await app.listen(3001, '0.0.0.0');
  console.log('RUNNING ON PORT 3001');
}
bootstrap();