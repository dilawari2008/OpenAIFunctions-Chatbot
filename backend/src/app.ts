import express from "express";
import helmet from "helmet";
import cors from "cors";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { errorHandlerMiddleware } from "@/middlewares";
import InitRoutes from "@/routes";
import { HTTPLogger } from "@/common";
import { nanoid } from "nanoid";

// in prod use .env, while development use .env.dev, do not put connection strings in .env as .env is not in .dockerignore
config({ path: ".env.dev" });
// config({ path: '.env' });

const port = process.env.PORT || "3000";
const app = express();

// Adds various HTTP headers to enhance security by protecting against well-known web vulnerabilities
app.use(helmet());

// Enables Cross-Origin Resource Sharing (CORS) to allow requests from other domains.
app.use(cors());

// add reqId to the req
app.use((req, res, next) => {
  req.context = { reqId: nanoid() };
  next();
});

// add sendOk and sendFormatted methods to res
app.use((req, res, next) => {
  res.sendOk = () => {
    res.sendStatus(200);
  };
  res.sendFormatted = (data = {}, { meta, errorCode, message } = {}) => {
    res.send({
      data,
      meta,
      code: errorCode,
      message,
    });
  };
  next();
});

// X-XSS-Protection: Sets the X-XSS-Protection header to prevent cross-site scripting (XSS) attacks.
app.use((req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Custom HTTP request logging middleware (HTTPLogger) for logging incoming requests
app.use(HTTPLogger);

// This middleware function is used to parse incoming request bodies with JSON payloads. It parses the JSON string in the request body and exposes the resulting object on req.body.
app.use(express.json({ limit: "100mb" }));
// he express.urlencoded() middleware in the Express.js framework is used to parse incoming requests with URL-encoded payloads. URL encoding is a method for translating data into a format that can be transmitted over the Internet, typically using the application/x-www-form-urlencoded MIME type. This middleware parses the URL-encoded data from the request body and makes it available on req.body.
app.use(
  express.urlencoded({ limit: "100mb", extended: true, parameterLimit: 50000 })
);

// Parses cookies attached to the client's requests.
app.use(cookieParser());

// Serves static files from the public directory using Express middleware
app.use(express.static(path.join(__dirname, "public")));

// define routes
InitRoutes(app);

// global catch
app.use(errorHandlerMiddleware);

// start listening on port for HTTP requests
app.listen(port, () => {
  console.log(`App started on port: ${port}`);
});
