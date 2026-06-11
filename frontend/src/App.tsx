import { useEffect, useState, type FormEvent } from "react";
import { mockAssets, mockAuditLogs, mockDashboardStats, mockEmployees, mockLeaveRequests, mockNotifications, mockReports, mockUser } from "./data/mockData";

const getApiBase = () => {
  const configured = (import.meta as any).env?.VITE_API_URL;
  if (configured) return configured;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }
  return "https://crm-internship-6.onrender.com";
};

const API_BASE = getApiBase();

// --- TEXT TO SPEECH OPERATIONAL ENGINE ---
const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    // Cancel any active audio queues to prevent overlapping voice lag
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Attempt to match premium human/female system profiles
    const femaleVoice = voices.find(voice => 
      (voice.name.includes('Google US English') || 
       voice.name.includes('Microsoft Zira') || 
       voice.name.includes('Samantha') || 
       voice.name.includes('Female')) && voice.lang.startsWith('en')
    );

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    } else {
      const anyEnglishVoice = voices.find(voice => voice.lang.startsWith('en'));
      if (anyEnglishVoice) utterance.voice = anyEnglishVoice;
    }

    // Set voice metrics for clean, professional narration
    utterance.rate = 1.0; 
    utterance.pitch = 1.15; 

    window.speechSynthesis.speak(utterance);
  }
};

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<any | null>(null);
  const [view, setView] = useState("dashboard");
  const [message, setMessage] = useState("");
  
  // New State: Controller for Dynamic Auth Modes
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [stats, setStats] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);

  // Forms
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    password: "", 
    departmentId: "1" 
  });
  
  const [assetForm, setAssetForm] = useState({ name: "", type: "Laptop", serialNumber: "", notes: "" });
  const [assignForm, setAssignForm] = useState({ assetId: "", assignedTo: "", assignedBy: "" });
  const [leaveForm, setLeaveForm] = useState({ leaveType: "SICK", startDate: "", endDate: "", reason: "" });

  // Voice effect 1: Announce Login page when authentication token is missing or when mode switches
  useEffect(() => {
    if (!token) {
      setUser(null);
      // Short delay gives browser voice matrices time to initialize completely
      const timer = setTimeout(() => {
        speakText(authMode === 'login' ? "Login" : "Register");
      }, 300);
      return () => clearTimeout(timer);
    } else {
      loadDashboard();
    }
  }, [token, authMode]);

  // Voice effect 2: Announce active layout selection on view state modifications
  useEffect(() => {
    if (token && user) {
      const formatViewText = view === 'audit' ? 'Audit Trail' : view.charAt(0).toUpperCase() + view.slice(1);
      speakText(formatViewText);
    }
  }, [view, user, token]);

  // Populate list metrics asynchronously from server endpoints
  useEffect(() => {
    // Ensures voices load dynamically for Chrome/Safari setup variations
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  function applyDashboardState(data: any) {
    setUser(data.user || null);
    setStats(data.stats || null);
    setEmployees(data.employees || []);
    setLeaveRequests(data.leaveRequests || []);
    setAssets(data.assets || []);
    setNotifications(data.notifications || []);
    setAuditLogs(data.auditLogs || []);
    setReports(data.reports || null);
  }

  function getMockDashboardState() {
    return {
      user: mockUser,
      stats: mockDashboardStats,
      employees: mockEmployees,
      leaveRequests: mockLeaveRequests,
      assets: mockAssets,
      notifications: mockNotifications,
      auditLogs: mockAuditLogs,
      reports: mockReports,
    };
  }

  async function loadDashboard() {
    if (!token) return;
    if (token === "mock-token") {
      applyDashboardState(getMockDashboardState());
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [meRes, statsRes, employeesRes, leaveRes, assetsRes, notifyRes, auditRes, reportRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/me`, { headers }),
        fetch(`${API_BASE}/api/dashboard/stats`, { headers }),
        fetch(`${API_BASE}/api/employees`, { headers }),
        fetch(`${API_BASE}/api/leave-requests`, { headers }),
        fetch(`${API_BASE}/api/v1/assets`, { headers }),
        fetch(`${API_BASE}/api/v1/notifications`, { headers }),
        fetch(`${API_BASE}/api/v1/audit-logs`, { headers }),
        fetch(`${API_BASE}/api/v1/reports/summary`, { headers }),
      ]);

      const meData = meRes.ok ? await meRes.json() : null;
      const statsData = statsRes.ok ? await statsRes.json() : null;
      const employeesData = employeesRes.ok ? await employeesRes.json() : null;
      const leaveData = leaveRes.ok ? await leaveRes.json() : null;
      const assetsData = assetsRes.ok ? await assetsRes.json() : null;
      const notifyData = notifyRes.ok ? await notifyRes.json() : null;
      const auditData = auditRes.ok ? await auditRes.json() : null;
      const reportData = reportRes.ok ? await reportRes.json() : null;

      applyDashboardState({
        user: meData?.user || mockUser,
        stats: statsData || mockDashboardStats,
        employees: employeesData?.employees || mockEmployees,
        leaveRequests: leaveData?.requests || mockLeaveRequests,
        assets: assetsData?.items || assetsData?.assets || mockAssets,
        notifications: notifyData?.notifications || mockNotifications,
        auditLogs: auditData?.logs || mockAuditLogs,
        reports: reportData?.summary || mockReports,
      });
    } catch {
      applyDashboardState(getMockDashboardState());
      setMessage("Showing demo workspace data while the backend is unavailable.");
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (loginForm.email === "admin@example.com" && loginForm.password === "admin123") {
      localStorage.setItem("token", "mock-token");
      localStorage.setItem("refreshToken", "mock-refresh");
      setToken("mock-token");
      applyDashboardState(getMockDashboardState());
      setMessage("Signed in successfully.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Login configuration failed");
      speakText("Authentication failed");
      return;
    }
    localStorage.setItem("token", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    setToken(data.accessToken);
    setMessage("Signed in successfully.");
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Registration validation error");
      speakText("Registration failed");
      return;
    }
    // If successful, reset and direct them to login
    setMessage("Registration verified. Please authenticate identity.");
    setAuthMode('login');
    // Clear and pre-fill the email for them
    setLoginForm({ email: registerForm.email, password: "" });
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
    setMessage("Signed out.");
    speakText("Logged out");
  }

  // Quick fill helper for the sandbox credentials
  function fillSandboxCredentials() {
    setLoginForm({ email: "admin@example.com", password: "admin123" });
    setMessage("Sandbox parameters applied.");
  }

  async function handleCreateAsset(e: FormEvent) {
    e.preventDefault();
    if (token === "mock-token") {
      const createdAsset = { id: Date.now(), ...assetForm, status: "AVAILABLE" };
      setAssets([createdAsset, ...assets]);
      setAssetForm({ name: "", type: "Laptop", serialNumber: "", notes: "" });
      setMessage("Asset created locally.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/v1/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(assetForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Asset creation failed");
      return;
    }
    setAssets([data.asset, ...assets]);
    setAssetForm({ name: "", type: "Laptop", serialNumber: "", notes: "" });
    setMessage("Asset created.");
  }

  async function handleAssignAsset(e: FormEvent) {
    e.preventDefault();
    if (token === "mock-token") {
      setAssets(assets.map((asset) => (asset.id === Number(assignForm.assetId) ? { ...asset, status: "ASSIGNED", assignedTo: assignForm.assignedTo, assignedBy: assignForm.assignedBy } : asset)));
      setAssignForm({ assetId: "", assignedTo: "", assignedBy: "" });
      setMessage("Asset assigned locally.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/v1/assets/${assignForm.assetId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ assignedTo: assignForm.assignedTo, assignedBy: assignForm.assignedBy }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Assignment failed");
      return;
    }
    setAssets(assets.map((asset) => (asset.id === data.asset.id ? data.asset : asset)));
    setAssignForm({ assetId: "", assignedTo: "", assignedBy: "" });
    setMessage("Asset assigned.");
  }

  async function handleCreateLeave(e: FormEvent) {
    e.preventDefault();
    if (token === "mock-token") {
      const createdRequest = {
        id: Date.now(),
        leaveType: leaveForm.leaveType,
        status: "PENDING",
        days: Math.max(1, Math.round((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1),
      };
      setLeaveRequests([createdRequest, ...leaveRequests]);
      setLeaveForm({ leaveType: "SICK", startDate: "", endDate: "", reason: "" });
      setMessage("Leave request submitted locally.");
      return;
    }

    const res = await fetch(`${API_BASE}/api/leave-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(leaveForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Leave request failed");
      return;
    }
    setLeaveRequests([data.request, ...leaveRequests]);
    setLeaveForm({ leaveType: "SICK", startDate: "", endDate: "", reason: "" });
    setMessage("Leave request submitted.");
  }

  function downloadCsv() {
    window.open(`${API_BASE}/api/v1/reports/export`, "_blank");
  }

  if (!token || !user) {
    return (
      <div className="app-shell login-view" onClick={() => { if(window.speechSynthesis.speaking === false) speakText(authMode === 'login' ? "Login" : "Register"); }}>
        <style>{styles}</style>
        <div className="login-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <header className="login-header text-center">
            <h1>Unified Workspace Telemetry</h1>
            <h1 className="color-fade">Core Console Platform</h1>
            <p className="description muted">Seamless telemetry and functional operational control surface for corporate core infrastructure nodes.</p>
          </header>
          
          <main className="card auth-card glow-card transparent-bg blur">
            {/* Redesigned Tab Controller */}
            <div className="auth-tab-pill">
              <button className={`auth-pill-btn ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>Sign In</button>
              <button className={`auth-pill-btn ${authMode === 'register' ? 'active' : ''}`} onClick={() => setAuthMode('register')}>Register Identity</button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="stack">
                <div className="input-group">
                  <label>corporate email address</label>
                  <input type="email" required value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="admin@enterprise-node.com" />
                </div>
                <div className="input-group">
                  <label>password</label>
                  <input type="password" required value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" />
                </div>
                <button type="submit" className="btn-primary auth-submit-btn">Authenticate Identity</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="stack">
                <div className="row-grid">
                  <div className="input-group">
                    <label>First Name</label>
                    <input type="text" required value={registerForm.firstName} onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })} placeholder="John" />
                  </div>
                  <div className="input-group">
                    <label>Last Name</label>
                    <input type="text" required value={registerForm.lastName} onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })} placeholder="Doe" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Corporate Email</label>
                  <input type="email" required value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="j.doe@enterprise.com" />
                </div>
                <div className="input-group">
                  <label>Secure Encryption Password</label>
                  <input type="password" required value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="Minimum 8 characters" />
                </div>
                <div className="input-group">
                  <label>Operational Domain Segment</label>
                  <select value={registerForm.departmentId} onChange={(e) => setRegisterForm({ ...registerForm, departmentId: e.target.value })} className="custom-select blur">
                    <option value="1">Engineering & Core Infra</option>
                    <option value="2">Human Capital Resources</option>
                    <option value="3">Operations & Logic Pipelines</option>
                    <option value="4">Finance Matrix</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary">Provision Node Account</button>
              </form>
            )}

            {/* Redesigned Footer Section */}
            <div className="auth-footer text-center muted text-xs">
              {authMode === 'login' && (
                <div className="sandbox-link inline-link" onClick={fillSandboxCredentials}>
                  bypass via sandbox parameters
                </div>
              )}
              {message && <div className="message status-active inline-msg">{message}</div>}
              <div className="signed-out-prompt">signed out.</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{styles}</style>
      <header className="topbar card glass">
        <div>
          <p className="eyebrow">Enterprise Core Node</p>
          <h1>Unified Management Deck</h1>
        </div>
        <div className="topbar-profile">
          <div className="profile-details">
            <span className="caption">Operator Profile</span>
            <strong className="profile-name">{user.name || `${user.firstName} ${user.lastName}`}</strong>
          </div>
          <button className="btn-secondary logout-btn" onClick={handleLogout}>Disconnect</button>
        </div>
      </header>
      
      <main className="page-grid">
        <aside className="sidebar card glass">
          <div className="sidebar-brand">
            <p className="eyebrow">Navigation System</p>
          </div>
          <div className="nav-list">
            {['dashboard','employees','leaves','assets','reports','notifications','audit'].map((item) => (
              <button key={item} className={view === item ? 'nav-item active' : 'nav-item'} onClick={() => setView(item)}>
                <span className="nav-dot"></span>
                {item}
              </button>
            ))}
          </div>
          <div className="mini-card status-indicator glass">
            <div className="pulse"></div>
            <div>
              <p className="caption">Core Interface</p>
              <strong className="text-success">Operational</strong>
            </div>
          </div>
        </aside>

        <section className="main-panel animate-slide-up">
          {message ? <div className="message global-msg">{message}</div> : null}
          
          {view === 'dashboard' && (
            <div className="view-container stack">
              <div className="stats-grid">
                <div className="card stat-card glass glow-blue"><h4>Total Headcount</h4><strong>{stats?.employeeCount ?? 0}</strong><div className="stat-line bg-blue"></div></div>
                <div className="card stat-card glass glow-indigo"><h4>Active Clusters</h4><strong>{stats?.departmentCount ?? 0}</strong><div className="stat-line bg-indigo"></div></div>
                <div className="card stat-card glass glow-teal"><h4>Skills Directory</h4><strong>{stats?.skillCount ?? 0}</strong><div className="stat-line bg-teal"></div></div>
                <div className="card stat-card glass glow-emerald"><h4>Tracked Modules</h4><strong>{reports?.assets ?? 0}</strong><div className="stat-line bg-emerald"></div></div>
              </div>
              <div className="card glass">
                <h3 className="card-title"><span className="title-decorator bg-indigo"></span>Recent Onboarding Feeds</h3>
                {stats?.recentEmployees?.length ? (
                  <ul className="list">
                    {stats.recentEmployees.map((item:any) => (
                      <li key={item.id} className="list-item item-row">
                        <div className="item-meta">
                          <strong className="item-title">{item.name}</strong>
                        </div>
                        <span className="badge badge-dept">{item.department}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="muted padding-inside">No historical record mutations recorded.</p>}
              </div>
            </div>
          )}

          {view === 'employees' && (
            <div className="card table-card glass">
              <h3 className="card-title padding-x"><span className="title-decorator bg-blue"></span>Personnel Master Directory</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Identity Record</th><th>Secure Communications</th><th>Operational Pillar</th></tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className="table-row">
                        <td className="font-medium font-display">{employee.firstName} {employee.lastName}</td>
                        <td className="font-mono text-muted">{employee.email}</td>
                        <td><span className="badge badge-dept">{employee.department?.name || 'Unassigned'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === 'leaves' && (
            <div className="split-grid">
              <div className="card glass">
                <h3 className="card-title"><span className="title-decorator bg-amber"></span>Dispatch Off-Time Request</h3>
                <form onSubmit={handleCreateLeave} className="stack">
                  <div className="input-group">
                    <label>Absence Configuration Type</label>
                    <input value={leaveForm.leaveType} onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })} placeholder="e.g. SICK, CASUAL, VACATION" />
                  </div>
                  <div className="row-grid">
                    <div className="input-group">
                      <label>Cycle Initialization</label>
                      <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <label>Cycle Termination</label>
                      <input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Justification Statement</label>
                    <textarea value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Provide context regarding infrastructure handoff plans..." rows={3} />
                  </div>
                  <button type="submit" className="btn-primary">Dispatch to Registry</button>
                </form>
              </div>
              <div className="card glass">
                <h3 className="card-title"><span className="title-decorator bg-muted"></span>Allocation History Archive</h3>
                {leaveRequests.length ? (
                  <ul className="list">
                    {leaveRequests.map((request) => (
                      <li key={request.id} className="list-item column-layout">
                        <div className="row-justify">
                          <strong className="font-display">{request.leaveType} File</strong>
                          <span className={`badge status-${(request.status || 'pending').toLowerCase()}`}>{request.status || 'Pending'}</span>
                        </div>
                        <div className="meta-footer">
                          <span className="caption font-mono text-muted">{request.days} operational cycles allocated</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="muted padding-inside">No historical schedule deviations reported.</p>}
              </div>
            </div>
          )}

          {view === 'assets' && (
            <div className="view-container stack">
              <div className="split-grid">
                <div className="card glass">
                  <h3 className="card-title"><span className="title-decorator bg-teal"></span>Provision System Asset</h3>
                  <form onSubmit={handleCreateAsset} className="stack">
                    <input value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} placeholder="Asset Spec Title (e.g. Blade Engine x9)" />
                    <input value={assetForm.type} onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })} placeholder="Macro Classification Category" />
                    <input value={assetForm.serialNumber} onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })} placeholder="Cryptographic Hardware Serial ID" />
                    <textarea value={assetForm.notes} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} placeholder="Structural configuration constraints..." rows={2} />
                    <button type="submit" className="btn-primary">Register Asset Record</button>
                  </form>
                </div>
                <div className="card glass">
                  <h3 className="card-title"><span className="title-decorator bg-purple"></span>Authorize Custody Handoff</h3>
                  <form onSubmit={handleAssignAsset} className="stack">
                    <div className="input-group"><label>Asset Node Address ID</label><input value={assignForm.assetId} onChange={(e) => setAssignForm({ ...assignForm, assetId: e.target.value })} placeholder="TARGET_NODE_ID" /></div>
                    <div className="input-group"><label>Recipient Assignee ID</label><input value={assignForm.assignedTo} onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })} placeholder="RECIPIENT_USER_ID" /></div>
                    <div className="input-group"><label>Authorizing Signatory ID</label><input value={assignForm.assignedBy} onChange={(e) => setAssignForm({ ...assignForm, assignedBy: e.target.value })} placeholder="SIGNATORY_OFFICER_ID" /></div>
                    <button type="submit" className="btn-secondary">Seal Cluster Assignment</button>
                  </form>
                </div>
              </div>
              <div className="card glass">
                <h3 className="card-title"><span className="title-decorator bg-emerald"></span>Inventory Allocation Ledger</h3>
                {assets.length ? (
                  <ul className="list-grid">
                    {assets.map((asset) => (
                      <li key={asset.id} className="asset-grid-card glass">
                        <div className="asset-meta-stack">
                          <span className="caption font-mono text-emerald">{asset.type}</span>
                          <h4>{asset.name}</h4>
                        </div>
                        <span className="badge status-active">{asset.status || 'Active Ledger'}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="muted padding-inside">Asset tracking registry empty.</p>}
              </div>
            </div>
          )}

          {view === 'reports' && (
            <div className="card glass metrics-center">
              <div className="row-justify border-dashed-bottom">
                <div>
                  <h3 className="card-title"><span className="title-decorator bg-emerald"></span>Data Aggregation Hub</h3>
                  <p className="muted text-sm">Download systemic platform variables output array configurations safely.</p>
                </div>
                <button onClick={downloadCsv} className="btn-primary neon-glow-btn">Export Core Ledger (.CSV)</button>
              </div>
              <div className="stats-grid grid-spacer">
                <div className="stat-card minimal"><h4>Staff Vector Matrix</h4><strong>{reports?.employees ?? 0}</strong></div>
                <div className="stat-card minimal"><h4>Absence Record Arrays</h4><strong>{reports?.leaves ?? 0}</strong></div>
                <div className="stat-card minimal"><h4>Hardware Entity Nodes</h4><strong>{reports?.assets ?? 0}</strong></div>
              </div>
            </div>
          )}

          {view === 'notifications' && (
            <div className="card glass">
              <h3 className="card-title"><span className="title-decorator bg-purple"></span>System Realtime Feeds</h3>
              {notifications.length ? (
                <ul className="list">
                  {notifications.map((item) => (
                    <li key={item.id} className="list-item notification-row glass">
                      <div className="notification-indicator"></div>
                      <div>
                        <strong className="font-display block-span">{item.title}</strong>
                        <p className="text-muted text-sm margin-top-xs">{item.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="muted padding-inside">Telemetry event messaging channels are clear.</p>}
            </div>
          )}

          {view === 'audit' && (
            <div className="card table-card glass">
              <h3 className="card-title padding-x"><span className="title-decorator bg-rose"></span>Immutable Pipeline Mutations</h3>
              {auditLogs.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Mutation Vector</th><th>Operational Target</th><th>Data Delta Payload</th></tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((item) => (
                        <tr key={item.id} className="table-row">
                          <td><span className="badge badge-action">{item.action}</span></td>
                          <td className="font-medium font-display">{item.entity}</td>
                          <td className="font-mono text-muted text-xs truncate-cell">{item.newValue || '∅ No payload delta'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="muted padding-inside">No State Variable Mutations Verified Inside Current Framework Thread.</p>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = `
  :root { 
    --bg-base: #02030b;
    --glass-bg: rgba(13, 19, 41, 0.45);
    --glass-border: rgba(255, 255, 255, 0.055);
    --glass-border-glow: rgba(255, 255, 255, 0.09);
    --input-bg: rgba(3, 5, 15, 0.6);
    --text-primary: #f8fafc;
    --text-muted: #64748b;
    --blue: #3b82f6;
    --indigo: #6366f1;
    --teal: #14b8a6;
    --emerald: #10b981;
    --rose: #f43f5e;
    --amber: #f59e0b;
    --radius-xl: 20px;
    --radius-lg: 14px;
    --radius-sm: 8px;
    --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  
  * { box-sizing: border-box; outline: none; }
  body { 
    margin: 0; 
    background-color: var(--bg-base); 
    color: var(--text-primary); 
    font-family: var(--font-sans);
    letter-spacing: -0.01em;
    background-image: 
      radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 10% 90%, rgba(99, 102, 241, 0.04) 0%, transparent 40%);
    background-attachment: fixed;
  }
  
  .app-shell { min-height: 100vh; padding: 40px; max-width: 1540px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }
  
  /* Centralized Spatial Authentication Layout */
  .login-view { justify-content: center; align-items: center; min-height: 100vh; padding: 24px; cursor: pointer; }
  .login-container { width: min(440px, 100%); display: flex; flex-direction: column; gap: 28px; pointer-events: auto; }
  .login-header h1 { font-size: 2.2rem; font-weight: 900; tracking: -0.04em; margin: 0; color: #ffffff; }
  .login-header .color-fade { color: var(--text-muted); opacity: 0.8; }
  .description { max-width: 360px; margin: 12px auto 0; font-size: 0.92rem; line-height: 1.6; }
  
  h2, h3, h4 { font-weight: 800; letter-spacing: -0.03em; margin: 0; }
  h2 { font-size: 1.5rem; text-align: center; color: #ffffff; }
  
  /* Modernized Auth Controller Pill Tabs */
  .auth-tab-pill { display: flex; background: rgba(0, 0, 0, 0.35); padding: 5px; border-radius: 40px; border: 1px solid var(--glass-border); margin-bottom: 8px; }
  .auth-pill-btn { flex: 1; padding: 12px; background: transparent; border: none; color: var(--text-muted); font-size: 0.82rem; font-weight: 700; border-radius: 40px; text-transform: capitalize; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
  .auth-pill-btn.active { background: var(--blue); color: #fff; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); border: 1px solid rgba(255,255,255,0.1); }

  /* Redesigned Emissive Auth Submit Button */
  .auth-submit-btn { margin-top: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; background: var(--blue); box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
  .auth-submit-btn:hover { box-shadow: 0 0 25px rgba(59, 130, 246, 0.7); }

  /* Minimalist Auth Footer with statuses */
  .auth-footer { margin-top: 16px; font-weight: 500; font-size: 0.82rem; }
  .signed-out-prompt { text-transform: capitalize; color: var(--text-muted); opacity: 0.8; margin-top: 6px; }
  
  /* Glassmorphism Structural Core Blueprint */
  .card { 
    background: var(--glass-bg); 
    border: 1px solid var(--glass-border); 
    border-radius: var(--radius-xl); 
    padding: 28px; 
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.05);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .transparent-bg { background: rgba(13, 19, 41, 0.15); border-color: rgba(59, 130, 246, 0.15); box-shadow: 0 0 30px rgba(59, 130, 246, 0.15); }
  .glow-card:hover { border-color: rgba(59, 130, 246, 0.3); box-shadow: 0 0 40px rgba(59, 130, 246, 0.25); }
  .blur { backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); }
  
  /* Decorative Accents */
  .title-decorator { width: 4px; height: 18px; border-radius: 4px; display: inline-block; margin-right: 12px; vertical-align: middle; }
  .bg-blue { background-color: var(--blue); }
  .bg-indigo { background-color: var(--indigo); }
  .bg-teal { background-color: var(--teal); }
  .bg-emerald { background-color: var(--emerald); }
  .bg-rose { background-color: var(--rose); }
  .bg-amber { background-color: var(--amber); }
  
  /* Interactive Form Components with modernized styling */
  .stack { display: flex; flex-direction: column; gap: 20px; }
  .input-group { display: flex; flex-direction: column; gap: 8px; }
  .input-group label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); opacity: 0.8; text-transform: capitalize; letter-spacing: 0.04em; }
  
  input, textarea, .custom-select { 
    font-family: inherit; font-size: 0.92rem; border-radius: var(--radius-lg); padding: 14px 16px; 
    border: 1px solid var(--glass-border); background: var(--input-bg); color: var(--text-primary); 
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); transition: all 0.2s ease; 
  }
  input:focus, textarea:focus, .custom-select:focus { border-color: rgba(99, 102, 241, 0.5); background: rgba(3, 5, 15, 0.8); box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12), inset 0 2px 4px rgba(0,0,0,0.3); }
  
  /* Telemetry Control Buttons */
  button { font-family: inherit; font-weight: 700; font-size: 0.88rem; padding: 14px 24px; border: none; border-radius: var(--radius-lg); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
  .btn-primary { background: linear-gradient(135deg, var(--indigo), var(--blue)); color: #fff; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25); }
  .btn-primary:hover { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35); }
  .btn-secondary { background: rgba(255, 255, 255, 0.03); color: var(--text-primary); border: 1px solid var(--glass-border-glow); }
  .btn-secondary:hover { background: rgba(255, 255, 255, 0.07); border-color: rgba(255, 255, 255, 0.15); }
  .logout-btn { padding: 10px 18px; font-size: 0.8rem; border-radius: var(--radius-sm); }
  
  /* Generic Styling Helpers */
  .row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .split-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 32px; }
  .topbar { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; }
  .topbar h1 { font-size: 1.5rem; font-weight: 900; background: linear-gradient(135deg, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .topbar-profile { display: flex; align-items: center; gap: 24px; }
  .profile-details { display: flex; flex-direction: column; text-align: right; }
  .profile-name { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
  
  .page-grid { display: grid; grid-template-columns: 280px 1fr; gap: 32px; align-items: start; }
  .sidebar { display: flex; flex-direction: column; gap: 28px; position: sticky; top: 40px; }
  .nav-list { display: flex; flex-direction: column; gap: 6px; }
  .nav-item { text-align: left; padding: 14px 18px; border-radius: var(--radius-lg); background: transparent; color: var(--text-muted); border: 1px solid transparent; cursor: pointer; text-transform: uppercase; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; display: flex; align-items: center; gap: 14px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
  .nav-dot { width: 6px; height: 6px; border-radius: 50%; background-color: var(--text-muted); opacity: 0.4; transition: all 0.25s ease; }
  .nav-item:hover { background: rgba(255, 255, 255, 0.02); color: var(--text-primary); border-color: var(--glass-border); }
  .nav-item.active { background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(59, 130, 246, 0.05)); color: #fff; border-color: rgba(99, 102, 241, 0.3); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); }
  .nav-item.active .nav-dot { background-color: var(--blue); opacity: 1; box-shadow: 0 0 10px var(--blue); }
  
  .status-indicator { display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-color: var(--glass-border-glow); }
  .pulse { width: 8px; height: 8px; background-color: var(--emerald); border-radius: 50%; position: relative; }
  .pulse::after { content:''; position: absolute; width:100%; height:100%; left:0; top:0; background: inherit; border-radius:inherit; animation: activeGlow 1.8s infinite; }
  @keyframes activeGlow { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.8); opacity: 0; } }
  .text-success { color: var(--emerald); font-size: 0.9rem; font-weight: 700; }
  
  /* Matrix Displays and Data Visuals */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
  .stat-card { position: relative; overflow: hidden; padding: 24px; border-color: var(--glass-border-glow); }
  .stat-card h4 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 12px; }
  .stat-card strong { font-size: 2.2rem; font-weight: 900; tracking: -0.03em; color: #fff; font-family: system-ui, sans-serif; }
  .stat-line { position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; opacity: 0.7; }
  
  .glow-blue:hover { border-color: rgba(59, 130, 246, 0.3); box-shadow: 0 0 25px rgba(59, 130, 246, 0.15); }
  .glow-indigo:hover { border-color: rgba(99, 102, 241, 0.3); box-shadow: 0 0 25px rgba(99, 102, 241, 0.15); }
  .glow-teal:hover { border-color: rgba(20, 184, 166, 0.3); box-shadow: 0 0 25px rgba(20, 184, 166, 0.15); }
  .glow-emerald:hover { border-color: rgba(16, 185, 129, 0.3); box-shadow: 0 0 25px rgba(16, 185, 129, 0.15); }
  
  .table-card { padding: 24px 0; }
  .table-card .card-title { padding: 4px 28px 16px; margin: 0; }
  .table-wrapper { width: 100%; overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
  th { padding: 16px 28px; color: var(--text-muted); font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid var(--glass-border); background: rgba(0,0,0,0.15); }
  td { padding: 18px 28px; border-bottom: 1px solid var(--glass-border); }
  .table-row { transition: background 0.2s ease; }
  .table-row:hover { background: rgba(255, 255, 255, 0.015); }
  
  .list { display: flex; flex-direction: column; gap: 12px; list-style: none; padding: 0; margin: 0; }
  .list-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-radius: var(--radius-lg); background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); }
  
  .badge { display: inline-flex; align-items: center; font-size: 0.7rem; font-weight: 800; padding: 4px 12px; border-radius: 30px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid transparent; }
  .status-active { background: rgba(16, 185, 129, 0.08); color: #34d399; border-color: rgba(16, 185, 129, 0.2); }
  
  .list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; list-style: none; padding: 0; margin: 0; }
  .asset-grid-card { padding: 20px; border-radius: var(--radius-lg); border: 1px solid var(--glass-border-glow); display: flex; justify-content: space-between; align-items: flex-start; background: rgba(255,255,255,0.005); }
  
  .message { padding: 16px 20px; border-radius: var(--radius-lg); font-size: 0.9rem; font-weight: 600; margin-bottom: 24px; }
  .global-msg { background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); color: #60a5fa; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .notification-row { display: flex; gap: 16px; align-items: flex-start; border-color: var(--glass-border-glow); background: rgba(255,255,255,0.005); }
  
  /* Text and Alignment Primitives */
  .text-center { text-align: center; }
  .inline-link, .inline-msg { display: inline; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
  .inline-link:hover { color: var(--blue); }
  .inline-msg { border: none; padding: 0; margin: 0; text-decoration: none; }
  .text-xs { font-size: 0.78rem; }
  .muted { color: var(--text-muted); }
  
  /* Operational Custom Elements */
  .custom-select { width: 100%; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; background-size: 16px; }
  .custom-select option { background-color: #02030b; color: var(--text-primary); }

  /* Kinetic Animations */
  .animate-slide-up { animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
  @keyframes slideUp { 0% { transform: translateY(12px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
  @keyframes fadeIn { 0% { opacity: 0; transform: scale(0.98); } 100% { opacity: 1; transform: scale(1); } }
  
  @media (max-width: 1024px) { 
    .page-grid { grid-template-columns: 1fr; gap: 24px; } 
    .topbar { flex-direction: column; align-items: flex-start; gap: 20px; padding: 24px; }
    .topbar-profile { width: 100%; justify-content: space-between; border-top: 1px solid var(--glass-border); padding-top: 16px; }
    .app-shell { padding: 20px; }
  }
`;

export default App;