import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/axios";

const FALLBACK_TEXT = "Not available";

const examPermissions = [
  "close academic year",
  "manage student grades",
  "manage grade objections",
  "manage exam schedules",
  "manage supplementary exam schedules",
  "review supplementary requests",
];

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  sent_to_doctor: "Sent to Doctor",
  doctor_responded: "Doctor Responded",
  rejected_by_exams: "Rejected by Exams",
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
  current: "Current",
  closed: "Closed",
  open: "Open",
  true: "Yes",
  false: "No",
};

const statusClasses = {
  submitted: "warning",
  under_review: "warning",
  sent_to_doctor: "info",
  doctor_responded: "info",
  pending: "warning",
  approved: "success",
  passed: "success",
  current: "success",
  true: "success",
  rejected_by_exams: "danger",
  rejected: "danger",
  failed: "danger",
  closed: "danger",
  false: "neutral",
};

const objectionTargetLabels = {
  coursework: "Coursework Mark / 100",
  practical: "Practical Mark / 100",
  exam: "Exam Mark / 100",
};

function formatValue(value) {
  if (value === null || value === undefined || value === "") return FALLBACK_TEXT;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

function formatDate(value) {
  if (!value) return FALLBACK_TEXT;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

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
  if (!error) return "";
  if (error.response?.status === 401) return "Session expired. Please login again.";
  if (error.response?.status === 403) return "This action is blocked by backend permissions.";
  if (error.response?.status === 404) return "Endpoint or record was not found.";
  if (error.response?.data?.errors) {
    const firstKey = Object.keys(error.response.data.errors)[0];
    const firstError = error.response.data.errors[firstKey]?.[0];
    if (firstError) return firstError;
  }
  return error.response?.data?.message || error.message || "Request failed.";
}

function StatusBadge({ value }) {
  const raw = value === true || value === false ? String(value) : value;
  const label = value === true || value === false ? formatValue(value) : statusLabels[value] || formatValue(value);
  const type = statusClasses[raw] || "neutral";
  return <span className={`edp-badge ${type}`}>{label}</span>;
}

function EmptyState({ title, text }) {
  return (
    <div className="edp-empty">
      <div className="edp-empty-icon">i</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ErrorNote({ message }) {
  if (!message) return null;
  return <div className="edp-error-note">{message}</div>;
}

function InfoItem({ label, value, wide = false }) {
  return (
    <div className={`edp-info-item ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{formatValue(value)}</strong>
    </div>
  );
}

function getStudentName(item) {
  return item?.student?.user?.full_name || item?.student?.full_name || FALLBACK_TEXT;
}

function getStudentNumber(item) {
  return item?.student?.student_number || FALLBACK_TEXT;
}

function getCourseName(item) {
  return item?.enrollment?.course?.name || item?.course?.name || FALLBACK_TEXT;
}

function getCourseCode(item) {
  return item?.enrollment?.course?.code || item?.course?.code || FALLBACK_TEXT;
}

function getAcademicYearName(item) {
  return (
    item?.academic_year?.name ||
    item?.academicYear?.name ||
    item?.enrollment?.academic_year?.name ||
    item?.enrollment?.academicYear?.name ||
    FALLBACK_TEXT
  );
}

function getGrade(item) {
  return item?.enrollment?.grade || item?.grade || null;
}

function getCurrentGradeValue(objection, field) {
  const grade = getGrade(objection);
  return grade?.[field];
}

function isEmptyInput(value) {
  return value === null || value === undefined || value === "";
}


function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getGradePayloadFromStudentRow(row) {
  return row?.current_grade || row?.grade || null;
}

function buildGradeFormFromPayload(grade) {
  return {
    coursework_mark: grade?.coursework_mark ?? "",
    practical_mark: grade?.practical_mark ?? "",
    exam_mark: grade?.exam_mark ?? "",
    is_locked: Boolean(grade?.is_locked),
  };
}


function calculateFinalPreview(form) {
  const coursework = toNullableNumber(form?.coursework_mark);
  const practical = toNullableNumber(form?.practical_mark);
  const exam = toNullableNumber(form?.exam_mark);

  if (coursework === null || practical === null || exam === null) return "-";

  return (coursework * 0.2 + practical * 0.2 + exam * 0.6).toFixed(2);
}

function buildGradeRequestPayload(form) {
  return {
    coursework_mark: toNullableNumber(form.coursework_mark),
    practical_mark: toNullableNumber(form.practical_mark),
    exam_mark: toNullableNumber(form.exam_mark),
    is_locked: Boolean(form.is_locked),
  };
}

export default function ExaminationsDepts() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("grades");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [sectionErrors, setSectionErrors] = useState({});
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const [profile, setProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [objections, setObjections] = useState([]);
  const [supplementaryRequests, setSupplementaryRequests] = useState([]);
  const [examSchedules, setExamSchedules] = useState([]);
  const [supplementarySchedules, setSupplementarySchedules] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [gradeCourseId, setGradeCourseId] = useState("");
  const [gradeAcademicYearId, setGradeAcademicYearId] = useState("");
  const [gradingStudents, setGradingStudents] = useState([]);
  const [gradingMeta, setGradingMeta] = useState({ course: null, academic_year: null, students_count: 0 });
  const [gradeForms, setGradeForms] = useState({});
  const [quickEntryResult, setQuickEntryResult] = useState(null);
  const [quickGradeForm, setQuickGradeForm] = useState({
    academic_year_id: "",
    course_id: "",
    course_code: "",
    student_number: "",
    coursework_mark: "",
    practical_mark: "",
    exam_mark: "",
    is_locked: false,
  });

  const [objectionFilter, setObjectionFilter] = useState("all");
  const [supplementaryFilter, setSupplementaryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [reviewForms, setReviewForms] = useState({});
  const [finalForms, setFinalForms] = useState({});
  const [supplementaryForms, setSupplementaryForms] = useState({});
  const [busyAction, setBusyAction] = useState("");

  const [regularScheduleForm, setRegularScheduleForm] = useState({
    course_id: "",
    academic_year_id: "",
    semester_number: "1",
    exam_date: "",
    exam_room: "",
  });
  const [supplementaryScheduleForm, setSupplementaryScheduleForm] = useState({
    course_id: "",
    academic_year_id: "",
    exam_date: "",
    exam_room: "",
  });
  const [closingForm, setClosingForm] = useState({ academic_year_id: "", password: "" });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const user = profile?.user || null;
  const employee = user?.employee || null;
  const department = employee?.department || null;
  const userName = user?.full_name || "Examinations Officer";
  const initials = useMemo(() => {
    return (
      userName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "EX"
    );
  }, [userName]);

  const hasExamAccess = useMemo(() => {
    const departmentCode = department?.code || user?.doctor?.department?.code;
    return departmentCode === "exams" || permissions.some((permission) => examPermissions.includes(permission));
  }, [department?.code, user?.doctor?.department?.code, permissions]);

  const currentAcademicYear = useMemo(() => {
    return academicYears.find((year) => year.is_current) || academicYears[0] || null;
  }, [academicYears]);


  const gradingStats = useMemo(() => {
    const locked = gradingStudents.filter((row) => getGradePayloadFromStudentRow(row)?.is_locked).length;
    const saved = gradingStudents.filter((row) => getGradePayloadFromStudentRow(row)?.id).length;
    return {
      loaded: gradingStudents.length,
      saved,
      locked,
      pending: Math.max(gradingStudents.length - saved, 0),
    };
  }, [gradingStudents]);

  const filteredObjections = useMemo(() => {
    const term = search.trim().toLowerCase();
    return objections.filter((item) => {
      const matchesStatus = objectionFilter === "all" || item.status === objectionFilter;
      const haystack = [
        getStudentName(item),
        getStudentNumber(item),
        getCourseName(item),
        getCourseCode(item),
        getAcademicYearName(item),
        item.status,
        item.objection_text,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [objections, objectionFilter, search]);

  const filteredSupplementaryRequests = useMemo(() => {
    return supplementaryRequests.filter((item) => supplementaryFilter === "all" || item.status === supplementaryFilter);
  }, [supplementaryRequests, supplementaryFilter]);

  const objectionStats = useMemo(() => {
    return {
      submitted: objections.filter((item) => item.status === "submitted").length,
      underReview: objections.filter((item) => item.status === "under_review").length,
      sentToDoctor: objections.filter((item) => item.status === "sent_to_doctor").length,
      doctorResponded: objections.filter((item) => item.status === "doctor_responded").length,
      final: objections.filter((item) => ["approved", "rejected", "rejected_by_exams"].includes(item.status)).length,
    };
  }, [objections]);

  const supplementaryPendingCount = useMemo(() => {
    return supplementaryRequests.filter((item) => item.status === "submitted").length;
  }, [supplementaryRequests]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);

  async function requestWithFallback(endpoint) {
    try {
      const response = await api.get(endpoint);
      return { data: response.data, error: "" };
    } catch (error) {
      return { data: null, error: extractApiMessage(error) };
    }
  }

  async function loadPortalData(showRefreshState = false) {
    if (showRefreshState) setRefreshing(true);
    setPageError("");
    setSectionErrors({});
    setActionMessage({ type: "", text: "" });

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const meResponse = await requestWithFallback("me");
      if (!meResponse.data) {
        if (meResponse.error.includes("Session expired")) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        setPageError(meResponse.error || "Unable to load user profile.");
        return;
      }

      const loadedProfile = meResponse.data;
      const loadedPermissions = loadedProfile.permissions || [];
      setProfile(loadedProfile);
      setPermissions(loadedPermissions);
      localStorage.setItem("user", JSON.stringify(loadedProfile.user || {}));
      localStorage.setItem("permissions", JSON.stringify(loadedPermissions));

      const departmentCode = loadedProfile.user?.employee?.department?.code || loadedProfile.user?.doctor?.department?.code;
      const canOpenExamPortal = departmentCode === "exams" || loadedPermissions.some((permission) => examPermissions.includes(permission));

      if (!canOpenExamPortal) {
        setPageError("This account is not linked to the examinations department or does not have exam permissions.");
        return;
      }

      const [
        objectionsRes,
        supplementaryRequestsRes,
        examSchedulesRes,
        supplementarySchedulesRes,
        academicYearsRes,
        coursesRes,
        notificationsRes,
      ] = await Promise.all([
        requestWithFallback("grade-objections"),
        requestWithFallback("supplementary-requests"),
        requestWithFallback("exam-schedules"),
        requestWithFallback("supplementary-exam-schedules"),
        requestWithFallback("academic-years"),
        requestWithFallback("courses"),
        requestWithFallback("notifications/me"),
      ]);

      setObjections(normalizeCollection(objectionsRes.data));
      setSupplementaryRequests(normalizeCollection(supplementaryRequestsRes.data));
      setExamSchedules(normalizeCollection(examSchedulesRes.data));
      setSupplementarySchedules(normalizeCollection(supplementarySchedulesRes.data));
      setAcademicYears(normalizeCollection(academicYearsRes.data));
      setCourses(normalizeCollection(coursesRes.data));
      setNotifications(normalizeCollection(notificationsRes.data, "notifications"));

      setSectionErrors({
        objections: objectionsRes.error,
        supplementaryRequests: supplementaryRequestsRes.error,
        examSchedules: examSchedulesRes.error,
        supplementarySchedules: supplementarySchedulesRes.error,
        academicYears: academicYearsRes.error,
        courses: coursesRes.error,
        notifications: notificationsRes.error,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPortalData(false);
  }, []);


  useEffect(() => {
    if (!gradeAcademicYearId && currentAcademicYear?.id) {
      setGradeAcademicYearId(String(currentAcademicYear.id));
      setQuickGradeForm((prev) => ({ ...prev, academic_year_id: String(currentAcademicYear.id) }));
    }
  }, [currentAcademicYear?.id, gradeAcademicYearId]);

  useEffect(() => {
    if (!gradeCourseId && courses.length) {
      setGradeCourseId(String(courses[0].id));
      setQuickGradeForm((prev) => ({ ...prev, course_id: String(courses[0].id), course_code: courses[0].code || "" }));
    }
  }, [courses, gradeCourseId]);

  async function logout() {
    try {
      await api.post("logout");
    } catch {
      // Local logout still has to happen even when the token is already expired.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      navigate("/login");
    }
  }

  function updateReviewForm(id, value) {
    setReviewForms((prev) => ({ ...prev, [id]: value }));
  }

  function updateFinalForm(id, patch) {
    setFinalForms((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  }

  function updateSupplementaryForm(id, value) {
    setSupplementaryForms((prev) => ({ ...prev, [id]: value }));
  }

  function replaceObjection(updated) {
    if (!updated?.id) return;
    setObjections((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  function replaceSupplementaryRequest(updated) {
    if (!updated?.id) return;
    setSupplementaryRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function runAction(actionKey, callback, successFallback = "Action completed successfully.") {
    setBusyAction(actionKey);
    setActionMessage({ type: "", text: "" });
    try {
      const response = await callback();
      setActionMessage({ type: "success", text: response.data?.message || successFallback });
      return response;
    } catch (error) {
      setActionMessage({ type: "error", text: extractApiMessage(error) });
      return null;
    } finally {
      setBusyAction("");
    }
  }

  async function markUnderReview(objectionId) {
    const response = await runAction(
      `under-review-${objectionId}`,
      () => api.patch(`grade-objections/${objectionId}/under-review`),
      "Objection marked as under review."
    );
    if (response?.data?.data) replaceObjection(response.data.data);
  }

  async function initialReview(objectionId, decision) {
    const note = reviewForms[objectionId] || "";
    const response = await runAction(
      `initial-${decision}-${objectionId}`,
      () =>
        api.patch(`grade-objections/${objectionId}/initial-review`, {
          initial_decision: decision,
          exam_department_note: note,
        }),
      decision === "approved" ? "Objection sent to doctor." : "Objection rejected by exams department."
    );
    if (response?.data?.data) replaceObjection(response.data.data);
  }

  async function finalDecision(objection, decision) {
    const form = finalForms[objection.id] || {};
    const payload = {
      final_decision: decision,
      final_exam_decision_note: form.final_exam_decision_note || "",
    };

    if (decision === "approved") {
      if (!isEmptyInput(form.coursework_mark)) payload.coursework_mark = form.coursework_mark;
      if (!isEmptyInput(form.practical_mark)) payload.practical_mark = form.practical_mark;
      if (!isEmptyInput(form.exam_mark)) payload.exam_mark = form.exam_mark;
    }

    const response = await runAction(
      `final-${decision}-${objection.id}`,
      () => api.patch(`grade-objections/${objection.id}/final-decision`, payload),
      "Final decision saved successfully."
    );
    if (response?.data?.data) replaceObjection(response.data.data);
  }

  async function reviewSupplementaryRequest(requestId, decision) {
    const note = supplementaryForms[requestId] || "";
    const endpoint = decision === "approved" ? "approve" : "reject";

    if (decision === "rejected" && !note.trim()) {
      setActionMessage({ type: "error", text: "A rejection note is required by the backend." });
      return;
    }

    const response = await runAction(
      `supplementary-${decision}-${requestId}`,
      () => api.patch(`supplementary-requests/${requestId}/${endpoint}`, { exam_department_note: note }),
      decision === "approved" ? "Supplementary request approved." : "Supplementary request rejected."
    );
    if (response?.data?.data) replaceSupplementaryRequest(response.data.data);
  }

  async function createRegularSchedule(e) {
    e.preventDefault();
    const response = await runAction(
      "create-regular-schedule",
      () => api.post("exam-schedules", regularScheduleForm),
      "Exam schedule created successfully."
    );
    if (response?.data?.data) {
      setExamSchedules((prev) => [response.data.data, ...prev]);
      setRegularScheduleForm({ course_id: "", academic_year_id: "", semester_number: "1", exam_date: "", exam_room: "" });
    }
  }

  async function createSupplementarySchedule(e) {
    e.preventDefault();
    const response = await runAction(
      "create-supplementary-schedule",
      () => api.post("supplementary-exam-schedules", supplementaryScheduleForm),
      "Supplementary exam schedule created successfully."
    );
    if (response?.data?.data) {
      setSupplementarySchedules((prev) => [response.data.data, ...prev]);
      setSupplementaryScheduleForm({ course_id: "", academic_year_id: "", exam_date: "", exam_room: "" });
    }
  }

  async function deleteRegularSchedule(scheduleId) {
    const response = await runAction(
      `delete-regular-${scheduleId}`,
      () => api.delete(`exam-schedules/${scheduleId}`),
      "Exam schedule deleted successfully."
    );
    if (response) setExamSchedules((prev) => prev.filter((item) => item.id !== scheduleId));
  }

  async function deleteSupplementarySchedule(scheduleId) {
    const response = await runAction(
      `delete-supplementary-${scheduleId}`,
      () => api.delete(`supplementary-exam-schedules/${scheduleId}`),
      "Supplementary exam schedule deleted successfully."
    );
    if (response) setSupplementarySchedules((prev) => prev.filter((item) => item.id !== scheduleId));
  }

  async function closeAcademicYear(e) {
    e.preventDefault();
    if (!closingForm.academic_year_id || !closingForm.password) {
      setActionMessage({ type: "error", text: "Please choose an academic year and enter your password." });
      return;
    }

    const response = await runAction(
      "close-academic-year",
      () => api.post(`exams/academic-years/${closingForm.academic_year_id}/confirm-end`, { password: closingForm.password }),
      "Academic year closed successfully."
    );
    if (response) {
      setClosingForm({ academic_year_id: "", password: "" });
      loadPortalData(true);
    }
  }


  function seedGradeForms(rows) {
    const nextForms = {};
    rows.forEach((row) => {
      if (row.enrollment_id) {
        nextForms[row.enrollment_id] = buildGradeFormFromPayload(getGradePayloadFromStudentRow(row));
      }
    });
    setGradeForms(nextForms);
  }

  function updateGradeForm(enrollmentId, patch) {
    setGradeForms((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...(prev[enrollmentId] || {}),
        ...patch,
      },
    }));
  }

  function mergeUpdatedGrade(enrollmentId, grade) {
    if (!enrollmentId || !grade) return;
    setGradingStudents((prev) =>
      prev.map((row) => {
        if (row.enrollment_id !== enrollmentId) return row;
        if (row.current_grade !== undefined) return { ...row, current_grade: grade };
        return { ...row, grade };
      })
    );
    setGradeForms((prev) => ({
      ...prev,
      [enrollmentId]: buildGradeFormFromPayload(grade),
    }));
  }

  async function loadStudentsForGrading(e) {
    if (e) e.preventDefault();
    if (!gradeCourseId || !gradeAcademicYearId) {
      setActionMessage({ type: "error", text: "Please select a course and an academic year first." });
      return;
    }

    const response = await runAction(
      "load-grading-students",
      () => api.get(`courses/${gradeCourseId}/academic-years/${gradeAcademicYearId}/students-for-grading`),
      "Students eligible for grade entry loaded successfully."
    );

    if (response?.data) {
      const rows = normalizeCollection(response.data, "students");
      setGradingStudents(rows);
      seedGradeForms(rows);
      setGradingMeta({
        course: response.data.course || null,
        academic_year: response.data.academic_year || null,
        students_count: response.data.students_count || rows.length,
      });
    }
  }

  async function loadCourseGrades() {
    if (!gradeCourseId || !gradeAcademicYearId) {
      setActionMessage({ type: "error", text: "Please select a course and an academic year first." });
      return;
    }

    const response = await runAction(
      "load-course-grades",
      () => api.get(`courses/${gradeCourseId}/academic-years/${gradeAcademicYearId}/grades`),
      "Course grades loaded successfully."
    );

    if (response?.data) {
      const rows = normalizeCollection(response.data, "students");
      setGradingStudents(rows);
      seedGradeForms(rows);
      setGradingMeta({
        course: response.data.course || null,
        academic_year: response.data.academic_year || null,
        students_count: response.data.students_count || rows.length,
      });
    }
  }

  async function saveSingleGrade(row) {
    const enrollmentId = row.enrollment_id;
    const form = gradeForms[enrollmentId] || buildGradeFormFromPayload(getGradePayloadFromStudentRow(row));

    const response = await runAction(
      `save-grade-${enrollmentId}`,
      () => api.post(`enrollments/${enrollmentId}/grades`, buildGradeRequestPayload(form)),
      "Grade saved successfully."
    );

    if (response?.data?.data) mergeUpdatedGrade(enrollmentId, response.data.data);
  }

  async function saveBulkGrades() {
    const grades = gradingStudents
      .filter((row) => row.enrollment_id)
      .filter((row) => !getGradePayloadFromStudentRow(row)?.is_locked)
      .map((row) => ({
        enrollment_id: row.enrollment_id,
        ...buildGradeRequestPayload(gradeForms[row.enrollment_id] || buildGradeFormFromPayload(getGradePayloadFromStudentRow(row))),
      }));

    if (!grades.length) {
      setActionMessage({ type: "error", text: "There are no editable grade rows to save." });
      return;
    }

    const response = await runAction(
      "save-bulk-grades",
      () => api.post(`courses/${gradeCourseId}/academic-years/${gradeAcademicYearId}/grades/bulk`, { grades }),
      "Grades saved successfully for the selected course."
    );

    if (response?.data?.data) {
      response.data.data.forEach((updated) => mergeUpdatedGrade(updated.enrollment_id, updated.grade));
    }
  }

  async function lockGrade(row) {
    const enrollmentId = row.enrollment_id;
    const response = await runAction(
      `lock-grade-${enrollmentId}`,
      () => api.patch(`enrollments/${enrollmentId}/grades/lock`, { is_locked: true }),
      "Grade locked successfully."
    );

    if (response?.data?.data) mergeUpdatedGrade(enrollmentId, response.data.data);
  }

  async function submitQuickGrade(e) {
    e.preventDefault();
    setQuickEntryResult(null);

    const payload = {
      academic_year_id: quickGradeForm.academic_year_id,
      student_number: quickGradeForm.student_number.trim(),
      is_locked: Boolean(quickGradeForm.is_locked),
    };

    if (quickGradeForm.course_id) payload.course_id = quickGradeForm.course_id;
    else if (quickGradeForm.course_code.trim()) payload.course_code = quickGradeForm.course_code.trim();

    if (!isEmptyInput(quickGradeForm.coursework_mark)) payload.coursework_mark = toNullableNumber(quickGradeForm.coursework_mark);
    if (!isEmptyInput(quickGradeForm.practical_mark)) payload.practical_mark = toNullableNumber(quickGradeForm.practical_mark);
    if (!isEmptyInput(quickGradeForm.exam_mark)) payload.exam_mark = toNullableNumber(quickGradeForm.exam_mark);

    const response = await runAction(
      "quick-grade-entry",
      () => api.post("grades/quick-entry", payload),
      "Grade saved successfully using quick entry."
    );

    if (response?.data?.data) {
      setQuickEntryResult(response.data.data);
      mergeUpdatedGrade(response.data.data.enrollment_id, response.data.data.grade);
      setQuickGradeForm((prev) => ({
        ...prev,
        student_number: "",
        coursework_mark: "",
        practical_mark: "",
        exam_mark: "",
        is_locked: false,
      }));
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setActionMessage({ type: "error", text: "New password confirmation does not match." });
      return;
    }

    const response = await runAction(
      "change-password",
      () => api.post("account/change-my-password", passwordForm),
      "Password changed successfully."
    );
    if (response) setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
  }

  async function markNotificationAsRead(notificationId) {
    const response = await runAction(
      `notification-read-${notificationId}`,
      () => api.patch(`notifications/${notificationId}/read`),
      "Notification marked as read."
    );
    if (response) {
      setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item)));
    }
  }

  async function markAllNotificationsAsRead() {
    const response = await runAction("notifications-read-all", () => api.patch("notifications/read-all"), "Notifications marked as read.");
    if (response) setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
  }

  function renderCourseOptions() {
    return (
      <>
        <option value="">Select course</option>
        {courses.map((course) => (
          <option value={course.id} key={course.id}>
            {course.code ? `${course.code} - ${course.name}` : course.name}
          </option>
        ))}
      </>
    );
  }

  function renderAcademicYearOptions() {
    return (
      <>
        <option value="">Select academic year</option>
        {academicYears.map((year) => (
          <option value={year.id} key={year.id}>
            {year.name}{year.is_current ? " (Current)" : ""}{year.is_closed ? " (Closed)" : ""}
          </option>
        ))}
      </>
    );
  }

  if (loading) {
    return (
      <div className="edp-page">
        <style>{examinationsDeptStyles}</style>
        <div className="edp-loader-card">
          <div className="edp-spinner" />
          <h2>Loading examinations department...</h2>
          <p>Preparing grade objections, exam schedules, and academic-year data.</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="edp-page">
        <style>{examinationsDeptStyles}</style>
        <div className="edp-loader-card error-card">
          <div className="edp-empty-icon danger">!</div>
          <h2>Unable to open examinations page</h2>
          <p>{pageError}</p>
          <div className="edp-actions-center">
            <button className="edp-btn primary" onClick={() => loadPortalData(true)} disabled={refreshing}>
              Try Again
            </button>
            <button className="edp-btn ghost" onClick={logout}>Logout</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edp-page">
      <style>{examinationsDeptStyles}</style>

      <header className="edp-header">
        <div className="edp-header-left">
          <div className="edp-avatar">{initials}</div>
          <div>
            <p className="edp-kicker">University Examinations Department</p>
            <h1>{userName}</h1>
            <div className="edp-subtitle-row">
              <span>{user?.email || FALLBACK_TEXT}</span>
              <span className="edp-dot" />
              <span>{department?.name || "Examinations Department"}</span>
            </div>
          </div>
        </div>

        <div className="edp-header-actions">
          <button className="edp-btn light" onClick={() => loadPortalData(true)} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button className="edp-btn danger" onClick={logout}>Logout</button>
        </div>
      </header>

      <section className="edp-hero-grid">
        <div className="edp-card edp-profile-card">
          <div className="edp-card-title-row">
            <h2>Department Access</h2>
            <StatusBadge value={hasExamAccess} />
          </div>
          <div className="edp-info-grid compact">
            <InfoItem label="Department" value={department?.name || department?.code} />
            <InfoItem label="Job Title" value={employee?.job_title} />
            <InfoItem label="Active Employee" value={employee?.is_active} />
            <InfoItem label="Exam Permissions" value={`${permissions.filter((item) => examPermissions.includes(item)).length} enabled`} />
          </div>
        </div>

        <div className="edp-stat-card">
          <span>Grade Rows Loaded</span>
          <strong>{gradingStats.loaded}</strong>
          <p>{gradingStats.saved} saved · {gradingStats.locked} locked.</p>
        </div>

        <div className="edp-stat-card">
          <span>New / Under Review</span>
          <strong>{objectionStats.submitted + objectionStats.underReview}</strong>
          <p>Student grade objections waiting for exams review.</p>
        </div>
        <div className="edp-stat-card">
          <span>Sent to Doctor</span>
          <strong>{objectionStats.sentToDoctor}</strong>
          <p>Objections forwarded to assigned doctors.</p>
        </div>
        <div className="edp-stat-card">
          <span>Doctor Responded</span>
          <strong>{objectionStats.doctorResponded}</strong>
          <p>Ready for final exams department decision.</p>
        </div>
        <div className="edp-stat-card">
          <span>Supplementary Pending</span>
          <strong>{supplementaryPendingCount}</strong>
          <p>Supplementary requests waiting review.</p>
        </div>
        <div className="edp-stat-card">
          <span>Current Academic Year</span>
          <strong>{currentAcademicYear?.name || "-"}</strong>
          <p>{currentAcademicYear?.is_closed ? "Closed" : "Open for processing"}</p>
        </div>
      </section>

      {actionMessage.text && <div className={`edp-form-message ${actionMessage.type}`}>{actionMessage.text}</div>}

      <nav className="edp-tabs">
        <button className={activeTab === "grades" ? "active" : ""} onClick={() => setActiveTab("grades")}>Grades Entry</button>
        <button className={activeTab === "objections" ? "active" : ""} onClick={() => setActiveTab("objections")}>Grade Objections</button>
        <button className={activeTab === "supplementary" ? "active" : ""} onClick={() => setActiveTab("supplementary")}>Supplementary Requests</button>
        <button className={activeTab === "schedules" ? "active" : ""} onClick={() => setActiveTab("schedules")}>Exam Schedules</button>
        <button className={activeTab === "academicYears" ? "active" : ""} onClick={() => setActiveTab("academicYears")}>Academic Years</button>
        <button className={activeTab === "notifications" ? "active" : ""} onClick={() => setActiveTab("notifications")}>Notifications ({unreadCount})</button>
        <button className={activeTab === "security" ? "active" : ""} onClick={() => setActiveTab("security")}>Security</button>
      </nav>

      {activeTab === "grades" && (
        <div className="edp-content-grid">
          <section className="edp-card edp-wide-card">
            <div className="edp-card-title-row wrap">
              <div>
                <h2>Course Grade Entry</h2>
                <p className="edp-muted">Select a course and academic year, load eligible students, then save grades individually or in bulk.</p>
                <p className="edp-muted strong-note">Each component mark is entered from 100. Final mark is calculated by the backend as: Coursework 20% + Practical 20% + Exam 60%.</p>
              </div>
              <div className="edp-grade-stats">
                <span className="edp-soft-pill">Loaded: {gradingStats.loaded}</span>
                <span className="edp-soft-pill">Saved: {gradingStats.saved}</span>
                <span className="edp-soft-pill">Locked: {gradingStats.locked}</span>
              </div>
            </div>
            <ErrorNote message={sectionErrors.courses || sectionErrors.academicYears} />

            <form className="edp-grade-toolbar" onSubmit={loadStudentsForGrading}>
              <label>
                Course
                <select value={gradeCourseId} onChange={(e) => setGradeCourseId(e.target.value)} required>
                  {renderCourseOptions()}
                </select>
              </label>
              <label>
                Academic Year
                <select value={gradeAcademicYearId} onChange={(e) => setGradeAcademicYearId(e.target.value)} required>
                  {renderAcademicYearOptions()}
                </select>
              </label>
              <div className="edp-toolbar-actions">
                <button className="edp-btn primary" type="submit" disabled={busyAction === "load-grading-students"}>
                  {busyAction === "load-grading-students" ? "Loading..." : "Load Eligible Students"}
                </button>
                <button className="edp-btn light" type="button" onClick={loadCourseGrades} disabled={busyAction === "load-course-grades"}>
                  {busyAction === "load-course-grades" ? "Loading..." : "Load Saved Grades"}
                </button>
                <button className="edp-btn ghost" type="button" onClick={saveBulkGrades} disabled={!gradingStudents.length || busyAction === "save-bulk-grades"}>
                  {busyAction === "save-bulk-grades" ? "Saving..." : "Save All Editable"}
                </button>
              </div>
            </form>

            {(gradingMeta.course || gradingMeta.academic_year) && (
              <div className="edp-note-box light-note">
                <span>Current Grading Context</span>
                <p>
                  {gradingMeta.course?.code ? `${gradingMeta.course.code} - ` : ""}{gradingMeta.course?.name || "Selected course"} · {gradingMeta.academic_year?.name || "Selected academic year"} · {gradingMeta.students_count || gradingStudents.length} students
                </p>
              </div>
            )}

            {gradingStudents.length ? (
              <div className="edp-table-wrapper edp-grades-table-wrapper">
                <table className="edp-table edp-grades-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Study Year</th>
                      <th>Coursework / 100</th>
                      <th>Practical / 100</th>
                      <th>Exam / 100</th>
                      <th>Final</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradingStudents.map((row) => {
                      const grade = getGradePayloadFromStudentRow(row);
                      const form = gradeForms[row.enrollment_id] || buildGradeFormFromPayload(grade);
                      const locked = Boolean(grade?.is_locked || form.is_locked);
                      const rowBusy = busyAction.endsWith(`-${row.enrollment_id}`);

                      return (
                        <tr key={row.enrollment_id} className={locked ? "edp-locked-row" : ""}>
                          <td>
                            <strong>{row.student_name || FALLBACK_TEXT}</strong>
                            <small>{row.student_number || FALLBACK_TEXT}</small>
                          </td>
                          <td>
                            <strong>{row.study_year_name || FALLBACK_TEXT}</strong>
                            <small>Semester {row.semester_number || FALLBACK_TEXT}</small>
                          </td>
                          <td>
                            <input
                              className="edp-table-input"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              disabled={locked}
                              value={form.coursework_mark}
                              onChange={(e) => updateGradeForm(row.enrollment_id, { coursework_mark: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              className="edp-table-input"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              disabled={locked}
                              value={form.practical_mark}
                              onChange={(e) => updateGradeForm(row.enrollment_id, { practical_mark: e.target.value })}
                            />
                          </td>
                          <td>
                            <input
                              className="edp-table-input"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              disabled={locked}
                              value={form.exam_mark}
                              onChange={(e) => updateGradeForm(row.enrollment_id, { exam_mark: e.target.value })}
                            />
                          </td>
                          <td>
                            <strong>{grade?.final_mark ?? calculateFinalPreview(form)}</strong>
                            <small>{grade?.final_mark ? "Saved final" : "Preview final"}: 20% + 20% + 60%</small>
                            <small>Updated: {formatDate(grade?.last_updated_at)}</small>
                          </td>
                          <td>
                            <div className="edp-stack-small">
                              <StatusBadge value={grade?.result_status || "pending"} />
                              {locked ? <span className="edp-badge danger">Locked</span> : <span className="edp-badge neutral">Editable</span>}
                            </div>
                          </td>
                          <td>
                            <div className="edp-inline-actions">
                              <button className="edp-btn small primary" type="button" disabled={locked || rowBusy} onClick={() => saveSingleGrade(row)}>
                                {busyAction === `save-grade-${row.enrollment_id}` ? "Saving..." : "Save"}
                              </button>
                              <button className="edp-btn small light-danger" type="button" disabled={locked || rowBusy || !grade?.id} onClick={() => lockGrade(row)}>
                                {busyAction === `lock-grade-${row.enrollment_id}` ? "Locking..." : "Lock"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No students loaded" text="Choose a course and academic year, then load eligible students for grade entry." />
            )}
          </section>

          <section className="edp-card">
            <div className="edp-card-title-row">
              <h2>Quick Grade Entry</h2>
            </div>
            <p className="edp-muted strong-note">Use this when you want to save one student grade quickly. Enter each mark from 100.</p>
            <form className="edp-form" onSubmit={submitQuickGrade}>
              <label>
                Academic Year
                <select value={quickGradeForm.academic_year_id} onChange={(e) => setQuickGradeForm((prev) => ({ ...prev, academic_year_id: e.target.value }))} required>
                  {renderAcademicYearOptions()}
                </select>
              </label>
              <label>
                Course
                <select
                  value={quickGradeForm.course_id}
                  onChange={(e) => {
                    const selected = courses.find((course) => String(course.id) === e.target.value);
                    setQuickGradeForm((prev) => ({ ...prev, course_id: e.target.value, course_code: selected?.code || prev.course_code }));
                  }}
                >
                  {renderCourseOptions()}
                </select>
              </label>
              <label>
                Course Code Alternative
                <input
                  value={quickGradeForm.course_code}
                  onChange={(e) => setQuickGradeForm((prev) => ({ ...prev, course_code: e.target.value, course_id: "" }))}
                  placeholder="Example: BUS101"
                />
              </label>
              <label>
                Student Number
                <input value={quickGradeForm.student_number} onChange={(e) => setQuickGradeForm((prev) => ({ ...prev, student_number: e.target.value }))} placeholder="Example: 20250001" required />
              </label>
              <div className="edp-mark-grid">
                <label>
                  Coursework / 100
                  <input type="number" min="0" max="100" step="0.01" value={quickGradeForm.coursework_mark} onChange={(e) => setQuickGradeForm((prev) => ({ ...prev, coursework_mark: e.target.value }))} />
                </label>
                <label>
                  Practical / 100
                  <input type="number" min="0" max="100" step="0.01" value={quickGradeForm.practical_mark} onChange={(e) => setQuickGradeForm((prev) => ({ ...prev, practical_mark: e.target.value }))} />
                </label>
                <label>
                  Exam / 100
                  <input type="number" min="0" max="100" step="0.01" value={quickGradeForm.exam_mark} onChange={(e) => setQuickGradeForm((prev) => ({ ...prev, exam_mark: e.target.value }))} />
                </label>
              </div>
              <label className="edp-checkbox-row">
                <input type="checkbox" checked={quickGradeForm.is_locked} onChange={(e) => setQuickGradeForm((prev) => ({ ...prev, is_locked: e.target.checked }))} />
                Lock this grade after saving
              </label>
              <button className="edp-btn primary" type="submit" disabled={busyAction === "quick-grade-entry"}>
                {busyAction === "quick-grade-entry" ? "Saving..." : "Save by Student Number"}
              </button>
            </form>
          </section>

          <section className="edp-card">
            <div className="edp-card-title-row">
              <h2>Last Quick Entry Result</h2>
            </div>
            {quickEntryResult ? (
              <div className="edp-info-grid compact">
                <InfoItem label="Student" value={`${quickEntryResult.student_name || FALLBACK_TEXT} (${quickEntryResult.student_number || FALLBACK_TEXT})`} wide />
                <InfoItem label="Course" value={`${quickEntryResult.course_code || ""} ${quickEntryResult.course_name || ""}`} wide />
                <InfoItem label="Coursework" value={quickEntryResult.grade?.coursework_mark} />
                <InfoItem label="Practical" value={quickEntryResult.grade?.practical_mark} />
                <InfoItem label="Exam" value={quickEntryResult.grade?.exam_mark} />
                <InfoItem label="Final" value={quickEntryResult.grade?.final_mark} />
                <InfoItem label="Result" value={quickEntryResult.grade?.result_status} />
                <InfoItem label="Locked" value={quickEntryResult.grade?.is_locked} />
              </div>
            ) : (
              <EmptyState title="No quick entry yet" text="After saving a grade by student number, the result will appear here." />
            )}
          </section>
        </div>
      )}

      {activeTab === "objections" && (
        <section className="edp-card">
          <div className="edp-card-title-row wrap">
            <div>
              <h2>Grade Objections Workflow</h2>
              <p className="edp-muted">Receive student objections, review them, send valid requests to doctors, and issue final decisions.</p>
            </div>
            <div className="edp-filter-row">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, number, course..." />
              <select value={objectionFilter} onChange={(e) => setObjectionFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="sent_to_doctor">Sent to Doctor</option>
                <option value="doctor_responded">Doctor Responded</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="rejected_by_exams">Rejected by Exams</option>
              </select>
            </div>
          </div>
          <ErrorNote message={sectionErrors.objections} />

          {filteredObjections.length ? (
            <div className="edp-objections-list">
              {filteredObjections.map((objection) => {
                const grade = getGrade(objection);
                const finalForm = finalForms[objection.id] || {};
                const isInitialBusy = busyAction.includes(`-${objection.id}`);

                return (
                  <article className="edp-objection-card" key={objection.id}>
                    <div className="edp-objection-head">
                      <div>
                        <h3>{getCourseName(objection)}</h3>
                        <p>{getStudentName(objection)} · Student No: {getStudentNumber(objection)}</p>
                      </div>
                      <StatusBadge value={objection.status} />
                    </div>

                    <div className="edp-info-grid compact">
                      <InfoItem label="Course Code" value={getCourseCode(objection)} />
                      <InfoItem label="Academic Year" value={getAcademicYearName(objection)} />
                      <InfoItem label="Target" value={objectionTargetLabels[objection.objection_target] || objection.objection_target} />
                      <InfoItem label="Submitted At" value={formatDate(objection.submitted_at || objection.created_at)} />
                      <InfoItem label="Coursework" value={grade?.coursework_mark} />
                      <InfoItem label="Practical" value={grade?.practical_mark} />
                      <InfoItem label="Exam" value={grade?.exam_mark} />
                      <InfoItem label="Final" value={grade?.final_mark} />
                    </div>

                    <div className="edp-note-box">
                      <span>Student Objection</span>
                      <p>{objection.objection_text || FALLBACK_TEXT}</p>
                    </div>

                    {objection.exam_department_note && (
                      <div className="edp-note-box light-note">
                        <span>Exams Department Note</span>
                        <p>{objection.exam_department_note}</p>
                      </div>
                    )}

                    {objection.doctor_response && (
                      <div className="edp-note-box success-note">
                        <span>Doctor Response</span>
                        <p>{objection.doctor_response}</p>
                        <div className="edp-mini-marks">
                          <small>Suggested coursework: {formatValue(objection.doctor_suggested_coursework_mark)}</small>
                          <small>Suggested practical: {formatValue(objection.doctor_suggested_practical_mark)}</small>
                          <small>Suggested exam: {formatValue(objection.doctor_suggested_exam_mark)}</small>
                        </div>
                      </div>
                    )}

                    {objection.status === "submitted" && (
                      <div className="edp-action-row">
                        <button className="edp-btn light" disabled={busyAction === `under-review-${objection.id}`} onClick={() => markUnderReview(objection.id)}>
                          {busyAction === `under-review-${objection.id}` ? "Saving..." : "Mark Under Review"}
                        </button>
                      </div>
                    )}

                    {(objection.status === "submitted" || objection.status === "under_review") && (
                      <div className="edp-review-panel">
                        <label>
                          Exams Department Note
                          <textarea
                            value={reviewForms[objection.id] || ""}
                            onChange={(e) => updateReviewForm(objection.id, e.target.value)}
                            placeholder="Write an internal note before sending to doctor or rejecting..."
                          />
                        </label>
                        <div className="edp-action-row">
                          <button
                            className="edp-btn primary"
                            disabled={isInitialBusy}
                            onClick={() => initialReview(objection.id, "approved")}
                          >
                            {busyAction === `initial-approved-${objection.id}` ? "Sending..." : "Send to Doctor"}
                          </button>
                          <button
                            className="edp-btn danger light-danger"
                            disabled={isInitialBusy}
                            onClick={() => initialReview(objection.id, "rejected")}
                          >
                            {busyAction === `initial-rejected-${objection.id}` ? "Rejecting..." : "Reject by Exams"}
                          </button>
                        </div>
                      </div>
                    )}

                    {objection.status === "sent_to_doctor" && (
                      <div className="edp-waiting-box">This objection has been sent to the assigned doctor and is waiting for the doctor response.</div>
                    )}

                    {objection.status === "doctor_responded" && (
                      <div className="edp-review-panel final-panel">
                        <div className="edp-card-title-row">
                          <h3>Final Exams Decision</h3>
                          <span className="edp-soft-pill">Update marks only if the objection is approved</span>
                        </div>
                        <div className="edp-mark-grid">
                          <label>
                            Coursework Mark / 100
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={finalForm.coursework_mark ?? objection.doctor_suggested_coursework_mark ?? getCurrentGradeValue(objection, "coursework_mark") ?? ""}
                              onChange={(e) => updateFinalForm(objection.id, { coursework_mark: e.target.value })}
                            />
                          </label>
                          <label>
                            Practical Mark / 100
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={finalForm.practical_mark ?? objection.doctor_suggested_practical_mark ?? getCurrentGradeValue(objection, "practical_mark") ?? ""}
                              onChange={(e) => updateFinalForm(objection.id, { practical_mark: e.target.value })}
                            />
                          </label>
                          <label>
                            Exam Mark / 100
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={finalForm.exam_mark ?? objection.doctor_suggested_exam_mark ?? getCurrentGradeValue(objection, "exam_mark") ?? ""}
                              onChange={(e) => updateFinalForm(objection.id, { exam_mark: e.target.value })}
                            />
                          </label>
                        </div>
                        <label>
                          Final Decision Note
                          <textarea
                            value={finalForm.final_exam_decision_note || ""}
                            onChange={(e) => updateFinalForm(objection.id, { final_exam_decision_note: e.target.value })}
                            placeholder="Write the final decision note..."
                          />
                        </label>
                        <div className="edp-action-row">
                          <button
                            className="edp-btn primary"
                            disabled={busyAction.includes(`-${objection.id}`)}
                            onClick={() => finalDecision(objection, "approved")}
                          >
                            {busyAction === `final-approved-${objection.id}` ? "Approving..." : "Approve & Update Grade"}
                          </button>
                          <button
                            className="edp-btn danger light-danger"
                            disabled={busyAction.includes(`-${objection.id}`)}
                            onClick={() => finalDecision(objection, "rejected")}
                          >
                            {busyAction === `final-rejected-${objection.id}` ? "Rejecting..." : "Reject Final"}
                          </button>
                        </div>
                      </div>
                    )}

                    {objection.final_exam_decision_note && (
                      <div className="edp-note-box light-note">
                        <span>Final Decision Note</span>
                        <p>{objection.final_exam_decision_note}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No grade objections" text="There are no grade objections matching the selected filters." />
          )}
        </section>
      )}

      {activeTab === "supplementary" && (
        <section className="edp-card">
          <div className="edp-card-title-row wrap">
            <div>
              <h2>Supplementary Exam Requests</h2>
              <p className="edp-muted">Review supplementary requests submitted by students and approve or reject them.</p>
            </div>
            <select value={supplementaryFilter} onChange={(e) => setSupplementaryFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <ErrorNote message={sectionErrors.supplementaryRequests} />

          {filteredSupplementaryRequests.length ? (
            <div className="edp-objections-list">
              {filteredSupplementaryRequests.map((requestRow) => {
                const grade = getGrade(requestRow);
                return (
                  <article className="edp-objection-card" key={requestRow.id}>
                    <div className="edp-objection-head">
                      <div>
                        <h3>{getCourseName(requestRow)}</h3>
                        <p>{getStudentName(requestRow)} · Student No: {getStudentNumber(requestRow)}</p>
                      </div>
                      <StatusBadge value={requestRow.status} />
                    </div>
                    <div className="edp-info-grid compact">
                      <InfoItem label="Academic Year" value={getAcademicYearName(requestRow)} />
                      <InfoItem label="Final Mark" value={grade?.final_mark} />
                      <InfoItem label="Submitted At" value={formatDate(requestRow.created_at)} />
                      <InfoItem label="Reviewed At" value={formatDate(requestRow.reviewed_at)} />
                      <InfoItem label="Student Note" value={requestRow.student_note} wide />
                      <InfoItem label="Exams Note" value={requestRow.exam_department_note} wide />
                    </div>

                    {requestRow.status === "submitted" && (
                      <div className="edp-review-panel">
                        <label>
                          Exams Department Note
                          <textarea
                            value={supplementaryForms[requestRow.id] || ""}
                            onChange={(e) => updateSupplementaryForm(requestRow.id, e.target.value)}
                            placeholder="Write approval or rejection note..."
                          />
                        </label>
                        <div className="edp-action-row">
                          <button
                            className="edp-btn primary"
                            disabled={busyAction.endsWith(`-${requestRow.id}`)}
                            onClick={() => reviewSupplementaryRequest(requestRow.id, "approved")}
                          >
                            {busyAction === `supplementary-approved-${requestRow.id}` ? "Approving..." : "Approve Request"}
                          </button>
                          <button
                            className="edp-btn danger light-danger"
                            disabled={busyAction.endsWith(`-${requestRow.id}`)}
                            onClick={() => reviewSupplementaryRequest(requestRow.id, "rejected")}
                          >
                            {busyAction === `supplementary-rejected-${requestRow.id}` ? "Rejecting..." : "Reject Request"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No supplementary requests" text="There are no supplementary exam requests matching the selected filters." />
          )}
        </section>
      )}

      {activeTab === "schedules" && (
        <div className="edp-content-grid">
          <section className="edp-card">
            <div className="edp-card-title-row">
              <h2>Create Regular Exam Schedule</h2>
            </div>
            <ErrorNote message={sectionErrors.examSchedules || sectionErrors.courses || sectionErrors.academicYears} />
            <form className="edp-form" onSubmit={createRegularSchedule}>
              <label>
                Course
                <select value={regularScheduleForm.course_id} onChange={(e) => setRegularScheduleForm((prev) => ({ ...prev, course_id: e.target.value }))} required>
                  {renderCourseOptions()}
                </select>
              </label>
              <label>
                Academic Year
                <select value={regularScheduleForm.academic_year_id} onChange={(e) => setRegularScheduleForm((prev) => ({ ...prev, academic_year_id: e.target.value }))} required>
                  {renderAcademicYearOptions()}
                </select>
              </label>
              <label>
                Semester
                <select value={regularScheduleForm.semester_number} onChange={(e) => setRegularScheduleForm((prev) => ({ ...prev, semester_number: e.target.value }))} required>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </label>
              <label>
                Exam Date
                <input type="datetime-local" value={regularScheduleForm.exam_date} onChange={(e) => setRegularScheduleForm((prev) => ({ ...prev, exam_date: e.target.value }))} required />
              </label>
              <label>
                Exam Room
                <input value={regularScheduleForm.exam_room} onChange={(e) => setRegularScheduleForm((prev) => ({ ...prev, exam_room: e.target.value }))} placeholder="Room / Hall" />
              </label>
              <button className="edp-btn primary" type="submit" disabled={busyAction === "create-regular-schedule"}>
                {busyAction === "create-regular-schedule" ? "Creating..." : "Create Schedule"}
              </button>
            </form>
          </section>

          <section className="edp-card">
            <div className="edp-card-title-row">
              <h2>Create Supplementary Schedule</h2>
            </div>
            <ErrorNote message={sectionErrors.supplementarySchedules || sectionErrors.courses || sectionErrors.academicYears} />
            <form className="edp-form" onSubmit={createSupplementarySchedule}>
              <label>
                Course
                <select value={supplementaryScheduleForm.course_id} onChange={(e) => setSupplementaryScheduleForm((prev) => ({ ...prev, course_id: e.target.value }))} required>
                  {renderCourseOptions()}
                </select>
              </label>
              <label>
                Academic Year
                <select value={supplementaryScheduleForm.academic_year_id} onChange={(e) => setSupplementaryScheduleForm((prev) => ({ ...prev, academic_year_id: e.target.value }))} required>
                  {renderAcademicYearOptions()}
                </select>
              </label>
              <label>
                Exam Date
                <input type="datetime-local" value={supplementaryScheduleForm.exam_date} onChange={(e) => setSupplementaryScheduleForm((prev) => ({ ...prev, exam_date: e.target.value }))} required />
              </label>
              <label>
                Exam Room
                <input value={supplementaryScheduleForm.exam_room} onChange={(e) => setSupplementaryScheduleForm((prev) => ({ ...prev, exam_room: e.target.value }))} placeholder="Room / Hall" />
              </label>
              <button className="edp-btn primary" type="submit" disabled={busyAction === "create-supplementary-schedule"}>
                {busyAction === "create-supplementary-schedule" ? "Creating..." : "Create Supplementary Schedule"}
              </button>
            </form>
          </section>

          <section className="edp-card edp-wide-card">
            <div className="edp-card-title-row">
              <h2>Regular Exam Schedules</h2>
              <span className="edp-soft-pill">{examSchedules.length} entries</span>
            </div>
            {examSchedules.length ? (
              <div className="edp-table-wrapper">
                <table className="edp-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Academic Year</th>
                      <th>Semester</th>
                      <th>Date</th>
                      <th>Room</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examSchedules.map((schedule) => (
                      <tr key={schedule.id}>
                        <td>{getCourseName(schedule)}</td>
                        <td>{getAcademicYearName(schedule)}</td>
                        <td>{schedule.semester_number || FALLBACK_TEXT}</td>
                        <td>{formatDate(schedule.exam_date)}</td>
                        <td>{schedule.exam_room || FALLBACK_TEXT}</td>
                        <td>
                          <button className="edp-btn small danger light-danger" disabled={busyAction === `delete-regular-${schedule.id}`} onClick={() => deleteRegularSchedule(schedule.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No regular schedules" text="No regular exam schedules were returned by the backend." />
            )}
          </section>

          <section className="edp-card edp-wide-card">
            <div className="edp-card-title-row">
              <h2>Supplementary Exam Schedules</h2>
              <span className="edp-soft-pill">{supplementarySchedules.length} entries</span>
            </div>
            {supplementarySchedules.length ? (
              <div className="edp-table-wrapper">
                <table className="edp-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Academic Year</th>
                      <th>Date</th>
                      <th>Room</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplementarySchedules.map((schedule) => (
                      <tr key={schedule.id}>
                        <td>{getCourseName(schedule)}</td>
                        <td>{getAcademicYearName(schedule)}</td>
                        <td>{formatDate(schedule.exam_date)}</td>
                        <td>{schedule.exam_room || FALLBACK_TEXT}</td>
                        <td>
                          <button className="edp-btn small danger light-danger" disabled={busyAction === `delete-supplementary-${schedule.id}`} onClick={() => deleteSupplementarySchedule(schedule.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No supplementary schedules" text="No supplementary exam schedules were returned by the backend." />
            )}
          </section>
        </div>
      )}

      {activeTab === "academicYears" && (
        <div className="edp-content-grid">
          <section className="edp-card">
            <div className="edp-card-title-row">
              <h2>Close Academic Year</h2>
            </div>
            <ErrorNote message={sectionErrors.academicYears} />
            <form className="edp-form" onSubmit={closeAcademicYear}>
              <label>
                Academic Year
                <select value={closingForm.academic_year_id} onChange={(e) => setClosingForm((prev) => ({ ...prev, academic_year_id: e.target.value }))} required>
                  {renderAcademicYearOptions()}
                </select>
              </label>
              <label>
                Confirm Password
                <input type="password" value={closingForm.password} onChange={(e) => setClosingForm((prev) => ({ ...prev, password: e.target.value }))} required />
              </label>
              <div className="edp-warning-box">
                Closing an academic year triggers backend auto-promotion and switches the current academic year.
              </div>
              <button className="edp-btn danger" type="submit" disabled={busyAction === "close-academic-year"}>
                {busyAction === "close-academic-year" ? "Closing..." : "Confirm Year Closing"}
              </button>
            </form>
          </section>

          <section className="edp-card">
            <div className="edp-card-title-row">
              <h2>Academic Years</h2>
              <span className="edp-soft-pill">{academicYears.length} years</span>
            </div>
            {academicYears.length ? (
              <div className="edp-year-list">
                {academicYears.map((year) => (
                  <div className="edp-year-card" key={year.id}>
                    <div>
                      <h3>{year.name}</h3>
                      <p>{formatDate(year.start_date)} → {formatDate(year.end_date)}</p>
                    </div>
                    <div className="edp-year-badges">
                      {year.is_current && <StatusBadge value="current" />}
                      <StatusBadge value={year.is_closed ? "closed" : "open"} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No academic years" text="No academic years were returned by the backend." />
            )}
          </section>
        </div>
      )}

      {activeTab === "notifications" && (
        <section className="edp-card">
          <div className="edp-card-title-row">
            <h2>Notifications</h2>
            <button className="edp-btn small" onClick={markAllNotificationsAsRead} disabled={!unreadCount || busyAction === "notifications-read-all"}>
              Mark all as read
            </button>
          </div>
          <ErrorNote message={sectionErrors.notifications} />
          {notifications.length ? (
            <div className="edp-notifications-list">
              {notifications.map((notification) => (
                <article className={`edp-notification ${notification.is_read ? "read" : "unread"}`} key={notification.id}>
                  <div>
                    <h3>{notification.title || "Notification"}</h3>
                    <p>{notification.message || FALLBACK_TEXT}</p>
                    <span>{formatDate(notification.created_at)}</span>
                  </div>
                  {!notification.is_read && (
                    <button className="edp-btn small light" onClick={() => markNotificationAsRead(notification.id)}>
                      Mark read
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No notifications" text="You do not have notifications yet." />
          )}
        </section>
      )}

      {activeTab === "security" && (
        <section className="edp-card edp-security-card">
          <div className="edp-card-title-row">
            <h2>Change Password</h2>
          </div>
          <form className="edp-form" onSubmit={changePassword}>
            <label>
              Current Password
              <input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))} required />
            </label>
            <label>
              New Password
              <input type="password" minLength="8" value={passwordForm.new_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))} required />
            </label>
            <label>
              Confirm New Password
              <input type="password" minLength="8" value={passwordForm.new_password_confirmation} onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password_confirmation: e.target.value }))} required />
            </label>
            <button className="edp-btn primary" type="submit" disabled={busyAction === "change-password"}>
              {busyAction === "change-password" ? "Saving..." : "Update Password"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

const examinationsDeptStyles = `
:root {
  --edp-main: var(--main-color, #253752);
  --edp-soft: #f5f7fb;
  --edp-border: #e5e7eb;
  --edp-text: #0f172a;
  --edp-muted: #64748b;
}

.edp-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
  padding: 28px;
  color: var(--edp-text);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.edp-header,
.edp-card,
.edp-stat-card,
.edp-loader-card {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 26px;
  box-shadow: 0 22px 70px rgba(15, 23, 42, 0.08);
}

.edp-header {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.edp-header-left,
.edp-header-actions,
.edp-subtitle-row,
.edp-action-row,
.edp-card-title-row,
.edp-filter-row,
.edp-year-badges,
.edp-actions-center {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edp-header-left {
  gap: 18px;
}

.edp-avatar {
  width: 66px;
  height: 66px;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--edp-main), #49617e);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 22px;
}

.edp-kicker {
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  color: var(--edp-muted);
  font-weight: 800;
}

.edp-header h1,
.edp-card h2,
.edp-objection-card h3,
.edp-year-card h3 {
  margin: 0;
  color: var(--edp-text);
}

.edp-header h1 {
  font-size: 30px;
}

.edp-subtitle-row {
  color: var(--edp-muted);
  font-size: 14px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.edp-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #94a3b8;
}

.edp-hero-grid {
  display: grid;
  grid-template-columns: 1.45fr repeat(5, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.edp-card,
.edp-stat-card {
  padding: 20px;
}

.edp-profile-card {
  min-height: 190px;
}

.edp-stat-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 190px;
  overflow: hidden;
  position: relative;
}

.edp-stat-card::after {
  content: "";
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(37, 55, 82, 0.08);
  right: -22px;
  bottom: -22px;
}

.edp-stat-card span,
.edp-info-item span,
.edp-note-box span {
  color: var(--edp-muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.edp-stat-card strong {
  display: block;
  font-size: 32px;
  color: var(--edp-main);
  margin: 12px 0 8px;
}

.edp-stat-card p,
.edp-muted,
.edp-note-box p,
.edp-year-card p,
.edp-empty p,
.edp-notification p,
.edp-objection-card p {
  color: var(--edp-muted);
  margin: 0;
  line-height: 1.6;
}

.edp-card-title-row {
  justify-content: space-between;
  margin-bottom: 18px;
}

.edp-card-title-row.wrap {
  flex-wrap: wrap;
}

.edp-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.edp-info-grid.compact {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.edp-info-item {
  background: #f8fafc;
  border: 1px solid #edf2f7;
  border-radius: 16px;
  padding: 12px;
}

.edp-info-item.wide {
  grid-column: 1 / -1;
}

.edp-info-item strong {
  display: block;
  margin-top: 6px;
  color: #1e293b;
  word-break: break-word;
}


.edp-grade-stats,
.edp-grade-toolbar,
.edp-toolbar-actions,
.edp-inline-actions,
.edp-stack-small,
.edp-checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.edp-grade-toolbar {
  align-items: end;
  padding: 14px;
  border: 1px solid var(--edp-border);
  border-radius: 18px;
  background: #f8fafc;
  margin-bottom: 16px;
}

.edp-grade-toolbar label {
  display: grid;
  gap: 8px;
  font-weight: 900;
  color: #334155;
  min-width: 230px;
  flex: 1;
}

.edp-grade-toolbar select,
.edp-table-input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  outline: none;
  font-size: 15px;
  background: #fff;
}

.edp-grade-toolbar select {
  height: 46px;
  padding: 0 14px;
}

.edp-toolbar-actions {
  justify-content: flex-end;
}

.edp-grades-table-wrapper {
  margin-top: 12px;
}

.edp-grades-table {
  min-width: 1040px;
}

.edp-grades-table td strong,
.edp-grades-table td small {
  display: block;
}

.edp-grades-table td small {
  color: var(--edp-muted);
  margin-top: 5px;
  font-size: 12px;
}

.edp-table-input {
  height: 40px;
  padding: 0 10px;
  max-width: 120px;
}

.edp-table-input:disabled {
  background: #e2e8f0;
  color: #64748b;
}

.edp-locked-row {
  background: #f8fafc;
  opacity: 0.82;
}

.edp-stack-small {
  align-items: flex-start;
  flex-direction: column;
}

.edp-checkbox-row {
  justify-content: flex-start;
  font-weight: 900;
  color: #334155;
}

.edp-checkbox-row input {
  width: 18px;
  height: 18px;
}

.edp-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 8px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 18px;
  margin: 20px 0;
}

.edp-tabs button,
.edp-btn {
  border: 0;
  cursor: pointer;
  font-weight: 900;
  transition: 0.2s ease;
}

.edp-tabs button {
  background: transparent;
  color: #475569;
  border-radius: 13px;
  padding: 11px 16px;
  white-space: nowrap;
}

.edp-tabs button.active,
.edp-tabs button:hover {
  background: var(--edp-main);
  color: #fff;
}

.edp-btn {
  border-radius: 14px;
  padding: 11px 16px;
  background: #e2e8f0;
  color: #1e293b;
}

.edp-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.edp-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.edp-btn.primary {
  background: var(--edp-main);
  color: #fff;
}

.edp-btn.light {
  background: #eef2f7;
  color: var(--edp-main);
}

.edp-btn.ghost {
  background: transparent;
  color: var(--edp-main);
  border: 1px solid var(--edp-border);
}

.edp-btn.danger {
  background: #dc2626;
  color: #fff;
}

.edp-btn.light-danger {
  background: #fee2e2;
  color: #b91c1c;
}

.edp-btn.small {
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.edp-badge,
.edp-soft-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 7px 11px;
  font-weight: 900;
  font-size: 12px;
  white-space: nowrap;
}

.edp-soft-pill {
  background: #eef2f7;
  color: #475569;
}

.edp-badge.success {
  color: #166534;
  background: #dcfce7;
}

.edp-badge.warning {
  color: #92400e;
  background: #fef3c7;
}

.edp-badge.danger {
  color: #991b1b;
  background: #fee2e2;
}

.edp-badge.info {
  color: #075985;
  background: #e0f2fe;
}

.edp-badge.neutral {
  color: #475569;
  background: #e2e8f0;
}

.edp-objections-list,
.edp-year-list,
.edp-notifications-list {
  display: grid;
  gap: 16px;
}

.edp-objection-card,
.edp-year-card,
.edp-notification {
  border: 1px solid var(--edp-border);
  border-radius: 20px;
  background: #f8fafc;
  padding: 16px;
}

.edp-objection-head,
.edp-year-card,
.edp-notification {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.edp-objection-head {
  margin-bottom: 14px;
}

.edp-note-box,
.edp-review-panel,
.edp-warning-box,
.edp-waiting-box {
  margin-top: 14px;
  border-radius: 16px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.edp-note-box p {
  color: #334155;
  margin-top: 8px;
  white-space: pre-wrap;
}

.edp-note-box.light-note {
  background: #f1f5f9;
}

.edp-note-box.success-note {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.edp-mini-marks {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.edp-mini-marks small {
  background: #fff;
  border: 1px solid #dcfce7;
  border-radius: 999px;
  padding: 5px 9px;
  color: #166534;
  font-weight: 800;
}

.edp-review-panel,
.edp-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.edp-review-panel label,
.edp-form label,
.edp-filter-row label {
  display: grid;
  gap: 8px;
  font-weight: 900;
  color: #334155;
}

.edp-review-panel input,
.edp-review-panel textarea,
.edp-form input,
.edp-form select,
.edp-form textarea,
.edp-filter-row input,
.edp-filter-row select,
.edp-card-title-row select {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 0 14px;
  outline: none;
  font-size: 15px;
  background: #fff;
}

.edp-review-panel input,
.edp-form input,
.edp-form select,
.edp-filter-row input,
.edp-filter-row select,
.edp-card-title-row select {
  height: 46px;
}

.edp-review-panel textarea,
.edp-form textarea {
  min-height: 105px;
  padding: 12px 14px;
  resize: vertical;
}

.edp-review-panel input:focus,
.edp-review-panel textarea:focus,
.edp-form input:focus,
.edp-form select:focus,
.edp-filter-row input:focus,
.edp-filter-row select:focus,
.edp-card-title-row select:focus,
.edp-grade-toolbar select:focus,
.edp-table-input:focus {
  border-color: var(--edp-main);
  box-shadow: 0 0 0 3px rgba(37, 55, 82, 0.12);
}

.edp-mark-grid,
.edp-content-grid {
  display: grid;
  gap: 16px;
}

.edp-mark-grid {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.edp-content-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.edp-wide-card {
  grid-column: 1 / -1;
}

.edp-filter-row {
  min-width: min(100%, 520px);
}

.edp-filter-row input {
  min-width: 280px;
}

.edp-table-wrapper {
  overflow-x: auto;
}

.edp-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

.edp-table th,
.edp-table td {
  padding: 13px 12px;
  border-bottom: 1px solid #eef2f7;
  text-align: left;
  vertical-align: top;
}

.edp-table th {
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.edp-form-message,
.edp-error-note,
.edp-warning-box,
.edp-waiting-box {
  border-radius: 14px;
  padding: 12px 14px;
  font-weight: 800;
}

.edp-form-message {
  margin: 16px 0;
}

.edp-form-message.success {
  background: #dcfce7;
  color: #166534;
}

.edp-form-message.error,
.edp-error-note {
  background: #fff7ed;
  color: #9a3412;
  border: 1px solid #fed7aa;
}

.edp-warning-box {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.edp-waiting-box {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.edp-notification.unread {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.edp-notification.read {
  opacity: 0.82;
}

.edp-notification span {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 800;
}

.edp-security-card {
  max-width: 760px;
}

.edp-empty {
  text-align: center;
  padding: 34px 20px;
  color: var(--edp-muted);
}

.edp-empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #334155;
  font-weight: 900;
  margin-bottom: 14px;
}

.edp-empty-icon.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.edp-loader-card {
  max-width: 560px;
  margin: 12vh auto;
  padding: 34px;
  text-align: center;
}

.edp-loader-card p {
  color: var(--edp-muted);
  margin-top: 10px;
}

.edp-spinner {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 4px solid #e2e8f0;
  border-top-color: var(--edp-main);
  margin: 0 auto 18px;
  animation: edp-spin 0.9s linear infinite;
}

@keyframes edp-spin {
  to { transform: rotate(360deg); }
}

.edp-muted.strong-note {
  margin-top: 6px;
  color: #1d4ed8;
  font-weight: 900;
}

@media (max-width: 1280px) {
  .edp-hero-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .edp-profile-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .edp-content-grid,
  .edp-hero-grid {
    grid-template-columns: 1fr;
  }

  .edp-header,
  .edp-header-left,
  .edp-header-actions,
  .edp-card-title-row,
  .edp-objection-head,
  .edp-year-card,
  .edp-notification,
  .edp-action-row,
  .edp-filter-row,
  .edp-grade-toolbar,
  .edp-toolbar-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .edp-filter-row,
  .edp-filter-row input,
  .edp-grade-toolbar label,
  .edp-toolbar-actions,
  .edp-toolbar-actions .edp-btn,
  .edp-header-actions,
  .edp-header-actions .edp-btn {
    width: 100%;
  }

  .edp-header h1 {
    font-size: 24px;
  }
}

@media (max-width: 640px) {
  .edp-page {
    padding: 16px;
  }

  .edp-info-grid,
  .edp-info-grid.compact,
  .edp-mark-grid {
    grid-template-columns: 1fr;
  }
}
`;
