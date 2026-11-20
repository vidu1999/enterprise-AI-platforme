import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const corsEnv = process.env.CORS_ORIGIN?.trim();
  const allowedOrigins = corsEnv && corsEnv !== '*' ? corsEnv.split(',').map((o) => o.trim()) : null;
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || !allowedOrigins || allowedOrigins.includes(origin) || /\.e2b\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('OpsPilot Enterprise API')
    .setDescription(
      'AI-Powered Multi-Tenant Enterprise Operations Intelligence Platform — Auth, RBAC, HR, Inventory, Maintenance, Approvals, Analytics, Audit & Permission-Aware AI.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  logger.log(`OpsPilot API listening on http://0.0.0.0:${port}/api (Swagger OpenAPI at /docs)`);
}
bootstrap();
