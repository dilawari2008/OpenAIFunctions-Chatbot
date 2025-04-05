import { NextFunction, Request, Response } from 'express';

export const forwardRequest = (handler: (req: Request, res: Response) => Promise<any>) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await handler(req, res);
  } catch (e) {
    next(e);
  }
};

export function parseGetFilters(req: Request) {
  const { page } = req.query;

  delete req.query.page;
  const query = { ...req.query };

  return { query, page };
}
