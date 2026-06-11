import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { apiRequest, API_URL } from "../services/api";

interface EmployeeRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string | null;
  resumeFile?: string | null;
  department?: { id: number; name: string } | null;
  skills: Array<{ skill: { id: number; name: string } }>;
}

interface Department { id: number; name: string; }
interface Skill { id: number; name: string; }

const resolveFileUrl = (value?: string | null) => {
  if (!value) return null;
  return value.startsWith("http") ? value : `${API_URL}${value}`;
};

const EmployeeList = () => {
  const { token, user } = useAppSelector((state) => state.auth);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState({ employeeCount: 0, departmentCount: 0, skillCount: 0 });
  const [departmentName, setDepartmentName] = useState("");
  const [skillName, setSkillName] = useState("");
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        const [employeesResponse, departmentsResponse, skillsResponse, statsResponse] = await Promise.all([
          apiRequest("/api/employees", { token }),
          apiRequest("/api/departments", { token }),
          apiRequest("/api/skills", { token }),
          apiRequest("/api/dashboard/stats", { token }),
        ]);

        setEmployees(employeesResponse.employees || []);
        setDepartments(departmentsResponse.departments || []);
        setSkills(skillsResponse.skills || []);
        setStats({
          employeeCount: statsResponse.employeeCount || 0,
          departmentCount: statsResponse.departmentCount || 0,
          skillCount: statsResponse.skillCount || 0,
        });
      } catch (err) {
        setError((err as Error).message);
      }
    };

    loadData();
  }, [token, refresh]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Delete this employee?")) return;
    try {
      await apiRequest(`/api/employees/${id}`, { method: "DELETE", token });
      setMessage("Employee deleted.");
      setRefresh((prev) => prev + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDepartmentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    try {
      if (editingDepartmentId) {
        await apiRequest(`/api/departments/${editingDepartmentId}`, { method: "PATCH", body: { name: departmentName }, token });
        setMessage("Department updated.");
      } else {
        await apiRequest("/api/departments", { method: "POST", body: { name: departmentName }, token });
        setMessage("Department created.");
      }
      setDepartmentName("");
      setEditingDepartmentId(null);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSkillSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    try {
      if (editingSkillId) {
        await apiRequest(`/api/skills/${editingSkillId}`, { method: "PATCH", body: { name: skillName }, token });
        setMessage("Skill updated.");
      } else {
        await apiRequest("/api/skills", { method: "POST", body: { name: skillName }, token });
        setMessage("Skill created.");
      }
      setSkillName("");
      setEditingSkillId(null);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!token) return;
    try {
      await apiRequest(`/api/departments/${id}`, { method: "DELETE", token });
      setMessage("Department removed.");
      setRefresh((prev) => prev + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteSkill = async (id: number) => {
    if (!token) return;
    try {
      await apiRequest(`/api/skills/${id}`, { method: "DELETE", token });
      setMessage("Skill removed.");
      setRefresh((prev) => prev + 1);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="page-stack">
      <section className="card">
        <div className="card-header">
          <div>
            <h2>Employee Management</h2>
            <p>A streamlined view for your workforce, departments, and skills.</p>
          </div>
          {user?.role === "ADMIN" && (
            <Link to="/employees/new" className="button-link">
              Add Employee
            </Link>
          )}
        </div>
        {message && <p className="form-success">{message}</p>}
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
      </section>

      {user?.role === "ADMIN" && (
        <div className="master-grid">
          <section className="card">
            <div className="card-header">
              <h3>Department Master</h3>
            </div>
            <form onSubmit={handleDepartmentSubmit} className="form-grid compact-form">
              <label>
                Department name
                <input value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} required />
              </label>
              <button type="submit">{editingDepartmentId ? "Update" : "Create"}</button>
            </form>
            <ul className="pill-list">
              {departments.map((department) => (
                <li key={department.id}>
                  <span>{department.name}</span>
                  <div className="action-row">
                    <button type="button" className="button-link small" onClick={() => { setDepartmentName(department.name); setEditingDepartmentId(department.id); }}>
                      Edit
                    </button>
                    <button type="button" className="button-link small danger" onClick={() => handleDeleteDepartment(department.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <div className="card-header">
              <h3>Skill Master</h3>
            </div>
            <form onSubmit={handleSkillSubmit} className="form-grid compact-form">
              <label>
                Skill name
                <input value={skillName} onChange={(event) => setSkillName(event.target.value)} required />
              </label>
              <button type="submit">{editingSkillId ? "Update" : "Create"}</button>
            </form>
            <ul className="pill-list">
              {skills.map((skill) => (
                <li key={skill.id}>
                  <span>{skill.name}</span>
                  <div className="action-row">
                    <button type="button" className="button-link small" onClick={() => { setSkillName(skill.name); setEditingSkillId(skill.id); }}>
                      Edit
                    </button>
                    <button type="button" className="button-link small danger" onClick={() => handleDeleteSkill(skill.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <section className="card">
        <div className="card-header">
          <h3>Employee Directory</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Skills</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7}>No employees found.</td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.id}</td>
                    <td>
                      {employee.profileImage ? (
                        <img src={resolveFileUrl(employee.profileImage) ?? ""} alt="profile" className="avatar" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{employee.firstName} {employee.lastName}</td>
                    <td>{employee.email}</td>
                    <td>{employee.department?.name ?? "Unassigned"}</td>
                    <td>{employee.skills.map((item) => item.skill.name).join(", ")}</td>
                    <td>
                      {user?.role === "ADMIN" && (
                        <div className="action-row">
                          <Link to={`/employees/${employee.id}/edit`} className="button-link small">
                            Edit
                          </Link>
                          <button type="button" className="button-link small danger" onClick={() => handleDelete(employee.id)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default EmployeeList;
