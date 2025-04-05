import LOGGER from "@/common/logger";
import Config from "@/config";
import mongoose from "mongoose";

const mongoConnectionUrl = Config.db.mongo.url;
const DB = mongoose.createConnection(mongoConnectionUrl, {
  serverSelectionTimeoutMS: 60000,
  connectTimeoutMS: 60000,
});

mongoose.set("debug", true);
DB.on("connected", () => {
  LOGGER.info(`Connected to db url ${mongoConnectionUrl}`);
});
DB.on("reconnected", () => {
  LOGGER.info(`Reconnected to db url ${mongoConnectionUrl}`);
});
DB.on("error", () => {
  LOGGER.info(`Error connecting to db url ${mongoConnectionUrl}`);
});
DB.on("disconnected", () => {
  LOGGER.info(`Disconnected connecting to db url ${mongoConnectionUrl}`);
});

// if you have a separate read only url

// const mongoReadConnectionUrl = process.env.MONGOURL_READONLY ? Config.db.mongo.readUrl : Config.db.mongo.url;

// export const DBReadonly = mongoose.createConnection(mongoReadConnectionUrl, {
//   serverSelectionTimeoutMS: 60000,
//   connectTimeoutMS: 60000,
// });

// DBReadonly.on('connected', () => {
//   LOGGER.info(`Connected to readDb url ${mongoReadConnectionUrl}`);
// });
// DBReadonly.on('reconnected', () => {
//   LOGGER.info(`Reconnected to readDb url ${mongoReadConnectionUrl}`);
// });
// DBReadonly.on('error', () => {
//   LOGGER.info(`Error connecting to readDb url ${mongoReadConnectionUrl}`);
// });
// DBReadonly.on('disconnected', () => {
//   LOGGER.info(`Disconnected connecting to readDb url ${mongoReadConnectionUrl}`);
// });

export default DB;
