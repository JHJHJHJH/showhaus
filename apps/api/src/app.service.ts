import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private configService: ConfigService) {}

  getHello(): string {
    return 'Hello Showhouse Api! UPDATE';
  }

  logEnvVariables(): void {
    this.logger.log(this.configService.get('URA_API_KEY'));
    this.logger.log(this.configService.get('POSTGRES_DB'));
  }
}
