import { Router } from "express";
import Joi from "joi";
import { assetService } from "../services/assetService";
import { assetAssignSchema, assetCreateSchema } from "../validation/assetSchemas";

const router = Router();

function validate(schema: Joi.ObjectSchema, body: any) {
  const { error, value } = schema.validate(body, { abortEarly: false });
  if (error) {
    const message = error.details.map((detail) => detail.message).join(", ");
    throw new Error(message);
  }
  return value;
}

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "enterprise-api" });
});

router.get("/assets", async (req, res, next) => {
  try {
    const result = await assetService.listAssets(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/assets", async (req, res, next) => {
  try {
    const payload = validate(assetCreateSchema, req.body);
    const asset = await assetService.createAsset(payload);
    res.status(201).json({ asset });
  } catch (error) {
    next(error);
  }
});

router.patch("/assets/:id/assign", async (req, res, next) => {
  try {
    const payload = validate(assetAssignSchema, req.body);
    const asset = await assetService.assignAsset(Number(req.params.id), payload.assignedTo, payload.assignedBy);
    res.json({ asset });
  } catch (error) {
    next(error);
  }
});

router.patch("/assets/:id/return", async (req, res, next) => {
  try {
    const asset = await assetService.returnAsset(Number(req.params.id));
    res.json({ asset });
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", async (_req, res, next) => {
  try {
    res.json({ notifications: await assetService.getNotifications() });
  } catch (error) {
    next(error);
  }
});

router.get("/audit-logs", async (_req, res, next) => {
  try {
    res.json({ logs: await assetService.getAuditLogs() });
  } catch (error) {
    next(error);
  }
});

router.get("/reports/summary", async (_req, res, next) => {
  try {
    res.json({ summary: await assetService.getReports() });
  } catch (error) {
    next(error);
  }
});

router.get("/reports/export", async (_req, res) => {
  const rows = [
    ["type", "count"],
    ["assets", "1"],
    ["employees", "1"],
    ["leaves", "1"],
  ];
  const csv = rows.map((row) => row.join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=report.csv");
  res.send(csv);
});

export default router;
