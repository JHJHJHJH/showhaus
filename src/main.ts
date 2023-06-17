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
  app.enableCors({
    origin: [
      process.env.SHOWHOUSE_URL_DEV,
      process.env.SHOWHOUSE_URL_PROD,
      'https://www.showhouse.app',
    ],
    preflightContinue: false,
    methods: 'GET, PUT, POST, DELETE, PATCH, OPTIONS',
    allowedHeaders: [
      'content-type',
      'authorization',
      ...supertokens.getAllCORSHeaders(),
    ],
    credentials: true,
  });
  console.log(
    '🚀 ~ file: main.ts:33 ~ bootstrap ~ process.env.SHOWHOUSE_URL_DEV:',
    process.env.SHOWHOUSE_URL_PROD,
  );
  console.log(`App running on <${process.env.NODE_ENV}>....`);
  console.log(`Listening to PORT ${port}....`);
  await app.listen(port);
}
bootstrap();
