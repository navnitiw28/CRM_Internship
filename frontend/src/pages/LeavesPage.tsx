import { useEffect, useState, type FormEvent } from "react";
import { useAppSelector } from "../app/hooks";
import { apiRequest } from "../services/api";

interface LeaveRequest {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  managerComment?: string | null;
  hrComment?: string | null;
  user?: { id: number; name: string; email: string; role: string };
}

interface LeaveBalance {
  id: number;
  annualDays: number;
  usedDays: number;
  remainingDays: number;
}

interface LeaveAnalytics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  counts: Array<{ status: string; _count: { status: number } }>;
  recent: Array<{ id: number; employeeName: string; leaveType: string; status: string; days: number }>;
}

const LeavesPage = () => {
  const { user, token } = useAppSelector((state) => state.auth);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [analytics, setAnalytics] = useState<LeaveAnalytics | null>(null);
  const [leaveType, setLeaveType] = useState("Sick");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        const [balanceData, requestsData, analyticsData] = await Promise.all([
          apiRequest("/api/leave-balance", { token }),
          apiRequest("/api/leave-requests", { token }),
          apiRequest("/api/leave-analytics", { token }),
        ]);

        setBalance(balanceData.balance);
        setRequests(requestsData.requests || []);
        setAnalytics(analyticsData);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    loadData();
  }, [token, refreshKey]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      await apiRequest("/api/leave-requests", { method: "POST", body: { leaveType, startDate, endDate, reason }, token });
      setMessage("Leave request submitted successfully.");
      setLeaveType("Sick");
      setStartDate("");
      setEndDate("");
      setReason("");
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDecision = async (id: number, action: "APPROVE" | "REJECT", stage: "MANAGER" | "HR") => {
    if (!token) return;
    try {
      await apiRequest(`/api/leave-requests/${id}/decision`, {
        method: "PATCH",
        body: { action, stage, comment: action === "APPROVE" ? `${stage} approved request` : "Request rejected" },
        token,
      });
      setMessage(`Leave request ${action.toLowerCase()}d.`);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const canApprove = user?.role === "ADMIN" || user?.role === "HR" || user?.role === "MANAGER";

  return (
    <div className="page-stack">
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Leave Management</h2>
            <p>Submit leave requests and manage approvals from one place.</p>
          </div>
        </div>
        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="stats-grid">
          <div className="stat-card">
            <strong>{balance?.remainingDays ?? 0}</strong>
            <span>Remaining Days</span>
          </div>
          <div className="stat-card">
            <strong>{analytics?.totalRequests ?? 0}</strong>
            <span>Total Requests</span>
          </div>
          <div className="stat-card">
            <strong>{analytics?.pendingRequests ?? 0}</strong>
            <span>Pending</span>
          </div>
          <div className="stat-card">
            <strong>{analytics?.approvedRequests ?? 0}</strong>
            <span>Approved</span>
          </div>
        </div>
      </section>

      <div className="master-grid">
        <section className="card">
          <div className="card-header">
            <h3>Apply for Leave</h3>
          </div>
          <form onSubmit={handleSubmit} className="form-grid compact-form">
            <label>
              Leave Type
              <select value={leaveType} onChange={(event) => setLeaveType(event.target.value)}>
                <option value="Sick">Sick</option>
                <option value="Casual">Casual</option>
                <option value="Earned">Earned</option>
                <option value="Emergency">Emergency</option>
              </select>
            </label>
            <label>
              Start Date
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
            </label>
            <label>
              End Date
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
            </label>
            <label>
              Reason
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} required />
            </label>
            <button type="submit">Submit Request</button>
          </form>
        </section>

        {canApprove && (
          <section className="card">
            <div className="card-header">
              <h3>Approval Queue</h3>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.filter((item) => item.status === "PENDING" || item.status === "MANAGER_APPROVED").length === 0 ? (
                    <tr><td colSpan={3}>No approval tasks.</td></tr>
                  ) : requests.filter((item) => item.status === "PENDING" || item.status === "MANAGER_APPROVED").map((item) => (
                    <tr key={item.id}>
                      <td>{item.user?.name || "Unknown"}</td>
                      <td>{item.status}</td>
                      <td>
                        <div className="action-row">
                          {(user?.role === "MANAGER" || user?.role === "ADMIN") && (
                            <button type="button" className="button-link small" onClick={() => handleDecision(item.id, "APPROVE", "MANAGER")}>Approve Manager</button>
                          )}
                          {(user?.role === "HR" || user?.role === "ADMIN") && (
                            <button type="button" className="button-link small" onClick={() => handleDecision(item.id, "APPROVE", "HR")}>Approve HR</button>
                          )}
                          <button type="button" className="button-link small danger" onClick={() => handleDecision(item.id, "REJECT", user?.role === "HR" || user?.role === "ADMIN" ? "HR" : "MANAGER")}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <section className="card">
        <div className="card-header">
          <h3>My Leave Requests</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={4}>No leave requests yet.</td></tr>
              ) : requests.map((item) => (
                <tr key={item.id}>
                  <td>{item.leaveType}</td>
                  <td>{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</td>
                  <td>{item.days}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Recent Activity</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Status</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.recent || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.employeeName}</td>
                  <td>{item.leaveType}</td>
                  <td>{item.status}</td>
                  <td>{item.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default LeavesPage;
