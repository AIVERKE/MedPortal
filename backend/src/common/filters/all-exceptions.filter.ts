import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let error = 'Internal Server Error';
    let suggestions: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' ? (res as any).message || res : res;
      error =
        typeof res === 'object'
          ? (res as any).error || exception.name
          : exception.name;
      if (typeof res === 'object' && Array.isArray((res as any).suggestions)) {
        suggestions = (res as any).suggestions;
      }
    } else if (exception instanceof QueryFailedError) {
      // Handle database errors
      const driverError = (exception as any).driverError;
      // Postgres unique_violation code is 23505
      if (driverError && driverError.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'El registro ya existe (violación de unicidad)';
        error = 'Conflict';
      } else {
        this.logger.error(
          `Database Error: ${exception.message}`,
          exception.stack,
        );
        message = 'Error en la base de datos';
        error = 'Database Error';
      }
    } else {
      // Unhandled generic errors
      const msg =
        exception instanceof Error ? exception.message : 'Error desconocido';
      const stack = exception instanceof Error ? exception.stack : '';
      this.logger.error(`Unhandled Exception: ${msg}`, stack);
      message = msg;
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error,
      ...(suggestions ? { suggestions } : {}),
    });
  }
}
