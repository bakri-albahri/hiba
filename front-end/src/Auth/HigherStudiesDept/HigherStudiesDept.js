import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/axios";

const FALLBACK = "Not available";

const higherStudiesPermissions = [
  "view postgraduate students",
  "create postgraduate students",
  "update postgraduate students",
  "manage postgraduate schedules",
  "send student notifications",
];

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "Postgraduate Students" },
  { id: "create", label: "Add Student" },
  { id: "schedules", label: "Class Schedules" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
];

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const emptyStudentForm = {
  full_name: "",
  father_name: "",
  mother_name: "",
  birth_date: "",
  birth_place: "",
  central_registry: "",
  national_id: "",
  nationality: "",
  gender: "",
  mobile: "",
  address: "",
  email: "",
  password: "",
  program_id: "",
  specialization_id: "",
  academic_year_id: "",
  study_year_id: "",
  enrollment_date: "",
  registration_status: "pending",
  tuition_paid: false,
  notes: "",
};

const emptyEditForm = {
  full_name: "",
  father_name: "",
  mother_name: "",
  birth_date: "",
  birth_place: "",
  central_registry: "",
  national_id: "",
  nationality: "",
  gender: "",
  mobile: "",
  address: "",
  program_id: "",
  specialization_id: "",
  enrollment_date: "",
  notes: "",
};

const emptyScheduleForm = {
  program_id: "",
  study_year_id: "",
  specialization_id: "",
  semester_number: "1",
  name: "",
  is_active: true,
  notes: "",
};

const emptyItemForm = {
  schedule_id: "",
  course_id: "",
  day_of_week: "Sunday",
  start_time: "09:00",
  end_time: "10:30",
  hall: "",
};

const emptyNotificationForm = {
  student_id: "",
  type: "general_notice",
  title: "",
  message: "",
  send_all: false,
};

const emptyPasswordForm = {
  current_password: "",
  new_password: "",
  new_password_confirmation: "",
};

function normalizeCollection(payload, key) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (key && Array.isArray(payload[key])) return payload[key];
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && key && Array.isArray(payload.data[key])) return payload.data[key];
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
}

function extractApiMessage(error) {
  if (!error) return "Request failed.";
  if (error.response?.status === 401) return "Session expired. Please login again.";
  if (error.response?.status === 403) return "This action is blocked by backend permissions.";
  if (error.response?.status === 404) return "Endpoint or record was not found.";
  if (error.response?.data?.errors) {
    const firstKey = Object.keys(error.response.data.errors)[0];
    const firstError = error.response.data.errors[firstKey]?.[0];
    if (firstError) return firstError;
  }
  return error.response?.data?.message || error.response?.data?.error || error.message || "Request failed.";
}

function toNullable(value) {
  return value === "" || value === undefined ? null : value;
}

function toBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return FALLBACK;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

function formatDate(value) {
  if (!value) return FALLBACK;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return value;
  }
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function isPostgraduateProgram(program) {
  const level = normalizeText(program?.level);
  const name = normalizeText(program?.name);
  const text = `${level} ${name}`;

  if (!program) return false;
  if (text.includes("bachelor") || text.includes("undergraduate") || text.includes("بكالور") || text.includes("إجازة") || text.includes("اجازة")) return false;

  return (
    text.includes("master") ||
    text.includes("mba") ||
    text.includes("postgraduate") ||
    text.includes("phd") ||
    text.includes("doctorate") ||
    text.includes("doctoral") ||
    text.includes("ماجستير") ||
    text.includes("دكتور") ||
    text.includes("دراسات عليا")
  );
}

function studentName(student) {
  return student?.user?.full_name || student?.full_name || FALLBACK;
}

function studentEmail(student) {
  return student?.user?.email || student?.email || FALLBACK;
}

function studentMobile(student) {
  return student?.user?.mobile || student?.mobile || FALLBACK;
}

function studentAddress(student) {
  return student?.user?.address || student?.address || FALLBACK;
}

function getCurrentRecord(student) {
  if (student?.current_academic_record) return student.current_academic_record;
  if (student?.currentAcademicRecord) return student.currentAcademicRecord;
  const records = student?.academic_records || student?.academicRecords || [];
  if (!Array.isArray(records) || records.length === 0) return null;
  return [...records].sort((a, b) => (b.academic_year_id || 0) - (a.academic_year_id || 0) || (b.id || 0) - (a.id || 0))[0];
}

function getStudentProgram(student) {
  const record = getCurrentRecord(student);
  return record?.program || student?.program || null;
}

function getStudentStudyYear(student) {
  const record = getCurrentRecord(student);
  return record?.study_year || student?.study_year || null;
}

function getStudentSpecialization(student) {
  const record = getCurrentRecord(student);
  return record?.specialization || student?.specialization || null;
}

function getStudentAcademicYear(student) {
  const record = getCurrentRecord(student);
  return record?.academic_year || student?.academic_year || null;
}

function isPostgraduateStudent(student, programs) {
  const program = getStudentProgram(student);
  if (program && isPostgraduateProgram(program)) return true;

  const programId = getCurrentRecord(student)?.program_id || student?.program_id;
  if (programId) {
    const lookupProgram = programs.find((item) => String(item.id) === String(programId));
    if (lookupProgram) return isPostgraduateProgram(lookupProgram);
  }

  const levelText = normalizeText(student?.level || student?.student_type || student?.program_level || student?.type);
  if (levelText.includes("postgraduate") || levelText.includes("master") || levelText.includes("phd") || levelText.includes("ماجستير") || levelText.includes("دكتور")) return true;

  return !programId && !program;
}

function StatusBadge({ value }) {
  const raw = String(value ?? "unknown").toLowerCase();
  const type = raw.includes("active") || raw.includes("registered") || raw.includes("paid") || raw === "true" || raw.includes("passed")
    ? "success"
    : raw.includes("stop") || raw.includes("not") || raw.includes("failed") || raw.includes("false") || raw.includes("exhausted")
      ? "danger"
      : "warning";
  return <span className={`hsdp-badge ${type}`}>{formatValue(value)}</span>;
}

function EmptyState({ title, text }) {
  return (
    <div className="hsdp-empty">
      <div className="hsdp-empty-icon">i</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ErrorNote({ message }) {
  if (!message) return null;
  return <div className="hsdp-error-note">{message}</div>;
}

function InfoItem({ label, value, wide = false }) {
  return (
    <div className={`hsdp-info-item ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{formatValue(value)}</strong>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder = "Select", disabled = false, allowEmpty = true }) {
  return (
    <label className="hsdp-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {allowEmpty && <option value="">{placeholder}</option>}
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name || item.full_name || item.code || `#${item.id}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, type = "text", placeholder = "", disabled = false }) {
  return (
    <label className="hsdp-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="hsdp-field wide">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows="3" />
    </label>
  );
}

function getInitials(name) {
  const words = String(name || "HS").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "HS";
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

export default function HigherStudiesDept() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lookupError, setLookupError] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [studyYears, setStudyYears] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [studentSearch, setStudentSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState({ summary: null, record: null, grades: [], attendance: [], carried: [] });
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [statusForm, setStatusForm] = useState({ is_active_registration: true, reason: "" });

  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [editingItemId, setEditingItemId] = useState(null);
  const [notificationForm, setNotificationForm] = useState(emptyNotificationForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);

  const postgraduatePrograms = useMemo(() => programs.filter(isPostgraduateProgram), [programs]);

  const currentDepartment = currentUser?.employee?.department || currentUser?.doctor?.department || null;
  const currentEmployee = currentUser?.employee || currentUser?.doctor || null;
  const currentName = currentUser?.full_name || currentUser?.name || "Higher Studies Officer";

  const filteredStudents = useMemo(() => {
    const query = normalizeText(studentSearch);
    return students
      .filter((student) => isPostgraduateStudent(student, programs))
      .filter((student) => {
        const record = getCurrentRecord(student);
        const programId = record?.program_id || student?.program_id || getStudentProgram(student)?.id;
        if (programFilter && String(programId) !== String(programFilter)) return false;

        if (statusFilter !== "all") {
          const active = Boolean(student?.is_active_registration ?? record?.is_active_registration ?? student?.is_active);
          if (statusFilter === "active" && !active) return false;
          if (statusFilter === "inactive" && active) return false;
        }

        if (!query) return true;
        const haystack = [
          studentName(student),
          studentEmail(student),
          student?.student_number,
          studentMobile(student),
          getStudentProgram(student)?.name,
          getStudentSpecialization(student)?.name,
        ].map(normalizeText).join(" ");
        return haystack.includes(query);
      });
  }, [students, programs, studentSearch, programFilter, statusFilter]);

  const postgraduateSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const program = schedule?.program || programs.find((item) => String(item.id) === String(schedule?.program_id));
      if (program) return isPostgraduateProgram(program);
      return true;
    });
  }, [schedules, programs]);

  const stats = useMemo(() => {
    const activeCount = filteredStudents.filter((student) => Boolean(student?.is_active_registration ?? getCurrentRecord(student)?.is_active_registration ?? student?.is_active)).length;
    return {
      students: filteredStudents.length,
      active: activeCount,
      inactive: Math.max(filteredStudents.length - activeCount, 0),
      programs: postgraduatePrograms.length,
      schedules: postgraduateSchedules.length,
      notifications: notifications.filter((n) => !n.is_read).length,
    };
  }, [filteredStudents, postgraduatePrograms, postgraduateSchedules, notifications]);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function loadAll() {
    setLoading(true);
    clearMessages();
    setLookupError("");
    try {
      const me = await api.get("/me");
      const user = me.data.user || me.data || null;
      const perms = me.data.permissions || user?.permissions || [];
      setCurrentUser(user);
      setPermissions(perms);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("permissions", JSON.stringify(perms));

      const lookupResults = await Promise.allSettled([
        api.get("/programs"),
        api.get("/specializations"),
        api.get("/study-years"),
        api.get("/academic-years"),
        api.get("/courses"),
      ]);

      const [programRes, specializationRes, studyYearRes, academicYearRes, courseRes] = lookupResults;
      setPrograms(programRes.status === "fulfilled" ? normalizeCollection(programRes.value.data, "programs") : []);
      setSpecializations(specializationRes.status === "fulfilled" ? normalizeCollection(specializationRes.value.data, "specializations") : []);
      setStudyYears(studyYearRes.status === "fulfilled" ? normalizeCollection(studyYearRes.value.data, "study_years") : []);
      setAcademicYears(academicYearRes.status === "fulfilled" ? normalizeCollection(academicYearRes.value.data, "academic_years") : []);
      setCourses(courseRes.status === "fulfilled" ? normalizeCollection(courseRes.value.data, "courses") : []);

      const failedLookup = lookupResults.find((result) => result.status === "rejected");
      if (failedLookup) setLookupError(extractApiMessage(failedLookup.reason));

      await Promise.all([loadStudents(), loadSchedules(), loadNotifications()]);
    } catch (err) {
      setError(extractApiMessage(err));
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents() {
    const response = await api.get("/students");
    setStudents(normalizeCollection(response.data, "students"));
  }

  async function loadSchedules() {
    try {
      const response = await api.get("/class-schedules");
      setSchedules(normalizeCollection(response.data, "class_schedules"));
    } catch (err) {
      console.log(err.response || err);
      setSchedules([]);
    }
  }

  async function loadNotifications() {
    try {
      const response = await api.get("/notifications/me");
      setNotifications(normalizeCollection(response.data, "notifications"));
    } catch (err) {
      console.log(err.response || err);
      setNotifications([]);
    }
  }

  async function loadStudentDetails(student) {
    if (!student?.id) return;
    setSelectedStudent(student);
    setDetailLoading(true);
    clearMessages();

    const record = getCurrentRecord(student);
    setEditForm({
      full_name: student?.user?.full_name || student?.full_name || "",
      father_name: student?.user?.father_name || student?.father_name || "",
      mother_name: student?.user?.mother_name || student?.mother_name || "",
      birth_date: student?.user?.birth_date || student?.birth_date || "",
      birth_place: student?.user?.birth_place || student?.birth_place || "",
      central_registry: student?.user?.central_registry || student?.central_registry || "",
      national_id: student?.user?.national_id || student?.national_id || "",
      nationality: student?.user?.nationality || student?.nationality || "",
      gender: student?.user?.gender || student?.gender || "",
      mobile: student?.user?.mobile || student?.mobile || "",
      address: student?.user?.address || student?.address || "",
      program_id: record?.program_id || student?.program_id || "",
      specialization_id: record?.specialization_id || student?.specialization_id || "",
      enrollment_date: student?.enrollment_date || "",
      notes: student?.notes || "",
    });
    setStatusForm({
      is_active_registration: Boolean(student?.is_active_registration ?? record?.is_active_registration ?? student?.is_active ?? true),
      reason: "",
    });

    const requests = await Promise.allSettled([
      api.get(`/students/${student.id}/current-academic-record`),
      api.get(`/students/${student.id}/academic-summary`),
      api.get(`/students/${student.id}/grades`),
      api.get(`/students/${student.id}/attendance`),
      api.get(`/students/${student.id}/carried-courses`),
    ]);

    setStudentDetails({
      record: requests[0].status === "fulfilled" ? (requests[0].value.data.record || requests[0].value.data.current_academic_record || requests[0].value.data.data || requests[0].value.data) : null,
      summary: requests[1].status === "fulfilled" ? (requests[1].value.data.summary || requests[1].value.data.data || requests[1].value.data) : null,
      grades: requests[2].status === "fulfilled" ? normalizeCollection(requests[2].value.data, "grades") : [],
      attendance: requests[3].status === "fulfilled" ? normalizeCollection(requests[3].value.data, "attendance") : [],
      carried: requests[4].status === "fulfilled" ? normalizeCollection(requests[4].value.data, "carried_courses") : [],
    });
    setDetailLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    try {
      await api.post("/logout");
    } catch (err) {
      console.log(err.response || err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      navigate("/login");
    }
  }

  function setFormValue(setter, key, value) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  function buildStudentBody(form, includeCredentials = true) {
    const body = {
      full_name: form.full_name,
      father_name: form.father_name,
      mother_name: form.mother_name,
      birth_date: toNullable(form.birth_date),
      birth_place: form.birth_place,
      central_registry: form.central_registry,
      national_id: form.national_id,
      nationality: form.nationality,
      gender: toNullable(form.gender),
      mobile: form.mobile,
      address: form.address,
      program_id: Number(form.program_id),
      specialization_id: toNullable(form.specialization_id),
      academic_year_id: Number(form.academic_year_id),
      study_year_id: Number(form.study_year_id),
      enrollment_date: toNullable(form.enrollment_date),
      registration_status: form.registration_status,
      tuition_paid: toBoolean(form.tuition_paid),
      notes: form.notes,
    };

    if (body.specialization_id) body.specialization_id = Number(body.specialization_id);
    if (includeCredentials) {
      body.email = form.email;
      body.password = form.password;
    }
    return body;
  }

  async function createStudent(e) {
    e.preventDefault();
    clearMessages();
    setActionLoading(true);
    try {
      await api.post("/students", buildStudentBody(studentForm, true));
      setSuccess("Postgraduate student was created successfully.");
      setStudentForm(emptyStudentForm);
      await loadStudents();
      setActiveTab("students");
    } catch (err) {
      setError(extractApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function updateSelectedStudent(e) {
    e.preventDefault();
    if (!selectedStudent?.id) return;
    clearMessages();
    setActionLoading(true);
    try {
      const body = {
        full_name: editForm.full_name,
        father_name: editForm.father_name,
        mother_name: editForm.mother_name,
        birth_date: toNullable(editForm.birth_date),
        birth_place: editForm.birth_place,
        central_registry: editForm.central_registry,
        national_id: editForm.national_id,
        nationality: editForm.nationality,
        gender: toNullable(editForm.gender),
        mobile: editForm.mobile,
        address: editForm.address,
        program_id: toNullable(editForm.program_id) ? Number(editForm.program_id) : undefined,
        specialization_id: toNullable(editForm.specialization_id) ? Number(editForm.specialization_id) : null,
        enrollment_date: toNullable(editForm.enrollment_date),
        notes: editForm.notes,
      };
      await api.put(`/students/${selectedStudent.id}`, body);
      setSuccess("Student profile was updated successfully.");
      await loadStudents();
      const refreshed = students.find((student) => student.id === selectedStudent.id) || selectedStudent;
      await loadStudentDetails(refreshed);
    } catch (err) {
      setError(extractApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function changeRegistrationStatus() {
    if (!selectedStudent?.id) return;
    clearMessages();
    setActionLoading(true);
    try {
      await api.patch(`/students/${selectedStudent.id}/registration-status`, {
        is_active_registration: toBoolean(statusForm.is_active_registration),
        reason: statusForm.reason,
      });
      setSuccess("Registration status was updated successfully.");
      await loadStudents();
      await loadStudentDetails(selectedStudent);
    } catch (err) {
      setError(extractApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function autoEnrollSelectedStudent() {
    if (!selectedStudent?.id) return;
    const record = studentDetails.record || getCurrentRecord(selectedStudent);
    const academicYearId = record?.academic_year_id || selectedStudent?.academic_year_id;
    const studyYearId = record?.study_year_id || selectedStudent?.study_year_id;
    if (!academicYearId || !studyYearId) {
      setError("Academic year and study year are required for auto-enrollment.");
      return;
    }
    clearMessages();
    setActionLoading(true);
    try {
      await api.post(`/students/${selectedStudent.id}/auto-enroll`, {
        academic_year_id: Number(academicYearId),
        study_year_id: Number(studyYearId),
      });
      setSuccess("Student was auto-enrolled in the study plan courses.");
      await loadStudentDetails(selectedStudent);
    } catch (err) {
      setError(extractApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  function scheduleBody(form) {
    return {
      program_id: Number(form.program_id),
      study_year_id: Number(form.study_year_id),
      specialization_id: toNullable(form.specialization_id) ? Number(form.specialization_id) : null,
      semester_number: Number(form.semester_number),
      name: form.name,
      is_active: toBoolean(form.is_active),
      notes: form.notes,
    };
  }

  async function saveSchedule(e) {
    e.preventDefault();
    clearMessages();
    setActionLoading(true);
    try {
      if (editingScheduleId) {
        await api.put(`/class-schedules/${editingScheduleId}`, scheduleBody(scheduleForm));
        setSuccess("Class schedule was updated successfully.");
      } else {
        await api.post("/class-schedules", scheduleBody(scheduleForm));
        setSuccess("Class schedule was created successfully.");
      }
      setScheduleForm(emptyScheduleForm);
      setEditingScheduleId(null);
      await loadSchedules();
    } catch (err) {
      setError(extractApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  function startEditSchedule(schedule) {
    setEditingScheduleId(schedule.id);
    setScheduleForm({
      program_id: schedule.program_id || schedule.program?.id || "",
      study_year_id: schedule.study_year_id || schedule.study_year?.id || "",
      specialization_id: schedule.specialization_id || schedule.specialization?.id || "",
      semester_number: String(schedule.semester_number || 1),
      name: schedule.name || "",
      is_active: Boolean(schedule.is_active ?? true),
      notes: schedule.notes || "",
    });
    setActiveTab("schedules");
  }

  function itemBody(form) {
    return {
      course_id: Number(form.course_id),
      day_of_week: form.day_of_week,
      start_time: form.start_time?.length === 5 ? `${form.start_time}:00` : form.start_time,
      end_time: form.end_time?.length === 5 ? `${form.end_time}:00` : form.end_time,
      hall: form.hall,
    };
  }

  async function saveScheduleItem(e) {
    e.preventDefault();
    clearMessages();
    setActionLoading(true);
    try {
      if (editingItemId) {
        await api.put(`/class-schedule-items/${editingItemId}`, itemBody(itemForm));
        setSuccess("Lecture item was updated successfully.");
      } else {
        await api.post(`/class-schedules/${itemForm.schedule_id}/items`, itemBody(itemForm));
        setSuccess("Lecture item was added successfully.");
      }
      setItemForm(emptyItemForm);
      setEditingItemId(null);
      await loadSchedules();
    } catch (err) {
      setError(extractApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  function startEditItem(schedule, item) {
    setEditingItemId(item.id);
    setItemForm({
      schedule_id: schedule.id,
      course_id: item.course_id || item.course?.id || "",
      day_of_week: item.day_of_week || "Sunday",
      start_time: String(item.start_time || "09:00").slice(0, 5),
      end_time: String(item.end_time || "10:30").slice(0, 5),
      hall: item.hall || "",
    });
    setActiveTab("schedules");
  }

  async function deleteScheduleItem(itemId) {
    if (!window.confirm("Delete this lecture item?")) return;
    clearMessages();
    setActionLoading(true);
    try {
      await api.delete(`/class-schedule-items/${itemId}`);
      setSuccess("Lecture item was deleted successfully.");
      await loadSchedules();
    } catch (err) {
      setError(extractApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function sendNotification(e) {
    e.preventDefault();
    clearMessages();
    setActionLoading(true);
    try {
      if (notificationForm.send_all) {
        await api.post("/notifications/students/send-all", {
          type: notificationForm.type,
          title: notificationForm.title,
          message: notificationForm.message,
        });
      } else {
        await api.post("/notifications/students/send", {
          student_id: Number(notificationForm.student_id),
          type: notificationForm.type,
          title: notificationForm.title,
          message: notificationForm.message,
        });
      }
      setSuccess("Notification was sent successfully.");
      setNotificationForm(emptyNotificationForm);
      await loadNotifications();
    } catch (err) {
      setError(extractApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function markNotificationRead(notificationId) {
    try {
      await api.patch(`/notifications/${notificationId}/read`, { is_read: true });
      await loadNotifications();
    } catch (err) {
      setError(extractApiMessage(err));
    }
  }

  async function markAllNotificationsRead() {
    try {
      await api.patch("/notifications/read-all");
      await loadNotifications();
    } catch (err) {
      setError(extractApiMessage(err));
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    clearMessages();
    setActionLoading(true);
    try {
      await api.post("/account/change-my-password", passwordForm);
      setPasswordForm(emptyPasswordForm);
      setSuccess("Password was changed successfully.");
    } catch (err) {
      setError(extractApiMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="hsdp-page">
        <style>{styles}</style>
        <div className="hsdp-loader-card">
          <div className="hsdp-spinner" />
          <h2>Loading Higher Studies Department</h2>
          <p>Please wait while the portal loads students, schedules, and academic references.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="hsdp-page">
      <style>{styles}</style>

      <header className="hsdp-header">
        <div className="hsdp-header-left">
          <div className="hsdp-logo">HS</div>
          <div>
            <span className="hsdp-kicker">Higher Studies Workspace</span>
            <h1>Welcome, {currentName}</h1>
            <p>Manage postgraduate students, master/doctorate records, and postgraduate class schedules.</p>
          </div>
        </div>
        <div className="hsdp-header-actions">
          <button className="hsdp-btn ghost" onClick={loadAll}>Refresh</button>
          <button className="hsdp-btn ghost" onClick={logout}>Logout</button>
        </div>
      </header>

      {success && <div className="hsdp-alert success">{success}</div>}
      {error && <div className="hsdp-alert danger">{error}</div>}
      {lookupError && <div className="hsdp-warning-box">Some lookup lists could not be loaded: {lookupError}</div>}

      <section className="hsdp-hero-grid">
        <div className="hsdp-profile-card">
          <div className="hsdp-avatar">{getInitials(currentName)}</div>
          <div>
            <span className="hsdp-section-kicker">Department Account</span>
            <h2>{currentName}</h2>
            <p>{currentDepartment?.name || "Higher Studies Department"}</p>
            <small>{currentEmployee?.job_title || currentUser?.type || "Administrative Staff"}</small>
          </div>
        </div>
        <Metric label="Postgraduate Students" value={stats.students} text="Master and doctorate scope" />
        <Metric label="Active Records" value={stats.active} text="Currently active" />
        <Metric label="Inactive Records" value={stats.inactive} text="Stopped or pending" />
        <Metric label="Programs" value={stats.programs} text="Postgraduate programs" />
        <Metric label="Schedules" value={stats.schedules} text="Class schedules" />
        <Metric label="Notifications" value={stats.notifications} text="Unread notices" />
      </section>

      <nav className="hsdp-tabs">
        {tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
      </nav>

      {activeTab === "overview" && renderOverview()}
      {activeTab === "students" && renderStudents()}
      {activeTab === "create" && renderCreateStudent()}
      {activeTab === "schedules" && renderSchedules()}
      {activeTab === "notifications" && renderNotifications()}
      {activeTab === "account" && renderAccount()}
    </main>
  );

  function renderOverview() {
    return (
      <section className="hsdp-content-grid">
        <div className="hsdp-card">
          <div className="hsdp-card-title-row">
            <div>
              <span className="hsdp-section-kicker">Department Scope</span>
              <h2>What this page controls</h2>
            </div>
          </div>
          <div className="hsdp-scope-list">
            <ScopeItem title="Postgraduate students" text="Create, review, update, and follow students registered under master or doctorate programmes." />
            <ScopeItem title="Academic records" text="Open student academic summary, current record, grades, attendance, and carried courses without editing grades." />
            <ScopeItem title="Class schedules" text="Create and update postgraduate weekly schedules, then add lectures with day, time, course, and hall." />
            <ScopeItem title="Notifications" text="Send notices to a postgraduate student or to all students when the permission is available." />
          </div>
        </div>

        <div className="hsdp-card">
          <div className="hsdp-card-title-row">
            <div>
              <span className="hsdp-section-kicker">Permissions</span>
              <h2>Higher studies access</h2>
            </div>
          </div>
          <div className="hsdp-pill-list">
            {higherStudiesPermissions.map((permission) => (
              <span key={permission} className={`hsdp-permission-pill ${permissions.includes(permission) ? "enabled" : "disabled"}`}>{permission}</span>
            ))}
          </div>
        </div>

        <div className="hsdp-card wide-card">
          <div className="hsdp-card-title-row">
            <div>
              <span className="hsdp-section-kicker">Postgraduate Programs</span>
              <h2>Available programmes</h2>
            </div>
          </div>
          {postgraduatePrograms.length === 0 ? <EmptyState title="No postgraduate programmes detected" text="The list is empty or the user does not have permission to read programmes." /> : (
            <div className="hsdp-table-wrap">
              <table className="hsdp-table">
                <thead><tr><th>Name</th><th>Level</th><th>Total Years</th><th>Status</th></tr></thead>
                <tbody>{postgraduatePrograms.map((program) => <tr key={program.id}><td>{program.name}</td><td>{formatValue(program.level)}</td><td>{formatValue(program.total_years)}</td><td><StatusBadge value={program.is_active ?? true} /></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderStudents() {
    return (
      <section className="hsdp-content-grid student-grid">
        <div className="hsdp-card">
          <div className="hsdp-card-title-row">
            <div>
              <span className="hsdp-section-kicker">Students</span>
              <h2>Postgraduate records</h2>
            </div>
            <button className="hsdp-btn primary small" onClick={() => setActiveTab("create")}>Add Student</button>
          </div>

          <div className="hsdp-filter-row">
            <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search name, email, number, specialization..." />
            <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
              <option value="">All programmes</option>
              {postgraduatePrograms.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active registration</option>
              <option value="inactive">Inactive registration</option>
            </select>
          </div>

          {filteredStudents.length === 0 ? <EmptyState title="No students" text="No postgraduate students match the current filters." /> : (
            <div className="hsdp-table-wrap compact-height">
              <table className="hsdp-table compact-table">
                <thead><tr><th>Student</th><th>Programme</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const record = getCurrentRecord(student);
                    const selected = selectedStudent?.id === student.id;
                    return (
                      <tr key={student.id} className={selected ? "selected" : ""}>
                        <td>
                          <strong>{studentName(student)}</strong>
                          <small>{student?.student_number || studentEmail(student)}</small>
                        </td>
                        <td>{getStudentProgram(student)?.name || FALLBACK}<small>{getStudentSpecialization(student)?.name || getStudentStudyYear(student)?.name || ""}</small></td>
                        <td><StatusBadge value={student?.is_active_registration ?? record?.is_active_registration ?? student?.is_active ?? "unknown"} /></td>
                        <td><button className="hsdp-btn small" onClick={() => loadStudentDetails(student)}>Open</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="hsdp-card">
          {!selectedStudent ? <EmptyState title="Select a student" text="Choose a postgraduate student to open profile, academic details, and editable fields." /> : renderStudentDetails()}
        </div>
      </section>
    );
  }

  function renderStudentDetails() {
    const record = studentDetails.record || getCurrentRecord(selectedStudent);
    return (
      <div>
        <div className="hsdp-student-header">
          <div>
            <span className="hsdp-section-kicker">Selected Student</span>
            <h2>{studentName(selectedStudent)}</h2>
            <p>{selectedStudent?.student_number || studentEmail(selectedStudent)}</p>
          </div>
          <div className="hsdp-inline-actions">
            <button className="hsdp-btn small" onClick={() => loadStudentDetails(selectedStudent)} disabled={detailLoading}>Reload</button>
            <button className="hsdp-btn secondary small" onClick={autoEnrollSelectedStudent} disabled={actionLoading}>Auto-enroll</button>
          </div>
        </div>

        {detailLoading ? <div className="hsdp-warning-box">Loading student details...</div> : null}

        <div className="hsdp-info-grid">
          <InfoItem label="Email" value={studentEmail(selectedStudent)} />
          <InfoItem label="Mobile" value={studentMobile(selectedStudent)} />
          <InfoItem label="Address" value={studentAddress(selectedStudent)} />
          <InfoItem label="Programme" value={record?.program?.name || getStudentProgram(selectedStudent)?.name} />
          <InfoItem label="Specialization" value={record?.specialization?.name || getStudentSpecialization(selectedStudent)?.name} />
          <InfoItem label="Academic Year" value={record?.academic_year?.name || getStudentAcademicYear(selectedStudent)?.name} />
          <InfoItem label="Study Year" value={record?.study_year?.name || getStudentStudyYear(selectedStudent)?.name} />
          <InfoItem label="Tuition Paid" value={record?.tuition_paid ?? selectedStudent?.tuition_paid} />
          <InfoItem label="Registration" value={record?.is_active_registration ?? selectedStudent?.is_active_registration ?? selectedStudent?.is_active} />
        </div>

        <details className="hsdp-details" open>
          <summary>Edit student information</summary>
          <form className="hsdp-form" onSubmit={updateSelectedStudent}>
            <TextField label="Full Name" value={editForm.full_name} onChange={(v) => setFormValue(setEditForm, "full_name", v)} />
            <TextField label="Father Name" value={editForm.father_name} onChange={(v) => setFormValue(setEditForm, "father_name", v)} />
            <TextField label="Mother Name" value={editForm.mother_name} onChange={(v) => setFormValue(setEditForm, "mother_name", v)} />
            <TextField label="Birth Date" type="date" value={editForm.birth_date} onChange={(v) => setFormValue(setEditForm, "birth_date", v)} />
            <TextField label="Birth Place" value={editForm.birth_place} onChange={(v) => setFormValue(setEditForm, "birth_place", v)} />
            <TextField label="National ID" value={editForm.national_id} onChange={(v) => setFormValue(setEditForm, "national_id", v)} />
            <TextField label="Central Registry" value={editForm.central_registry} onChange={(v) => setFormValue(setEditForm, "central_registry", v)} />
            <TextField label="Nationality" value={editForm.nationality} onChange={(v) => setFormValue(setEditForm, "nationality", v)} />
            <SelectField label="Gender" value={editForm.gender} onChange={(v) => setFormValue(setEditForm, "gender", v)} options={[{ id: "male", name: "Male" }, { id: "female", name: "Female" }]} />
            <TextField label="Mobile" value={editForm.mobile} onChange={(v) => setFormValue(setEditForm, "mobile", v)} />
            <TextField label="Address" value={editForm.address} onChange={(v) => setFormValue(setEditForm, "address", v)} />
            <TextField label="Enrollment Date" type="date" value={editForm.enrollment_date} onChange={(v) => setFormValue(setEditForm, "enrollment_date", v)} />
            <SelectField label="Programme" value={editForm.program_id} onChange={(v) => setFormValue(setEditForm, "program_id", v)} options={postgraduatePrograms} />
            <SelectField label="Specialization" value={editForm.specialization_id} onChange={(v) => setFormValue(setEditForm, "specialization_id", v)} options={specializations.filter((s) => !editForm.program_id || String(s.program_id) === String(editForm.program_id))} />
            <TextAreaField label="Notes" value={editForm.notes} onChange={(v) => setFormValue(setEditForm, "notes", v)} />
            <div className="hsdp-form-footer full">
              <span>Email and password are intentionally not editable from this page.</span>
              <button className="hsdp-btn primary" type="submit" disabled={actionLoading}>Save Student</button>
            </div>
          </form>
        </details>

        <details className="hsdp-details">
          <summary>Registration status</summary>
          <div className="hsdp-form single">
            <label className="hsdp-check-field">
              <input type="checkbox" checked={toBoolean(statusForm.is_active_registration)} onChange={(e) => setStatusForm((prev) => ({ ...prev, is_active_registration: e.target.checked }))} />
              <span>Active registration</span>
            </label>
            <TextAreaField label="Reason" value={statusForm.reason} onChange={(v) => setStatusForm((prev) => ({ ...prev, reason: v }))} />
            <div className="hsdp-form-footer full"><span>Use this for stopping or reactivating postgraduate registration.</span><button className="hsdp-btn secondary" onClick={changeRegistrationStatus} disabled={actionLoading}>Update Status</button></div>
          </div>
        </details>

        <details className="hsdp-details">
          <summary>Academic summary</summary>
          <StudentSummary summary={studentDetails.summary} />
          <h3 className="hsdp-mini-title">Grades</h3>
          <GradesTable rows={studentDetails.grades} />
          <h3 className="hsdp-mini-title">Attendance</h3>
          <AttendanceTable rows={studentDetails.attendance} />
          <h3 className="hsdp-mini-title">Carried Courses</h3>
          <CarriedCoursesTable rows={studentDetails.carried} />
        </details>
      </div>
    );
  }

  function renderCreateStudent() {
    return (
      <section className="hsdp-card">
        <div className="hsdp-card-title-row">
          <div>
            <span className="hsdp-section-kicker">Create Record</span>
            <h2>Add postgraduate student</h2>
          </div>
        </div>
        <ErrorNote message={postgraduatePrograms.length === 0 ? "No postgraduate programmes were detected. Check programme data or lookup permissions." : ""} />
        <form className="hsdp-form" onSubmit={createStudent}>
          <TextField label="Full Name" value={studentForm.full_name} onChange={(v) => setFormValue(setStudentForm, "full_name", v)} />
          <TextField label="Father Name" value={studentForm.father_name} onChange={(v) => setFormValue(setStudentForm, "father_name", v)} />
          <TextField label="Mother Name" value={studentForm.mother_name} onChange={(v) => setFormValue(setStudentForm, "mother_name", v)} />
          <TextField label="Birth Date" type="date" value={studentForm.birth_date} onChange={(v) => setFormValue(setStudentForm, "birth_date", v)} />
          <TextField label="Birth Place" value={studentForm.birth_place} onChange={(v) => setFormValue(setStudentForm, "birth_place", v)} />
          <TextField label="National ID" value={studentForm.national_id} onChange={(v) => setFormValue(setStudentForm, "national_id", v)} />
          <TextField label="Central Registry" value={studentForm.central_registry} onChange={(v) => setFormValue(setStudentForm, "central_registry", v)} />
          <TextField label="Nationality" value={studentForm.nationality} onChange={(v) => setFormValue(setStudentForm, "nationality", v)} />
          <SelectField label="Gender" value={studentForm.gender} onChange={(v) => setFormValue(setStudentForm, "gender", v)} options={[{ id: "male", name: "Male" }, { id: "female", name: "Female" }]} />
          <TextField label="Mobile" value={studentForm.mobile} onChange={(v) => setFormValue(setStudentForm, "mobile", v)} />
          <TextField label="Address" value={studentForm.address} onChange={(v) => setFormValue(setStudentForm, "address", v)} />
          <TextField label="Email" type="email" value={studentForm.email} onChange={(v) => setFormValue(setStudentForm, "email", v)} />
          <TextField label="Password" type="password" value={studentForm.password} onChange={(v) => setFormValue(setStudentForm, "password", v)} />
          <SelectField label="Programme" value={studentForm.program_id} onChange={(v) => setFormValue(setStudentForm, "program_id", v)} options={postgraduatePrograms} />
          <SelectField label="Specialization" value={studentForm.specialization_id} onChange={(v) => setFormValue(setStudentForm, "specialization_id", v)} options={specializations.filter((s) => !studentForm.program_id || String(s.program_id) === String(studentForm.program_id))} />
          <SelectField label="Academic Year" value={studentForm.academic_year_id} onChange={(v) => setFormValue(setStudentForm, "academic_year_id", v)} options={academicYears} />
          <SelectField label="Study Year" value={studentForm.study_year_id} onChange={(v) => setFormValue(setStudentForm, "study_year_id", v)} options={studyYears.filter((s) => !studentForm.program_id || String(s.program_id) === String(studentForm.program_id))} />
          <TextField label="Enrollment Date" type="date" value={studentForm.enrollment_date} onChange={(v) => setFormValue(setStudentForm, "enrollment_date", v)} />
          <SelectField label="Registration Status" value={studentForm.registration_status} onChange={(v) => setFormValue(setStudentForm, "registration_status", v)} options={[{ id: "pending", name: "Pending" }, { id: "active", name: "Active" }, { id: "stopped", name: "Stopped" }]} allowEmpty={false} />
          <label className="hsdp-check-field"><input type="checkbox" checked={toBoolean(studentForm.tuition_paid)} onChange={(e) => setFormValue(setStudentForm, "tuition_paid", e.target.checked)} /><span>Tuition paid</span></label>
          <TextAreaField label="Notes" value={studentForm.notes} onChange={(v) => setFormValue(setStudentForm, "notes", v)} />
          <div className="hsdp-form-footer full"><span>The university number should be generated automatically by the backend.</span><button className="hsdp-btn primary" type="submit" disabled={actionLoading}>Create Student</button></div>
        </form>
      </section>
    );
  }

  function renderSchedules() {
    return (
      <section className="hsdp-content-grid">
        <div className="hsdp-card">
          <div className="hsdp-card-title-row"><div><span className="hsdp-section-kicker">Schedules</span><h2>{editingScheduleId ? "Update class schedule" : "Create class schedule"}</h2></div>{editingScheduleId && <button className="hsdp-btn small" onClick={() => { setEditingScheduleId(null); setScheduleForm(emptyScheduleForm); }}>Cancel Edit</button>}</div>
          <form className="hsdp-form single" onSubmit={saveSchedule}>
            <SelectField label="Programme" value={scheduleForm.program_id} onChange={(v) => setFormValue(setScheduleForm, "program_id", v)} options={postgraduatePrograms} />
            <SelectField label="Study Year" value={scheduleForm.study_year_id} onChange={(v) => setFormValue(setScheduleForm, "study_year_id", v)} options={studyYears.filter((s) => !scheduleForm.program_id || String(s.program_id) === String(scheduleForm.program_id))} />
            <SelectField label="Specialization" value={scheduleForm.specialization_id} onChange={(v) => setFormValue(setScheduleForm, "specialization_id", v)} options={specializations.filter((s) => !scheduleForm.program_id || String(s.program_id) === String(scheduleForm.program_id))} />
            <SelectField label="Semester" value={scheduleForm.semester_number} onChange={(v) => setFormValue(setScheduleForm, "semester_number", v)} options={[{ id: "1", name: "Semester 1" }, { id: "2", name: "Semester 2" }]} allowEmpty={false} />
            <TextField label="Schedule Name" value={scheduleForm.name} onChange={(v) => setFormValue(setScheduleForm, "name", v)} />
            <label className="hsdp-check-field"><input type="checkbox" checked={toBoolean(scheduleForm.is_active)} onChange={(e) => setFormValue(setScheduleForm, "is_active", e.target.checked)} /><span>Active schedule</span></label>
            <TextAreaField label="Notes" value={scheduleForm.notes} onChange={(v) => setFormValue(setScheduleForm, "notes", v)} />
            <div className="hsdp-form-footer full"><span>Used for master and doctorate lecture planning.</span><button className="hsdp-btn primary" type="submit" disabled={actionLoading}>{editingScheduleId ? "Update Schedule" : "Create Schedule"}</button></div>
          </form>
        </div>

        <div className="hsdp-card">
          <div className="hsdp-card-title-row"><div><span className="hsdp-section-kicker">Lectures</span><h2>{editingItemId ? "Update lecture" : "Add lecture"}</h2></div>{editingItemId && <button className="hsdp-btn small" onClick={() => { setEditingItemId(null); setItemForm(emptyItemForm); }}>Cancel Edit</button>}</div>
          <form className="hsdp-form single" onSubmit={saveScheduleItem}>
            <SelectField label="Schedule" value={itemForm.schedule_id} onChange={(v) => setFormValue(setItemForm, "schedule_id", v)} options={postgraduateSchedules} />
            <SelectField label="Course" value={itemForm.course_id} onChange={(v) => setFormValue(setItemForm, "course_id", v)} options={courses} />
            <SelectField label="Day" value={itemForm.day_of_week} onChange={(v) => setFormValue(setItemForm, "day_of_week", v)} options={days.map((day) => ({ id: day, name: day }))} allowEmpty={false} />
            <TextField label="Start Time" type="time" value={itemForm.start_time} onChange={(v) => setFormValue(setItemForm, "start_time", v)} />
            <TextField label="End Time" type="time" value={itemForm.end_time} onChange={(v) => setFormValue(setItemForm, "end_time", v)} />
            <TextField label="Hall" value={itemForm.hall} onChange={(v) => setFormValue(setItemForm, "hall", v)} />
            <div className="hsdp-form-footer full"><span>Lecture times must match the university schedule.</span><button className="hsdp-btn secondary" type="submit" disabled={actionLoading}>{editingItemId ? "Update Lecture" : "Add Lecture"}</button></div>
          </form>
        </div>

        <div className="hsdp-card wide-card">
          <div className="hsdp-card-title-row"><div><span className="hsdp-section-kicker">Existing Schedules</span><h2>Postgraduate weekly schedules</h2></div></div>
          {postgraduateSchedules.length === 0 ? <EmptyState title="No schedules" text="No postgraduate schedules were found." /> : (
            <div className="hsdp-schedule-list">
              {postgraduateSchedules.map((schedule) => (
                <div className="hsdp-schedule-card" key={schedule.id}>
                  <div className="hsdp-schedule-head">
                    <div><h3>{schedule.name || `Schedule #${schedule.id}`}</h3><p>{schedule.program?.name || programs.find((p) => String(p.id) === String(schedule.program_id))?.name || FALLBACK} • Semester {schedule.semester_number || FALLBACK}</p></div>
                    <div className="hsdp-inline-actions"><StatusBadge value={schedule.is_active ?? true} /><button className="hsdp-btn small" onClick={() => startEditSchedule(schedule)}>Edit</button></div>
                  </div>
                  <ScheduleItemsTable schedule={schedule} onEdit={startEditItem} onDelete={deleteScheduleItem} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  function renderNotifications() {
    return (
      <section className="hsdp-content-grid">
        <div className="hsdp-card">
          <div className="hsdp-card-title-row"><div><span className="hsdp-section-kicker">Send Notice</span><h2>Student notifications</h2></div></div>
          <form className="hsdp-form single" onSubmit={sendNotification}>
            <label className="hsdp-check-field"><input type="checkbox" checked={notificationForm.send_all} onChange={(e) => setFormValue(setNotificationForm, "send_all", e.target.checked)} /><span>Send to all students</span></label>
            {!notificationForm.send_all && <SelectField label="Student" value={notificationForm.student_id} onChange={(v) => setFormValue(setNotificationForm, "student_id", v)} options={filteredStudents.map((student) => ({ id: student.id, name: `${studentName(student)}${student.student_number ? ` - ${student.student_number}` : ""}` }))} />}
            <SelectField label="Type" value={notificationForm.type} onChange={(v) => setFormValue(setNotificationForm, "type", v)} options={[{ id: "general_notice", name: "General Notice" }, { id: "schedule_notice", name: "Schedule Notice" }, { id: "registration_notice", name: "Registration Notice" }]} allowEmpty={false} />
            <TextField label="Title" value={notificationForm.title} onChange={(v) => setFormValue(setNotificationForm, "title", v)} />
            <TextAreaField label="Message" value={notificationForm.message} onChange={(v) => setFormValue(setNotificationForm, "message", v)} />
            <div className="hsdp-form-footer full"><span>Sending all notifications depends on backend permission.</span><button className="hsdp-btn primary" type="submit" disabled={actionLoading}>Send Notification</button></div>
          </form>
        </div>

        <div className="hsdp-card">
          <div className="hsdp-card-title-row"><div><span className="hsdp-section-kicker">Inbox</span><h2>My notifications</h2></div><button className="hsdp-btn small" onClick={markAllNotificationsRead}>Mark all read</button></div>
          {notifications.length === 0 ? <EmptyState title="No notifications" text="There are no notifications for this account." /> : <NotificationList rows={notifications} onRead={markNotificationRead} />}
        </div>
      </section>
    );
  }

  function renderAccount() {
    return (
      <section className="hsdp-content-grid">
        <div className="hsdp-card">
          <div className="hsdp-card-title-row"><div><span className="hsdp-section-kicker">Account</span><h2>Profile information</h2></div></div>
          <div className="hsdp-info-grid compact">
            <InfoItem label="Full Name" value={currentUser?.full_name} />
            <InfoItem label="Email" value={currentUser?.email} />
            <InfoItem label="Department" value={currentDepartment?.name} />
            <InfoItem label="Job Title" value={currentEmployee?.job_title} />
            <InfoItem label="Mobile" value={currentUser?.mobile} />
            <InfoItem label="Status" value={currentEmployee?.is_active ?? currentUser?.is_active} />
          </div>
        </div>
        <div className="hsdp-card">
          <div className="hsdp-card-title-row"><div><span className="hsdp-section-kicker">Security</span><h2>Change password</h2></div></div>
          <form className="hsdp-form single" onSubmit={changePassword}>
            <TextField label="Current Password" type="password" value={passwordForm.current_password} onChange={(v) => setFormValue(setPasswordForm, "current_password", v)} />
            <TextField label="New Password" type="password" value={passwordForm.new_password} onChange={(v) => setFormValue(setPasswordForm, "new_password", v)} />
            <TextField label="Confirm New Password" type="password" value={passwordForm.new_password_confirmation} onChange={(v) => setFormValue(setPasswordForm, "new_password_confirmation", v)} />
            <div className="hsdp-form-footer full"><span>Use a strong password and keep it private.</span><button className="hsdp-btn primary" type="submit" disabled={actionLoading}>Change Password</button></div>
          </form>
        </div>
      </section>
    );
  }
}

function Metric({ label, value, text }) {
  return <div className="hsdp-metric-card"><span>{label}</span><strong>{value}</strong><p>{text}</p></div>;
}

function ScopeItem({ title, text }) {
  return <div className="hsdp-scope-item"><strong>{title}</strong><p>{text}</p></div>;
}

function StudentSummary({ summary }) {
  if (!summary || Object.keys(summary).length === 0) return <EmptyState title="No summary" text="No academic summary was returned for this student." />;
  return (
    <div className="hsdp-info-grid compact">
      <InfoItem label="Annual Average" value={summary.annual_average || summary.average || summary.gpa} />
      <InfoItem label="Result" value={summary.result_status || summary.status} />
      <InfoItem label="Passed Courses" value={summary.passed_courses_count || summary.passed_courses} />
      <InfoItem label="Carried Courses" value={summary.carried_courses_count || summary.carried_courses} />
    </div>
  );
}

function GradesTable({ rows }) {
  if (!rows || rows.length === 0) return <EmptyState title="No grades" text="No grades were returned for this student." />;
  return (
    <div className="hsdp-table-wrap"><table className="hsdp-table compact-table"><thead><tr><th>Course</th><th>Coursework</th><th>Practical</th><th>Exam</th><th>Final</th><th>Status</th></tr></thead><tbody>{rows.map((row, index) => {
      const grade = row.grade || row;
      return <tr key={row.id || row.enrollment_id || index}><td>{row.course?.code || row.course_code} {row.course?.name || row.course_name || row.name}</td><td>{formatValue(grade.coursework_mark)}</td><td>{formatValue(grade.practical_mark)}</td><td>{formatValue(grade.exam_mark)}</td><td>{formatValue(grade.final_mark)}</td><td><StatusBadge value={grade.result_status || grade.status} /></td></tr>;
    })}</tbody></table></div>
  );
}

function AttendanceTable({ rows }) {
  if (!rows || rows.length === 0) return <EmptyState title="No attendance" text="No attendance records were returned for this student." />;
  return (
    <div className="hsdp-table-wrap"><table className="hsdp-table compact-table"><thead><tr><th>Course</th><th>Count</th><th>Recent Records</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.enrollment_id || row.id || index}><td>{row.course_name || row.course?.name || row.course_id}</td><td>{formatValue(row.attendance_count || row.count)}</td><td>{(row.records || []).slice(0, 5).map((r) => formatDate(r.attendance_date)).join(", ") || formatDate(row.attendance_date)}</td></tr>)}</tbody></table></div>
  );
}

function CarriedCoursesTable({ rows }) {
  if (!rows || rows.length === 0) return <EmptyState title="No carried courses" text="No carried courses were returned for this student." />;
  return (
    <div className="hsdp-table-wrap"><table className="hsdp-table compact-table"><thead><tr><th>Course</th><th>Study Year</th><th>Semester</th><th>Final</th><th>Status</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.enrollment_id || index}><td>{row.course_code} {row.course_name || row.course?.name}</td><td>{row.study_year || row.study_year_name}</td><td>{row.semester_number}</td><td>{row.grade?.final_mark || row.final_mark}</td><td><StatusBadge value={row.grade?.result_status || row.result_status} /></td></tr>)}</tbody></table></div>
  );
}

function ScheduleItemsTable({ schedule, onEdit, onDelete }) {
  const items = schedule.items || schedule.schedule_items || schedule.class_schedule_items || [];
  if (!Array.isArray(items) || items.length === 0) return <EmptyState title="No lectures" text="No lecture items were added to this schedule yet." />;
  return (
    <div className="hsdp-table-wrap"><table className="hsdp-table compact-table"><thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Hall</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.day_of_week}</td><td>{String(item.start_time || "").slice(0, 5)} - {String(item.end_time || "").slice(0, 5)}</td><td>{item.course?.code} {item.course?.name || item.course_name || item.course_id}</td><td>{formatValue(item.hall)}</td><td><div className="hsdp-inline-actions"><button className="hsdp-btn small" onClick={() => onEdit(schedule, item)}>Edit</button><button className="hsdp-btn danger small" onClick={() => onDelete(item.id)}>Delete</button></div></td></tr>)}</tbody></table></div>
  );
}

function NotificationList({ rows, onRead }) {
  return (
    <div className="hsdp-notification-list">
      {rows.map((notification) => (
        <article key={notification.id} className="hsdp-notification">
          <div><strong>{notification.title || notification.type || "Notification"}</strong><p>{notification.message || notification.body || FALLBACK}</p><small>{formatDate(notification.created_at)}</small></div>
          {!notification.is_read && <button className="hsdp-btn small" onClick={() => onRead(notification.id)}>Mark read</button>}
        </article>
      ))}
    </div>
  );
}

const styles = `
:root {
  --hsdp-main: #2980b9;
  --hsdp-main-dark: #1f6694;
  --hsdp-main-soft: rgba(41, 128, 185, 0.12);
  --hsdp-bg: #f5f8fb;
  --hsdp-card: #ffffff;
  --hsdp-text: #172033;
  --hsdp-muted: #64748b;
  --hsdp-border: #e2e8f0;
  --hsdp-danger: #dc2626;
  --hsdp-success: #16a34a;
  --hsdp-warning: #d97706;
}

.hsdp-page { min-height: 100vh; background: radial-gradient(circle at top left, rgba(41, 128, 185, 0.18), transparent 32%), var(--hsdp-bg); padding: 28px; color: var(--hsdp-text); font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.hsdp-header { display: flex; justify-content: space-between; gap: 24px; align-items: center; background: linear-gradient(135deg, #172033, #2980b9); color: #fff; padding: 26px; border-radius: 28px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18); }
.hsdp-header-left { display: flex; align-items: center; gap: 18px; }
.hsdp-logo { width: 64px; height: 64px; border-radius: 22px; background: rgba(255,255,255,.15); display: grid; place-items: center; font-weight: 900; font-size: 24px; }
.hsdp-kicker, .hsdp-section-kicker { text-transform: uppercase; letter-spacing: .08em; font-size: 12px; font-weight: 800; color: #8ec8ee; }
.hsdp-section-kicker { color: var(--hsdp-main); }
.hsdp-header h1 { margin: 4px 0 6px; font-size: 34px; }
.hsdp-header p { margin: 0; color: rgba(255,255,255,.82); }
.hsdp-header-actions, .hsdp-inline-actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.hsdp-hero-grid { display: grid; grid-template-columns: 1.6fr repeat(6, 1fr); gap: 16px; margin: 22px 0; }
.hsdp-profile-card, .hsdp-metric-card, .hsdp-card, .hsdp-loader-card { background: var(--hsdp-card); border: 1px solid var(--hsdp-border); border-radius: 24px; box-shadow: 0 14px 34px rgba(15, 23, 42, .08); }
.hsdp-profile-card { padding: 18px; display: flex; align-items: center; gap: 16px; }
.hsdp-avatar { width: 58px; height: 58px; border-radius: 20px; background: var(--hsdp-main-soft); color: var(--hsdp-main-dark); display: grid; place-items: center; font-size: 22px; font-weight: 900; }
.hsdp-profile-card h2 { margin: 3px 0; font-size: 20px; }
.hsdp-profile-card p, .hsdp-profile-card small { display: block; margin: 0; color: var(--hsdp-muted); }
.hsdp-metric-card { padding: 18px; }
.hsdp-metric-card span { color: var(--hsdp-muted); font-size: 13px; font-weight: 700; }
.hsdp-metric-card strong { display: block; font-size: 30px; margin: 8px 0 5px; }
.hsdp-metric-card p { margin: 0; color: var(--hsdp-muted); font-size: 13px; }
.hsdp-tabs { display: flex; gap: 10px; flex-wrap: wrap; margin: 16px 0 22px; }
.hsdp-tabs button { border: 1px solid var(--hsdp-border); background: #fff; color: var(--hsdp-muted); padding: 12px 16px; border-radius: 999px; cursor: pointer; font-weight: 800; }
.hsdp-tabs button.active { background: var(--hsdp-main); border-color: var(--hsdp-main); color: white; box-shadow: 0 10px 24px rgba(41,128,185,.28); }
.hsdp-content-grid { display: grid; grid-template-columns: minmax(320px, .85fr) minmax(440px, 1.5fr); gap: 18px; align-items: start; }
.hsdp-content-grid.student-grid { grid-template-columns: minmax(420px, .85fr) minmax(640px, 1.55fr); }
.hsdp-card { padding: 20px; }
.hsdp-card.wide-card { grid-column: 1 / -1; }
.hsdp-card-title-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 16px; }
.hsdp-card h2 { margin: 2px 0 0; font-size: 21px; }
.hsdp-btn { border: 0; border-radius: 14px; padding: 11px 16px; cursor: pointer; font-weight: 900; background: #eef2f7; color: var(--hsdp-text); transition: .18s ease; }
.hsdp-btn:hover { transform: translateY(-1px); }
.hsdp-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
.hsdp-btn.primary { background: var(--hsdp-main); color: white; }
.hsdp-btn.secondary { background: #172033; color: white; }
.hsdp-btn.ghost { background: rgba(255,255,255,.14); color: inherit; border: 1px solid rgba(255,255,255,.26); }
.hsdp-btn.danger { background: #fee2e2; color: #991b1b; }
.hsdp-btn.small { padding: 8px 11px; border-radius: 11px; font-size: 12px; }
.hsdp-alert, .hsdp-warning-box, .hsdp-error-note { border-radius: 18px; padding: 14px 16px; margin: 16px 0; }
.hsdp-alert.success { background: #dcfce7; color: #166534; }
.hsdp-alert.danger, .hsdp-error-note { background: #fee2e2; color: #991b1b; }
.hsdp-warning-box { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
.hsdp-scope-list { display: grid; gap: 12px; }
.hsdp-scope-item { padding: 16px; background: #f8fafc; border: 1px solid var(--hsdp-border); border-radius: 18px; }
.hsdp-scope-item p { margin: 6px 0 0; color: var(--hsdp-muted); line-height: 1.5; }
.hsdp-pill-list { display: flex; flex-wrap: wrap; gap: 8px; }
.hsdp-permission-pill { padding: 8px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; }
.hsdp-permission-pill.enabled { background: #dcfce7; color: #166534; }
.hsdp-permission-pill.disabled { background: #f1f5f9; color: #94a3b8; }
.hsdp-filter-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.hsdp-filter-row input, .hsdp-filter-row select { flex: 1; min-width: 150px; border: 1px solid var(--hsdp-border); border-radius: 14px; padding: 12px; background: #fff; }
.hsdp-table-wrap { width: 100%; overflow: auto; border: 1px solid var(--hsdp-border); border-radius: 18px; }
.hsdp-table-wrap.compact-height { max-height: 650px; }
.hsdp-table { width: 100%; border-collapse: collapse; background: #fff; }
.hsdp-table th, .hsdp-table td { text-align: left; border-bottom: 1px solid var(--hsdp-border); padding: 12px; vertical-align: top; }
.hsdp-table th { background: #f8fafc; color: var(--hsdp-muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
.hsdp-table tr:last-child td { border-bottom: 0; }
.hsdp-table tr.selected td { background: var(--hsdp-main-soft); }
.hsdp-table small { display: block; color: var(--hsdp-muted); margin-top: 4px; }
.hsdp-table.compact-table th, .hsdp-table.compact-table td { padding: 10px; font-size: 13px; }
.hsdp-student-header { display: flex; justify-content: space-between; gap: 14px; align-items: start; border-bottom: 1px solid var(--hsdp-border); padding-bottom: 16px; margin-bottom: 16px; }
.hsdp-student-header h2 { margin: 3px 0; font-size: 24px; }
.hsdp-student-header p { margin: 0; color: var(--hsdp-muted); }
.hsdp-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
.hsdp-info-grid.compact { grid-template-columns: repeat(2, 1fr); }
.hsdp-info-item { background: #f8fafc; border: 1px solid var(--hsdp-border); border-radius: 16px; padding: 12px; }
.hsdp-info-item.wide { grid-column: 1 / -1; }
.hsdp-info-item span { display: block; color: var(--hsdp-muted); font-size: 12px; margin-bottom: 5px; font-weight: 800; }
.hsdp-info-item strong { font-size: 14px; }
.hsdp-details { border: 1px solid var(--hsdp-border); border-radius: 18px; padding: 14px; margin-bottom: 12px; background: #fff; }
.hsdp-details summary { cursor: pointer; font-weight: 900; color: var(--hsdp-main-dark); }
.hsdp-mini-title { margin: 18px 0 8px; font-size: 16px; }
.hsdp-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.hsdp-form.single { grid-template-columns: 1fr; }
.hsdp-field { display: flex; flex-direction: column; gap: 7px; }
.hsdp-field.wide, .hsdp-form-footer.full { grid-column: 1 / -1; }
.hsdp-field span, .hsdp-check-field span { color: var(--hsdp-muted); font-size: 13px; font-weight: 800; }
.hsdp-field input, .hsdp-field select, .hsdp-field textarea { border: 1px solid var(--hsdp-border); border-radius: 14px; padding: 12px; background: #fff; font: inherit; outline: none; }
.hsdp-field input:focus, .hsdp-field select:focus, .hsdp-field textarea:focus { border-color: var(--hsdp-main); box-shadow: 0 0 0 4px var(--hsdp-main-soft); }
.hsdp-check-field { display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border: 1px solid var(--hsdp-border); border-radius: 14px; }
.hsdp-check-field input { width: 18px; height: 18px; }
.hsdp-form-footer { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.hsdp-form-footer span { color: var(--hsdp-muted); font-size: 13px; }
.hsdp-badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 900; }
.hsdp-badge.success { background: #dcfce7; color: #166534; }
.hsdp-badge.danger { background: #fee2e2; color: #991b1b; }
.hsdp-badge.warning { background: #fef3c7; color: #92400e; }
.hsdp-empty { text-align: center; padding: 26px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 18px; }
.hsdp-empty-icon { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: var(--hsdp-main-soft); color: var(--hsdp-main-dark); margin: 0 auto 10px; font-weight: 900; }
.hsdp-empty h3 { margin: 0 0 6px; }
.hsdp-empty p { margin: 0; color: var(--hsdp-muted); }
.hsdp-schedule-list { display: grid; gap: 14px; }
.hsdp-schedule-card { border: 1px solid var(--hsdp-border); border-radius: 18px; padding: 14px; background: #fff; }
.hsdp-schedule-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 12px; }
.hsdp-schedule-head h3 { margin: 0; }
.hsdp-schedule-head p { margin: 4px 0 0; color: var(--hsdp-muted); }
.hsdp-notification-list { display: grid; gap: 12px; }
.hsdp-notification { display: flex; justify-content: space-between; gap: 14px; border: 1px solid var(--hsdp-border); border-radius: 16px; padding: 14px; background: #fff; }
.hsdp-notification p { margin: 6px 0; color: var(--hsdp-muted); }
.hsdp-notification small { color: var(--hsdp-muted); }
.hsdp-loader-card { max-width: 520px; margin: 12vh auto; padding: 34px; text-align: center; }
.hsdp-loader-card p { color: var(--hsdp-muted); }
.hsdp-spinner { width: 44px; height: 44px; border-radius: 50%; border: 4px solid #e2e8f0; border-top-color: var(--hsdp-main); margin: 0 auto 18px; animation: hsdp-spin .9s linear infinite; }
@keyframes hsdp-spin { to { transform: rotate(360deg); } }
@media (max-width: 1380px) { .hsdp-hero-grid { grid-template-columns: repeat(3, 1fr); } .hsdp-profile-card { grid-column: 1 / -1; } .hsdp-content-grid, .hsdp-content-grid.student-grid { grid-template-columns: 1fr; } }
@media (max-width: 760px) { .hsdp-page { padding: 16px; } .hsdp-header, .hsdp-header-left, .hsdp-header-actions, .hsdp-card-title-row, .hsdp-student-header, .hsdp-schedule-head, .hsdp-form-footer, .hsdp-notification { flex-direction: column; align-items: flex-start; } .hsdp-hero-grid, .hsdp-info-grid, .hsdp-info-grid.compact, .hsdp-form { grid-template-columns: 1fr; } .hsdp-header h1 { font-size: 25px; } .hsdp-btn, .hsdp-header-actions, .hsdp-header-actions .hsdp-btn { width: 100%; } }
`;
