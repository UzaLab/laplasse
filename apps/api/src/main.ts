import 'dotenv/config'
import * as Sentry from '@sentry/node'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { join } from 'path'
import express from 'express'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { winstonLogger } from './common/logger/logger.config'

// Initialiser Sentry avant tout (seulement si DSN configuré)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    integrations: [
      Sentry.httpIntegration(),
    ],
  })
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: winstonLogger,
  })

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')))

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  )

  // Prefix global API
  app.setGlobalPrefix('api')

  // CORS — autorise le frontend Next.js
  app.enableCors({
    origin: [
      'http://localhost:3000',
      process.env.APP_URL ?? 'http://localhost:3000',
    ],
    credentials: true,
  })

  // Validation globale via class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Filtre d'exceptions global
  app.useGlobalFilters(new HttpExceptionFilter())

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`\n🚀 LaPlasse API running on http://localhost:${port}/api`)
  console.log(`   Health: http://localhost:${port}/api/health`)
  console.log(`   Env: ${process.env.NODE_ENV ?? 'development'}\n`)
}

bootstrap()
