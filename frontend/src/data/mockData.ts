export const mockUser = {
  id: 1,
  name: "Ava Chen",
  email: "admin@example.com",
  role: "ADMIN",
  verified: true,
};

export const mockDashboardStats = {
  employeeCount: 12,
  departmentCount: 4,
  skillCount: 8,
  recentEmployees: [
    { id: 1, name: "Marcus Lee", position: "Senior Engineer", department: "Engineering" },
    { id: 2, name: "Nadia Patel", position: "Operations Lead", department: "Operations" },
    { id: 3, name: "Sofia Nguyen", position: "HR Partner", department: "HR" },
  ],
};

export const mockEmployees = [
  { id: 1, firstName: "Marcus", lastName: "Lee", email: "marcus@example.com", phone: "+1-555-0102", department: { name: "Engineering" } },
  { id: 2, firstName: "Nadia", lastName: "Patel", email: "nadia@example.com", phone: "+1-555-0103", department: { name: "Operations" } },
  { id: 3, firstName: "Sofia", lastName: "Nguyen", email: "sofia@example.com", phone: "+1-555-0104", department: { name: "HR" } },
  { id: 4, firstName: "Darius", lastName: "Kim", email: "darius@example.com", phone: "+1-555-0105", department: { name: "Finance" } },
];

export const mockLeaveRequests = [
  { id: 101, leaveType: "SICK", status: "PENDING", days: 2 },
  { id: 102, leaveType: "VACATION", status: "MANAGER_APPROVED", days: 5 },
  { id: 103, leaveType: "PERSONAL", status: "HR_APPROVED", days: 1 },
];

export const mockAssets = [
  { id: 201, name: "MacBook Pro 14", type: "Laptop", serialNumber: "MBP-001", status: "ASSIGNED" },
  { id: 202, name: "Dell Dock Station", type: "Peripheral", serialNumber: "DOC-002", status: "AVAILABLE" },
  { id: 203, name: "Monitor 27-inch", type: "Display", serialNumber: "MON-003", status: "ASSIGNED" },
];

export const mockNotifications = [
  { id: 301, title: "Asset inventory synced", message: "Latest asset snapshot is ready.", type: "SYSTEM" },
  { id: 302, title: "Leave review pending", message: "A new leave request is awaiting review.", type: "LEAVE" },
];

export const mockAuditLogs = [
  { id: 401, action: "CREATE", entity: "Employee", newValue: "Marcus Lee onboarded" },
  { id: 402, action: "ASSIGN", entity: "Asset", newValue: "MacBook Pro 14 -> Marcus Lee" },
  { id: 403, action: "APPROVE", entity: "LeaveRequest", newValue: "Vacation request approved" },
];

export const mockReports = {
  employees: 12,
  leaves: 4,
  assets: 6,
};
