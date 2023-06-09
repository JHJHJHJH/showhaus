import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UraScraperModule } from './ura-scraper/ura-scraper.module';
import { ScheduleModule } from '@nestjs/schedule';
import config from './config/configuration';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
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
    AuthModule.forRoot({
      // https://try.supertokens.com is for demo purposes. Replace this with the address of your core instance (sign up on supertokens.com), or self host a core.
      connectionURI: config().SUPERTOKENS_URI,
      apiKey: config().SUPERTOKENS_API_KEY,
      appInfo: {
        // Learn more about this on https://supertokens.com/docs/thirdparty/appinfo
        appName: 'showhouse',
        apiDomain: 'http://localhost:8080/api',
        websiteDomain: 'http://localhost:8080',
        apiBasePath: '/auth',
        websiteBasePath: '/auth',
      },
    }),
    ScheduleModule.forRoot(),
    UraScraperModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
