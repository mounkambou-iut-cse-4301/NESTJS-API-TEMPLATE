// // main.ts (ou bootstrap.ts)
// import { NestFactory } from '@nestjs/core';
// import { AppModule }   from './app.module';
// import { ValidationPipe } from '@nestjs/common';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import * as bodyParser from 'body-parser';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   app.enableCors({
//     origin: [
//       'http://localhost:3000',
//       'http://localhost:3001',
//       'http://localhost:3002',
//       'http://localhost:5173',
//       'http://localhost:5174',
//       'https://superadmin.sigcom.collexios.com',
//       'https://portail.sigcom.collexios.com',
//       'http://superadmin.sigcom.collexios.com',
//       'http://portail.sigcom.collexios.com',
//       'https://admin.commune.sigcom.collexios.com',
//       'http://admin.commune.sigcom.collexios.com'
//     ],
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
//   });

//     app.useGlobalPipes(new ValidationPipe({
//     transform: true,                 // ✅ convertit "2" -> 2 grâce aux DTO
//     whitelist: true,
//       forbidNonWhitelisted: false, // pour éviter 400 si des clés en plus arrivent
//     transformOptions: { enableImplicitConversion: true },
//   }));

//   // 1. Construction de la config Swagger avec bearer
//   const config = new DocumentBuilder()
//     .setTitle('SIGCOM superadmin/MINDDEVEL API')
//     .setDescription('API de gestion de SIGCOM')
//     .setVersion('1.0')
//     .addBearerAuth(
//       {
//         type: 'http',
//         scheme: 'bearer',
//         bearerFormat: 'JWT',
//         in: 'header',
//         name: 'Authorization',
//       },
//       'JWT-auth', // identifiant du schéma
//     )
//     .build();

//   // 2. Création du document et expo de l’UI
//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api-docs', app, document, {
//     swaggerOptions: { persistAuthorization: true },
//   });

//   app.use(bodyParser.json({ limit: '50mb' }));
//   app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//   await app.listen(process.env.PORT ?? 4002);
// }
// bootstrap();
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permet à Nest d'écouter SIGINT/SIGTERM et d'appeler onModuleDestroy()
  app.enableShutdownHooks();

  // --- CORS ULTRA-PERMISSIF (Swagger + toutes API) ---
  app.enableCors({
    origin: true,            // reflète l’Origin de la requête (équivaut à "*", compatible credentials)
    credentials: true,       // cookies + Authorization
    methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
    allowedHeaders: ['*'],   // accepte tous les headers
    exposedHeaders: ['Content-Disposition'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Middleware fallback pour OPTIONS (évite que certains proxies bloquent)
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Validation globale
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
    transformOptions: { enableImplicitConversion: true },
  }));

  // --- Swagger ---
  const config = new DocumentBuilder()
    .setTitle('SIGCOM API')
    .setDescription('API de gestion de SIGCOM')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header', name: 'Authorization' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // --- Body parser ---
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Démarrage serveur
  await app.listen(Number(process.env.PORT) || 4002, '0.0.0.0');
}
bootstrap();
