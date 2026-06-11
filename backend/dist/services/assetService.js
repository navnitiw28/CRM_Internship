"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetService = exports.AssetService = void 0;
const assetRepository_1 = require("../repositories/assetRepository");
const logger_1 = require("../utils/logger");
class AssetService {
    async listAssets(params) {
        return assetRepository_1.assetRepository.listAssets(params);
    }
    async createAsset(data) {
        const asset = await assetRepository_1.assetRepository.createAsset(data);
        await assetRepository_1.assetRepository.createNotification({ title: "Asset created", message: `Asset ${asset.name} was registered.`, type: "ASSET" });
        await assetRepository_1.assetRepository.createAuditLog({ entity: "Asset", entityId: asset.id, action: "CREATE", actor: "SYSTEM", newValue: asset.serialNumber });
        logger_1.logger.info(`Created asset ${asset.serialNumber}`);
        return asset;
    }
    async assignAsset(id, assignedTo, assignedBy) {
        const asset = await assetRepository_1.assetRepository.updateAsset(id, {
            status: "ASSIGNED",
            assignedTo,
            assignedBy,
            assignedAt: new Date(),
            returnedAt: null,
        });
        await assetRepository_1.assetRepository.createNotification({ title: "Asset assigned", message: `${asset.name} was assigned to ${assignedTo}.`, type: "ASSET" });
        await assetRepository_1.assetRepository.createAuditLog({ entity: "Asset", entityId: asset.id, action: "ASSIGN", actor: assignedBy, oldValue: "AVAILABLE", newValue: assignedTo });
        return asset;
    }
    async returnAsset(id) {
        const asset = await assetRepository_1.assetRepository.updateAsset(id, {
            status: "AVAILABLE",
            assignedTo: null,
            assignedBy: null,
            returnedAt: new Date(),
        });
        await assetRepository_1.assetRepository.createNotification({ title: "Asset returned", message: `${asset.name} was returned.`, type: "ASSET" });
        await assetRepository_1.assetRepository.createAuditLog({ entity: "Asset", entityId: asset.id, action: "RETURN", actor: "SYSTEM", oldValue: "ASSIGNED", newValue: "AVAILABLE" });
        return asset;
    }
    async getNotifications() {
        return assetRepository_1.assetRepository.getNotifications();
    }
    async getAuditLogs() {
        return assetRepository_1.assetRepository.getAuditLogs();
    }
    async getReports() {
        return assetRepository_1.assetRepository.getReports();
    }
}
exports.AssetService = AssetService;
exports.assetService = new AssetService();
