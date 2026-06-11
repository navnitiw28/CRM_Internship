"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
function errorHandler(err, _req, res, _next) {
    logger_1.logger.error(err instanceof Error ? err.message : "Unexpected error");
    res.status(500).json({ error: "Internal server error" });
}
