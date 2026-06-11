"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemoData = seedDemoData;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedDemoData() {
    try {
        const existingAdmin = await prisma.user.findFirst({ where: { email: "admin@example.com" } });
        if (existingAdmin) {
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash("admin123", 10);
        const [engineering, hr, operations, finance] = await Promise.all([
            prisma.department.create({ data: { name: "Engineering" } }),
            prisma.department.create({ data: { name: "HR" } }),
            prisma.department.create({ data: { name: "Operations" } }),
            prisma.department.create({ data: { name: "Finance" } }),
        ]);
        const [react, node, ui, analytics] = await Promise.all([
            prisma.skill.create({ data: { name: "React" } }),
            prisma.skill.create({ data: { name: "Node.js" } }),
            prisma.skill.create({ data: { name: "UI/UX" } }),
            prisma.skill.create({ data: { name: "Analytics" } }),
        ]);
        const admin = await prisma.user.create({
            data: {
                name: "Ava Chen",
                email: "admin@example.com",
                password: passwordHash,
                role: "ADMIN",
                verified: true,
            },
        });
        const employeeOne = await prisma.user.create({
            data: {
                name: "Marcus Lee",
                email: "marcus@example.com",
                password: passwordHash,
                role: "EMPLOYEE",
                verified: true,
            },
        });
        const employeeTwo = await prisma.user.create({
            data: {
                name: "Nadia Patel",
                email: "nadia@example.com",
                password: passwordHash,
                role: "MANAGER",
                verified: true,
            },
        });
        const employeeRecords = await Promise.all([
            prisma.employee.create({
                data: {
                    firstName: "Marcus",
                    lastName: "Lee",
                    email: "marcus@example.com",
                    phone: "+1-555-0102",
                    departmentId: engineering.id,
                    profileImage: "/uploads/demo-marcus.jpg",
                    documents: { create: [{ filePath: "/uploads/contract-marcus.pdf" }] },
                    skills: { create: [{ skill: { connect: { id: react.id } } }, { skill: { connect: { id: node.id } } }] },
                },
            }),
            prisma.employee.create({
                data: {
                    firstName: "Nadia",
                    lastName: "Patel",
                    email: "nadia@example.com",
                    phone: "+1-555-0103",
                    departmentId: operations.id,
                    profileImage: "/uploads/demo-nadia.jpg",
                    documents: { create: [{ filePath: "/uploads/offer-letter.pdf" }] },
                    skills: { create: [{ skill: { connect: { id: analytics.id } } }, { skill: { connect: { id: ui.id } } }] },
                },
            }),
            prisma.employee.create({
                data: {
                    firstName: "Sofia",
                    lastName: "Nguyen",
                    email: "sofia@example.com",
                    phone: "+1-555-0104",
                    departmentId: hr.id,
                    skills: { create: [{ skill: { connect: { id: ui.id } } }] },
                },
            }),
        ]);
        await Promise.all([
            prisma.asset.create({
                data: {
                    name: "MacBook Pro 14",
                    type: "Laptop",
                    serialNumber: "MBP-001",
                    status: "ASSIGNED",
                    assignedTo: "Marcus Lee",
                    assignedBy: "Ava Chen",
                    assignedAt: new Date(),
                    notes: "Primary engineering laptop",
                },
            }),
            prisma.asset.create({
                data: {
                    name: "Dell Dock Station",
                    type: "Peripheral",
                    serialNumber: "DOC-002",
                    status: "AVAILABLE",
                    notes: "Docking station for remote work",
                },
            }),
            prisma.asset.create({
                data: {
                    name: "Monitor 27-inch",
                    type: "Display",
                    serialNumber: "MON-003",
                    status: "ASSIGNED",
                    assignedTo: "Nadia Patel",
                    assignedBy: "Ava Chen",
                    assignedAt: new Date(),
                    notes: "Shared team monitor",
                },
            }),
        ]);
        await Promise.all([
            prisma.notification.create({
                data: {
                    title: "Asset inventory synced",
                    message: "The latest asset inventory snapshot is available.",
                    type: "SYSTEM",
                },
            }),
            prisma.notification.create({
                data: {
                    title: "Leave request pending",
                    message: "One leave request is waiting for manager review.",
                    type: "LEAVE",
                },
            }),
            prisma.notification.create({
                data: {
                    title: "New employee onboarded",
                    message: "Sofia Nguyen was added to the HR team.",
                    type: "HR",
                },
            }),
        ]);
        await Promise.all([
            prisma.auditLog.create({
                data: {
                    entity: "Employee",
                    entityId: employeeRecords[0].id,
                    action: "CREATE",
                    actor: "Ava Chen",
                    newValue: "Marcus Lee onboarded",
                },
            }),
            prisma.auditLog.create({
                data: {
                    entity: "Asset",
                    entityId: 1,
                    action: "ASSIGN",
                    actor: "Ava Chen",
                    oldValue: "AVAILABLE",
                    newValue: "Marcus Lee",
                },
            }),
            prisma.auditLog.create({
                data: {
                    entity: "LeaveRequest",
                    entityId: 1,
                    action: "APPROVE",
                    actor: "Nadia Patel",
                    newValue: "Manager approved",
                },
            }),
        ]);
        await prisma.leaveBalance.createMany({
            data: [
                { userId: admin.id, annualDays: 25, usedDays: 3, remainingDays: 22 },
                { userId: employeeOne.id, annualDays: 20, usedDays: 2, remainingDays: 18 },
                { userId: employeeTwo.id, annualDays: 20, usedDays: 1, remainingDays: 19 },
            ],
        });
        await prisma.leaveRequest.createMany({
            data: [
                {
                    userId: employeeOne.id,
                    leaveType: "SICK",
                    startDate: new Date("2026-06-14"),
                    endDate: new Date("2026-06-15"),
                    days: 2,
                    reason: "Flu symptoms and recovery",
                    status: "PENDING",
                },
                {
                    userId: employeeTwo.id,
                    leaveType: "VACATION",
                    startDate: new Date("2026-06-22"),
                    endDate: new Date("2026-06-26"),
                    days: 5,
                    reason: "Planned family travel",
                    status: "MANAGER_APPROVED",
                },
            ],
        });
    }
    catch (error) {
        console.warn("Demo data seeding skipped:", error instanceof Error ? error.message : error);
    }
}
