const { fail } = require("../utils/envelope");

function errorHandler(err, req, res, next) {
  console.error("[error]", {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });

  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;
  res.status(status).json(fail(message));
}

module.exports = errorHandler;
