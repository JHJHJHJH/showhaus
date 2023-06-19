import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import config from './config/configuration';
import supertokens from 'supertokens-node';
import { SupertokensExceptionFilter } from './auth/auth.filter';

async function bootstrap() {
  // console.log('Nest bootstrap started...');
  // console.log(`Environment: ${process.env.NODE_ENV} `);
  // console.log(`Host: ${process.env.POSTGRES_HOST} `);
  // console.log(`Port: ${process.env.POSTGRES_PORT} `);
  // console.log(`URA API KEY: ${process.env.URA_API_KEY} `);
  // console.log(`PG DB: ${process.env.POSTGRES_DB} `);
  const app = await NestFactory.create(AppModule);
  // app.setGlobalPrefix('v1/api');
  const port = process.env.PORT || 8080;
  const pipe = new ValidationPipe({ whitelist: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(pipe);
  app.useGlobalFilters(new SupertokensExceptionFilter());
  const whitelist = [
    'http://localhost:3000',
    'https://www.showhouse.app',
    'https://www.showhouse.app/',
    'https://showhouse.app/',
    'https://showhouse.app',
  ];
  app.enableCors({
    origin: whitelist,
    preflightContinue: false,
    methods: 'GET, PUT, POST, DELETE, PATCH, OPTIONS',
    allowedHeaders: [
      'Origin',
      'X-Api-Key',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      ...supertokens.getAllCORSHeaders(),
    ],
    credentials: true,
  });
  console.log(`App running on <${process.env.NODE_ENV}>....`);
  console.log(`Listening to PORT ${port}....`);
  await app.listen(port);
}
bootstrap();
