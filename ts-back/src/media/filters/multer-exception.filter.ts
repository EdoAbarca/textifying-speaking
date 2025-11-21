import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle HTTP exceptions (including UnauthorizedException)
    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json(exception.getResponse());
    }

    // Check if it's a Multer error
    if (exception.message && exception.message.includes('Invalid file type')) {
      return response.status(400).json({
        statusCode: 400,
        message: exception.message,
        error: 'Bad Request',
      });
    }

    // Check if it's a file size error
    if (exception.code === 'LIMIT_FILE_SIZE') {
      return response.status(400).json({
        statusCode: 400,
        message: 'File size exceeds the maximum limit of 100MB',
        error: 'Bad Request',
      });
    }

    // Default error response
    return response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}
