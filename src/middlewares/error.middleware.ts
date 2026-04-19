import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../exceptions/http.exception';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpException) {
    return res.status(err.status).json({
      status: 'error',
      message: err.message,
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}