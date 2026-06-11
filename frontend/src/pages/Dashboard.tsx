import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { apiRequest } from "../services/api";

interface RecentEmployee {
  id: number;
  name: string;
  position: string | null;
  department: string;
}

interface LeaveAnalytics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
}

const Dashboard = () => {
  const { user, token } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState({ employeeCount: 0, departmentCount: 0, skillCount: 0 });
  const [recentEmployees, setRecentEmployees] = useState<RecentEmployee[]>([]);
  const [leaveAnalytics, setLeaveAnalytics] = useState<LeaveAnalytics>({ totalRequests: 0, pendingRequests: 0, approvedRequests: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiRequest("/api/dashboard/stats", { token }),
      apiRequest("/api/leave-analytics", { token }),
    ])
      .then(([statsData, leaveData]) => {
        setStats({ employeeCount: statsData.employeeCount, departmentCount: statsData.departmentCount, skillCount: statsData.skillCount });
        setRecentEmployees(statsData.recentEmployees || []);
        setLeaveAnalytics({
          totalRequests: leaveData.totalRequests || 0,
          pendingRequests: leaveData.pendingRequests || 0,
          approvedRequests: leaveData.approvedRequests || 0,
        });
      })
      .catch((err) => setError((err as Error).message));
  }, [token]);

  return (
    <div className="page-stack">
      <section className="card">
        <h2>Dashboard</h2>
        <p>Welcome back, <strong>{user?.name}</strong>!</p>
        <p>Your role is: <strong>{user?.role}</strong></p>
        {error && <p className="form-error">{error}</p>}
        <div className="stats-grid">
          <div className="stat-card">
            <strong>{stats.employeeCount}</strong>
            <span>Employees</span>
          </div>
          <div className="stat-card">
            <strong>{stats.departmentCount}</strong>
            <span>Departments</span>
          </div>
          <div className="stat-card">
            <strong>{stats.skillCount}</strong>
            <span>Skills</span>
          </div>
        </div>
        <div className="dashboard-actions">
          <Link to="/profile" className="button-link">Edit Profile</Link>
          <Link to="/leaves" className="button-link">Manage Leaves</Link>
          {user?.role === "ADMIN" && <Link to="/employees" className="button-link">Manage Employees</Link>}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Leave Workflow Summary</h3>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <strong>{leaveAnalytics.totalRequests}</strong>
            <span>Total Leave Requests</span>
          </div>
          <div className="stat-card">
            <strong>{leaveAnalytics.pendingRequests}</strong>
            <span>Pending</span>
          </div>
          <div className="stat-card">
            <strong>{leaveAnalytics.approvedRequests}</strong>
            <span>Approved</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Recently Added Employees</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              {recentEmployees.length === 0 ? (
                <tr><td colSpan={3}>No recent employees.</td></tr>
              ) : recentEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.position || "—"}</td>
                  <td>{employee.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
