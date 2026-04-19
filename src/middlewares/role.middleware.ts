import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ForbiddenException } from '../exceptions/Forbidden.exception';

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenException('User not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenException('Insufficient permissions'));
    }
    next();
  };
}