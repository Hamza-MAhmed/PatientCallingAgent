require("dotenv").config();
const path = require("path");

module.exports = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  databasePath: path.resolve(process.env.DATABASE_PATH || "./patients.db"),
  corsOrigin: process.env.CORS_ORIGIN || "*"
};
