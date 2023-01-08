import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UraScraperModule } from './ura-scraper/ura-scraper.module';
import { ScheduleModule } from '@nestjs/schedule';
import config from './config/configuration';
import { LoggerModule } from 'nestjs-pino';
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      // envFilePath: `.env.${process.env.NODE_ENV}`,
      //ignoreEnvFile: process.env.NODE_ENV === 'production' ? true : false,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'postgres',
          host: config.get('POSTGRES_HOST'),
          port: config.get<number>('POSTGRES_PORT'),
          username: config.get('POSTGRES_USER'),
          password: config.get('POSTGRES_PASSWORD'),
          database: config.get('POSTGRES_DB'),
          autoLoadEntities: true,
          synchronize: true, //temp
          // synchronize: process.env.NODE_ENV === 'production'? false : true, //should not be used in production environment
        };
      },
    }),
    ScheduleModule.forRoot(),
    UraScraperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
