import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AssetRepository {
  async listAssets(params: { search?: string; status?: string; type?: string; page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) {
    const page = Number(params.page || 1);
    const pageSize = Number(params.pageSize || 10);
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { serialNumber: { contains: params.search } },
        { type: { contains: params.search } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

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

  async createAsset(data: { name: string; type: string; serialNumber: string; notes?: string }) {
    return prisma.asset.create({ data });
  }

  async updateAsset(id: number, data: any) {
    return prisma.asset.update({ where: { id }, data });
  }

  async getNotifications() {
    return prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  }

  async createNotification(data: { title: string; message: string; type: string }) {
    return prisma.notification.create({ data });
  }

  async createAuditLog(data: { entity: string; entityId?: number; action: string; actor?: string; oldValue?: string; newValue?: string }) {
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

export const assetRepository = new AssetRepository();
