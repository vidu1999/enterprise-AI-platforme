import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttp) {
      this.logger.error(
        `Unhandled error on ${req?.method} ${req?.originalUrl}: ${(exception as Error)?.message}`,
        (exception as Error)?.stack,
      );
    }

    const body = isHttp ? exception.getResponse() : 'Internal server error';
    const rawMessage =
      typeof body === 'string'
        ? body
        : Array.isArray((body as any)?.message)
          ? (body as any).message.join('; ')
          : (body as any)?.message ?? (exception as Error)?.message ?? 'Request failed';

    res.status(status).json({
      statusCode: status,
      message: rawMessage,
      path: req?.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
