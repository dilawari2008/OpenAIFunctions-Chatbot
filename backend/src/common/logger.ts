import { logger as expressLogger } from 'express-winston';
import Winston from 'winston';

const LoggerModule = () => {
  const transports = [new Winston.transports.Console()];

  return Winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    transports,
    format: Winston.format.simple(),
    exceptionHandlers: [new Winston.transports.Console()],
    exitOnError: false,
  });
};

export const HTTPLogger = expressLogger({
  level: 'info',
  format: Winston.format.simple(),
  msg: 'HTTP {{req.method}}  {{res.statusCode}} {{res.responseTime}}ms {{req.url}}',
  transports: [new Winston.transports.Console()],
});

const LOGGER = LoggerModule();
export default LOGGER;
