const { Sequelize } = require("sequelize");
const { databasePath, nodeEnv } = require("../config/env");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: databasePath,
  logging: nodeEnv === "development" ? false : false,
  define: {
    freezeTableName: true,
    timestamps: false
  }
});

module.exports = sequelize;
