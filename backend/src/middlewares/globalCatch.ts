import { HttpStatusCodes } from '@/common/constants';
import Environments from '@/common/constants/environments';
import LOGGER from '@/common/logger';
import Config from '@/config';
import { NextFunction, Request, Response } from 'express';
import createError, { HttpError } from 'http-errors';
import Mongoose, { MongooseError } from 'mongoose';
import { MongoError } from 'mongodb';

const parseMongooseError = (err: Mongoose.Error) => {
  if (err instanceof Mongoose.Error.CastError || err instanceof Mongoose.Error.ValidationError || err instanceof Mongoose.Error.ValidatorError) {
    return createError(HttpStatusCodes.BAD_REQUEST, err);
  }

  return createError(HttpStatusCodes.INTERNAL_SERVER_ERROR, err);
};
const parseMongoError = (err: MongoError) => {
  if (err.code === 11000) {
    return createError(HttpStatusCodes.CONFLICT, err);
  }

  return createError(HttpStatusCodes.INTERNAL_SERVER_ERROR, err);
};
const parseError = (err: Error): HttpError => {
  if (err instanceof Mongoose.Error) {
    return parseMongooseError(err);
    // eslint-disable-next-line global-require
  }
  if (err instanceof MongoError) {
    return parseMongoError(err);
  }
  if (!(err instanceof HttpError)) {
    return createError(HttpStatusCodes.INTERNAL_SERVER_ERROR, err);
  }

  return err;
};

export const errorHandlerMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
  LOGGER.error(error);
  const err = parseError(error);
  const { status } = err;
  const trace = Config.environment === Environments.development && err.stack ? err.stack : undefined;
  let message;

  if (status === HttpStatusCodes.INTERNAL_SERVER_ERROR) {
    if (Config.environment === Environments.development) {
      message = err.message;
    } else {
      message = 'Something went wrong';
    }
  } else {
    message = err.message;
  }

  return res.status(status).json({
    error: true,
    message,
    trace,
    code: status.toString(),
    meta: err.meta,
  });
};
