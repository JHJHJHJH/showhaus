import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Res,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseMessage } from './decorators/message.decorator';
import { ExceptionInterceptor } from './interceptors/exception.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { SessionContainer } from 'supertokens-node/recipe/session';
import { AuthGuard } from './auth/auth.guard';
import { Session } from './auth/session.decorator';
import ThirdParty from 'supertokens-node/recipe/thirdparty';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('test')
  @UseGuards(new AuthGuard())
  async getTest(@Session() session: SessionContainer): Promise<string> {
    // TODO: magic
    return 'magic';
  }

  @Get('user-email')
  @UseGuards(new AuthGuard())
  async getUserInfo(@Session() session: SessionContainer): Promise<string> {
    const userId = session.getUserId();
    // You can learn more about the `User` object over here https://github.com/supertokens/core-driver-interface/wiki
    const userInfo: ThirdParty.User = await ThirdParty.getUserById(userId);
    return userInfo.email;
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/env')
  getEnvVars(): void {
    this.appService.logEnvVariables();
  }

  @Get('/transformed')
  @ResponseMessage('TEST MESSAGE')
  @UseInterceptors(TransformInterceptor)
  getTransformed(): number[] {
    return [1, 2, 3, 4];
  }
}
