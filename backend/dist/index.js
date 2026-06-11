"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_1 = require("@prisma/client");
const assetController_1 = __importDefault(require("./controllers/assetController"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
const seedDemoData_1 = require("./utils/seedDemoData");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const uploadDirectory = path_1.default.join(__dirname, "..", "uploads");
if (!fs_1.default.existsSync(uploadDirectory)) {
    fs_1.default.mkdirSync(uploadDirectory, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirectory),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = (0, multer_1.default)({ storage });
const allowedOrigins = [FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(uploadDirectory));
app.use("/api/v1", assetController_1.default);
function signAccessToken(userId, role) {
    return jsonwebtoken_1.default.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: "15m" });
}
function signRefreshToken(userId, role) {
    return jsonwebtoken_1.default.sign({ sub: userId, role }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
}
function sendEmail(subject, to, body) {
    console.log("==============================");
    console.log(`Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(body);
    console.log("==============================");
}
function getUserFromToken(authHeader) {
    if (!authHeader?.startsWith("Bearer "))
        return null;
    const token = authHeader.split(" ")[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return payload;
    }
    catch {
        return null;
    }
}
function requireAuth(req, res, next) {
    const payload = getUserFromToken(req.headers.authorization);
    if (!payload)
        return res.status(401).json({ error: "Unauthorized" });
    req.auth = payload;
    next();
}
function requireRole(role) {
    return (req, res, next) => {
        const auth = req.auth;
        if (!auth || auth.role !== role)
            return res.status(403).json({ error: "Forbidden" });
        next();
    };
}
function requireAnyRole(roles) {
    return (req, res, next) => {
        const auth = req.auth;
        if (!auth || !roles.includes(auth.role))
            return res.status(403).json({ error: "Forbidden" });
        next();
    };
}
async function getOrCreateLeaveBalance(userId) {
    const existing = await prisma.leaveBalance.findUnique({ where: { userId } });
    if (existing)
        return existing;
    return prisma.leaveBalance.create({
        data: {
            userId,
            annualDays: 20,
            usedDays: 0,
            remainingDays: 20,
        },
    });
}
function getLeaveDayCount(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 0;
    }
    const difference = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return difference;
}
app.post("/api/auth/register", async (req, res) => {
    const { name, firstName, lastName, email, password } = req.body;
    const resolvedName = name || [firstName, lastName].filter(Boolean).join(" ").trim();
    if (!resolvedName || !email || !password)
        return res.status(400).json({ error: "Name, email, and password are required." });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
        return res.status(409).json({ error: "Email already exists." });
    const userCount = await prisma.user.count();
    const hashed = await bcryptjs_1.default.hash(password, 10);
    await prisma.user.create({
        data: {
            name: resolvedName,
            email,
            password: hashed,
            verified: true,
            role: userCount === 0 ? "ADMIN" : "USER",
        },
    });
    return res.status(201).json({ message: "Registration successful. Your account is ready to use." });
});
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email and password are required." });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ error: "Invalid credentials." });
    const matched = await bcryptjs_1.default.compare(password, user.password);
    if (!matched)
        return res.status(401).json({ error: "Invalid credentials." });
    if (!user.verified) {
        await prisma.user.update({ where: { id: user.id }, data: { verified: true } });
    }
    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    return res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, verified: user.verified } });
});
app.post("/api/auth/refresh-token", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ error: "Refresh token is required." });
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        const tokenData = payload;
        const user = await prisma.user.findUnique({ where: { id: tokenData.sub } });
        if (!user || user.refreshToken !== refreshToken)
            return res.status(401).json({ error: "Invalid refresh token." });
        const accessToken = signAccessToken(user.id, user.role);
        const nextRefreshToken = signRefreshToken(user.id, user.role);
        await prisma.user.update({ where: { id: user.id }, data: { refreshToken: nextRefreshToken } });
        return res.json({ accessToken, refreshToken: nextRefreshToken });
    }
    catch (error) {
        return res.status(401).json({ error: "Refresh token expired or invalid." });
    }
});
app.post("/api/auth/logout", requireAuth, async (req, res) => {
    const auth = req.auth;
    await prisma.user.update({ where: { id: auth.sub }, data: { refreshToken: null } });
    res.json({ message: "Logged out." });
});
app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: "Email is required." });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(200).json({ message: "If that email exists, a reset link was sent." });
    const resetToken = jsonwebtoken_1.default.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "1h" });
    const expires = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.user.update({ where: { id: user.id }, data: { passwordResetToken: resetToken, passwordResetExpires: expires } });
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    sendEmail("Reset your password", user.email, `Click here to reset: ${resetUrl}`);
    return res.json({ message: "If that email exists, a reset link was sent." });
});
app.post("/api/auth/reset-password", async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password)
        return res.status(400).json({ error: "Token and new password are required." });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const tokenData = payload;
        const user = await prisma.user.findUnique({ where: { id: tokenData.sub } });
        if (!user || user.passwordResetToken !== token || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
            return res.status(400).json({ error: "Invalid or expired reset token." });
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashed, passwordResetToken: null, passwordResetExpires: null } });
        return res.json({ message: "Password has been reset. Please log in." });
    }
    catch {
        return res.status(400).json({ error: "Invalid reset token." });
    }
});
app.get("/api/users/me", requireAuth, async (req, res) => {
    const auth = req.auth;
    const user = await prisma.user.findUnique({ where: { id: auth.sub }, select: { id: true, name: true, email: true, role: true, verified: true, createdAt: true } });
    if (!user)
        return res.status(404).json({ error: "User not found." });
    return res.json({ user });
});
app.patch("/api/users/me", requireAuth, async (req, res) => {
    const auth = req.auth;
    const { name } = req.body;
    if (!name)
        return res.status(400).json({ error: "Name is required." });
    const user = await prisma.user.update({ where: { id: auth.sub }, data: { name } });
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, verified: user.verified, createdAt: user.createdAt } });
});
app.get("/api/users/admin", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, verified: true, createdAt: true } });
    return res.json({ users });
});
app.patch("/api/users/:id/role", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const id = Number(req.params.id);
    const { role } = req.body;
    if (!role)
        return res.status(400).json({ error: "Role is required." });
    const user = await prisma.user.update({ where: { id }, data: { role }, select: { id: true, name: true, email: true, role: true, verified: true, createdAt: true } });
    return res.json({ user });
});
app.get("/api/dashboard/stats", requireAuth, async (_req, res) => {
    const [employeeCount, departmentCount, skillCount, recentEmployees] = await Promise.all([
        prisma.employee.count(),
        prisma.department.count(),
        prisma.skill.count(),
        prisma.employee.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { department: true },
        }),
    ]);
    return res.json({
        employeeCount,
        departmentCount,
        skillCount,
        recentEmployees: recentEmployees.map((employee) => ({
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            position: null,
            department: employee.department?.name || "Unassigned",
        })),
    });
});
app.get("/api/departments", requireAuth, async (_req, res) => {
    const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
    return res.json({ departments });
});
app.post("/api/departments", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const { name } = req.body;
    if (!name)
        return res.status(400).json({ error: "Department name is required." });
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing)
        return res.status(409).json({ error: "Department already exists." });
    const department = await prisma.department.create({ data: { name } });
    return res.status(201).json({ department });
});
app.get("/api/skills", requireAuth, async (_req, res) => {
    const skills = await prisma.skill.findMany({ orderBy: { name: "asc" } });
    return res.json({ skills });
});
app.post("/api/skills", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const { name } = req.body;
    if (!name)
        return res.status(400).json({ error: "Skill name is required." });
    const existing = await prisma.skill.findUnique({ where: { name } });
    if (existing)
        return res.status(409).json({ error: "Skill already exists." });
    const skill = await prisma.skill.create({ data: { name } });
    return res.status(201).json({ skill });
});
function parseSkillIds(body) {
    const raw = body.skillIds;
    if (!raw)
        return [];
    const values = Array.isArray(raw) ? raw : [raw];
    return values.map((value) => Number(value)).filter((id) => Number.isFinite(id));
}
function buildUploadPath(file) {
    return file ? `/uploads/${path_1.default.basename(file.path)}` : undefined;
}
app.get("/api/employees", requireAuth, async (_req, res) => {
    const employees = await prisma.employee.findMany({
        include: {
            department: true,
            skills: { include: { skill: true } },
            documents: true,
        },
        orderBy: { createdAt: "desc" },
    });
    return res.json({ employees });
});
app.get("/api/employees/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
            department: true,
            skills: { include: { skill: true } },
            documents: true,
        },
    });
    if (!employee)
        return res.status(404).json({ error: "Employee not found." });
    return res.json({ employee });
});
app.post("/api/employees", requireAuth, requireRole("ADMIN"), upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "resumeFile", maxCount: 1 },
    { name: "documents", maxCount: 5 },
]), async (req, res) => {
    const { firstName, lastName, email, phone, departmentId } = req.body;
    if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({ error: "First name, last name, email, and phone are required." });
    }
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing)
        return res.status(409).json({ error: "Employee email already exists." });
    const skillIds = parseSkillIds(req.body);
    const files = req.files;
    const documents = files?.documents?.map((file) => `/uploads/${path_1.default.basename(file.path)}`) ?? [];
    const profileImage = buildUploadPath(files?.profileImage?.[0]);
    const resumeFile = buildUploadPath(files?.resumeFile?.[0]);
    const employee = await prisma.employee.create({
        data: {
            firstName,
            lastName,
            email,
            phone,
            departmentId: departmentId ? Number(departmentId) : undefined,
            profileImage,
            resumeFile,
            documents: documents.length
                ? { create: documents.map((path) => ({ filePath: path })) }
                : undefined,
            skills: {
                create: skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })),
            },
        },
        include: { department: true, skills: { include: { skill: true } }, documents: true },
    });
    return res.status(201).json({ employee });
});
app.patch("/api/employees/:id", requireAuth, requireRole("ADMIN"), upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "resumeFile", maxCount: 1 },
    { name: "documents", maxCount: 5 },
]), async (req, res) => {
    const id = Number(req.params.id);
    const { firstName, lastName, email, phone, departmentId } = req.body;
    if (!firstName || !lastName || !email || !phone) {
        return res.status(400).json({ error: "First name, last name, email, and phone are required." });
    }
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee)
        return res.status(404).json({ error: "Employee not found." });
    const skillIds = parseSkillIds(req.body);
    const files = req.files;
    const uploadedDocuments = files?.documents?.map((file) => `/uploads/${path_1.default.basename(file.path)}`) ?? [];
    const profileImage = buildUploadPath(files?.profileImage?.[0]) || employee.profileImage;
    const resumeFile = buildUploadPath(files?.resumeFile?.[0]) || employee.resumeFile;
    const updated = await prisma.employee.update({
        where: { id },
        data: {
            firstName,
            lastName,
            email,
            phone,
            departmentId: departmentId ? Number(departmentId) : undefined,
            profileImage,
            resumeFile,
            documents: uploadedDocuments.length
                ? { deleteMany: {}, create: uploadedDocuments.map((path) => ({ filePath: path })) }
                : undefined,
            skills: {
                deleteMany: {},
                create: skillIds.map((skillId) => ({ skill: { connect: { id: skillId } } })),
            },
        },
        include: { department: true, skills: { include: { skill: true } }, documents: true },
    });
    return res.json({ employee: updated });
});
app.delete("/api/employees/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const id = Number(req.params.id);
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee)
        return res.status(404).json({ error: "Employee not found." });
    await prisma.employee.delete({ where: { id } });
    return res.json({ message: "Employee deleted." });
});
app.get("/api/leave-balance", requireAuth, async (req, res) => {
    const auth = req.auth;
    const balance = await getOrCreateLeaveBalance(auth.sub);
    return res.json({ balance });
});
app.get("/api/leave-balance/all", requireAuth, requireAnyRole(["ADMIN", "HR"]), async (_req, res) => {
    const balances = await prisma.leaveBalance.findMany({
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { remainingDays: "asc" },
    });
    return res.json({ balances });
});
app.patch("/api/leave-balance", requireAuth, requireAnyRole(["ADMIN", "HR"]), async (req, res) => {
    const { userId, annualDays, usedDays } = req.body;
    const resolvedUserId = Number(userId);
    if (!resolvedUserId || !Number.isFinite(resolvedUserId)) {
        return res.status(400).json({ error: "Valid userId is required." });
    }
    const remainingDays = Math.max(0, Number(annualDays) - Number(usedDays));
    const balance = await prisma.leaveBalance.upsert({
        where: { userId: resolvedUserId },
        update: { annualDays: Number(annualDays), usedDays: Number(usedDays), remainingDays },
        create: { userId: resolvedUserId, annualDays: Number(annualDays), usedDays: Number(usedDays), remainingDays },
    });
    return res.json({ balance });
});
app.get("/api/leave-requests", requireAuth, async (req, res) => {
    const auth = req.auth;
    const where = auth.role === "ADMIN" || auth.role === "HR" || auth.role === "MANAGER"
        ? {}
        : { userId: auth.sub };
    const requests = await prisma.leaveRequest.findMany({
        where,
        include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            approvals: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
    });
    return res.json({ requests });
});
app.post("/api/leave-requests", requireAuth, async (req, res) => {
    const auth = req.auth;
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate || !reason) {
        return res.status(400).json({ error: "Leave type, dates, and reason are required." });
    }
    const days = getLeaveDayCount(startDate, endDate);
    if (days <= 0)
        return res.status(400).json({ error: "End date must be after start date." });
    const balance = await getOrCreateLeaveBalance(auth.sub);
    if (balance.remainingDays < days) {
        return res.status(400).json({ error: "Insufficient leave balance for this range." });
    }
    const request = await prisma.leaveRequest.create({
        data: {
            userId: auth.sub,
            leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            days,
            reason,
            status: "PENDING",
        },
        include: { user: { select: { id: true, name: true, email: true, role: true } }, approvals: true },
    });
    return res.status(201).json({ request });
});
app.patch("/api/leave-requests/:id/decision", requireAuth, async (req, res) => {
    const auth = req.auth;
    const id = Number(req.params.id);
    const { action, stage, comment } = req.body;
    if (!action || !stage)
        return res.status(400).json({ error: "Action and stage are required." });
    const request = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!request)
        return res.status(404).json({ error: "Leave request not found." });
    if (action === "REJECT") {
        const updated = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                managerComment: stage === "MANAGER" ? comment : request.managerComment,
                hrComment: stage === "HR" ? comment : request.hrComment,
            },
            include: { user: { select: { id: true, name: true, email: true, role: true } }, approvals: true },
        });
        await prisma.leaveApprovalLog.create({
            data: {
                leaveRequestId: id,
                actorId: auth.sub,
                actorName: auth.role,
                action: "REJECTED",
                comment,
            },
        });
        return res.json({ request: updated });
    }
    if (action === "APPROVE") {
        const canManagerApprove = auth.role === "MANAGER" || auth.role === "ADMIN";
        const canHrApprove = auth.role === "HR" || auth.role === "ADMIN";
        if (stage === "MANAGER" && !canManagerApprove) {
            return res.status(403).json({ error: "Only managers can approve at this stage." });
        }
        if (stage === "HR" && !canHrApprove) {
            return res.status(403).json({ error: "Only HR can finalize approval." });
        }
        if (stage === "MANAGER" && request.status !== "PENDING") {
            return res.status(400).json({ error: "This request is no longer pending manager review." });
        }
        if (stage === "HR" && request.status !== "MANAGER_APPROVED" && request.status !== "PENDING") {
            return res.status(400).json({ error: "This request is not eligible for HR approval." });
        }
        const updated = await prisma.$transaction(async (tx) => {
            const nextRequest = await tx.leaveRequest.update({
                where: { id },
                data: {
                    status: stage === "HR" ? "HR_APPROVED" : "MANAGER_APPROVED",
                    managerComment: stage === "MANAGER" ? comment : request.managerComment,
                    hrComment: stage === "HR" ? comment : request.hrComment,
                    managerId: stage === "MANAGER" ? auth.sub : request.managerId,
                    hrId: stage === "HR" ? auth.sub : request.hrId,
                },
                include: { user: { select: { id: true, name: true, email: true, role: true } }, approvals: true },
            });
            if (stage === "HR") {
                const balance = await tx.leaveBalance.findUnique({ where: { userId: request.userId } });
                if (balance) {
                    await tx.leaveBalance.update({
                        where: { id: balance.id },
                        data: {
                            usedDays: balance.usedDays + request.days,
                            remainingDays: balance.remainingDays - request.days,
                        },
                    });
                }
            }
            await tx.leaveApprovalLog.create({
                data: {
                    leaveRequestId: id,
                    actorId: auth.sub,
                    actorName: auth.role,
                    action: stage === "HR" ? "HR_APPROVED" : "MANAGER_APPROVED",
                    comment,
                },
            });
            return nextRequest;
        });
        return res.json({ request: updated });
    }
    return res.status(400).json({ error: "Unsupported action." });
});
app.get("/api/leave-analytics", requireAuth, async (_req, res) => {
    const counts = await prisma.leaveRequest.groupBy({ by: ["status"], _count: { status: true } });
    const recent = (await prisma.$queryRawUnsafe(`SELECT lr.id, u.name AS employeeName, lr.leaveType, lr.status, lr.days
    FROM LeaveRequest lr
    INNER JOIN User u ON lr.userId = u.id
    ORDER BY lr.createdAt DESC
    LIMIT 8`));
    return res.json({
        counts,
        recent,
        totalRequests: await prisma.leaveRequest.count(),
        pendingRequests: await prisma.leaveRequest.count({ where: { status: "PENDING" } }),
        approvedRequests: await prisma.leaveRequest.count({ where: { status: "HR_APPROVED" } }),
    });
});
app.get("/api/docs", (_req, res) => {
    res.json({
        title: "Leave Management API",
        version: "1.0.0",
        endpoints: [
            "GET /api/leave-balance",
            "GET /api/leave-balance/all",
            "PATCH /api/leave-balance",
            "GET /api/leave-requests",
            "POST /api/leave-requests",
            "PATCH /api/leave-requests/:id/decision",
            "GET /api/leave-analytics",
        ],
    });
});
app.use(errorHandler_1.errorHandler);
async function bootstrap() {
    await (0, seedDemoData_1.seedDemoData)();
    app.listen(PORT, () => {
        logger_1.logger.info(`Backend running on http://localhost:${PORT}`);
    });
}
void bootstrap();
