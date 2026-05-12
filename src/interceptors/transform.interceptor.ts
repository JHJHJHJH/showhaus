import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { ResponseMessageKey } from '../decorators/message.decorator';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  error: string;
}
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const responseMessage = this.reflector.get<string>(
      ResponseMessageKey,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: responseMessage || '',
        data: data || '',
        error: '',
      })),
    );
  }
}
