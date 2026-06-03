import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/axios";

const FALLBACK = "Not available";

const studentAffairsPermissions = [
  "view undergraduate students",
  "create undergraduate students",
  "update undergraduate students",
  "change undergraduate student status",
  "create undergraduate schedules",
  "manage undergraduate schedules",
  "set course attendance limits",
  "send student notifications",
  "update undergraduate students",
  "update postgraduate students",
];

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "Students" },
  { id: "create", label: "Add Student" },
  { id: "schedules", label: "Class Schedules" },
  { id: "attendance", label: "Lecture Limits" },
  { id: "notifications", label: "Notifications" },
  { id: "serviceRequests", label: "Service Requests" },
];

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

const serviceRequestTypeLabels = {
  transcript_request: "Official Transcript / Grade Statement",
  enrollment_certificate: "Enrollment Certificate",
  personal_info_update: "Personal Information Update",
  financial_review: "Financial Status Review",
  attendance_review: "Attendance Review",
  general_inquiry: "General Student Inquiry",
};

const serviceRequestStatusOptions = [
  { id: "submitted", name: "Submitted" },
  { id: "under_review", name: "Under Review" },
  { id: "approved", name: "Approved" },
  { id: "rejected", name: "Rejected" },
  { id: "completed", name: "Completed" },
  { id: "cancelled", name: "Cancelled" },
];

function serviceRequestStudentName(request) {
  return request?.student?.user?.full_name || request?.student_name || FALLBACK;
}

function serviceRequestStudentNumber(request) {
  return request?.student?.student_number || request?.student_number || FALLBACK;
}

function serviceRequestTypeLabel(type) {
  return serviceRequestTypeLabels[type] || formatValue(String(type || "").replaceAll("_", " "));
}

function serviceRequestStatusType(status) {
  const raw = String(status || "").toLowerCase();
  if (["approved", "completed"].includes(raw)) return "success";
  if (["rejected", "cancelled"].includes(raw)) return "danger";
  return "warning";
}

function getCurrentRecord(student) {
  if (student?.current_academic_record) return student.current_academic_record;
  if (student?.currentAcademicRecord) return student.currentAcademicRecord;
  const records = student?.academic_records || student?.academicRecords || [];
  if (!Array.isArray(records) || records.length === 0) return null;
  return [...records].sort((a, b) => (b.academic_year_id || 0) - (a.academic_year_id || 0) || (b.id || 0) - (a.id || 0))[0];
}

function StatusBadge({ value }) {
  const raw = String(value ?? "unknown").toLowerCase();
  const type = raw.includes("active") || raw.includes("registered") || raw.includes("paid") || raw === "true" || raw.includes("passed")
    ? "success"
    : raw.includes("stop") || raw.includes("not") || raw.includes("failed") || raw.includes("false") || raw.includes("exhausted")
      ? "danger"
      : "warning";
  return <span className={`sadp-badge ${type}`}>{formatValue(value)}</span>;
}

function ErrorNote({ message }) {
  if (!message) return null;
  return <div className="sadp-error-note">{message}</div>;
}

function EmptyState({ title, text }) {
  return (
    <div className="sadp-empty">
      <div className="sadp-empty-icon">i</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function InfoItem({ label, value, wide = false }) {
  return (
    <div className={`sadp-info-item ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{formatValue(value)}</strong>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder = "Select", disabled = false, allowEmpty = true }) {
  return (
    <label className="sadp-field">
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
    <label className="sadp-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="sadp-field wide">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows="3" />
    </label>
  );
}

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

const emptyScheduleItemForm = {
  schedule_id: "",
  course_id: "",
  day_of_week: "Sunday",
  start_time: "09:00",
  end_time: "10:30",
  hall: "",
  notes: "",
};

const emptyAttendanceLimitForm = {
  course_id: "",
  academic_year_id: "",
  semester_number: "1",
  required_attendance_count: "",
};

const emptyNotificationForm = {
  student_id: "",
  type: "general_notice",
  title: "",
  message: "",
  sendToAll: false,
};

export default function StuAffairsDep() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [pageError, setPageError] = useState("");
  const [sectionErrors, setSectionErrors] = useState({});
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const [profile, setProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [studentSummary, setStudentSummary] = useState(null);
  const [studentCurrentRecord, setStudentCurrentRecord] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [studentCarriedCourses, setStudentCarriedCourses] = useState([]);

  const [programs, setPrograms] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [studyYears, setStudyYears] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classSchedules, setClassSchedules] = useState([]);
  const [attendanceLimits, setAttendanceLimits] = useState([]);
  const [myNotifications, setMyNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [selectedServiceRequest, setSelectedServiceRequest] = useState(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const [serviceRequestFilters, setServiceRequestFilters] = useState({ search: "", status: "all", type: "all" });

  const [createForm, setCreateForm] = useState(emptyStudentForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [statusForm, setStatusForm] = useState({ is_active_registration: true, reason: "" });
  const [autoEnrollForm, setAutoEnrollForm] = useState({ academic_year_id: "", study_year_id: "" });
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [scheduleItemForm, setScheduleItemForm] = useState(emptyScheduleItemForm);
  const [attendanceLimitForm, setAttendanceLimitForm] = useState(emptyAttendanceLimitForm);
  const [notificationForm, setNotificationForm] = useState(emptyNotificationForm);
  const [serviceStatusForm, setServiceStatusForm] = useState({ status: "under_review", staff_response: "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", new_password_confirmation: "" });

  const can = useMemo(() => {
    const list = permissions || [];
    return {
      viewStudents: list.includes("view undergraduate students") || list.includes("view postgraduate students"),
      createStudents: list.includes("create undergraduate students") || list.includes("create postgraduate students"),
      updateStudents: list.includes("update undergraduate students") || list.includes("update postgraduate students"),
      changeStatus: list.includes("change undergraduate student status") || list.includes("update postgraduate students"),
      manageSchedules: list.includes("manage undergraduate schedules") || list.includes("manage postgraduate schedules"),
      setAttendanceLimits: list.includes("set course attendance limits"),
      sendNotifications: list.includes("send student notifications"),
      manageServiceRequests: list.includes("update undergraduate students") || list.includes("update postgraduate students"),
    };
  }, [permissions]);

  const lookupErrors = useMemo(() => Object.entries(sectionErrors).filter(([key]) => ["programs", "specializations", "studyYears", "academicYears", "courses"].includes(key)), [sectionErrors]);

  const filteredStudyYears = useMemo(() => {
    const programId = createForm.program_id || editForm.program_id || scheduleForm.program_id;
    if (!programId) return studyYears;
    return studyYears.filter((item) => String(item.program_id) === String(programId));
  }, [studyYears, createForm.program_id, editForm.program_id, scheduleForm.program_id]);

  const filteredSpecializations = useMemo(() => {
    const programId = createForm.program_id || editForm.program_id || scheduleForm.program_id;
    if (!programId) return specializations;
    return specializations.filter((item) => String(item.program_id) === String(programId));
  }, [specializations, createForm.program_id, editForm.program_id, scheduleForm.program_id]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch = !query || [
        studentName(student),
        student?.student_number,
        studentEmail(student),
        studentMobile(student),
      ].join(" ").toLowerCase().includes(query);

      const matchesProgram = !programFilter || String(student.program_id) === String(programFilter);
      const isActive = Boolean(student.is_active_registration);
      const matchesStatus = registrationFilter === "all" || (registrationFilter === "active" ? isActive : !isActive);

      return matchesSearch && matchesProgram && matchesStatus;
    });
  }, [students, studentSearch, programFilter, registrationFilter]);

  const filteredServiceRequests = useMemo(() => {
    const query = serviceRequestFilters.search.trim().toLowerCase();
    return serviceRequests.filter((request) => {
      const matchesSearch = !query || [
        serviceRequestStudentName(request),
        serviceRequestStudentNumber(request),
        request?.subject,
        request?.description,
        request?.staff_response,
        serviceRequestTypeLabel(request?.request_type),
        request?.status,
      ].filter(Boolean).join(" ").toLowerCase().includes(query);

      const matchesStatus = serviceRequestFilters.status === "all" || String(request?.status) === String(serviceRequestFilters.status);
      const matchesType = serviceRequestFilters.type === "all" || String(request?.request_type) === String(serviceRequestFilters.type);
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [serviceRequests, serviceRequestFilters]);

  const serviceRequestStats = useMemo(() => {
    const active = serviceRequests.filter((item) => ["submitted", "under_review"].includes(item.status)).length;
    const completed = serviceRequests.filter((item) => ["approved", "completed"].includes(item.status)).length;
    const rejected = serviceRequests.filter((item) => ["rejected", "cancelled"].includes(item.status)).length;
    return { total: serviceRequests.length, active, completed, rejected };
  }, [serviceRequests]);

  const stats = useMemo(() => {
    const activeStudents = students.filter((student) => student.is_active_registration).length;
    const stoppedStudents = Math.max(students.length - activeStudents, 0);
    const unreadNotifications = myNotifications.filter((item) => !item.is_read).length;
    return {
      students: students.length,
      activeStudents,
      stoppedStudents,
      schedules: classSchedules.length,
      attendanceLimits: attendanceLimits.length,
      unreadNotifications,
    };
  }, [students, classSchedules, attendanceLimits, myNotifications]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(setter, field, value) {
    setter((prev) => ({ ...prev, [field]: value }));
  }

  function setSectionError(key, error) {
    setSectionErrors((prev) => ({ ...prev, [key]: extractApiMessage(error) }));
  }

  function clearSectionError(key) {
    setSectionErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function showMessage(type, text) {
    setActionMessage({ type, text });
    window.setTimeout(() => setActionMessage({ type: "", text: "" }), 4500);
  }

  async function fetchCollection(url, key, setter, sectionKey) {
    try {
      const res = await api.get(url);
      setter(normalizeCollection(res.data, key));
      clearSectionError(sectionKey);
      return res.data;
    } catch (error) {
      setSectionError(sectionKey, error);
      return null;
    }
  }

  async function loadAll() {
    setLoading(true);
    setPageError("");

    try {
      const me = await api.get("/me");
      const user = me.data.user || me.data || null;
      const userPermissions = me.data.permissions || [];
      setProfile(user);
      setPermissions(userPermissions);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("permissions", JSON.stringify(userPermissions));
    } catch (error) {
      setPageError(extractApiMessage(error));
    }

    await Promise.all([
      fetchCollection("/students", "students", setStudents, "students"),
      fetchCollection("/programs", "programs", setPrograms, "programs"),
      fetchCollection("/specializations", "specializations", setSpecializations, "specializations"),
      fetchCollection("/study-years", "study_years", setStudyYears, "studyYears"),
      fetchCollection("/academic-years", "academic_years", setAcademicYears, "academicYears"),
      fetchCollection("/courses", "courses", setCourses, "courses"),
      fetchCollection("/class-schedules", "class_schedules", setClassSchedules, "classSchedules"),
      fetchCollection("/course-attendance-requirements", "requirements", setAttendanceLimits, "attendanceLimits"),
      fetchCollection("/notifications/me", "notifications", setMyNotifications, "myNotifications"),
      fetchCollection("/notifications", "notifications", setAllNotifications, "allNotifications"),
      fetchCollection("/student-service-requests", "service_requests", setServiceRequests, "serviceRequests"),
    ]);

    setLoading(false);
  }

  async function refreshAll() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  function buildCreatePayload() {
    return {
      full_name: createForm.full_name,
      father_name: toNullable(createForm.father_name),
      mother_name: toNullable(createForm.mother_name),
      birth_date: toNullable(createForm.birth_date),
      birth_place: toNullable(createForm.birth_place),
      central_registry: toNullable(createForm.central_registry),
      national_id: toNullable(createForm.national_id),
      nationality: toNullable(createForm.nationality),
      gender: toNullable(createForm.gender),
      mobile: toNullable(createForm.mobile),
      address: toNullable(createForm.address),
      email: createForm.email,
      password: createForm.password,
      program_id: Number(createForm.program_id),
      specialization_id: toNullable(createForm.specialization_id),
      academic_year_id: Number(createForm.academic_year_id),
      study_year_id: Number(createForm.study_year_id),
      enrollment_date: toNullable(createForm.enrollment_date),
      registration_status: toNullable(createForm.registration_status),
      tuition_paid: Boolean(createForm.tuition_paid),
      notes: toNullable(createForm.notes),
    };
  }

  async function submitCreateStudent(e) {
    e.preventDefault();
    setBusyAction("create-student");
    try {
      const res = await api.post("/students", buildCreatePayload());
      showMessage("success", res.data.message || "Student created successfully.");
      setCreateForm(emptyStudentForm);
      await fetchCollection("/students", "students", setStudents, "students");
      setActiveTab("students");
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  function fillEditForm(student) {
    const user = student?.user || {};
    setEditForm({
      full_name: user.full_name || student?.full_name || "",
      father_name: user.father_name || "",
      mother_name: user.mother_name || "",
      birth_date: user.birth_date ? String(user.birth_date).slice(0, 10) : "",
      birth_place: user.birth_place || "",
      central_registry: user.central_registry || "",
      national_id: user.national_id || "",
      nationality: user.nationality || "",
      gender: user.gender || "",
      mobile: user.mobile || "",
      address: user.address || "",
      program_id: student?.program_id || "",
      specialization_id: student?.specialization_id || "",
      enrollment_date: student?.enrollment_date ? String(student.enrollment_date).slice(0, 10) : "",
      notes: student?.notes || "",
    });
    setStatusForm({ is_active_registration: Boolean(student?.is_active_registration), reason: "" });
    const record = getCurrentRecord(student);
    setAutoEnrollForm({
      academic_year_id: record?.academic_year_id || "",
      study_year_id: record?.study_year_id || "",
    });
  }

  async function selectStudent(student) {
    setSelectedStudent(student);
    setSelectedStudentDetails(null);
    setStudentSummary(null);
    setStudentCurrentRecord(null);
    setStudentGrades([]);
    setStudentAttendance([]);
    setStudentCarriedCourses([]);
    fillEditForm(student);
    setActiveTab("students");
    setBusyAction(`load-student-${student.id}`);

    try {
      const [detailsRes, summaryRes, recordRes, gradesRes, attendanceRes, carriedRes] = await Promise.allSettled([
        api.get(`/students/${student.id}`),
        api.get(`/students/${student.id}/academic-summary`),
        api.get(`/students/${student.id}/current-academic-record`),
        api.get(`/students/${student.id}/grades`),
        api.get(`/students/${student.id}/attendance`),
        api.get(`/students/${student.id}/carried-courses`),
      ]);

      if (detailsRes.status === "fulfilled") {
        const data = detailsRes.value.data;
        setSelectedStudentDetails(data);
        fillEditForm(data);
      }
      if (summaryRes.status === "fulfilled") setStudentSummary(summaryRes.value.data.summary || summaryRes.value.data);
      if (recordRes.status === "fulfilled") setStudentCurrentRecord(recordRes.value.data.current_academic_record || recordRes.value.data);
      if (gradesRes.status === "fulfilled") setStudentGrades(normalizeCollection(gradesRes.value.data, "grades"));
      if (attendanceRes.status === "fulfilled") setStudentAttendance(normalizeCollection(attendanceRes.value.data, "attendance"));
      if (carriedRes.status === "fulfilled") setStudentCarriedCourses(normalizeCollection(carriedRes.value.data, "carried_courses"));
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  function buildUpdatePayload() {
    return {
      full_name: editForm.full_name,
      father_name: toNullable(editForm.father_name),
      mother_name: toNullable(editForm.mother_name),
      birth_date: toNullable(editForm.birth_date),
      birth_place: toNullable(editForm.birth_place),
      central_registry: toNullable(editForm.central_registry),
      national_id: toNullable(editForm.national_id),
      nationality: toNullable(editForm.nationality),
      gender: toNullable(editForm.gender),
      mobile: toNullable(editForm.mobile),
      address: toNullable(editForm.address),
      program_id: Number(editForm.program_id),
      specialization_id: toNullable(editForm.specialization_id),
      enrollment_date: toNullable(editForm.enrollment_date),
      notes: toNullable(editForm.notes),
    };
  }

  async function submitUpdateStudent(e) {
    e.preventDefault();
    const id = selectedStudentDetails?.id || selectedStudent?.id;
    if (!id) return;
    setBusyAction("update-student");
    try {
      const res = await api.put(`/students/${id}`, buildUpdatePayload());
      showMessage("success", res.data.message || "Student profile updated successfully.");
      const fresh = res.data.data || res.data;
      setSelectedStudentDetails(fresh);
      fillEditForm(fresh);
      await fetchCollection("/students", "students", setStudents, "students");
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function submitRegistrationStatus(e) {
    e.preventDefault();
    const id = selectedStudentDetails?.id || selectedStudent?.id;
    if (!id) return;
    setBusyAction("status-student");
    try {
      const res = await api.patch(`/students/${id}/registration-status`, {
        is_active_registration: Boolean(statusForm.is_active_registration),
        reason: toNullable(statusForm.reason),
      });
      showMessage("success", res.data.message || "Registration status updated.");
      const fresh = res.data.data || res.data;
      setSelectedStudentDetails(fresh);
      fillEditForm(fresh);
      await fetchCollection("/students", "students", setStudents, "students");
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function submitAutoEnroll(e) {
    e.preventDefault();
    const id = selectedStudentDetails?.id || selectedStudent?.id;
    if (!id) return;
    setBusyAction("auto-enroll");
    try {
      const res = await api.post(`/students/${id}/auto-enroll`, {
        academic_year_id: Number(autoEnrollForm.academic_year_id),
        study_year_id: Number(autoEnrollForm.study_year_id),
      });
      showMessage("success", res.data.message || "Auto-enrollment completed.");
      await selectStudent(selectedStudentDetails || selectedStudent);
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function submitSchedule(e) {
    e.preventDefault();
    setBusyAction("create-schedule");
    try {
      const res = await api.post("/class-schedules", {
        program_id: Number(scheduleForm.program_id),
        study_year_id: Number(scheduleForm.study_year_id),
        specialization_id: toNullable(scheduleForm.specialization_id),
        semester_number: Number(scheduleForm.semester_number),
        name: scheduleForm.name,
        is_active: Boolean(scheduleForm.is_active),
        notes: toNullable(scheduleForm.notes),
      });
      showMessage("success", res.data.message || "Class schedule created.");
      setScheduleForm(emptyScheduleForm);
      await fetchCollection("/class-schedules", "class_schedules", setClassSchedules, "classSchedules");
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function submitScheduleItem(e) {
    e.preventDefault();
    if (!scheduleItemForm.schedule_id) return;
    setBusyAction("create-schedule-item");
    try {
      const res = await api.post(`/class-schedules/${scheduleItemForm.schedule_id}/items`, {
        course_id: Number(scheduleItemForm.course_id),
        day_of_week: scheduleItemForm.day_of_week,
        start_time: scheduleItemForm.start_time,
        end_time: scheduleItemForm.end_time,
        hall: toNullable(scheduleItemForm.hall),
        notes: toNullable(scheduleItemForm.notes),
      });
      showMessage("success", res.data.message || "Schedule item added.");
      setScheduleItemForm((prev) => ({ ...emptyScheduleItemForm, schedule_id: prev.schedule_id }));
      await fetchCollection("/class-schedules", "class_schedules", setClassSchedules, "classSchedules");
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function deleteScheduleItem(itemId) {
    if (!itemId) return;
    setBusyAction(`delete-item-${itemId}`);
    try {
      const res = await api.delete(`/class-schedule-items/${itemId}`);
      showMessage("success", res.data.message || "Schedule item deleted.");
      await fetchCollection("/class-schedules", "class_schedules", setClassSchedules, "classSchedules");
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function submitAttendanceLimit(e) {
    e.preventDefault();
    setBusyAction("attendance-limit");
    try {
      const res = await api.post("/course-attendance-requirements", {
        course_id: Number(attendanceLimitForm.course_id),
        academic_year_id: Number(attendanceLimitForm.academic_year_id),
        semester_number: Number(attendanceLimitForm.semester_number),
        required_attendance_count: Number(attendanceLimitForm.required_attendance_count),
      });
      showMessage("success", res.data.message || "Lecture limit saved.");
      setAttendanceLimitForm(emptyAttendanceLimitForm);
      await fetchCollection("/course-attendance-requirements", "requirements", setAttendanceLimits, "attendanceLimits");
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function deleteAttendanceLimit(limitId) {
    if (!limitId) return;
    setBusyAction(`delete-limit-${limitId}`);
    try {
      const res = await api.delete(`/course-attendance-requirements/${limitId}`);
      showMessage("success", res.data.message || "Lecture limit deleted.");
      await fetchCollection("/course-attendance-requirements", "requirements", setAttendanceLimits, "attendanceLimits");
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function submitNotification(e) {
    e.preventDefault();
    setBusyAction("send-notification");
    try {
      const payload = {
        type: notificationForm.type || "general_notice",
        title: notificationForm.title,
        message: notificationForm.message,
      };
      const endpoint = notificationForm.sendToAll ? "/notifications/students/send-all" : "/notifications/students/send";
      if (!notificationForm.sendToAll) payload.student_id = Number(notificationForm.student_id);

      const res = await api.post(endpoint, payload);
      showMessage("success", res.data.message || "Notification sent.");
      setNotificationForm(emptyNotificationForm);
      await Promise.all([
        fetchCollection("/notifications", "notifications", setAllNotifications, "allNotifications"),
        fetchCollection("/notifications/me", "notifications", setMyNotifications, "myNotifications"),
      ]);
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function selectServiceRequest(request) {
    setSelectedServiceRequest(request);
    setServiceStatusForm({ status: request?.status || "under_review", staff_response: request?.staff_response || "" });

    if (!request?.id) return;
    setBusyAction(`load-service-request-${request.id}`);
    try {
      const res = await api.get(`/student-service-requests/${request.id}`);
      const fresh = res.data.data || res.data;
      setSelectedServiceRequest(fresh);
      setServiceStatusForm({ status: fresh?.status || "under_review", staff_response: fresh?.staff_response || "" });
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function submitServiceRequestStatus(e) {
    e.preventDefault();
    if (!selectedServiceRequest?.id) return;
    setBusyAction("service-request-status");
    try {
      const res = await api.patch(`/student-service-requests/${selectedServiceRequest.id}/status`, {
        status: serviceStatusForm.status,
        staff_response: toNullable(serviceStatusForm.staff_response),
      });
      showMessage("success", res.data.message || "Student service request updated successfully.");
      const fresh = res.data.data || res.data;
      setSelectedServiceRequest(fresh);
      setServiceStatusForm({ status: fresh?.status || serviceStatusForm.status, staff_response: fresh?.staff_response || serviceStatusForm.staff_response });
      await fetchCollection("/student-service-requests", "service_requests", setServiceRequests, "serviceRequests");
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setBusyAction("password");
    try {
      const res = await api.post("/account/change-my-password", passwordForm);
      showMessage("success", res.data.message || "Password changed.");
      setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (error) {
      showMessage("danger", extractApiMessage(error));
    } finally {
      setBusyAction("");
    }
  }

  async function logout() {
    try {
      await api.post("/logout");
    } catch {
      // Local logout still matters if the token is already expired.
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    navigate("/login");
  }

  function renderLookupsWarning() {
    if (!lookupErrors.length) return null;
    return (
      <div className="sadp-warning-box">
        <strong>Some lookup lists did not load.</strong>
        <p>
          Student Affairs needs read access to Programs, Specializations, Study Years, Academic Years, and Courses to create students and schedules.
          Apply the backend patch included with this page if these messages show 403.
        </p>
        <ul>
          {lookupErrors.map(([key, message]) => <li key={key}>{key}: {message}</li>)}
        </ul>
      </div>
    );
  }

  function renderOverview() {
    return (
      <div className="sadp-content-grid">
        <section className="sadp-card wide-card">
          <div className="sadp-card-title-row">
            <div>
              <span className="sadp-section-kicker">Department scope</span>
              <h2>Student Affairs Operations</h2>
            </div>
            <button className="sadp-btn ghost" onClick={refreshAll} disabled={refreshing}>{refreshing ? "Refreshing..." : "Refresh"}</button>
          </div>
          <div className="sadp-scope-grid">
            {[
              ["Student records", "Create students, review files, and update personal information without changing email or password."],
              ["Registration status", "Activate or stop registration with a documented reason."],
              ["Academic view", "Review current record, academic summary, grades, carried courses, and attendance."],
              ["Class schedules", "Create weekly class schedules and add lecture items for courses."],
              ["Lecture limits", "Set the required number of lectures per course, academic year, and semester."],
              ["Notifications", "Send direct or general notices to students."],
            ].map(([title, text]) => (
              <div className="sadp-scope-item" key={title}>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="sadp-card">
          <div className="sadp-card-title-row"><h2>My Permissions</h2></div>
          <div className="sadp-pill-list">
            {studentAffairsPermissions.map((permission) => (
              <span key={permission} className={`sadp-permission-pill ${permissions.includes(permission) ? "enabled" : "disabled"}`}>
                {permission}
              </span>
            ))}
          </div>
        </section>

        <section className="sadp-card">
          <div className="sadp-card-title-row"><h2>Change Password</h2></div>
          <form className="sadp-form single" onSubmit={changePassword}>
            <TextField label="Current password" type="password" value={passwordForm.current_password} onChange={(v) => setField(setPasswordForm, "current_password", v)} />
            <TextField label="New password" type="password" value={passwordForm.new_password} onChange={(v) => setField(setPasswordForm, "new_password", v)} />
            <TextField label="Confirm new password" type="password" value={passwordForm.new_password_confirmation} onChange={(v) => setField(setPasswordForm, "new_password_confirmation", v)} />
            <button className="sadp-btn primary" disabled={busyAction === "password"}>{busyAction === "password" ? "Saving..." : "Change Password"}</button>
          </form>
        </section>
      </div>
    );
  }

  function renderStudents() {
    const details = selectedStudentDetails || selectedStudent;
    const user = details?.user || {};
    const record = studentCurrentRecord || getCurrentRecord(details);

    return (
      <div className="sadp-content-grid student-grid">
        <section className="sadp-card student-list-card">
          <div className="sadp-card-title-row">
            <div>
              <span className="sadp-section-kicker">Records</span>
              <h2>Students</h2>
            </div>
            <button className="sadp-btn primary" onClick={() => setActiveTab("create")}>Add Student</button>
          </div>
          <ErrorNote message={sectionErrors.students} />
          <div className="sadp-filter-row">
            <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search by name, number, email, or mobile" />
            <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
              <option value="">All programs</option>
              {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
            </select>
            <select value={registrationFilter} onChange={(e) => setRegistrationFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>
          {filteredStudents.length === 0 ? (
            <EmptyState title="No students found" text="No record matches the current filters." />
          ) : (
            <div className="sadp-table-wrap compact-height">
              <table className="sadp-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Number</th>
                    <th>Program</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className={details?.id === student.id ? "selected" : ""}>
                      <td>
                        <strong>{studentName(student)}</strong>
                        <small>{studentEmail(student)}</small>
                      </td>
                      <td>{formatValue(student.student_number)}</td>
                      <td>{student.program?.name || FALLBACK}</td>
                      <td><StatusBadge value={student.is_active_registration ? "active" : "stopped"} /></td>
                      <td><button className="sadp-btn small" onClick={() => selectStudent(student)} disabled={busyAction === `load-student-${student.id}`}>Open</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="sadp-card student-details-card">
          {!details ? (
            <EmptyState title="Select a student" text="Open a student record to review and update it." />
          ) : (
            <>
              <div className="sadp-student-header">
                <div>
                  <span className="sadp-section-kicker">Student profile</span>
                  <h2>{studentName(details)}</h2>
                  <p>{formatValue(details.student_number)} · {studentEmail(details)}</p>
                </div>
                <StatusBadge value={details.is_active_registration ? "active" : "stopped"} />
              </div>

              <div className="sadp-info-grid compact">
                <InfoItem label="Program" value={details.program?.name} />
                <InfoItem label="Specialization" value={details.specialization?.name} />
                <InfoItem label="Current academic year" value={record?.academic_year?.name || record?.academicYear?.name || studentSummary?.academic_year} />
                <InfoItem label="Study year" value={record?.study_year?.name || record?.studyYear?.name || studentSummary?.study_year} />
                <InfoItem label="Annual average" value={studentSummary?.annual_average} />
                <InfoItem label="Tuition paid" value={studentSummary?.tuition_paid} />
                <InfoItem label="Mobile" value={studentMobile(details)} />
                <InfoItem label="Address" value={studentAddress(details)} wide />
              </div>

              <div className="sadp-inner-tabs">
                <details open>
                  <summary>Update personal information</summary>
                  <form className="sadp-form" onSubmit={submitUpdateStudent}>
                    <TextField label="Full name" value={editForm.full_name} onChange={(v) => setField(setEditForm, "full_name", v)} />
                    <TextField label="Father name" value={editForm.father_name} onChange={(v) => setField(setEditForm, "father_name", v)} />
                    <TextField label="Mother name" value={editForm.mother_name} onChange={(v) => setField(setEditForm, "mother_name", v)} />
                    <TextField label="Birth date" type="date" value={editForm.birth_date} onChange={(v) => setField(setEditForm, "birth_date", v)} />
                    <TextField label="Birth place" value={editForm.birth_place} onChange={(v) => setField(setEditForm, "birth_place", v)} />
                    <TextField label="Central registry" value={editForm.central_registry} onChange={(v) => setField(setEditForm, "central_registry", v)} />
                    <TextField label="National ID" value={editForm.national_id} onChange={(v) => setField(setEditForm, "national_id", v)} />
                    <TextField label="Nationality" value={editForm.nationality} onChange={(v) => setField(setEditForm, "nationality", v)} />
                    <label className="sadp-field"><span>Gender</span><select value={editForm.gender} onChange={(e) => setField(setEditForm, "gender", e.target.value)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></label>
                    <TextField label="Mobile" value={editForm.mobile} onChange={(v) => setField(setEditForm, "mobile", v)} />
                    <SelectField label="Program" value={editForm.program_id} onChange={(v) => setField(setEditForm, "program_id", v)} options={programs} />
                    <SelectField label="Specialization" value={editForm.specialization_id} onChange={(v) => setField(setEditForm, "specialization_id", v)} options={filteredSpecializations} placeholder="No specialization" />
                    <TextField label="Enrollment date" type="date" value={editForm.enrollment_date} onChange={(v) => setField(setEditForm, "enrollment_date", v)} />
                    <TextAreaField label="Address" value={editForm.address} onChange={(v) => setField(setEditForm, "address", v)} />
                    <TextAreaField label="Notes" value={editForm.notes} onChange={(v) => setField(setEditForm, "notes", v)} />
                    <div className="sadp-form-footer">
                      <span>Email and password are intentionally not editable from this department page.</span>
                      <button className="sadp-btn primary" disabled={busyAction === "update-student"}>{busyAction === "update-student" ? "Saving..." : "Save Student Profile"}</button>
                    </div>
                  </form>
                </details>

                <details>
                  <summary>Registration status and auto-enrollment</summary>
                  <div className="sadp-two-columns">
                    <form className="sadp-form single" onSubmit={submitRegistrationStatus}>
                      <label className="sadp-field"><span>Registration status</span><select value={String(statusForm.is_active_registration)} onChange={(e) => setField(setStatusForm, "is_active_registration", toBoolean(e.target.value))}><option value="true">Active</option><option value="false">Stopped</option></select></label>
                      <TextAreaField label="Reason" value={statusForm.reason} onChange={(v) => setField(setStatusForm, "reason", v)} />
                      <button className="sadp-btn primary" disabled={busyAction === "status-student"}>{busyAction === "status-student" ? "Saving..." : "Update Status"}</button>
                    </form>
                    <form className="sadp-form single" onSubmit={submitAutoEnroll}>
                      <SelectField label="Academic year" value={autoEnrollForm.academic_year_id} onChange={(v) => setField(setAutoEnrollForm, "academic_year_id", v)} options={academicYears} />
                      <SelectField label="Study year" value={autoEnrollForm.study_year_id} onChange={(v) => setField(setAutoEnrollForm, "study_year_id", v)} options={studyYears} />
                      <button className="sadp-btn secondary" disabled={busyAction === "auto-enroll"}>{busyAction === "auto-enroll" ? "Processing..." : "Auto-enroll in Study Plan"}</button>
                    </form>
                  </div>
                </details>

                <details>
                  <summary>Academic summary, grades, attendance, and carried courses</summary>
                  <div className="sadp-info-grid compact">
                    <InfoItem label="Academic result" value={studentSummary?.academic_result} />
                    <InfoItem label="Registration status" value={studentSummary?.registration_status} />
                    <InfoItem label="Carried courses count" value={studentSummary?.carried_courses_count} />
                    <InfoItem label="Carried credit sum" value={studentSummary?.carried_courses_credit_sum} />
                    <InfoItem label="Consecutive failures" value={studentSummary?.consecutive_failures_in_same_year} />
                    <InfoItem label="Exhausted" value={details.is_exhausted} />
                  </div>
                  <h3 className="sadp-mini-title">Grades</h3>
                  <SimpleGradeTable rows={studentGrades} />
                  <h3 className="sadp-mini-title">Attendance</h3>
                  <SimpleAttendanceTable rows={studentAttendance} />
                  <h3 className="sadp-mini-title">Carried Courses</h3>
                  <SimpleCarriedCourses rows={studentCarriedCourses} />
                </details>
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  function renderCreateStudent() {
    return (
      <section className="sadp-card wide-card">
        <div className="sadp-card-title-row">
          <div>
            <span className="sadp-section-kicker">Provisioning</span>
            <h2>Add New Student</h2>
          </div>
        </div>
        <form className="sadp-form" onSubmit={submitCreateStudent}>
          <TextField label="Full name" value={createForm.full_name} onChange={(v) => setField(setCreateForm, "full_name", v)} />
          <TextField label="Email" type="email" value={createForm.email} onChange={(v) => setField(setCreateForm, "email", v)} />
          <TextField label="Initial password" type="password" value={createForm.password} onChange={(v) => setField(setCreateForm, "password", v)} />
          <TextField label="Father name" value={createForm.father_name} onChange={(v) => setField(setCreateForm, "father_name", v)} />
          <TextField label="Mother name" value={createForm.mother_name} onChange={(v) => setField(setCreateForm, "mother_name", v)} />
          <TextField label="Birth date" type="date" value={createForm.birth_date} onChange={(v) => setField(setCreateForm, "birth_date", v)} />
          <TextField label="Birth place" value={createForm.birth_place} onChange={(v) => setField(setCreateForm, "birth_place", v)} />
          <TextField label="Central registry" value={createForm.central_registry} onChange={(v) => setField(setCreateForm, "central_registry", v)} />
          <TextField label="National ID" value={createForm.national_id} onChange={(v) => setField(setCreateForm, "national_id", v)} />
          <TextField label="Nationality" value={createForm.nationality} onChange={(v) => setField(setCreateForm, "nationality", v)} />
          <label className="sadp-field"><span>Gender</span><select value={createForm.gender} onChange={(e) => setField(setCreateForm, "gender", e.target.value)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></label>
          <TextField label="Mobile" value={createForm.mobile} onChange={(v) => setField(setCreateForm, "mobile", v)} />
          <SelectField label="Program" value={createForm.program_id} onChange={(v) => setField(setCreateForm, "program_id", v)} options={programs} />
          <SelectField label="Specialization" value={createForm.specialization_id} onChange={(v) => setField(setCreateForm, "specialization_id", v)} options={filteredSpecializations} placeholder="No specialization" />
          <SelectField label="Academic year" value={createForm.academic_year_id} onChange={(v) => setField(setCreateForm, "academic_year_id", v)} options={academicYears} />
          <SelectField label="Study year" value={createForm.study_year_id} onChange={(v) => setField(setCreateForm, "study_year_id", v)} options={filteredStudyYears} />
          <TextField label="Enrollment date" type="date" value={createForm.enrollment_date} onChange={(v) => setField(setCreateForm, "enrollment_date", v)} />
          <label className="sadp-field"><span>Initial registration status</span><select value={createForm.registration_status} onChange={(e) => setField(setCreateForm, "registration_status", e.target.value)}><option value="pending">Pending</option><option value="registered">Registered</option><option value="not_registered">Not registered</option><option value="stopped">Stopped</option></select></label>
          <label className="sadp-check-field"><input type="checkbox" checked={createForm.tuition_paid} onChange={(e) => setField(setCreateForm, "tuition_paid", e.target.checked)} /><span>Tuition paid</span></label>
          <TextAreaField label="Address" value={createForm.address} onChange={(v) => setField(setCreateForm, "address", v)} />
          <TextAreaField label="Notes" value={createForm.notes} onChange={(v) => setField(setCreateForm, "notes", v)} />
          <div className="sadp-form-footer full">
            <span>The backend will generate the student number and auto-create the initial academic record.</span>
            <button className="sadp-btn primary" disabled={busyAction === "create-student"}>{busyAction === "create-student" ? "Creating..." : "Create Student"}</button>
          </div>
        </form>
      </section>
    );
  }

  function renderSchedules() {
    return (
      <div className="sadp-content-grid">
        <section className="sadp-card">
          <div className="sadp-card-title-row"><div><span className="sadp-section-kicker">Weekly schedules</span><h2>Create Schedule</h2></div></div>
          <ErrorNote message={sectionErrors.classSchedules} />
          <form className="sadp-form single" onSubmit={submitSchedule}>
            <TextField label="Schedule name" value={scheduleForm.name} onChange={(v) => setField(setScheduleForm, "name", v)} />
            <SelectField label="Program" value={scheduleForm.program_id} onChange={(v) => setField(setScheduleForm, "program_id", v)} options={programs} />
            <SelectField label="Study year" value={scheduleForm.study_year_id} onChange={(v) => setField(setScheduleForm, "study_year_id", v)} options={filteredStudyYears} />
            <SelectField label="Specialization" value={scheduleForm.specialization_id} onChange={(v) => setField(setScheduleForm, "specialization_id", v)} options={filteredSpecializations} placeholder="No specialization" />
            <label className="sadp-field"><span>Semester</span><select value={scheduleForm.semester_number} onChange={(e) => setField(setScheduleForm, "semester_number", e.target.value)}><option value="1">Semester 1</option><option value="2">Semester 2</option></select></label>
            <label className="sadp-check-field"><input type="checkbox" checked={scheduleForm.is_active} onChange={(e) => setField(setScheduleForm, "is_active", e.target.checked)} /><span>Active schedule</span></label>
            <TextAreaField label="Notes" value={scheduleForm.notes} onChange={(v) => setField(setScheduleForm, "notes", v)} />
            <button className="sadp-btn primary" disabled={busyAction === "create-schedule"}>{busyAction === "create-schedule" ? "Creating..." : "Create Schedule"}</button>
          </form>
        </section>

        <section className="sadp-card">
          <div className="sadp-card-title-row"><div><span className="sadp-section-kicker">Lecture items</span><h2>Add Schedule Item</h2></div></div>
          <form className="sadp-form single" onSubmit={submitScheduleItem}>
            <SelectField label="Schedule" value={scheduleItemForm.schedule_id} onChange={(v) => setField(setScheduleItemForm, "schedule_id", v)} options={classSchedules} />
            <SelectField label="Course" value={scheduleItemForm.course_id} onChange={(v) => setField(setScheduleItemForm, "course_id", v)} options={courses.map((c) => ({ ...c, name: `${c.code || ""} ${c.name || ""}`.trim() }))} />
            <label className="sadp-field"><span>Day</span><select value={scheduleItemForm.day_of_week} onChange={(e) => setField(setScheduleItemForm, "day_of_week", e.target.value)}>{days.map((day) => <option key={day} value={day}>{day}</option>)}</select></label>
            <TextField label="Start time" type="time" value={scheduleItemForm.start_time} onChange={(v) => setField(setScheduleItemForm, "start_time", v)} />
            <TextField label="End time" type="time" value={scheduleItemForm.end_time} onChange={(v) => setField(setScheduleItemForm, "end_time", v)} />
            <TextField label="Hall" value={scheduleItemForm.hall} onChange={(v) => setField(setScheduleItemForm, "hall", v)} />
            <TextAreaField label="Notes" value={scheduleItemForm.notes} onChange={(v) => setField(setScheduleItemForm, "notes", v)} />
            <button className="sadp-btn primary" disabled={busyAction === "create-schedule-item"}>{busyAction === "create-schedule-item" ? "Adding..." : "Add Lecture"}</button>
          </form>
        </section>

        <section className="sadp-card wide-card">
          <div className="sadp-card-title-row"><h2>Existing Class Schedules</h2></div>
          {classSchedules.length === 0 ? <EmptyState title="No schedules" text="Create a schedule first." /> : (
            <div className="sadp-schedule-list">
              {classSchedules.map((schedule) => (
                <div className="sadp-schedule-card" key={schedule.id}>
                  <div className="sadp-schedule-head">
                    <div>
                      <strong>{schedule.name}</strong>
                      <p>{schedule.program?.name || FALLBACK} · {schedule.study_year?.name || schedule.studyYear?.name || FALLBACK} · Semester {schedule.semester_number}</p>
                    </div>
                    <StatusBadge value={schedule.is_active ? "active" : "inactive"} />
                  </div>
                  <div className="sadp-table-wrap">
                    <table className="sadp-table compact-table">
                      <thead><tr><th>Course</th><th>Day</th><th>Time</th><th>Hall</th><th></th></tr></thead>
                      <tbody>
                        {(schedule.items || []).length === 0 ? (
                          <tr><td colSpan="5">No lectures added yet.</td></tr>
                        ) : (schedule.items || []).map((item) => (
                          <tr key={item.id}>
                            <td>{item.course?.code} {item.course?.name}</td>
                            <td>{item.day_of_week}</td>
                            <td>{item.start_time} - {item.end_time}</td>
                            <td>{formatValue(item.hall)}</td>
                            <td><button className="sadp-btn small danger" onClick={() => deleteScheduleItem(item.id)} disabled={busyAction === `delete-item-${item.id}`}>Delete</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderAttendanceLimits() {
    return (
      <div className="sadp-content-grid">
        <section className="sadp-card">
          <div className="sadp-card-title-row"><div><span className="sadp-section-kicker">Attendance control</span><h2>Set Required Lectures</h2></div></div>
          <ErrorNote message={sectionErrors.attendanceLimits} />
          <form className="sadp-form single" onSubmit={submitAttendanceLimit}>
            <SelectField label="Course" value={attendanceLimitForm.course_id} onChange={(v) => setField(setAttendanceLimitForm, "course_id", v)} options={courses.map((c) => ({ ...c, name: `${c.code || ""} ${c.name || ""}`.trim() }))} />
            <SelectField label="Academic year" value={attendanceLimitForm.academic_year_id} onChange={(v) => setField(setAttendanceLimitForm, "academic_year_id", v)} options={academicYears} />
            <label className="sadp-field"><span>Semester</span><select value={attendanceLimitForm.semester_number} onChange={(e) => setField(setAttendanceLimitForm, "semester_number", e.target.value)}><option value="1">Semester 1</option><option value="2">Semester 2</option></select></label>
            <TextField label="Required lecture count" type="number" value={attendanceLimitForm.required_attendance_count} onChange={(v) => setField(setAttendanceLimitForm, "required_attendance_count", v)} />
            <button className="sadp-btn primary" disabled={busyAction === "attendance-limit"}>{busyAction === "attendance-limit" ? "Saving..." : "Save Lecture Limit"}</button>
          </form>
        </section>

        <section className="sadp-card wide-card">
          <div className="sadp-card-title-row"><h2>Saved Lecture Limits</h2></div>
          {attendanceLimits.length === 0 ? <EmptyState title="No limits" text="Set lecture requirements for courses to control attendance capacity." /> : (
            <div className="sadp-table-wrap">
              <table className="sadp-table">
                <thead><tr><th>Course</th><th>Academic Year</th><th>Semester</th><th>Required Lectures</th><th></th></tr></thead>
                <tbody>
                  {attendanceLimits.map((limit) => (
                    <tr key={limit.id}>
                      <td>{limit.course?.code} {limit.course?.name || limit.course_id}</td>
                      <td>{limit.academic_year?.name || limit.academicYear?.name || limit.academic_year_id}</td>
                      <td>{limit.semester_number}</td>
                      <td><strong>{limit.required_attendance_count}</strong></td>
                      <td><button className="sadp-btn small danger" onClick={() => deleteAttendanceLimit(limit.id)} disabled={busyAction === `delete-limit-${limit.id}`}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderNotifications() {
    return (
      <div className="sadp-content-grid">
        <section className="sadp-card">
          <div className="sadp-card-title-row"><div><span className="sadp-section-kicker">Student communication</span><h2>Send Notification</h2></div></div>
          <ErrorNote message={sectionErrors.allNotifications} />
          <form className="sadp-form single" onSubmit={submitNotification}>
            <label className="sadp-check-field"><input type="checkbox" checked={notificationForm.sendToAll} onChange={(e) => setField(setNotificationForm, "sendToAll", e.target.checked)} /><span>Send to all students</span></label>
            {!notificationForm.sendToAll && <SelectField label="Student" value={notificationForm.student_id} onChange={(v) => setField(setNotificationForm, "student_id", v)} options={students.map((s) => ({ ...s, name: `${s.student_number || ""} - ${studentName(s)}` }))} />}
            <TextField label="Type" value={notificationForm.type} onChange={(v) => setField(setNotificationForm, "type", v)} />
            <TextField label="Title" value={notificationForm.title} onChange={(v) => setField(setNotificationForm, "title", v)} />
            <TextAreaField label="Message" value={notificationForm.message} onChange={(v) => setField(setNotificationForm, "message", v)} />
            <button className="sadp-btn primary" disabled={busyAction === "send-notification"}>{busyAction === "send-notification" ? "Sending..." : "Send Notification"}</button>
          </form>
        </section>

        <section className="sadp-card wide-card">
          <div className="sadp-card-title-row"><h2>Recent Sent Notifications</h2></div>
          {allNotifications.length === 0 ? <EmptyState title="No notifications" text="Sent notifications will appear here." /> : (
            <div className="sadp-notification-list">
              {allNotifications.slice(0, 20).map((item) => (
                <div className="sadp-notification" key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <small>{item.student?.student_number ? `${item.student.student_number} · ` : ""}{item.user?.full_name || "All/Student"} · {formatDate(item.created_at)}</small>
                  </div>
                  <StatusBadge value={item.is_read ? "read" : "unread"} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  function renderServiceRequests() {
    return (
      <div className="sadp-content-grid service-requests-grid">
        <section className="sadp-card">
          <div className="sadp-card-title-row">
            <div>
              <span className="sadp-section-kicker">Student services</span>
              <h2>Student Service Requests</h2>
            </div>
            <button className="sadp-btn ghost" onClick={() => fetchCollection("/student-service-requests", "service_requests", setServiceRequests, "serviceRequests")}>Reload</button>
          </div>
          <ErrorNote message={sectionErrors.serviceRequests} />

          <div className="sadp-service-metrics">
            <MetricCard label="Total Requests" value={serviceRequestStats.total} text="All submitted service requests" />
            <MetricCard label="Active" value={serviceRequestStats.active} text="Submitted or under review" />
            <MetricCard label="Completed" value={serviceRequestStats.completed} text="Approved or completed" />
            <MetricCard label="Rejected / Cancelled" value={serviceRequestStats.rejected} text="Closed without completion" />
          </div>

          <div className="sadp-filter-row">
            <input
              value={serviceRequestFilters.search}
              onChange={(e) => setServiceRequestFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search by student name, number, subject..."
            />
            <select value={serviceRequestFilters.status} onChange={(e) => setServiceRequestFilters((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="all">All Statuses</option>
              {serviceRequestStatusOptions.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
            </select>
            <select value={serviceRequestFilters.type} onChange={(e) => setServiceRequestFilters((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="all">All Request Types</option>
              {Object.entries(serviceRequestTypeLabels).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>

          {filteredServiceRequests.length === 0 ? <EmptyState title="No service requests" text="Student service requests will appear here after students submit them from their portal." /> : (
            <div className="sadp-table-wrap compact-height">
              <table className="sadp-table">
                <thead><tr><th>Student</th><th>Type</th><th>Subject</th><th>Status</th><th>Priority</th><th>Submitted</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredServiceRequests.map((request) => (
                    <tr key={request.id} className={selectedServiceRequest?.id === request.id ? "selected" : ""}>
                      <td><strong>{serviceRequestStudentNumber(request)}</strong><small>{serviceRequestStudentName(request)}</small></td>
                      <td>{serviceRequestTypeLabel(request.request_type)}</td>
                      <td><strong>{request.subject}</strong><small>{request.description}</small></td>
                      <td><span className={`sadp-badge ${serviceRequestStatusType(request.status)}`}>{formatValue(String(request.status || "").replaceAll("_", " "))}</span></td>
                      <td>{formatValue(request.priority)}</td>
                      <td>{formatDate(request.created_at)}</td>
                      <td><button className="sadp-btn small primary" onClick={() => selectServiceRequest(request)}>Review</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="sadp-card wide-card service-request-details-card">
          {!selectedServiceRequest ? <EmptyState title="Select a request" text="Choose a student service request to review details and update its status." /> : (
            <>
              <div className="sadp-student-header">
                <div>
                  <span className="sadp-section-kicker">Request #{selectedServiceRequest.id}</span>
                  <h2>{selectedServiceRequest.subject}</h2>
                  <p>{serviceRequestTypeLabel(selectedServiceRequest.request_type)} · {serviceRequestStudentNumber(selectedServiceRequest)} · {serviceRequestStudentName(selectedServiceRequest)}</p>
                </div>
                <span className={`sadp-badge ${serviceRequestStatusType(selectedServiceRequest.status)}`}>{formatValue(String(selectedServiceRequest.status || "").replaceAll("_", " "))}</span>
              </div>

              <div className="sadp-info-grid compact">
                <InfoItem label="Student" value={`${serviceRequestStudentNumber(selectedServiceRequest)} - ${serviceRequestStudentName(selectedServiceRequest)}`} wide />
                <InfoItem label="Request type" value={serviceRequestTypeLabel(selectedServiceRequest.request_type)} />
                <InfoItem label="Priority" value={selectedServiceRequest.priority} />
                <InfoItem label="Submitted at" value={formatDate(selectedServiceRequest.created_at)} />
                <InfoItem label="Reviewed by" value={selectedServiceRequest.reviewed_by?.full_name || selectedServiceRequest.reviewedBy?.full_name} />
                <InfoItem label="Reviewed at" value={formatDate(selectedServiceRequest.reviewed_at)} />
              </div>

              <div className="sadp-request-body">
                <h3>Student Description</h3>
                <p>{selectedServiceRequest.description || "No description provided."}</p>
              </div>

              <form className="sadp-form single" onSubmit={submitServiceRequestStatus}>
                <label className="sadp-field">
                  <span>Status</span>
                  <select value={serviceStatusForm.status} onChange={(e) => setField(setServiceStatusForm, "status", e.target.value)} disabled={!can.manageServiceRequests}>
                    {serviceRequestStatusOptions.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
                  </select>
                </label>
                <TextAreaField label="Staff Response / Note to Student" value={serviceStatusForm.staff_response} onChange={(v) => setField(setServiceStatusForm, "staff_response", v)} disabled={!can.manageServiceRequests} />
                <div className="sadp-form-footer full">
                  <span>The student will see the updated status and staff response inside Student Portal → My Requests.</span>
                  <button className="sadp-btn primary" disabled={!can.manageServiceRequests || busyAction === "service-request-status"}>{busyAction === "service-request-status" ? "Saving..." : "Update Request"}</button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    );
  }

  function renderActiveTab() {
    if (activeTab === "overview") return renderOverview();
    if (activeTab === "students") return renderStudents();
    if (activeTab === "create") return renderCreateStudent();
    if (activeTab === "schedules") return renderSchedules();
    if (activeTab === "attendance") return renderAttendanceLimits();
    if (activeTab === "notifications") return renderNotifications();
    if (activeTab === "serviceRequests") return renderServiceRequests();
    return renderOverview();
  }

  if (loading) {
    return (
      <div className="sadp-page">
        <style>{styles}</style>
        <div className="sadp-loader-card">
          <div className="sadp-spinner" />
          <h2>Loading Student Affairs workspace...</h2>
          <p>Preparing student records, schedules, attendance limits, and notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sadp-page">
      <style>{styles}</style>

      <header className="sadp-header">
        <div className="sadp-header-left">
          <div className="sadp-logo">SA</div>
          <div>
            <span className="sadp-kicker">University Management System</span>
            <h1>Student Affairs Department</h1>
            <p>Manage student registration, records, weekly schedules, lecture limits, and student notifications.</p>
          </div>
        </div>
        <div className="sadp-header-actions">
          <button className="sadp-btn ghost" onClick={refreshAll} disabled={refreshing}>{refreshing ? "Refreshing..." : "Refresh"}</button>
          <button className="sadp-btn danger" onClick={logout}>Logout</button>
        </div>
      </header>

      {pageError && <div className="sadp-alert danger">{pageError}</div>}
      {actionMessage.text && <div className={`sadp-alert ${actionMessage.type}`}>{actionMessage.text}</div>}
      {renderLookupsWarning()}

      <section className="sadp-hero-grid">
        <div className="sadp-profile-card">
          <div className="sadp-avatar">{(profile?.full_name || "SA").slice(0, 2).toUpperCase()}</div>
          <div>
            <span className="sadp-kicker">Signed in as</span>
            <h2>{profile?.full_name || FALLBACK}</h2>
            <p>{profile?.employee?.job_title || "Student Affairs Employee"}</p>
            <small>{profile?.employee?.department?.name || profile?.employee?.department?.code || "Student Affairs"}</small>
          </div>
        </div>
        <MetricCard label="Total Students" value={stats.students} text="All visible student records" />
        <MetricCard label="Active Registration" value={stats.activeStudents} text="Currently active students" />
        <MetricCard label="Stopped / Pending" value={stats.stoppedStudents} text="Needs follow-up" />
        <MetricCard label="Class Schedules" value={stats.schedules} text="Created weekly schedules" />
        <MetricCard label="Lecture Limits" value={stats.attendanceLimits} text="Configured course limits" />
        <MetricCard label="Service Requests" value={stats.activeServiceRequests} text="Student requests needing follow-up" />
      </section>

      <nav className="sadp-tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </nav>

      {renderActiveTab()}
    </div>
  );
}

function MetricCard({ label, value, text }) {
  return (
    <div className="sadp-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{text}</p>
    </div>
  );
}

function SimpleGradeTable({ rows }) {
  if (!rows || rows.length === 0) return <EmptyState title="No grades" text="No grades were returned for this student." />;
  return (
    <div className="sadp-table-wrap">
      <table className="sadp-table compact-table">
        <thead><tr><th>Course</th><th>Coursework</th><th>Practical</th><th>Exam</th><th>Final</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((row, index) => {
            const grade = row.grade || row;
            return (
              <tr key={row.id || row.enrollment_id || index}>
                <td>{row.course?.code || row.course_code} {row.course?.name || row.course_name}</td>
                <td>{formatValue(grade.coursework_mark)}</td>
                <td>{formatValue(grade.practical_mark)}</td>
                <td>{formatValue(grade.exam_mark)}</td>
                <td>{formatValue(grade.final_mark)}</td>
                <td><StatusBadge value={grade.result_status || row.result_status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SimpleAttendanceTable({ rows }) {
  if (!rows || rows.length === 0) return <EmptyState title="No attendance" text="No attendance records were returned for this student." />;
  return (
    <div className="sadp-table-wrap">
      <table className="sadp-table compact-table">
        <thead><tr><th>Course</th><th>Attendance Count</th><th>Recent Records</th></tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.enrollment_id || index}>
              <td>{row.course_name || row.course?.name || row.course_id}</td>
              <td>{formatValue(row.attendance_count)}</td>
              <td>{(row.records || []).slice(0, 4).map((r) => formatDate(r.attendance_date)).join(", ") || FALLBACK}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleCarriedCourses({ rows }) {
  if (!rows || rows.length === 0) return <EmptyState title="No carried courses" text="The student has no carried courses in the current response." />;
  return (
    <div className="sadp-table-wrap">
      <table className="sadp-table compact-table">
        <thead><tr><th>Course</th><th>Study Year</th><th>Semester</th><th>Final Mark</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.enrollment_id || index}>
              <td>{row.course_code} {row.course_name}</td>
              <td>{row.study_year}</td>
              <td>{row.semester_number}</td>
              <td>{row.grade?.final_mark}</td>
              <td><StatusBadge value={row.grade?.result_status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = `
:root {
  --sadp-main: #2980b9;
  --sadp-main-dark: #1f6694;
  --sadp-main-soft: rgba(41, 128, 185, 0.12);
  --sadp-bg: #f5f8fb;
  --sadp-card: #ffffff;
  --sadp-text: #172033;
  --sadp-muted: #64748b;
  --sadp-border: #e2e8f0;
  --sadp-danger: #dc2626;
  --sadp-success: #16a34a;
  --sadp-warning: #d97706;
}

.sadp-page {
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(41, 128, 185, 0.18), transparent 32%), var(--sadp-bg);
  padding: 28px;
  color: var(--sadp-text);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.sadp-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  background: linear-gradient(135deg, #172033, #2980b9);
  color: #fff;
  padding: 26px;
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
}

.sadp-header-left { display: flex; align-items: center; gap: 18px; }
.sadp-logo { width: 64px; height: 64px; border-radius: 22px; background: rgba(255,255,255,.15); display: grid; place-items: center; font-weight: 900; font-size: 24px; }
.sadp-kicker, .sadp-section-kicker { text-transform: uppercase; letter-spacing: .08em; font-size: 12px; font-weight: 800; color: #8ec8ee; }
.sadp-section-kicker { color: var(--sadp-main); }
.sadp-header h1 { margin: 4px 0 6px; font-size: 34px; }
.sadp-header p { margin: 0; color: rgba(255,255,255,.82); }
.sadp-header-actions { display: flex; gap: 10px; flex-wrap: wrap; }

.sadp-hero-grid { display: grid; grid-template-columns: 1.5fr repeat(5, 1fr); gap: 16px; margin: 22px 0; }
.sadp-profile-card, .sadp-metric-card, .sadp-card, .sadp-loader-card { background: var(--sadp-card); border: 1px solid var(--sadp-border); border-radius: 24px; box-shadow: 0 14px 34px rgba(15, 23, 42, .08); }
.sadp-profile-card { padding: 18px; display: flex; align-items: center; gap: 16px; }
.sadp-avatar { width: 58px; height: 58px; border-radius: 20px; background: var(--sadp-main-soft); color: var(--sadp-main-dark); display: grid; place-items: center; font-size: 22px; font-weight: 900; }
.sadp-profile-card h2 { margin: 3px 0; font-size: 20px; }
.sadp-profile-card p, .sadp-profile-card small { display: block; margin: 0; color: var(--sadp-muted); }
.sadp-metric-card { padding: 18px; }
.sadp-metric-card span { color: var(--sadp-muted); font-size: 13px; font-weight: 700; }
.sadp-metric-card strong { display: block; font-size: 30px; margin: 8px 0 5px; }
.sadp-metric-card p { margin: 0; color: var(--sadp-muted); font-size: 13px; }

.sadp-tabs { display: flex; gap: 10px; flex-wrap: wrap; margin: 16px 0 22px; }
.sadp-tabs button { border: 1px solid var(--sadp-border); background: #fff; color: var(--sadp-muted); padding: 12px 16px; border-radius: 999px; cursor: pointer; font-weight: 800; }
.sadp-tabs button.active { background: var(--sadp-main); border-color: var(--sadp-main); color: white; box-shadow: 0 10px 24px rgba(41,128,185,.28); }

.sadp-content-grid { display: grid; grid-template-columns: minmax(320px, .9fr) minmax(420px, 1.5fr); gap: 18px; align-items: start; }
.sadp-content-grid.student-grid { grid-template-columns: minmax(420px, .8fr) minmax(600px, 1.4fr); }
.sadp-card { padding: 20px; }
.sadp-card.wide-card { grid-column: 1 / -1; }
.sadp-card-title-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 16px; }
.sadp-card h2 { margin: 2px 0 0; font-size: 21px; }

.sadp-btn { border: 0; border-radius: 14px; padding: 11px 16px; cursor: pointer; font-weight: 900; background: #eef2f7; color: var(--sadp-text); transition: .18s ease; }
.sadp-btn:hover { transform: translateY(-1px); }
.sadp-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
.sadp-btn.primary { background: var(--sadp-main); color: white; }
.sadp-btn.secondary { background: #172033; color: white; }
.sadp-btn.ghost { background: rgba(255,255,255,.14); color: inherit; border: 1px solid rgba(255,255,255,.26); }
.sadp-btn.danger { background: #fee2e2; color: #991b1b; }
.sadp-btn.small { padding: 8px 11px; border-radius: 11px; font-size: 12px; }

.sadp-alert, .sadp-warning-box, .sadp-error-note { border-radius: 18px; padding: 14px 16px; margin-bottom: 14px; }
.sadp-alert.success { background: #dcfce7; color: #166534; }
.sadp-alert.danger, .sadp-error-note { background: #fee2e2; color: #991b1b; }
.sadp-warning-box { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }
.sadp-warning-box p { margin: 6px 0; }
.sadp-warning-box ul { margin: 6px 0 0; padding-left: 18px; }

.sadp-scope-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.sadp-scope-item { padding: 16px; background: #f8fafc; border: 1px solid var(--sadp-border); border-radius: 18px; }
.sadp-scope-item p { margin: 6px 0 0; color: var(--sadp-muted); line-height: 1.5; }

.sadp-pill-list { display: flex; flex-wrap: wrap; gap: 8px; }
.sadp-permission-pill { padding: 8px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; }
.sadp-permission-pill.enabled { background: #dcfce7; color: #166534; }
.sadp-permission-pill.disabled { background: #f1f5f9; color: #94a3b8; }

.sadp-filter-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.sadp-filter-row input, .sadp-filter-row select { flex: 1; min-width: 150px; border: 1px solid var(--sadp-border); border-radius: 14px; padding: 12px; background: #fff; }

.sadp-table-wrap { width: 100%; overflow: auto; border: 1px solid var(--sadp-border); border-radius: 18px; }
.sadp-table-wrap.compact-height { max-height: 650px; }
.sadp-table { width: 100%; border-collapse: collapse; background: #fff; }
.sadp-table th, .sadp-table td { text-align: left; border-bottom: 1px solid var(--sadp-border); padding: 12px; vertical-align: top; }
.sadp-table th { background: #f8fafc; color: var(--sadp-muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
.sadp-table tr:last-child td { border-bottom: 0; }
.sadp-table tr.selected td { background: var(--sadp-main-soft); }
.sadp-table small { display: block; color: var(--sadp-muted); margin-top: 4px; }
.sadp-table.compact-table th, .sadp-table.compact-table td { padding: 10px; font-size: 13px; }

.sadp-student-header { display: flex; justify-content: space-between; gap: 14px; align-items: start; border-bottom: 1px solid var(--sadp-border); padding-bottom: 16px; margin-bottom: 16px; }
.sadp-student-header h2 { margin: 3px 0; font-size: 24px; }
.sadp-student-header p { margin: 0; color: var(--sadp-muted); }
.sadp-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
.sadp-info-grid.compact { grid-template-columns: repeat(2, 1fr); }
.sadp-info-item { background: #f8fafc; border: 1px solid var(--sadp-border); border-radius: 16px; padding: 12px; }
.sadp-info-item.wide { grid-column: 1 / -1; }
.sadp-info-item span { display: block; color: var(--sadp-muted); font-size: 12px; margin-bottom: 5px; font-weight: 800; }
.sadp-info-item strong { font-size: 14px; }

.sadp-inner-tabs details { border: 1px solid var(--sadp-border); border-radius: 18px; padding: 14px; margin-bottom: 12px; background: #fff; }
.sadp-inner-tabs summary { cursor: pointer; font-weight: 900; color: var(--sadp-main-dark); }
.sadp-mini-title { margin: 18px 0 8px; font-size: 16px; }

.sadp-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.sadp-form.single { grid-template-columns: 1fr; }
.sadp-field { display: flex; flex-direction: column; gap: 7px; }
.sadp-field.wide, .sadp-form-footer.full { grid-column: 1 / -1; }
.sadp-field span, .sadp-check-field span { color: var(--sadp-muted); font-size: 13px; font-weight: 800; }
.sadp-field input, .sadp-field select, .sadp-field textarea { border: 1px solid var(--sadp-border); border-radius: 14px; padding: 12px; background: #fff; font: inherit; outline: none; }
.sadp-field input:focus, .sadp-field select:focus, .sadp-field textarea:focus { border-color: var(--sadp-main); box-shadow: 0 0 0 4px var(--sadp-main-soft); }
.sadp-check-field { display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border: 1px solid var(--sadp-border); border-radius: 14px; }
.sadp-check-field input { width: 18px; height: 18px; }
.sadp-form-footer { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.sadp-form-footer span { color: var(--sadp-muted); font-size: 13px; }
.sadp-two-columns { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 12px; }

.sadp-badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 900; }
.sadp-badge.success { background: #dcfce7; color: #166534; }
.sadp-badge.danger { background: #fee2e2; color: #991b1b; }
.sadp-badge.warning { background: #fef3c7; color: #92400e; }
.sadp-badge.neutral { background: #f1f5f9; color: #475569; }

.sadp-empty { text-align: center; padding: 26px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 18px; }
.sadp-empty-icon { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: var(--sadp-main-soft); color: var(--sadp-main-dark); margin: 0 auto 10px; font-weight: 900; }
.sadp-empty h3 { margin: 0 0 6px; }
.sadp-empty p { margin: 0; color: var(--sadp-muted); }

.sadp-schedule-list { display: grid; gap: 14px; }
.sadp-schedule-card { border: 1px solid var(--sadp-border); border-radius: 18px; padding: 14px; background: #fff; }
.sadp-schedule-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 12px; }
.sadp-schedule-head p { margin: 4px 0 0; color: var(--sadp-muted); }

.sadp-notification-list { display: grid; gap: 12px; }
.sadp-notification { display: flex; justify-content: space-between; gap: 14px; border: 1px solid var(--sadp-border); border-radius: 16px; padding: 14px; background: #fff; }
.sadp-notification p { margin: 6px 0; color: var(--sadp-muted); }
.sadp-notification small { color: var(--sadp-muted); }

.sadp-content-grid.service-requests-grid { grid-template-columns: minmax(560px, 1.35fr) minmax(420px, .9fr); }
.sadp-service-metrics { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 10px; margin-bottom: 14px; }
.sadp-service-metrics .sadp-metric-card { padding: 13px; border-radius: 16px; box-shadow: none; }
.sadp-service-metrics .sadp-metric-card strong { font-size: 22px; }
.sadp-service-metrics .sadp-metric-card p { font-size: 12px; }
.sadp-section-kicker { display: inline-block; color: var(--sadp-main); font-size: 11px; letter-spacing: .08em; font-weight: 900; text-transform: uppercase; }
.sadp-request-body { border: 1px solid var(--sadp-border); border-radius: 18px; background: #f8fafc; padding: 15px; margin-bottom: 16px; }
.sadp-request-body h3 { margin: 0 0 8px; font-size: 15px; color: var(--sadp-main-dark); }
.sadp-request-body p { margin: 0; color: var(--sadp-muted); line-height: 1.65; }
.service-request-details-card { position: sticky; top: 16px; }

.sadp-loader-card { max-width: 520px; margin: 12vh auto; padding: 34px; text-align: center; }
.sadp-loader-card p { color: var(--sadp-muted); }
.sadp-spinner { width: 44px; height: 44px; border-radius: 50%; border: 4px solid #e2e8f0; border-top-color: var(--sadp-main); margin: 0 auto 18px; animation: sadp-spin .9s linear infinite; }
@keyframes sadp-spin { to { transform: rotate(360deg); } }

@media (max-width: 1280px) {
  .sadp-hero-grid { grid-template-columns: repeat(3, 1fr); }
  .sadp-profile-card { grid-column: 1 / -1; }
  .sadp-content-grid, .sadp-content-grid.student-grid, .sadp-content-grid.service-requests-grid { grid-template-columns: 1fr; }
  .sadp-scope-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 760px) {
  .sadp-page { padding: 16px; }
  .sadp-header, .sadp-header-left, .sadp-header-actions, .sadp-card-title-row, .sadp-student-header, .sadp-schedule-head, .sadp-form-footer, .sadp-notification { flex-direction: column; align-items: flex-start; }
  .sadp-hero-grid, .sadp-scope-grid, .sadp-info-grid, .sadp-info-grid.compact, .sadp-form, .sadp-two-columns, .sadp-service-metrics { grid-template-columns: 1fr; }
  .sadp-header h1 { font-size: 25px; }
  .sadp-btn, .sadp-header-actions, .sadp-header-actions .sadp-btn { width: 100%; }
  .service-request-details-card { position: static; }

}
`;
