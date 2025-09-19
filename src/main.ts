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

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permet à Nest d'écouter SIGINT/SIGTERM et d'appeler onModuleDestroy()
  app.enableShutdownHooks();

  if (process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'local') {
    app.enableCors({
      origin: true,   // autorise tout en local
      credentials: true,
    });
  } else {
    const whitelist: (string | RegExp)[] = [
      /^https?:\/\/localhost(:\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
      /^https?:\/\/10\.41\.62\.\d{1,3}(:\d+)?$/,
      'https://superadmin.sigcom.collexios.com',
      'https://portail.sigcom.collexios.com',
      'http://superadmin.sigcom.collexios.com',
      'http://portail.sigcom.collexios.com',
      'https://admin.commune.sigcom.collexios.com',
      'http://admin.commune.sigcom.collexios.com',
    ];

    app.enableCors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        const ok = whitelist.some(rule =>
          rule instanceof RegExp ? rule.test(origin) : rule === origin,
        );
        return ok ? cb(null, true) : cb(new Error('CORS blocked'), false);
      },
      credentials: false,
      methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
      allowedHeaders: ['Authorization','Content-Type','Accept','X-Requested-With','Origin'],
      exposedHeaders: ['Content-Disposition'],
      optionsSuccessStatus: 204,
    });
  }

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
    transformOptions: { enableImplicitConversion: true },
  }));

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
  SwaggerModule.setup('api-docs', app, document, { swaggerOptions: { persistAuthorization: true } });

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(Number(process.env.PORT) || 4002, '0.0.0.0');
}
bootstrap();
