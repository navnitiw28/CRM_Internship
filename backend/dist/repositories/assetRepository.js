"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetRepository = exports.AssetRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AssetRepository {
    async listAssets(params) {
        const page = Number(params.page || 1);
        const pageSize = Number(params.pageSize || 10);
        const skip = (page - 1) * pageSize;
        const where = {};
        if (params.search) {
            where.OR = [
                { name: { contains: params.search } },
                { serialNumber: { contains: params.search } },
                { type: { contains: params.search } },
            ];
        }
        if (params.status)
            where.status = params.status;
        if (params.type)
            where.type = params.type;
        const [items, total] = await Promise.all([
            prisma.asset.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { [params.sortBy || "createdAt"]: params.sortOrder === "asc" ? "asc" : "desc" },
            }),
            prisma.asset.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async createAsset(data) {
        return prisma.asset.create({ data });
    }
    async updateAsset(id, data) {
        return prisma.asset.update({ where: { id }, data });
    }
    async getNotifications() {
        return prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
    }
    async createNotification(data) {
        return prisma.notification.create({ data });
    }
    async createAuditLog(data) {
        return prisma.auditLog.create({ data });
    }
    async getAuditLogs() {
        return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    }
    async getReports() {
        const [assets, leaves, employees] = await Promise.all([
            prisma.asset.count(),
            prisma.leaveRequest.count(),
            prisma.employee.count(),
        ]);
        return { assets, leaves, employees };
    }
}
exports.AssetRepository = AssetRepository;
exports.assetRepository = new AssetRepository();
