import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err instanceof Error ? err.message : "Unexpected error");
  res.status(500).json({ error: "Internal server error" });
}
