import { assetRepository } from "../repositories/assetRepository";
import { logger } from "../utils/logger";

export class AssetService {
  async listAssets(params: any) {
    return assetRepository.listAssets(params);
  }

  async createAsset(data: { name: string; type: string; serialNumber: string; notes?: string }) {
    const asset = await assetRepository.createAsset(data);
    await assetRepository.createNotification({ title: "Asset created", message: `Asset ${asset.name} was registered.`, type: "ASSET" });
    await assetRepository.createAuditLog({ entity: "Asset", entityId: asset.id, action: "CREATE", actor: "SYSTEM", newValue: asset.serialNumber });
    logger.info(`Created asset ${asset.serialNumber}`);
    return asset;
  }

  async assignAsset(id: number, assignedTo: string, assignedBy: string) {
    const asset = await assetRepository.updateAsset(id, {
      status: "ASSIGNED",
      assignedTo,
      assignedBy,
      assignedAt: new Date(),
      returnedAt: null,
    });
    await assetRepository.createNotification({ title: "Asset assigned", message: `${asset.name} was assigned to ${assignedTo}.`, type: "ASSET" });
    await assetRepository.createAuditLog({ entity: "Asset", entityId: asset.id, action: "ASSIGN", actor: assignedBy, oldValue: "AVAILABLE", newValue: assignedTo });
    return asset;
  }

  async returnAsset(id: number) {
    const asset = await assetRepository.updateAsset(id, {
      status: "AVAILABLE",
      assignedTo: null,
      assignedBy: null,
      returnedAt: new Date(),
    });
    await assetRepository.createNotification({ title: "Asset returned", message: `${asset.name} was returned.`, type: "ASSET" });
    await assetRepository.createAuditLog({ entity: "Asset", entityId: asset.id, action: "RETURN", actor: "SYSTEM", oldValue: "ASSIGNED", newValue: "AVAILABLE" });
    return asset;
  }

  async getNotifications() {
    return assetRepository.getNotifications();
  }

  async getAuditLogs() {
    return assetRepository.getAuditLogs();
  }

  async getReports() {
    return assetRepository.getReports();
  }
}

export const assetService = new AssetService();
