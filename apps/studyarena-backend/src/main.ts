import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Cookie Parser
    app.use(cookieParser());

    // Global Validation Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // CORS
    app.enableCors({
        origin: true,
        credentials: true,
    });

    // Swagger API Documentation
    const config = new DocumentBuilder()
        .setTitle('StudyArena API')
        .setDescription('클래스별 학습 경쟁 백엔드 API')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('arena')
        .addTag('leaderboard')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // Start server
    const port = parseInt(process.env.PORT || '4006', 10);
    await app.listen(port, '0.0.0.0');
    console.log(`🏟️  StudyArena Backend running on: http://0.0.0.0:${port}`);
    console.log(`📚 API Documentation: http://0.0.0.0:${port}/api`);
}
bootstrap();
