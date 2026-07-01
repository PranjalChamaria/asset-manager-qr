import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';

export const errorMiddleware: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
};
