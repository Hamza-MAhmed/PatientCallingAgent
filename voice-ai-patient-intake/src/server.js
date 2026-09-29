const app = require("./app");
const { port } = require("./config/env");
const { initializeDatabase } = require("./db/init");

async function main() {
  await initializeDatabase();

  const server = app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received; shutting down`);
    server.close(async () => {
      const sequelize = require("./db/sequelize");
      await sequelize.close();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[startup-error]", err);
  process.exit(1);
});
