import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const SESSION_ID_REGEX = /^[A-Za-z0-9:_-]+$/;
const MAX_SESSION_ID_LENGTH = 128;

@Injectable()
export class ChatbotSessionIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (
      typeof value !== 'string' ||
      !value ||
      value.length > MAX_SESSION_ID_LENGTH ||
      !SESSION_ID_REGEX.test(value)
    ) {
      throw new BadRequestException(
        'Invalid sessionId: must be at most 128 characters and match /^[A-Za-z0-9:_-]+$/',
      );
    }

    return value;
  }
}
