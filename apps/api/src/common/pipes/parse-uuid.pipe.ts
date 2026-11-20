import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
@Injectable()
export class ParseUuidPipe implements PipeTransform {
  transform(value: any) {
    if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      throw new BadRequestException('Invalid UUID');
    }
    return value;
  }
}
