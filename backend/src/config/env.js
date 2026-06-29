import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

function deriveTestMongoUri() {
  if (process.env.TEST_MONGO_URI) {
    return process.env.TEST_MONGO_URI;
  }

  if (process.env.MONGO_URI) {
    try {
      const mongoUrl = new URL(process.env.MONGO_URI);
      const databaseName = mongoUrl.pathname.replace("/", "") || "georgian_games";
      mongoUrl.pathname = `/${databaseName.replace(/_test$/, "")}_test`;

      return mongoUrl.toString();
    } catch {
      return process.env.MONGO_URI.replace(/\/([^/?]+)(\?.*)?$/, "/georgian_games_test$2");
    }
  }

  return "mongodb://127.0.0.1:27017/georgian_games_test";
}

export const config = {
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  enableJobs: process.env.ENABLE_JOBS !== "false",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  isProduction,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  jwtSecret: process.env.JWT_SECRET ?? "dev_only_change_me_before_deploy",
  mongoUri: process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/georgian_games",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  redisUrl: process.env.REDIS_URL ?? "",
  testMongoUri: deriveTestMongoUri()
};

export function validateProductionConfig() {
  if (!config.isProduction) {
    return;
  }

  const missing = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev_only_change_me_before_deploy") {
    missing.push("JWT_SECRET");
  }

  if (!config.googleClientId) {
    missing.push("GOOGLE_CLIENT_ID");
  }

  if (!config.mongoUri) {
    missing.push("MONGO_URI");
  }

  if (missing.length > 0) {
    throw new Error(`Missing required production configuration: ${missing.join(", ")}`);
  }
}
