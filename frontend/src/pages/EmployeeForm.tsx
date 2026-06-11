import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { apiRequest, API_URL } from "../services/api";

interface Department { id: number; name: string; }
interface Skill { id: number; name: string; }
interface EmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId?: number | null;
  skillIds: number[];
  profileImage?: string | null;
  resumeFile?: string | null;
  documents: string[];
}

const resolveFileUrl = (value?: string | null) => {
  if (!value) return null;
  return value.startsWith("http") ? value : `${API_URL}${value}`;
};

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [employee, setEmployee] = useState<EmployeePayload>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    departmentId: null,
    skillIds: [],
    profileImage: null,
    resumeFile: null,
    documents: [],
  });
  const [selectedProfile, setSelectedProfile] = useState<File | null>(null);
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<FileList | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiRequest("/api/departments", { token })
      .then((data) => setDepartments(data.departments))
      .catch((err) => setError((err as Error).message));
    apiRequest("/api/skills", { token })
      .then((data) => setSkills(data.skills))
      .catch((err) => setError((err as Error).message));
  }, [token]);

  useEffect(() => {
    if (!token || !id) return;
    apiRequest(`/api/employees/${id}`, { token })
      .then((data) => {
        const employeeData = data.employee;
        setEmployee({
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          phone: employeeData.phone,
          departmentId: employeeData.department?.id ?? null,
          skillIds: employeeData.skills.map((item: any) => item.skill.id),
          profileImage: employeeData.profileImage ?? null,
          resumeFile: employeeData.resumeFile ?? null,
          documents: Array.isArray(employeeData.documents)
            ? employeeData.documents.map((doc: any) => doc.filePath)
            : [],
        });
      })
      .catch((err) => setError((err as Error).message));
  }, [token, id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const formData = new FormData();
    formData.append("firstName", employee.firstName);
    formData.append("lastName", employee.lastName);
    formData.append("email", employee.email);
    formData.append("phone", employee.phone);
    if (employee.departmentId) formData.append("departmentId", String(employee.departmentId));
    employee.skillIds.forEach((skillId) => formData.append("skillIds", String(skillId)));
    if (selectedProfile) formData.append("profileImage", selectedProfile);
    if (selectedResume) formData.append("resumeFile", selectedResume);
    if (selectedDocuments) {
      Array.from(selectedDocuments).forEach((file) => formData.append("documents", file));
    }

    try {
      if (id) {
        await apiRequest(`/api/employees/${id}`, { method: "PATCH", body: formData, token });
        setMessage("Employee updated successfully.");
      } else {
        await apiRequest("/api/employees", { method: "POST", body: formData, token });
        setMessage("Employee created successfully.");
      }
      navigate("/employees");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSkillChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions, (option) => Number(option.value));
    setEmployee((prev) => ({ ...prev, skillIds: selected }));
  };

  return (
    <div className="card auth-card">
      <div className="card-header">
        <div>
          <h2>{id ? "Edit Employee" : "New Employee"}</h2>
          <p>Manage employee profile, documents, and skills.</p>
        </div>
        <Link to="/employees" className="button-link">Back to list</Link>
      </div>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          First Name
          <input value={employee.firstName} onChange={(e) => setEmployee((prev) => ({ ...prev, firstName: e.target.value }))} required />
        </label>

        <label>
          Last Name
          <input value={employee.lastName} onChange={(e) => setEmployee((prev) => ({ ...prev, lastName: e.target.value }))} required />
        </label>

        <label>
          Email
          <input type="email" value={employee.email} onChange={(e) => setEmployee((prev) => ({ ...prev, email: e.target.value }))} required />
        </label>

        <label>
          Phone
          <input value={employee.phone} onChange={(e) => setEmployee((prev) => ({ ...prev, phone: e.target.value }))} required />
        </label>

        <label>
          Department
          <select value={employee.departmentId ?? ""} onChange={(e) => setEmployee((prev) => ({ ...prev, departmentId: e.target.value ? Number(e.target.value) : null }))}>
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </label>

        <label>
          Skills
          <select multiple value={employee.skillIds.map(String)} onChange={handleSkillChange}>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>{skill.name}</option>
            ))}
          </select>
        </label>

        <label>
          Profile Image
          <input type="file" accept="image/*" onChange={(e) => setSelectedProfile(e.target.files?.[0] ?? null)} />
          {employee.profileImage && !selectedProfile && (
            <p><a href={resolveFileUrl(employee.profileImage) ?? "#"} target="_blank" rel="noreferrer">Existing profile image</a></p>
          )}
        </label>

        <label>
          Resume
          <input type="file" accept="application/pdf,application/msword" onChange={(e) => setSelectedResume(e.target.files?.[0] ?? null)} />
          {employee.resumeFile && !selectedResume && (
            <p><a href={resolveFileUrl(employee.resumeFile) ?? "#"} target="_blank" rel="noreferrer">Existing resume</a></p>
          )}
        </label>

        <label>
          Documents
          <input type="file" multiple onChange={(e) => setSelectedDocuments(e.target.files)} />
          {Array.isArray(employee.documents) && employee.documents.length > 0 && !selectedDocuments && (
            <div className="document-list">
              {employee.documents.map((doc, index) => (
                <p key={index}><a href={resolveFileUrl(doc) ?? "#"} target="_blank" rel="noreferrer">Document {index + 1}</a></p>
              ))}
            </div>
          )}
        </label>

        <button type="submit">{id ? "Update Employee" : "Create Employee"}</button>
      </form>
      {message && <p className="form-success">{message}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default EmployeeForm;
