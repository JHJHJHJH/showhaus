import { SetMetadata } from '@nestjs/common';

export const ResponseMessageKey = 'message';
export const ResponseMessage = (message: string) =>
  SetMetadata(ResponseMessageKey, message);
