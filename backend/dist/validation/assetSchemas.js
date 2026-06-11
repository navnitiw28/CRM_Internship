"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetAssignSchema = exports.assetCreateSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.assetCreateSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).required(),
    type: joi_1.default.string().required(),
    serialNumber: joi_1.default.string().required(),
    notes: joi_1.default.string().optional(),
});
exports.assetAssignSchema = joi_1.default.object({
    assignedTo: joi_1.default.string().required(),
    assignedBy: joi_1.default.string().required(),
});
