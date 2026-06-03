import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/axios";

const FALLBACK_TEXT = "Not available";

const objectionTargetLabels = {
  coursework: "Coursework Mark",
  practical: "Practical Mark",
  exam: "Exam Mark",
};

const activeObjectionStatuses = [
  "submitted",
  "under_review",
  "sent_to_doctor",
  "doctor_responded",
];

const activeSupplementaryStatuses = ["submitted", "approved"];

const activeServiceRequestStatuses = ["submitted", "under_review"];

const STUDENT_SETTINGS_STORAGE_KEY = "student_portal_preferences";

const DEFAULT_STUDENT_SETTINGS = {
  language: "en",
  compactMode: false,
  showSensitiveFinancialInfo: true,
  notificationsEnabled: true,
  preferredContactMethod: "email",
};

const MAX_SERVICE_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const serviceRequestTypes = [
  {
    key: "transcript_request",
    label: "Official Transcript / Grade Statement",
    icon: "fa-solid fa-file-lines",
    description: "Request an official grade statement or academic transcript.",
  },
  {
    key: "enrollment_certificate",
    label: "Enrollment Certificate",
    icon: "fa-solid fa-id-card-clip",
    description: "Request an official proof of enrollment document.",
  },
  {
    key: "graduation_certificate",
    label: "Graduation Certificate",
    icon: "fa-solid fa-graduation-cap",
    description: "Request a graduation certificate after academic completion.",
  },
  {
    key: "clearance_request",
    label: "University Clearance",
    icon: "fa-solid fa-clipboard-check",
    description: "Request graduation or withdrawal clearance from university departments.",
  },
  {
    key: "student_card_replacement",
    label: "Student Card Replacement",
    icon: "fa-solid fa-address-card",
    description: "Request a replacement for a lost or damaged student card.",
  },
  {
    key: "personal_info_update",
    label: "Personal Information Update",
    icon: "fa-solid fa-user-pen",
    description: "Request a review or correction of personal information.",
  },
  {
    key: "financial_review",
    label: "Financial Status Review",
    icon: "fa-solid fa-wallet",
    description: "Request a review of tuition, payment status, or receipt information.",
  },
  {
    key: "attendance_review",
    label: "Attendance Review",
    icon: "fa-solid fa-user-check",
    description: "Ask Student Affairs to review attendance records.",
  },
  {
    key: "official_attendance_statement",
    label: "Official Attendance Statement",
    icon: "fa-solid fa-calendar-check",
    description: "Request an official attendance statement for one or more courses.",
  },
  {
    key: "exam_absence_excuse",
    label: "Exam Absence Excuse",
    icon: "fa-solid fa-file-medical",
    description: "Submit an excuse or supporting document for missing an exam.",
  },
  {
    key: "course_description_request",
    label: "Course Description Request",
    icon: "fa-solid fa-book-open",
    description: "Request official course descriptions for transfer, scholarship, or equivalency use.",
  },
  {
    key: "registration_status_review",
    label: "Registration Status Review",
    icon: "fa-solid fa-user-clock",
    description: "Ask Student Affairs to review your registration or enrollment status.",
  },
  {
    key: "course_add_request",
    label: "Course Add Request",
    icon: "fa-solid fa-square-plus",
    description: "Request adding a course to your current academic registration.",
  },
  {
    key: "course_withdrawal_request",
    label: "Course Withdrawal Request",
    icon: "fa-solid fa-square-minus",
    description: "Request withdrawal from a course according to university rules.",
  },
  {
    key: "major_change_request",
    label: "Major / Specialization Change",
    icon: "fa-solid fa-right-left",
    description: "Request a review for changing specialization or academic track.",
  },
  {
    key: "suspension_request",
    label: "Registration Suspension",
    icon: "fa-solid fa-pause-circle",
    description: "Request temporary suspension of registration for a valid reason.",
  },
  {
    key: "reactivation_request",
    label: "Registration Reactivation",
    icon: "fa-solid fa-play-circle",
    description: "Request reactivation after suspension or stopped registration.",
  },
  {
    key: "general_inquiry",
    label: "General Student Inquiry",
    icon: "fa-solid fa-circle-question",
    description: "Submit a general request to Student Affairs.",
  },
];

const STUDENT_TABS = [
  { key: "overview", label: "Overview", icon: "fa-solid fa-chart-line" },
  { key: "profile", label: "My Profile", icon: "fa-solid fa-id-card" },
  { key: "graduation", label: "Graduation Eligibility", icon: "fa-solid fa-user-graduate" },
  { key: "courseMaterials", label: "Course Materials", icon: "fa-solid fa-folder-tree" },
  { key: "documents", label: "Documents", icon: "fa-solid fa-folder-open" },
  { key: "grades", label: "Grades", icon: "fa-solid fa-square-poll-vertical" },
  { key: "progress", label: "Plan Progress", icon: "fa-solid fa-diagram-project" },
  { key: "objections", label: "Objections", icon: "fa-solid fa-scale-balanced" },
  { key: "supplementary", label: "Supplementary", icon: "fa-solid fa-file-circle-check" },
  { key: "services", label: "My Requests", icon: "fa-solid fa-headset" },
  { key: "finance", label: "Financial Status", icon: "fa-solid fa-wallet" },
  { key: "examCard", label: "Exam Card", icon: "fa-solid fa-id-card-clip" },
  { key: "calendar", label: "Academic Calendar", icon: "fa-solid fa-calendar-check" },
  { key: "examSchedule", label: "Exam Schedule", icon: "fa-solid fa-calendar-days" },
  { key: "schedule", label: "Class Schedule", icon: "fa-solid fa-calendar-week" },
  { key: "carried", label: "Carried Courses", icon: "fa-solid fa-book-bookmark" },
  { key: "attendance", label: "Attendance", icon: "fa-solid fa-user-check" },
  { key: "notifications", label: "Notifications", icon: "fa-solid fa-bell" },
  { key: "settings", label: "Settings", icon: "fa-solid fa-sliders" },
  { key: "security", label: "Security", icon: "fa-solid fa-lock" },
];

const statusLabels = {
  pending: "Pending",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  under_review: "Under Review",
  completed: "Completed",
  cancelled: "Cancelled",
  paid: "Paid",
  unpaid: "Unpaid",
  supplementary_approved: "Supplementary Approved",
  registered: "Registered",
  not_registered: "Not Registered",
  stopped: "Stopped",
  in_progress: "In Progress",
  passed: "Passed",
  promoted: "Promoted",
  failed: "Failed",
  exhausted: "Exhausted",
  carried: "Carried",
  conditionally_passed: "Conditionally Passed",
  enrolled: "Enrolled",
  eligible: "Eligible",
  blocked: "Blocked",
  allowed: "Allowed",
  upcoming: "Upcoming",
  due_soon: "Due Soon",
  overdue: "Overdue",
  current: "Current",
};

const statusClasses = {
  registered: "success",
  paid: "success",
  eligible: "success",
  allowed: "success",
  current: "success",
  passed: "success",
  promoted: "success",
  true: "success",
  pending: "warning",
  upcoming: "warning",
  due_soon: "warning",
  unpaid: "danger",
  blocked: "danger",
  overdue: "danger",
  in_progress: "warning",
  conditionally_passed: "warning",
  carried: "warning",
  submitted: "warning",
  under_review: "warning",
  sent_to_doctor: "warning",
  doctor_responded: "warning",
  failed: "danger",
  stopped: "danger",
  exhausted: "danger",
  not_registered: "danger",
  rejected_by_exams: "danger",
  rejected: "danger",
  approved: "success",
  completed: "success",
  cancelled: "danger",
  false: "danger",
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
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) return FALLBACK_TEXT;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function formatTime(value) {
  if (!value) return FALLBACK_TEXT;
  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    }

    const text = String(value);
    return text.length >= 5 ? text.slice(0, 5) : text;
  } catch {
    return String(value);
  }
}

function normalizeCollection(payload, key) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload[key])) return payload[key];
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data[key])) return payload.data[key];
  return [];
}

function loadStudentSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STUDENT_SETTINGS_STORAGE_KEY) || "{}");
    return { ...DEFAULT_STUDENT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_STUDENT_SETTINGS;
  }
}

function saveStudentSettings(settings) {
  localStorage.setItem(STUDENT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function getAttachmentUrl(request) {
  const directUrl =
    request?.attachment_url ||
    request?.attachmentUrl ||
    request?.attachment?.url ||
    null;

  if (directUrl) return directUrl;

  const path =
    request?.attachment_path ||
    request?.attachmentPath ||
    request?.attachment?.path ||
    null;

  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  const cleanPath = String(path)
    .replace(/^public\//, "")
    .replace(/^storage\//, "");

  const baseUrl = String(api.defaults?.baseURL || "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");

  return `${baseUrl}/storage/${cleanPath}`;
}

function getAttachmentName(request) {
  return (
    request?.attachment_original_name ||
    request?.attachmentOriginalName ||
    request?.attachment_name ||
    request?.attachmentName ||
    request?.attachment?.original_name ||
    request?.attachment?.name ||
    ""
  );
}


function buildFrontendUrl(path = "") {
  const cleanPath = String(path || "").startsWith("/") ? String(path || "") : `/${path || ""}`;
  return `${window.location.origin}${cleanPath}`;
}

function getDocumentVerificationUrl(documentItem = null) {
  const directUrl = documentItem?.verification_url || documentItem?.verificationUrl || "";
  if (!directUrl) return "";
  if (/^https?:\/\//i.test(directUrl)) return directUrl;
  return buildFrontendUrl(directUrl);
}

function getQrImageUrl(value) {
  if (!value) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=8&data=${encodeURIComponent(value)}`;
}

function safePdfText(value) {
  return String(value ?? "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value) {
  return safePdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfText(text, maxLength = 92) {
  const words = safePdfText(text).split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    if (!line) {
      line = word;
      return;
    }

    if ((line + " " + word).length <= maxLength) {
      line += " " + word;
    } else {
      lines.push(line);
      line = word;
    }
  });

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function downloadSimplePdf(filename, lines) {
  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 42;
  const marginTop = 790;
  const lineHeight = 14;
  const maxLinesPerPage = 52;

  const pages = [];
  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    pages.push(lines.slice(i, i + maxLinesPerPage));
  }

  if (!pages.length) pages.push(["No transcript data available."]);

  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(null);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const pageObjectIds = [];

  pages.forEach((pageLines) => {
    let content = "BT\n/F1 10 Tf\n";
    content += `${marginX} ${marginTop} Td\n`;

    pageLines.forEach((line, index) => {
      const escaped = escapePdfText(line);
      if (index === 0) {
        content += `(${escaped}) Tj\n`;
      } else {
        content += `0 -${lineHeight} Td\n(${escaped}) Tj\n`;
      }
    });

    content += "ET";

    const contentId = objects.length + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

    const pageId = objects.length + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageObjectIds.push(pageId);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}



function normalizeExamSchedulePayload(payload) {
  const data = payload?.data || payload || {};
  const regular = normalizeCollection(data.regular_exams || data.regular || data.exam_schedules || data.examSchedules || data.exams || [], "regular_exams");
  const supplementary = normalizeCollection(data.supplementary_exams || data.supplementary || data.supplementary_exam_schedules || data.supplementaryExamSchedules || [], "supplementary_exams");

  return {
    regular,
    supplementary,
    upcoming: normalizeCollection(data.upcoming || [], "upcoming"),
    past: normalizeCollection(data.past || [], "past"),
    academic_year: data.academic_year || data.academicYear || null,
  };
}

function normalizeExamCardPayload(payload) {
  const data = payload?.data || payload || {};
  const rows = normalizeCollection(data, "exam_card").length
    ? normalizeCollection(data, "exam_card")
    : normalizeCollection(data, "exams");

  return {
    student: data.student || null,
    academic_year: data.academic_year || data.academicYear || null,
    academic_record: data.academic_record || data.academicRecord || null,
    eligibility_summary: data.eligibility_summary || data.eligibilitySummary || {},
    exams: rows.map((exam, index) => ({
      id: exam.id || `${exam.exam_type || "exam"}-${exam.exam_schedule_id || index}`,
      examScheduleId: exam.exam_schedule_id || exam.examScheduleId || exam.id,
      examType: exam.exam_type || exam.examType || "regular",
      eligible: Boolean(firstDefined(exam.eligible, exam.is_eligible, false)),
      eligibilityStatus: firstDefined(exam.eligibility_status, exam.status, exam.eligible ? "eligible" : "blocked"),
      eligibilityLabel: firstDefined(exam.eligibility_label, exam.eligible ? "Allowed" : "Blocked"),
      eligibilityReasons: Array.isArray(exam.eligibility_reasons) ? exam.eligibility_reasons : [],
      courseCode: firstDefined(exam.course_code, exam.course?.code, ""),
      courseName: firstDefined(exam.course_name, exam.course?.name, FALLBACK_TEXT),
      semesterNumber: firstDefined(exam.semester_number, exam.semester, null),
      academicYear: firstDefined(exam.academic_year, exam.academicYear?.name, data.academic_year?.name, FALLBACK_TEXT),
      studyYear: firstDefined(exam.study_year, exam.studyYear?.name, ""),
      examDate: firstDefined(exam.exam_date, exam.examDate, exam.date),
      examRoom: firstDefined(exam.exam_room, exam.room, exam.hall, FALLBACK_TEXT),
      attendanceCount: firstDefined(exam.attendance_count, exam.attendanceCount, 0),
      attendanceRequired: firstDefined(exam.attendance_required, exam.attendanceRequired, null),
      attendanceEligible: Boolean(firstDefined(exam.attendance_eligible, exam.attendanceEligible, true)),
      supplementaryRequestStatus: firstDefined(exam.supplementary_request_status, exam.supplementaryRequestStatus, null),
    })),
  };
}

function normalizeAcademicCalendarPayload(payload) {
  const data = payload?.data || payload || {};
  const events = normalizeCollection(data, "events").map((event, index) => ({
    id: event.id || `calendar-event-${index}`,
    type: event.type || "general",
    title: event.title || FALLBACK_TEXT,
    description: event.description || "",
    date: firstDefined(event.date, event.start_date, event.starts_at),
    endDate: firstDefined(event.end_date, event.ends_at),
    status: event.status || getCalendarItemStatus(firstDefined(event.date, event.start_date, event.starts_at), firstDefined(event.end_date, event.ends_at)),
    badge: event.badge || event.type || "Event",
    icon: event.icon || getCalendarItemIcon(event.type),
    meta: event.meta || {},
  }));

  const deadlines = normalizeCollection(data, "deadlines").map((deadline, index) => ({
    id: deadline.id || `deadline-${index}`,
    type: deadline.type || "deadline",
    title: deadline.title || FALLBACK_TEXT,
    description: deadline.description || "",
    date: firstDefined(deadline.date, deadline.due_date, deadline.deadline),
    status: deadline.status || getCalendarItemStatus(firstDefined(deadline.date, deadline.due_date, deadline.deadline)),
    badge: deadline.badge || "Deadline",
    icon: deadline.icon || getCalendarItemIcon(deadline.type || "deadline"),
    action_tab: deadline.action_tab || deadline.actionTab || null,
    meta: deadline.meta || {},
  }));

  return {
    academic_year: data.academic_year || data.academicYear || null,
    events,
    deadlines,
    summary: data.summary || {},
  };
}


function normalizeOfficialDocumentsPayload(payload) {
  const data = payload?.data || payload || {};
  const rows = normalizeCollection(data, "documents");

  return rows.map((item, index) => ({
    id: item.id || item.key || `document-${index}`,
    title: item.title || item.label || "Official Document",
    description: item.description || "Student document service.",
    category: item.category || "Academic",
    mode: item.mode || item.delivery_mode || "request",
    status: item.status || (item.available === false ? "unavailable" : "available"),
    available: item.available !== false,
    icon: item.icon || "fa-solid fa-file-lines",
    requestType: item.request_type || item.requestType || null,
    instantAction: item.instant_action || item.instantAction || null,
    defaultSubject: item.default_subject || item.defaultSubject || item.title || "Official document request",
    defaultDescription: item.default_description || item.defaultDescription || item.description || "Please process this official document request.",
    verificationCode: item.verification_code || item.verificationCode || null,
    verificationUrl: item.verification_url || item.verificationUrl || null,
    issuedAt: item.issued_at || item.issuedAt || null,
    expiresAt: item.expires_at || item.expiresAt || null,
    feeRequired: Boolean(firstDefined(item.fee_required, item.feeRequired, false)),
    reasons: Array.isArray(item.reasons) ? item.reasons : [],
    lastUpdated: item.last_updated || item.lastUpdated || item.updated_at || null,
  }));
}


function normalizeGraduationEligibilityPayload(payload) {
  const data = payload?.data || payload || {};
  const progress = data.progress || data.summary || {};
  const requirements = Array.isArray(data.requirements) ? data.requirements : [];
  const blockers = Array.isArray(data.blockers) ? data.blockers : [];
  const courses = data.courses || {};

  const normalizeCourse = (row, index) => ({
    id: row.id || row.enrollment_id || row.course_id || `grad-course-${index}`,
    courseId: row.course_id || row.courseId || null,
    courseCode: firstDefined(row.course_code, row.course?.code, ""),
    courseName: firstDefined(row.course_name, row.course?.name, "Course"),
    studyYear: firstDefined(row.study_year, row.studyYear?.name, ""),
    semesterNumber: firstDefined(row.semester_number, row.semester, null),
    creditHours: firstDefined(row.credit_hours, row.course?.credit_hours, 0),
    finalMark: firstDefined(row.final_mark, row.grade?.final_mark, null),
    status: firstDefined(row.status, row.result_status, row.grade?.result_status, "pending"),
    category: firstDefined(row.category, "remaining"),
    reason: firstDefined(row.reason, row.notes, ""),
  });

  return {
    eligible: Boolean(firstDefined(data.eligible, data.is_eligible, false)),
    status: firstDefined(data.status, data.eligible ? "eligible" : "not_eligible"),
    title: firstDefined(data.title, data.eligible ? "Eligible for graduation" : "Not eligible yet"),
    message: firstDefined(
      data.message,
      data.eligible
        ? "All graduation requirements are currently satisfied."
        : "Some graduation requirements still need attention."
    ),
    student: data.student || null,
    academic_record: data.academic_record || data.academicRecord || null,
    progress: {
      totalCourses: Number(firstDefined(progress.total_courses, progress.totalCourses, 0)),
      completedCourses: Number(firstDefined(progress.completed_courses, progress.completedCourses, 0)),
      remainingCourses: Number(firstDefined(progress.remaining_courses, progress.remainingCourses, 0)),
      carriedCourses: Number(firstDefined(progress.carried_courses, progress.carriedCourses, 0)),
      failedCourses: Number(firstDefined(progress.failed_courses, progress.failedCourses, 0)),
      inProgressCourses: Number(firstDefined(progress.in_progress_courses, progress.inProgressCourses, 0)),
      completionPercentage: Number(firstDefined(progress.completion_percentage, progress.completionPercentage, 0)),
      completedCredits: Number(firstDefined(progress.completed_credits, progress.completedCredits, 0)),
      totalCredits: Number(firstDefined(progress.total_credits, progress.totalCredits, 0)),
    },
    requirements: requirements.map((item, index) => ({
      key: item.key || `requirement-${index}`,
      title: firstDefined(item.title, "Graduation requirement"),
      status: firstDefined(item.status, item.passed ? "passed" : "pending"),
      passed: Boolean(firstDefined(item.passed, item.status === "passed", false)),
      message: firstDefined(item.message, "Requirement check"),
      icon: firstDefined(item.icon, "fa-solid fa-circle-check"),
      actionTab: item.action_tab || item.actionTab || null,
    })),
    blockers: blockers.map((item, index) => ({
      key: item.key || `blocker-${index}`,
      title: firstDefined(item.title, "Pending requirement"),
      message: firstDefined(item.message, "This item must be completed before graduation."),
      count: firstDefined(item.count, null),
      type: firstDefined(item.type, "warning"),
      actionTab: item.action_tab || item.actionTab || null,
    })),
    courses: {
      completed: normalizeCollection(courses.completed || [], "completed").map(normalizeCourse),
      remaining: normalizeCollection(courses.remaining || [], "remaining").map(normalizeCourse),
      carried: normalizeCollection(courses.carried || [], "carried").map(normalizeCourse),
      failed: normalizeCollection(courses.failed || [], "failed").map(normalizeCourse),
      inProgress: normalizeCollection(courses.in_progress || courses.inProgress || [], "in_progress").map(normalizeCourse),
    },
  };
}


function courseMaterialIcon(type) {
  const normalized = String(type || "").toLowerCase();
  if (["file", "pdf", "document"].includes(normalized)) return "fa-solid fa-file-lines";
  if (["video", "recording"].includes(normalized)) return "fa-solid fa-circle-play";
  if (["link", "url", "website"].includes(normalized)) return "fa-solid fa-link";
  if (["slides", "presentation"].includes(normalized)) return "fa-solid fa-display";
  if (["assignment", "homework"].includes(normalized)) return "fa-solid fa-clipboard-list";
  return "fa-solid fa-book-open";
}

function normalizeCourseMaterialsPayload(payload) {
  const data = payload?.data || payload || {};
  const rows = normalizeCollection(data, "courses");

  return {
    student: data.student || null,
    academic_year: data.academic_year || data.academicYear || null,
    summary: data.summary || {},
    courses: rows.map((row, index) => {
      const materials = normalizeCollection(row.materials || [], "materials").map((item, materialIndex) => ({
        id: item.id || `material-${index}-${materialIndex}`,
        title: firstDefined(item.title, "Course material"),
        description: firstDefined(item.description, ""),
        type: firstDefined(item.type, item.material_type, "note"),
        icon: firstDefined(item.icon, courseMaterialIcon(item.type || item.material_type)),
        url: firstDefined(item.url, item.file_url, item.fileUrl, ""),
        fileName: firstDefined(item.original_name, item.originalName, item.file_name, item.fileName, ""),
        publishedAt: firstDefined(item.published_at, item.publishedAt, item.created_at, null),
        doctorName: firstDefined(item.doctor_name, item.doctorName, ""),
        downloadable: Boolean(firstDefined(item.downloadable, item.is_downloadable, Boolean(item.file_url || item.url))),
      }));

      return {
        id: row.id || row.enrollment_id || row.course_id || `course-material-${index}`,
        enrollmentId: firstDefined(row.enrollment_id, row.id, null),
        courseId: firstDefined(row.course_id, row.course?.id, null),
        courseCode: firstDefined(row.course_code, row.course?.code, ""),
        courseName: firstDefined(row.course_name, row.course?.name, "Course"),
        department: firstDefined(row.department, row.course?.department?.name, ""),
        description: firstDefined(row.description, row.course?.description, "No course description is available yet."),
        academicYear: firstDefined(row.academic_year, row.academicYear?.name, data.academic_year?.name, ""),
        studyYear: firstDefined(row.study_year, row.studyYear?.name, ""),
        semesterNumber: firstDefined(row.semester_number, row.semester, null),
        creditHours: firstDefined(row.credit_hours, row.course?.credit_hours, 0),
        status: firstDefined(row.status, "enrolled"),
        gradeStatus: firstDefined(row.grade_status, row.grade?.result_status, "in_progress"),
        finalMark: firstDefined(row.final_mark, row.grade?.final_mark, null),
        doctors: normalizeCollection(row.doctors || [], "doctors").map((doctor, doctorIndex) => ({
          id: doctor.id || `doctor-${index}-${doctorIndex}`,
          name: firstDefined(doctor.name, doctor.full_name, doctor.doctor_name, "Doctor"),
          title: firstDefined(doctor.title, doctor.academic_title, ""),
          primary: Boolean(firstDefined(doctor.primary, doctor.is_primary, false)),
        })),
        materials,
        materialsCount: Number(firstDefined(row.materials_count, row.materialsCount, materials.length)),
      };
    }),
  };
}

function buildOfficialDocumentsFallback(financialInfo, examCardRows = [], recordedAllGrades = [], currentAcademicRecord = null, student = null) {
  const isRegistered = String(financialInfo?.registrationStatus || currentAcademicRecord?.registration_status || "").toLowerCase() === "registered";
  const isActive = student?.is_active_registration !== false;
  const isExhausted = student?.is_exhausted === true;
  const baseAvailable = isActive && !isExhausted;

  return [
    {
      id: "unofficial_transcript",
      title: "Unofficial Transcript",
      description: "Download a student-copy PDF of recorded grades from the portal.",
      category: "Academic",
      mode: "instant",
      status: recordedAllGrades.length ? "available" : "limited",
      available: true,
      icon: "fa-solid fa-file-pdf",
      instantAction: "download_transcript",
      reasons: recordedAllGrades.length ? [] : ["No recorded grades are available yet."],
    },
    {
      id: "exam_card",
      title: "Exam Card",
      description: "Download the latest exam card with eligibility checks and exam details.",
      category: "Examinations",
      mode: "instant",
      status: examCardRows.length ? "available" : "limited",
      available: true,
      icon: "fa-solid fa-id-card-clip",
      instantAction: "download_exam_card",
      reasons: examCardRows.length ? [] : ["No exam card items are available yet."],
    },
    {
      id: "official_transcript",
      title: "Official Transcript / Grade Statement",
      description: "Submit an official request for a certified grade statement.",
      category: "Academic",
      mode: "request",
      status: baseAvailable ? "available" : "blocked",
      available: baseAvailable,
      icon: "fa-solid fa-file-lines",
      requestType: "transcript_request",
      defaultSubject: "Official transcript request",
      defaultDescription: "Please issue an official transcript / grade statement based on my recorded academic results.",
      reasons: baseAvailable ? [] : ["Student registration is not active or the student is exhausted."],
    },
    {
      id: "enrollment_certificate",
      title: "Enrollment Certificate",
      description: "Request an official proof of enrollment for the current academic year.",
      category: "Administrative",
      mode: "request",
      status: isRegistered ? "available" : "limited",
      available: baseAvailable,
      icon: "fa-solid fa-id-card",
      requestType: "enrollment_certificate",
      defaultSubject: "Enrollment certificate request",
      defaultDescription: "Please issue an official enrollment certificate for my current academic year.",
      reasons: isRegistered ? [] : ["Registration status is not fully registered yet."],
    },
    {
      id: "official_attendance_statement",
      title: "Official Attendance Statement",
      description: "Request an official statement of attendance for enrolled courses.",
      category: "Attendance",
      mode: "request",
      status: baseAvailable ? "available" : "blocked",
      available: baseAvailable,
      icon: "fa-solid fa-user-check",
      requestType: "official_attendance_statement",
      defaultSubject: "Official attendance statement request",
      defaultDescription: "Please issue an official attendance statement for my current enrolled courses.",
      reasons: baseAvailable ? [] : ["Student account is not eligible for official document requests."],
    },
    {
      id: "course_description_request",
      title: "Course Description",
      description: "Request official course descriptions for equivalency, transfer, or scholarship use.",
      category: "Academic",
      mode: "request",
      status: baseAvailable ? "available" : "blocked",
      available: baseAvailable,
      icon: "fa-solid fa-book-open",
      requestType: "course_description_request",
      defaultSubject: "Course description request",
      defaultDescription: "Please provide official course descriptions for the courses I will list in this request.",
      reasons: baseAvailable ? [] : ["Student account is not eligible for official document requests."],
    },
    {
      id: "clearance_request",
      title: "University Clearance",
      description: "Start an official clearance workflow for graduation, withdrawal, or administrative needs.",
      category: "Administrative",
      mode: "request",
      status: financialInfo?.tuitionPaid ? "available" : "limited",
      available: baseAvailable,
      icon: "fa-solid fa-clipboard-check",
      requestType: "clearance_request",
      defaultSubject: "University clearance request",
      defaultDescription: "Please start my university clearance request and confirm the required steps with the relevant departments.",
      reasons: financialInfo?.tuitionPaid ? [] : ["Financial clearance may be required before final approval."],
    },
    {
      id: "student_card_replacement",
      title: "Student Card Replacement",
      description: "Request a replacement for a lost or damaged university student card.",
      category: "Administrative",
      mode: "request",
      status: baseAvailable ? "available" : "blocked",
      available: baseAvailable,
      icon: "fa-solid fa-address-card",
      requestType: "student_card_replacement",
      defaultSubject: "Student card replacement request",
      defaultDescription: "Please process my request for a replacement student card. I will provide any required details or attachments.",
      feeRequired: true,
      reasons: baseAvailable ? [] : ["Student account is not eligible for official document requests."],
    },
  ];
}

function getCalendarItemIcon(type) {
  const icons = {
    academic_year_start: "fa-solid fa-flag-checkered",
    academic_year_end: "fa-solid fa-flag",
    regular_exam: "fa-solid fa-calendar-days",
    supplementary_exam: "fa-solid fa-file-circle-check",
    financial_clearance: "fa-solid fa-wallet",
    grade_objection_follow_up: "fa-solid fa-scale-balanced",
    supplementary_registration: "fa-solid fa-file-signature",
    service_request_follow_up: "fa-solid fa-headset",
    deadline: "fa-solid fa-hourglass-half",
  };

  return icons[type] || "fa-solid fa-calendar-check";
}

function getCalendarItemStatus(dateValue, endDateValue = null) {
  if (!dateValue) return "pending";

  const now = new Date();
  const start = new Date(dateValue);
  const end = endDateValue ? new Date(endDateValue) : null;

  if (Number.isNaN(start.getTime())) return "pending";

  if (end && !Number.isNaN(end.getTime()) && start <= now && now <= end) {
    return "current";
  }

  const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "completed";
  if (diffDays <= 7) return "due_soon";
  return "upcoming";
}

function buildAcademicCalendarFallback(allExamSchedules = [], currentAcademicRecord = null, financialInfo = null) {
  const academicYear = currentAcademicRecord?.academic_year || currentAcademicRecord?.academicYear || null;
  const events = [];
  const deadlines = [];

  if (academicYear?.start_date) {
    events.push({
      id: "fallback-academic-year-start",
      type: "academic_year_start",
      title: "Academic year starts",
      description: academicYear.name || "Current academic year",
      date: academicYear.start_date,
      endDate: academicYear.end_date || null,
      status: getCalendarItemStatus(academicYear.start_date, academicYear.end_date),
      badge: "Academic Year",
      icon: getCalendarItemIcon("academic_year_start"),
    });
  }

  if (academicYear?.end_date) {
    events.push({
      id: "fallback-academic-year-end",
      type: "academic_year_end",
      title: "Academic year ends",
      description: academicYear.name || "Current academic year",
      date: academicYear.end_date,
      status: getCalendarItemStatus(academicYear.end_date),
      badge: "Academic Year",
      icon: getCalendarItemIcon("academic_year_end"),
    });
  }

  allExamSchedules.forEach((exam, index) => {
    const examType = exam.exam_type === "supplementary" ? "supplementary_exam" : "regular_exam";
    events.push({
      id: `fallback-${examType}-${exam.id || index}`,
      type: examType,
      title: `${exam.exam_type === "supplementary" ? "Supplementary" : "Regular"} exam: ${getExamCourseName(exam)}`,
      description: `${getExamCourseCode(exam)} • Room ${getExamRoom(exam)}`,
      date: getExamDateValue(exam),
      status: getCalendarItemStatus(getExamDateValue(exam)),
      badge: exam.exam_type === "supplementary" ? "Supplementary" : "Regular Exam",
      icon: getCalendarItemIcon(examType),
    });
  });

  const nextExam = allExamSchedules
    .filter((exam) => isUpcomingExam(exam))
    .sort((a, b) => new Date(getExamDateValue(a)) - new Date(getExamDateValue(b)))[0];

  if (nextExam && financialInfo?.blocked) {
    deadlines.push({
      id: "fallback-financial-clearance",
      type: "financial_clearance",
      title: "Financial clearance required",
      description: "Complete tuition/payment review before exam entry.",
      date: getExamDateValue(nextExam),
      status: getCalendarItemStatus(getExamDateValue(nextExam)),
      badge: "Finance",
      icon: getCalendarItemIcon("financial_clearance"),
      action_tab: "finance",
    });
  }

  return { academic_year: academicYear, events, deadlines, summary: {} };
}

function getExamCourseName(exam) {
  return exam?.course?.name || exam?.course_name || exam?.courseName || FALLBACK_TEXT;
}

function getExamCourseCode(exam) {
  return exam?.course?.code || exam?.course_code || exam?.courseCode || FALLBACK_TEXT;
}

function getExamDateValue(exam) {
  return exam?.exam_date || exam?.examDate || exam?.date || exam?.start_at || exam?.starts_at || null;
}

function getExamRoom(exam) {
  return exam?.exam_room || exam?.room || exam?.hall || exam?.classroom || FALLBACK_TEXT;
}

function isUpcomingExam(exam) {
  const dateValue = getExamDateValue(exam);
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= Date.now();
}

function serviceRequestLabel(type) {
  return serviceRequestTypes.find((item) => item.key === type)?.label || formatValue(type);
}


function requestDepartmentByType(type) {
  const financial = ["financial_review"];
  const examinations = ["exam_absence_excuse", "transcript_request"];
  const academic = [
    "course_description_request",
    "course_add_request",
    "course_withdrawal_request",
    "major_change_request",
    "suspension_request",
    "reactivation_request",
    "registration_status_review",
  ];
  const documents = [
    "enrollment_certificate",
    "graduation_certificate",
    "clearance_request",
    "student_card_replacement",
    "official_attendance_statement",
  ];

  if (financial.includes(type)) return "Finance Department";
  if (examinations.includes(type)) return "Examinations Department";
  if (academic.includes(type)) return "Student Affairs Department";
  if (documents.includes(type)) return "Student Affairs / Documents Office";
  return "Student Affairs Department";
}

function requestPortalReference(request) {
  const rawId = request?.raw_id || request?.raw?.id || request?.id || "REQ";
  const cleanId = String(rawId).replace(/^(service|objection|supplementary)-/, "").toUpperCase();
  const prefix = request?.source === "objection" ? "OBJ" : request?.source === "supplementary" ? "SUP" : "REQ";
  return `${prefix}-${String(cleanId).padStart(5, "0")}`;
}

function getRequestStatusIndex(request) {
  const status = String(request?.status || "submitted").toLowerCase();
  if (["cancelled", "rejected"].includes(status)) return 4;
  if (["completed"].includes(status)) return 4;
  if (["approved"].includes(status)) return 3;
  if (["doctor_responded"].includes(status)) return 3;
  if (["sent_to_doctor", "under_review"].includes(status)) return 2;
  return 1;
}

function buildRequestTimeline(request) {
  const status = String(request?.status || "submitted").toLowerCase();
  const isRejected = ["rejected", "rejected_by_exams"].includes(status);
  const isCancelled = status === "cancelled";
  const activeIndex = getRequestStatusIndex(request);

  const finalLabel = isCancelled
    ? "Cancelled"
    : isRejected
      ? "Rejected"
      : status === "completed"
        ? "Completed"
        : status === "approved"
          ? "Approved"
          : "Final Decision";

  const serviceSteps = [
    { key: "submitted", label: "Submitted", date: request?.submitted_at || request?.created_at },
    { key: "received", label: "Received by Department", date: request?.created_at },
    { key: "under_review", label: "Under Review", date: ["under_review", "approved", "rejected", "completed", "cancelled"].includes(status) ? request?.updated_at : null },
    { key: "decision", label: finalLabel, date: request?.reviewed_at || request?.updated_at },
    { key: "closed", label: isCancelled ? "Closed" : status === "completed" ? "Closed" : "Awaiting Closure", date: status === "completed" || isCancelled ? request?.updated_at : null },
  ];

  const objectionSteps = [
    { key: "submitted", label: "Submitted", date: request?.submitted_at || request?.created_at },
    { key: "under_review", label: "Under Review", date: request?.updated_at },
    { key: "sent_to_doctor", label: "Sent to Doctor", date: status === "sent_to_doctor" || status === "doctor_responded" ? request?.updated_at : null },
    { key: "doctor_responded", label: "Doctor Responded", date: status === "doctor_responded" ? request?.updated_at : null },
    { key: "final_decision", label: finalLabel, date: request?.reviewed_at || request?.updated_at },
  ];

  const supplementarySteps = [
    { key: "submitted", label: "Submitted", date: request?.submitted_at || request?.created_at },
    { key: "under_review", label: "Under Review", date: request?.updated_at },
    { key: "eligibility", label: "Eligibility Review", date: request?.updated_at },
    { key: "decision", label: finalLabel, date: request?.reviewed_at || request?.updated_at },
    { key: "closed", label: status === "completed" ? "Closed" : "Awaiting Closure", date: status === "completed" ? request?.updated_at : null },
  ];

  const baseSteps = request?.source === "objection"
    ? objectionSteps
    : request?.source === "supplementary"
      ? supplementarySteps
      : serviceSteps;

  return baseSteps.map((step, index) => ({
    ...step,
    done: index < activeIndex,
    current: index === Math.min(activeIndex, baseSteps.length - 1),
    danger: (isRejected || isCancelled) && index === Math.min(activeIndex, baseSteps.length - 1),
  }));
}

function requestCanBeCancelled(request) {
  return request?.source === "service" && ["submitted", "under_review"].includes(String(request?.status || "").toLowerCase());
}

function serviceRequestIcon(type) {
  return serviceRequestTypes.find((item) => item.key === type)?.icon || "fa-solid fa-file-circle-question";
}

function normalizeServiceRequest(request, source = "service") {
  if (source === "objection") {
    return {
      id: `objection-${request.id}`,
      raw_id: request.id,
      source,
      type: "Grade Objection",
      icon: "fa-solid fa-scale-balanced",
      title: request.course_name || request.enrollment?.course?.name || "Grade Objection",
      subtitle: objectionTargetLabels[request.objection_target] || request.objection_target || "Grade review",
      status: request.status,
      priority: "academic",
      created_at: request.submitted_at || request.created_at,
      updated_at: request.updated_at,
      submitted_at: request.submitted_at || request.created_at,
      reviewed_at: request.reviewed_at || request.updated_at,
      department: "Examinations Department",
      description: request.objection_text,
      response: request.final_exam_decision_note || request.exam_department_note || request.doctor_response,
      raw: request,
    };
  }

  if (source === "supplementary") {
    return {
      id: `supplementary-${request.id}`,
      raw_id: request.id,
      source,
      type: "Supplementary Request",
      icon: "fa-solid fa-file-circle-check",
      title: request.course_name || request.enrollment?.course?.name || "Supplementary Exam",
      subtitle: request.academic_year?.name || request.academicYear?.name || "Supplementary exam request",
      status: request.status,
      priority: "academic",
      created_at: request.created_at || request.submitted_at,
      updated_at: request.updated_at,
      submitted_at: request.submitted_at || request.created_at,
      reviewed_at: request.reviewed_at || request.updated_at,
      department: "Examinations Department",
      description: request.student_note,
      response: request.exam_department_note,
      raw: request,
    };
  }

  return {
    id: `service-${request.id}`,
    raw_id: request.id,
    source,
    type: serviceRequestLabel(request.request_type),
    icon: serviceRequestIcon(request.request_type),
    title: request.subject || serviceRequestLabel(request.request_type),
    subtitle: request.priority ? `${request.priority} priority` : "Student service request",
    status: request.status,
    priority: request.priority || "normal",
    created_at: request.created_at,
    updated_at: request.updated_at,
    submitted_at: request.created_at,
    reviewed_at: request.reviewed_at,
    department: requestDepartmentByType(request.request_type),
    description: request.description,
    response: request.staff_response,
    request_type: request.request_type,
    submitted_by: request.submitted_by?.full_name || request.submittedBy?.full_name || request.submitted_by?.name || request.submittedBy?.name || null,
    reviewed_by: request.reviewed_by?.full_name || request.reviewedBy?.full_name || request.reviewed_by?.name || request.reviewedBy?.name || null,
    attachment_url: getAttachmentUrl(request),
    attachment_name: getAttachmentName(request),
    attachment_size: request.attachment_size || request.attachmentSize || request.attachment?.size || null,
    metadata: request.metadata || null,
    raw: request,
  };
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function formatMoney(value, currency = "") {
  const number = Number(value);
  if (!Number.isFinite(number)) return FALLBACK_TEXT;

  const formatted = number.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return currency ? `${formatted} ${currency}` : formatted;
}

function unwrapFinancePayload(payload) {
  if (!payload) return null;
  if (payload.finance_status) return payload.finance_status;
  if (payload.finance) return payload.finance;
  if (payload.data?.finance_status) return payload.data.finance_status;
  if (payload.data?.finance) return payload.data.finance;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;
  return payload;
}

function buildFinancialInfo(financeStatus, currentAcademicRecord, summaryData) {
  const finance = unwrapFinancePayload(financeStatus) || {};
  const academicRecord =
    finance.current_academic_record ||
    finance.academic_record ||
    finance.student_academic_record ||
    currentAcademicRecord ||
    {};

  const tuitionFee = finance.tuition_fee || finance.fee || finance.current_tuition_fee || {};
  const currency = firstDefined(finance.currency, tuitionFee.currency, "USD");

  const tuitionPaid = Boolean(
    firstDefined(
      finance.tuition_paid,
      academicRecord.tuition_paid,
      summaryData?.tuition_paid,
      false
    )
  );

  const registrationStatus = firstDefined(
    finance.registration_status,
    academicRecord.registration_status,
    summaryData?.registration_status,
    "not_registered"
  );

  const tuitionAmount = firstDefined(
    finance.tuition_amount,
    finance.amount,
    tuitionFee.amount,
    tuitionFee.tuition_amount
  );

  const paidAmount = firstDefined(
    finance.paid_amount,
    finance.total_paid,
    finance.amount_paid,
    tuitionPaid && tuitionAmount !== undefined ? tuitionAmount : undefined
  );

  const remainingAmount = firstDefined(
    finance.remaining_amount,
    finance.balance,
    finance.amount_due,
    tuitionPaid ? 0 : tuitionAmount
  );

  const receiptNumber = firstDefined(
    finance.payment_receipt_number,
    academicRecord.payment_receipt_number,
    summaryData?.payment_receipt_number
  );

  const receiptDate = firstDefined(
    finance.payment_receipt_date,
    academicRecord.payment_receipt_date,
    summaryData?.payment_receipt_date
  );

  const blocked = !tuitionPaid || ["not_registered", "pending", "stopped"].includes(String(registrationStatus || "").toLowerCase());

  return {
    tuitionPaid,
    registrationStatus,
    tuitionAmount,
    paidAmount,
    remainingAmount,
    receiptNumber,
    receiptDate,
    currency,
    academicYear:
      firstDefined(finance.academic_year?.name, academicRecord.academic_year?.name, summaryData?.academic_year) || FALLBACK_TEXT,
    studyYear:
      firstDefined(finance.study_year?.name, academicRecord.study_year?.name, summaryData?.study_year) || FALLBACK_TEXT,
    statusLabel: tuitionPaid ? "Financially Cleared" : "Payment Required",
    statusType: tuitionPaid ? "success" : "danger",
    canRequestReview: true,
    blocked,
  };
}


function normalizePaymentHistoryPayload(payload) {
  const data = payload?.data || payload || {};
  const rows =
    normalizeCollection(data, "payment_history").length
      ? normalizeCollection(data, "payment_history")
      : normalizeCollection(data, "payments").length
        ? normalizeCollection(data, "payments")
        : normalizeCollection(data, "history");

  return rows.map((row, index) => ({
    id: row.id || row.record_id || row.academic_record_id || `payment-${index}`,
    academicYear: firstDefined(row.academic_year, row.academicYear?.name, row.academic_year_name, FALLBACK_TEXT),
    studyYear: firstDefined(row.study_year, row.studyYear?.name, row.study_year_name, FALLBACK_TEXT),
    registrationStatus: firstDefined(row.registration_status, row.registrationStatus, FALLBACK_TEXT),
    paymentStatus: firstDefined(row.payment_status, row.status, row.tuition_paid === true ? "paid" : row.tuition_paid === false ? "unpaid" : "pending"),
    tuitionPaid: Boolean(firstDefined(row.tuition_paid, row.is_paid, false)),
    tuitionAmount: firstDefined(row.tuition_amount, row.amount, row.fee_amount, row.total_amount),
    paidAmount: firstDefined(row.paid_amount, row.amount_paid, row.total_paid),
    remainingAmount: firstDefined(row.remaining_amount, row.balance, row.amount_due),
    currency: firstDefined(row.currency, "USD"),
    receiptNumber: firstDefined(row.receipt_number, row.payment_receipt_number, row.receiptNo),
    receiptDate: firstDefined(row.receipt_date, row.payment_receipt_date, row.paid_at, row.payment_date),
    updatedAt: firstDefined(row.updated_at, row.created_at),
    notes: firstDefined(row.notes, row.note, row.staff_note),
    isCurrent: Boolean(firstDefined(row.is_current, row.current, false)),
  }));
}

function buildPaymentHistoryFallback(financialInfo) {
  if (!financialInfo) return [];

  return [
    {
      id: "current-financial-status",
      academicYear: financialInfo.academicYear,
      studyYear: financialInfo.studyYear,
      registrationStatus: financialInfo.registrationStatus,
      paymentStatus: financialInfo.tuitionPaid ? "paid" : "unpaid",
      tuitionPaid: financialInfo.tuitionPaid,
      tuitionAmount: financialInfo.tuitionAmount,
      paidAmount: financialInfo.paidAmount,
      remainingAmount: financialInfo.remainingAmount,
      currency: financialInfo.currency,
      receiptNumber: financialInfo.receiptNumber,
      receiptDate: financialInfo.receiptDate,
      updatedAt: null,
      notes: "Current academic financial status",
      isCurrent: true,
    },
  ];
}

function summarizePaymentHistory(paymentHistory = [], financialInfo = null) {
  const rows = paymentHistory.length ? paymentHistory : buildPaymentHistoryFallback(financialInfo);
  const paidRows = rows.filter((row) => row.tuitionPaid || String(row.paymentStatus).toLowerCase() === "paid");
  const unpaidRows = rows.filter((row) => !row.tuitionPaid && String(row.paymentStatus).toLowerCase() !== "paid");

  const totalPaid = rows.reduce((sum, row) => {
    const amount = Number(row.paidAmount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  const totalRemaining = rows.reduce((sum, row) => {
    const amount = Number(row.remainingAmount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  const lastPayment = paidRows
    .filter((row) => row.receiptDate)
    .sort((a, b) => new Date(b.receiptDate) - new Date(a.receiptDate))[0];

  return {
    rows,
    totalRecords: rows.length,
    paidCount: paidRows.length,
    unpaidCount: unpaidRows.length,
    totalPaid,
    totalRemaining,
    lastPaymentDate: lastPayment?.receiptDate || null,
  };
}

function getRowAcademicYearId(row) {
  return (
    row?.academic_year_id ||
    row?.academicYear?.id ||
    row?.academic_year?.id ||
    row?.enrollment?.academic_year_id ||
    row?.enrollment?.academicYear?.id ||
    row?.enrollment?.academic_year?.id ||
    row?.student_course_enrollment?.academic_year_id ||
    row?.student_course_enrollment?.academicYear?.id ||
    row?.student_course_enrollment?.academic_year?.id ||
    null
  );
}

function parseStudyYearNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const text = String(value).toLowerCase();

  const wordMap = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
  };

  for (const [word, number] of Object.entries(wordMap)) {
    if (text.includes(word)) return number;
  }

  const match =
    text.match(/(?:year|study year|fy|y)\s*-?\s*(\d+)/i) ||
    text.match(/السنة\s*(?:ال)?\s*(\d+)/i) ||
    text.match(/(\d+)/);

  return match ? Number(match[1]) : null;
}

function studyYearLabel(number) {
  const labels = {
    1: "First Year",
    2: "Second Year",
    3: "Third Year",
    4: "Fourth Year",
    5: "Fifth Year",
    6: "Sixth Year",
  };

  return labels[number] || `Year ${number}`;
}

function getRowStudyYearNumber(row) {
  const directNumber =
    parseStudyYearNumber(row?.study_year_number) ||
    parseStudyYearNumber(row?.study_year?.name) ||
    parseStudyYearNumber(row?.studyYear?.name) ||
    parseStudyYearNumber(row?.enrollment?.study_year?.name) ||
    parseStudyYearNumber(row?.enrollment?.studyYear?.name) ||
    parseStudyYearNumber(row?.student_course_enrollment?.study_year?.name) ||
    parseStudyYearNumber(row?.student_course_enrollment?.studyYear?.name) ||
    parseStudyYearNumber(row?.academic_record?.study_year?.name) ||
    parseStudyYearNumber(row?.current_academic_record?.study_year?.name);

  if (directNumber) return directNumber;

  const code =
    row?.course?.code ||
    row?.course_code ||
    row?.enrollment?.course?.code ||
    row?.student_course_enrollment?.course?.code ||
    "";

  const codeMatch = String(code).match(/FY\s*(\d+)|Y\s*(\d+)|YEAR\s*(\d+)/i);
  if (codeMatch) {
    return Number(codeMatch[1] || codeMatch[2] || codeMatch[3]);
  }

  return null;
}

function getRowSemesterNumber(row) {
  const value =
    row?.semester_number ||
    row?.semester ||
    row?.course?.semester_number ||
    row?.study_plan_course?.semester_number ||
    row?.enrollment?.semester_number ||
    row?.student_course_enrollment?.semester_number ||
    row?.academic_record?.semester_number ||
    null;

  if (value === null || value === undefined || value === "") return null;

  const match = String(value).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function getAcademicStandingInfo(status, carriedCount = 0, supplementaryCount = 0) {
  const normalized = String(status || "").toLowerCase();

  if (["promoted", "passed"].includes(normalized)) {
    return {
      type: "success",
      title: "Promoted",
      message: "You have met the academic progression requirements for the current year.",
      icon: "fa-solid fa-circle-check",
    };
  }

  if (["carried", "conditionally_passed"].includes(normalized) || carriedCount > 0) {
    return {
      type: "warning",
      title: "Carried Courses",
      message: carriedCount
        ? `You have ${carriedCount} carried course${carriedCount > 1 ? "s" : ""}. Follow them carefully during the next academic year.`
        : "You were promoted with conditions. Please review your carried courses.",
      icon: "fa-solid fa-triangle-exclamation",
    };
  }

  if (["failed", "exhausted", "stopped"].includes(normalized)) {
    return {
      type: "danger",
      title: statusLabels[normalized] || "Academic Risk",
      message: "You did not meet the progression requirements. Please contact Student Affairs for guidance.",
      icon: "fa-solid fa-circle-exclamation",
    };
  }

  if (supplementaryCount > 0) {
    return {
      type: "warning",
      title: "Supplementary Opportunity",
      message: `You have ${supplementaryCount} course${supplementaryCount > 1 ? "s" : ""} eligible for supplementary exam registration.`,
      icon: "fa-solid fa-file-circle-check",
    };
  }

  return {
    type: "neutral",
    title: "In Progress",
    message: "Your current academic standing will be updated after grades are recorded and reviewed.",
    icon: "fa-solid fa-circle-info",
  };
}

function normalizeAttendanceStatus(value) {
  return String(value || "").toLowerCase().replaceAll("_", " ");
}

function getAttendanceCourseInfo(record) {
  const course =
    record?.course ||
    record?.enrollment?.course ||
    record?.student_course_enrollment?.course ||
    {};

  return {
    id:
      record?.course_id ||
      course?.id ||
      record?.student_course_enrollment_id ||
      record?.enrollment_id ||
      record?.id ||
      "unknown",
    code: course?.code || record?.course_code || "",
    name:
      course?.name ||
      record?.course_name ||
      record?.enrollment?.course?.name ||
      record?.student_course_enrollment?.course?.name ||
      "Course",
  };
}

function getAttendanceRiskSummary(attendanceRecords = []) {
  const grouped = attendanceRecords.reduce((map, record) => {
    const courseInfo = getAttendanceCourseInfo(record);
    const key = `${courseInfo.id}-${courseInfo.name}`;

    if (!map[key]) {
      map[key] = {
        key,
        courseId: courseInfo.id,
        courseCode: courseInfo.code,
        courseName: courseInfo.name,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        latestDate: null,
      };
    }

    const status = normalizeAttendanceStatus(record?.status);
    const isAbsent = ["absent", "not attended", "missed", "غائب"].includes(status);
    const isLate = ["late", "delayed", "متأخر"].includes(status);
    const isExcused = ["excused", "excused absence", "معذور"].includes(status);
    const isPresent = ["present", "attended", "registered", "حاضر"].includes(status);

    map[key].total += 1;

    if (isAbsent) {
      map[key].absent += 1;
    } else if (isExcused) {
      map[key].excused += 1;
      map[key].present += 1;
    } else if (isLate) {
      map[key].late += 1;
      map[key].present += 1;
    } else if (isPresent || status) {
      map[key].present += 1;
    } else {
      map[key].present += 1;
    }

    const recordDate = record?.attendance_date || record?.created_at || record?.updated_at || null;
    if (recordDate && (!map[key].latestDate || new Date(recordDate) > new Date(map[key].latestDate))) {
      map[key].latestDate = recordDate;
    }

    return map;
  }, {});

  return Object.values(grouped)
    .map((item) => {
      const percentage = item.total ? Math.round((item.present / item.total) * 100) : 0;
      const risk =
        percentage >= 85 ? "safe" :
        percentage >= 70 ? "warning" :
        "danger";

      const remainingToSafe = item.total
        ? Math.max(0, Math.ceil((0.85 * item.total - item.present) / 0.15))
        : 0;

      return {
        ...item,
        percentage,
        risk,
        label:
          risk === "safe" ? "Safe" :
          risk === "warning" ? "Warning" :
          "At Risk",
        message:
          risk === "safe"
            ? "Your attendance is within the safe range."
            : risk === "warning"
              ? "Your attendance is close to the risk range. Avoid additional absences."
              : "Your attendance needs immediate attention. Contact Student Affairs if there is an issue.",
        remainingToSafe,
      };
    })
    .sort((a, b) => a.percentage - b.percentage || a.courseName.localeCompare(b.courseName));
}

function getAttendanceOverallSummary(attendanceSummary = []) {
  const totalSessions = attendanceSummary.reduce((sum, item) => sum + item.total, 0);
  const totalPresent = attendanceSummary.reduce((sum, item) => sum + item.present, 0);
  const totalAbsent = attendanceSummary.reduce((sum, item) => sum + item.absent, 0);
  const totalLate = attendanceSummary.reduce((sum, item) => sum + item.late, 0);
  const totalExcused = attendanceSummary.reduce((sum, item) => sum + item.excused, 0);
  const overallPercentage = totalSessions ? Math.round((totalPresent / totalSessions) * 100) : 0;

  return {
    coursesCount: attendanceSummary.length,
    totalSessions,
    totalPresent,
    totalAbsent,
    totalLate,
    totalExcused,
    overallPercentage,
    safeCourses: attendanceSummary.filter((item) => item.risk === "safe").length,
    warningCourses: attendanceSummary.filter((item) => item.risk === "warning").length,
    riskCourses: attendanceSummary.filter((item) => item.risk === "danger").length,
  };
}

function getObjectionStepIndex(status) {
  const normalized = String(status || "").toLowerCase();
  if (["submitted", "under_review"].includes(normalized)) return 0;
  if (["sent_to_doctor"].includes(normalized)) return 1;
  if (["doctor_responded"].includes(normalized)) return 2;
  if (["approved", "rejected", "rejected_by_exams", "final_decision"].includes(normalized)) return 3;
  return 0;
}

function getCurrentStudyYearNumber(currentAcademicRecord, summaryData) {
  return (
    parseStudyYearNumber(currentAcademicRecord?.study_year?.name) ||
    parseStudyYearNumber(currentAcademicRecord?.studyYear?.name) ||
    parseStudyYearNumber(summaryData?.study_year) ||
    parseStudyYearNumber(summaryData?.study_year_name) ||
    parseStudyYearNumber(summaryData?.studyYear?.name) ||
    parseStudyYearNumber(currentAcademicRecord?.study_year_id) ||
    parseStudyYearNumber(summaryData?.study_year_id) ||
    null
  );
}

function getCourseCreditHours(row) {
  const value = Number(
    row?.course?.credit_hours ||
      row?.credit_hours ||
      row?.course_credit_hours ||
      row?.enrollment?.course?.credit_hours ||
      row?.student_course_enrollment?.course?.credit_hours ||
      0
  );

  return Number.isFinite(value) && value > 0 ? value : 0;
}

function calculateAcademicAverage(rows) {
  const recordedRows = rows.filter(hasRecordedGrade);

  if (!recordedRows.length) {
    return "0.00";
  }

  const totalCredits = recordedRows.reduce((sum, row) => sum + getCourseCreditHours(row), 0);

  if (totalCredits > 0) {
    const weightedTotal = recordedRows.reduce(
      (sum, row) => sum + gradeFinalMark(row) * (getCourseCreditHours(row) || 0),
      0
    );

    return (weightedTotal / totalCredits).toFixed(2);
  }

  return (
    recordedRows.reduce((sum, row) => sum + gradeFinalMark(row), 0) / recordedRows.length
  ).toFixed(2);
}

function hasRecordedGrade(row) {
  const grade = row?.grade || row;
  if (!grade) return false;

  const status = String(grade?.result_status || "").toLowerCase();
  const hasRealUpdate = Boolean(grade?.last_updated_at);

  if (hasRealUpdate) return true;

  if (["passed", "failed", "carried", "conditionally_passed", "supplementary_approved"].includes(status)) {
    return true;
  }

  return false;
}

function gradeFinalMark(row) {
  const grade = row?.grade || row;
  const value = Number(grade?.final_mark);

  return Number.isFinite(value) ? value : 0;
}

function getRowCourseName(row) {
  return (
    row?.course?.name ||
    row?.course_name ||
    row?.enrollment?.course?.name ||
    row?.student_course_enrollment?.course?.name ||
    "Course"
  );
}

function getRowCourseCode(row) {
  return (
    row?.course?.code ||
    row?.course_code ||
    row?.enrollment?.course?.code ||
    row?.student_course_enrollment?.course?.code ||
    ""
  );
}

function getRowAcademicYearName(row) {
  return (
    row?.academic_year?.name ||
    row?.academicYear?.name ||
    row?.enrollment?.academic_year?.name ||
    row?.enrollment?.academicYear?.name ||
    row?.student_course_enrollment?.academic_year?.name ||
    row?.student_course_enrollment?.academicYear?.name ||
    row?.academic_year_name ||
    ""
  );
}

function getRowBooleanFlag(row, key) {
  return Boolean(
    row?.[key] ||
      row?.enrollment?.[key] ||
      row?.student_course_enrollment?.[key]
  );
}

function getPlanCourseCategory(row) {
  const status = String(row?.grade?.result_status || row?.result_status || row?.status || "").toLowerCase();
  const finalMark = gradeFinalMark(row);
  const passMark = Number(row?.course?.pass_mark || row?.pass_mark || row?.enrollment?.course?.pass_mark || 60);
  const isSupplementary = getRowBooleanFlag(row, "is_supplementary");
  const isCarried = getRowBooleanFlag(row, "is_carried");
  const notes = String(row?.notes || row?.enrollment?.notes || row?.student_course_enrollment?.notes || "").toLowerCase();

  if (!hasRecordedGrade(row)) {
    if (isSupplementary) return "supplementary";
    if (isCarried || notes.includes("failed") || notes.includes("repeat")) return "repeated";
    return "in_progress";
  }

  if (["passed", "supplementary_approved"].includes(status)) return isSupplementary ? "supplementary" : "passed";
  if (["conditionally_passed", "promoted"].includes(status)) return "conditional";
  if (["failed", "carried"].includes(status)) return "failed";

  if (finalMark >= passMark) return isSupplementary ? "supplementary" : "passed";
  if (finalMark > 0 && finalMark < passMark) return "failed";

  return "in_progress";
}

function getPlanCourseLabel(category) {
  const labels = {
    passed: "Passed",
    conditional: "Conditional",
    failed: "Failed",
    in_progress: "In Progress",
    repeated: "Repeated",
    supplementary: "Supplementary",
  };

  return labels[category] || "In Progress";
}

function summarizePlanCourses(courses = []) {
  return courses.reduce(
    (summary, course) => {
      summary.total += 1;
      summary[course.category] = (summary[course.category] || 0) + 1;
      if (course.isSupplementary) summary.supplementary += 1;
      if (course.isCarried || course.isRepeated) summary.repeated += 1;
      if (course.hasRecordedGrade) summary.recorded += 1;
      return summary;
    },
    {
      total: 0,
      passed: 0,
      conditional: 0,
      failed: 0,
      in_progress: 0,
      repeated: 0,
      supplementary: 0,
      recorded: 0,
    }
  );
}

function buildAcademicPlanProgress(grades = [], currentStudyYearNumber = null) {
  const detectedYears = grades
    .map((row) => getRowStudyYearNumber(row))
    .filter(Boolean);

  const maxYear = Math.max(currentStudyYearNumber || 0, ...detectedYears, 1);

  const yearMap = new Map();

  for (let year = 1; year <= maxYear; year += 1) {
    yearMap.set(year, {
      year,
      label: studyYearLabel(year),
      isCurrent: Number(currentStudyYearNumber) === Number(year),
      courses: [],
      semesters: [],
      summary: summarizePlanCourses([]),
      average: "0.00",
    });
  }

  grades.forEach((row) => {
    const year = getRowStudyYearNumber(row) || currentStudyYearNumber || 1;
    const semester = getRowSemesterNumber(row) || 0;
    const category = getPlanCourseCategory(row);
    const isSupplementary = getRowBooleanFlag(row, "is_supplementary");
    const isCarried = getRowBooleanFlag(row, "is_carried");
    const notes = String(row?.notes || row?.enrollment?.notes || row?.student_course_enrollment?.notes || "").toLowerCase();
    const isRepeated = isCarried || notes.includes("failed") || notes.includes("repeat");
    const hasRecorded = hasRecordedGrade(row);

    if (!yearMap.has(year)) {
      yearMap.set(year, {
        year,
        label: studyYearLabel(year),
        isCurrent: Number(currentStudyYearNumber) === Number(year),
        courses: [],
        semesters: [],
        summary: summarizePlanCourses([]),
        average: "0.00",
      });
    }

    yearMap.get(year).courses.push({
      id: row?.id || row?.enrollment_id || row?.student_course_enrollment_id || `${year}-${semester}-${getRowCourseCode(row)}-${getRowCourseName(row)}`,
      courseName: getRowCourseName(row),
      courseCode: getRowCourseCode(row),
      academicYear: getRowAcademicYearName(row),
      semester,
      finalMark: hasRecorded ? gradeFinalMark(row).toFixed(2) : null,
      status: row?.grade?.result_status || row?.result_status || row?.status || "in_progress",
      category,
      categoryLabel: getPlanCourseLabel(category),
      isSupplementary,
      isCarried,
      isRepeated,
      hasRecordedGrade: hasRecorded,
      originalRow: row,
    });
  });

  const years = Array.from(yearMap.values())
    .sort((a, b) => a.year - b.year)
    .map((yearItem) => {
      const semesterMap = new Map();

      yearItem.courses.forEach((course) => {
        const semesterKey = course.semester || 0;
        if (!semesterMap.has(semesterKey)) {
          semesterMap.set(semesterKey, {
            semester: semesterKey,
            label: semesterKey ? `Semester ${semesterKey}` : "Unassigned Semester",
            courses: [],
            summary: summarizePlanCourses([]),
          });
        }
        semesterMap.get(semesterKey).courses.push(course);
      });

      const semesters = Array.from(semesterMap.values())
        .sort((a, b) => a.semester - b.semester)
        .map((semesterItem) => ({
          ...semesterItem,
          courses: semesterItem.courses.sort((a, b) => {
            const codeA = String(a.courseCode || a.courseName);
            const codeB = String(b.courseCode || b.courseName);
            return codeA.localeCompare(codeB);
          }),
          summary: summarizePlanCourses(semesterItem.courses),
        }));

      return {
        ...yearItem,
        semesters,
        summary: summarizePlanCourses(yearItem.courses),
        average: calculateAcademicAverage(yearItem.courses.map((course) => course.originalRow).filter(Boolean)),
      };
    });

  const allCourses = years.flatMap((yearItem) => yearItem.courses);

  return {
    years,
    summary: summarizePlanCourses(allCourses),
  };
}

function extractApiMessage(error) {
  if (!error) return "";

  const status = error.response?.status;
  const rawMessage = String(error.response?.data?.message || error.message || "");
  const technicalPatterns = [
    /SQLSTATE/i,
    /Base table/i,
    /view not found/i,
    /doesn\'?t exist/i,
    /Connection:/i,
    /select \*/i,
    /PDOException/i,
    /Illuminate\\/i,
    /stack trace/i,
  ];

  if (status === 401) return "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.";
  if (status === 403) return "لا تملك صلاحية الوصول إلى هذا القسم.";
  if (status === 404) return "لم يتم العثور على البيانات المطلوبة لهذا القسم.";

  const isTechnicalMessage = technicalPatterns.some((pattern) => pattern.test(rawMessage));
  if (status >= 500 || isTechnicalMessage || rawMessage.length > 220) {
    return "تعذر تحميل بيانات هذا القسم الآن. تأكد من تشغيل تحديثات قاعدة البيانات ثم حاول مرة أخرى.";
  }

  return rawMessage || "تعذر تنفيذ الطلب. حاول مرة أخرى.";
}

function StatusBadge({ value }) {
  const raw = value === true || value === false ? String(value) : value;
  const label = value === true || value === false ? formatValue(value) : statusLabels[value] || formatValue(value);
  const type = statusClasses[raw] || "neutral";

  return <span className={`stp-badge ${type}`}>{label}</span>;
}

function EmptyState({ title, text }) {
  return (
    <div className="stp-empty">
      <div className="stp-empty-icon">i</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ErrorNote({ message }) {
  if (!message) return null;
  return <div className="stp-error-note">{message}</div>;
}

export default function StProfile() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [selectedGradeYear, setSelectedGradeYear] = useState("");
  const [selectedGradeSemester, setSelectedGradeSemester] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [grades, setGrades] = useState([]);
  const [gradeObjections, setGradeObjections] = useState([]);
  const [supplementaryEligibleCourses, setSupplementaryEligibleCourses] = useState([]);
  const [supplementaryRequests, setSupplementaryRequests] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetailsLoading, setRequestDetailsLoading] = useState(false);
  const [requestDetailsError, setRequestDetailsError] = useState("");
  const [financeStatus, setFinanceStatus] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [examCard, setExamCard] = useState({ student: null, academic_year: null, academic_record: null, eligibility_summary: {}, exams: [] });
  const [academicCalendar, setAcademicCalendar] = useState({ academic_year: null, events: [], deadlines: [], summary: {} });
  const [calendarFilter, setCalendarFilter] = useState("upcoming");
  const [officialDocuments, setOfficialDocuments] = useState([]);
  const [documentFilter, setDocumentFilter] = useState("all");
  const [courseMaterials, setCourseMaterials] = useState({ student: null, academic_year: null, summary: {}, courses: [] });
  const [courseMaterialsFilter, setCourseMaterialsFilter] = useState("all");
  const [graduationEligibility, setGraduationEligibility] = useState({
    eligible: false,
    status: "not_eligible",
    title: "Not eligible yet",
    message: "Some graduation requirements still need attention.",
    progress: {
      totalCourses: 0,
      completedCourses: 0,
      remainingCourses: 0,
      carriedCourses: 0,
      failedCourses: 0,
      inProgressCourses: 0,
      completionPercentage: 0,
      completedCredits: 0,
      totalCredits: 0,
    },
    requirements: [],
    blockers: [],
    courses: { completed: [], remaining: [], carried: [], failed: [], inProgress: [] },
  });
  const [examSchedule, setExamSchedule] = useState({ regular: [], supplementary: [], upcoming: [], past: [], academic_year: null });
  const [examScheduleFilter, setExamScheduleFilter] = useState("upcoming");
  const [attendance, setAttendance] = useState([]);
  const [attendanceAnalyticsFilter, setAttendanceAnalyticsFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [carriedCourses, setCarriedCourses] = useState([]);

  const [sectionErrors, setSectionErrors] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [objectionForm, setObjectionForm] = useState({
    student_course_enrollment_id: "",
    course_name: "",
    objection_target: "exam",
    objection_text: "",
  });
  const [objectionMessage, setObjectionMessage] = useState({ type: "", text: "" });
  const [submittingObjection, setSubmittingObjection] = useState(false);
  const [supplementaryForm, setSupplementaryForm] = useState({
    student_course_enrollment_id: "",
    course_name: "",
    academic_year_id: "",
    student_note: "",
  });
  const [supplementaryMessage, setSupplementaryMessage] = useState({ type: "", text: "" });
  const [submittingSupplementary, setSubmittingSupplementary] = useState(false);
  const [serviceRequestForm, setServiceRequestForm] = useState({
    request_type: "transcript_request",
    subject: "",
    description: "",
    priority: "normal",
    attachment: null,
  });
  const [serviceRequestMessage, setServiceRequestMessage] = useState({ type: "", text: "" });
  const [submittingServiceRequest, setSubmittingServiceRequest] = useState(false);
  const [studentSettings, setStudentSettings] = useState(() => loadStudentSettings());
  const [settingsMessage, setSettingsMessage] = useState("");

  const user = profile?.user || profile || null;
  const student = profile?.student || user?.student || null;
  const summaryData = summary?.summary || summary || null;
  const currentAcademicRecord =
    currentRecord?.current_academic_record ||
    currentRecord?.currentAcademicRecord ||
    currentRecord ||
    summaryData ||
    null;

  const currentAcademicYearId =
    currentAcademicRecord?.academic_year_id ||
    currentAcademicRecord?.academic_year?.id ||
    summaryData?.academic_year_id ||
    summaryData?.academicYear?.id ||
    summaryData?.academic_year?.id ||
    null;

  const studentName = user?.full_name || student?.user?.full_name || student?.full_name || "Student";
  const initials = useMemo(() => {
    return studentName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ST";
  }, [studentName]);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.is_read).length;
  }, [notifications]);

  const objectionsByEnrollment = useMemo(() => {
    return gradeObjections.reduce((map, objection) => {
      const enrollmentId = objection.student_course_enrollment_id || objection.enrollment_id;
      if (enrollmentId) map[enrollmentId] = objection;
      return map;
    }, {});
  }, [gradeObjections]);

  const activeGradeObjectionsCount = useMemo(() => {
    return gradeObjections.filter((item) => activeObjectionStatuses.includes(item.status)).length;
  }, [gradeObjections]);

  const activeSupplementaryRequestsCount = useMemo(() => {
    return supplementaryRequests.filter((item) => activeSupplementaryStatuses.includes(item.status)).length;
  }, [supplementaryRequests]);

  const activeServiceRequestsCount = useMemo(() => {
    return serviceRequests.filter((item) => activeServiceRequestStatuses.includes(item.status)).length;
  }, [serviceRequests]);

  const allStudentRequests = useMemo(() => {
    return [
      ...serviceRequests.map((item) => normalizeServiceRequest(item, "service")),
      ...gradeObjections.map((item) => normalizeServiceRequest(item, "objection")),
      ...supplementaryRequests.map((item) => normalizeServiceRequest(item, "supplementary")),
    ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [serviceRequests, gradeObjections, supplementaryRequests]);

  const financialInfo = useMemo(() => {
    return buildFinancialInfo(financeStatus, currentAcademicRecord, summaryData);
  }, [financeStatus, currentAcademicRecord, summaryData]);

  const paymentSummary = useMemo(() => {
    return summarizePaymentHistory(paymentHistory, financialInfo);
  }, [paymentHistory, financialInfo]);

  const examCardRows = useMemo(() => examCard?.exams || [], [examCard]);

  const examCardSummary = useMemo(() => {
    const eligibleCount = examCardRows.filter((exam) => exam.eligible).length;
    const blockedCount = examCardRows.length - eligibleCount;
    return {
      totalExams: examCard?.eligibility_summary?.total_exams ?? examCardRows.length,
      eligibleCount: examCard?.eligibility_summary?.eligible_count ?? eligibleCount,
      blockedCount: examCard?.eligibility_summary?.blocked_count ?? blockedCount,
      tuitionPaid: examCard?.eligibility_summary?.tuition_paid,
      registrationStatus: examCard?.eligibility_summary?.registration_status,
      activeRegistration: examCard?.eligibility_summary?.active_registration,
      exhausted: examCard?.eligibility_summary?.exhausted,
    };
  }, [examCard, examCardRows]);



  const graduationSummary = useMemo(() => {
    const progress = graduationEligibility.progress || {};
    const blockers = graduationEligibility.blockers || [];
    return {
      eligible: Boolean(graduationEligibility.eligible),
      completionPercentage: Number(progress.completionPercentage || 0),
      completedCourses: Number(progress.completedCourses || 0),
      totalCourses: Number(progress.totalCourses || 0),
      remainingCourses: Number(progress.remainingCourses || 0),
      carriedCourses: Number(progress.carriedCourses || 0),
      failedCourses: Number(progress.failedCourses || 0),
      inProgressCourses: Number(progress.inProgressCourses || 0),
      completedCredits: Number(progress.completedCredits || 0),
      totalCredits: Number(progress.totalCredits || 0),
      blockersCount: blockers.length,
    };
  }, [graduationEligibility]);


  const courseMaterialsRows = useMemo(() => courseMaterials?.courses || [], [courseMaterials]);

  const courseMaterialsSummary = useMemo(() => {
    const materialsCount = courseMaterialsRows.reduce((sum, course) => sum + (course.materials?.length || 0), 0);
    const coursesWithMaterials = courseMaterialsRows.filter((course) => (course.materials?.length || 0) > 0).length;
    const doctorsCount = new Set(
      courseMaterialsRows.flatMap((course) => (course.doctors || []).map((doctor) => doctor.name).filter(Boolean))
    ).size;

    return {
      totalCourses: courseMaterials?.summary?.total_courses ?? courseMaterialsRows.length,
      coursesWithMaterials: courseMaterials?.summary?.courses_with_materials ?? coursesWithMaterials,
      materialsCount: courseMaterials?.summary?.materials_count ?? materialsCount,
      doctorsCount: courseMaterials?.summary?.doctors_count ?? doctorsCount,
    };
  }, [courseMaterials, courseMaterialsRows]);

  const filteredCourseMaterials = useMemo(() => {
    if (courseMaterialsFilter === "withMaterials") {
      return courseMaterialsRows.filter((course) => (course.materials?.length || 0) > 0);
    }

    if (courseMaterialsFilter === "withoutMaterials") {
      return courseMaterialsRows.filter((course) => !(course.materials?.length || 0));
    }

    if (courseMaterialsFilter === "current") {
      return courseMaterialsRows.filter((course) => ["enrolled", "in_progress"].includes(String(course.status || "").toLowerCase()));
    }

    return courseMaterialsRows;
  }, [courseMaterialsRows, courseMaterialsFilter]);

  const profileCompletion = useMemo(() => {
    const fields = [
      { label: "Full name", value: user?.full_name || student?.user?.full_name || student?.full_name },
      { label: "Student number", value: student?.student_number || summaryData?.student_number },
      { label: "Email", value: user?.email },
      { label: "Mobile", value: user?.mobile },
      { label: "Birth date", value: user?.birth_date },
      { label: "Birth place", value: user?.birth_place },
      { label: "Gender", value: user?.gender },
      { label: "Nationality", value: user?.nationality },
      { label: "Address", value: user?.address },
      { label: "Program", value: student?.program?.name || summaryData?.program_name },
      { label: "Specialization", value: student?.specialization?.name || summaryData?.specialization_name },
      { label: "Academic year", value: summaryData?.academic_year || currentAcademicRecord?.academic_year?.name },
      { label: "Study year", value: summaryData?.study_year || currentAcademicRecord?.study_year?.name },
      { label: "Registration status", value: summaryData?.registration_status || currentAcademicRecord?.registration_status },
    ];

    const filled = fields.filter((field) => field.value !== null && field.value !== undefined && field.value !== "").length;
    const percent = fields.length ? Math.round((filled / fields.length) * 100) : 0;

    return {
      filled,
      total: fields.length,
      percent,
      missing: fields.filter((field) => field.value === null || field.value === undefined || field.value === "").map((field) => field.label),
    };
  }, [user, student, summaryData, currentAcademicRecord]);

  const allExamSchedules = useMemo(() => {
    const regular = (examSchedule.regular || []).map((exam) => ({ ...exam, exam_type: "regular" }));
    const supplementary = (examSchedule.supplementary || []).map((exam) => ({ ...exam, exam_type: "supplementary" }));

    return [...regular, ...supplementary].sort((a, b) => {
      const dateA = new Date(getExamDateValue(a) || 0).getTime();
      const dateB = new Date(getExamDateValue(b) || 0).getTime();
      return dateA - dateB;
    });
  }, [examSchedule]);

  const upcomingExams = useMemo(() => {
    return allExamSchedules.filter((exam) => isUpcomingExam(exam));
  }, [allExamSchedules]);

  const displayedExamSchedules = useMemo(() => {
    if (examScheduleFilter === "regular") return allExamSchedules.filter((exam) => exam.exam_type === "regular");
    if (examScheduleFilter === "supplementary") return allExamSchedules.filter((exam) => exam.exam_type === "supplementary");
    if (examScheduleFilter === "past") return allExamSchedules.filter((exam) => !isUpcomingExam(exam));
    if (examScheduleFilter === "all") return allExamSchedules;
    return upcomingExams.length ? upcomingExams : allExamSchedules;
  }, [allExamSchedules, upcomingExams, examScheduleFilter]);


  const calendarData = useMemo(() => {
    const hasApiData = (academicCalendar.events?.length || 0) + (academicCalendar.deadlines?.length || 0) > 0;
    return hasApiData ? academicCalendar : buildAcademicCalendarFallback(allExamSchedules, currentAcademicRecord, financialInfo);
  }, [academicCalendar, allExamSchedules, currentAcademicRecord, financialInfo]);

  const calendarEvents = useMemo(() => {
    return [...(calendarData.events || [])].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  }, [calendarData]);

  const importantDeadlines = useMemo(() => {
    return [...(calendarData.deadlines || [])].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  }, [calendarData]);

  const displayedCalendarEvents = useMemo(() => {
    if (calendarFilter === "all") return calendarEvents;
    if (calendarFilter === "deadlines") return importantDeadlines;
    if (calendarFilter === "past") return calendarEvents.filter((item) => ["completed", "overdue"].includes(item.status));
    return calendarEvents.filter((item) => !["completed", "overdue"].includes(item.status));
  }, [calendarEvents, importantDeadlines, calendarFilter]);

  const calendarSummary = useMemo(() => {
    const dueSoonCount = importantDeadlines.filter((item) => item.status === "due_soon" || item.status === "overdue").length;
    const upcomingCount = calendarEvents.filter((item) => ["upcoming", "due_soon", "current"].includes(item.status)).length;

    return {
      totalEvents: calendarEvents.length,
      upcomingCount,
      deadlinesCount: importantDeadlines.length,
      dueSoonCount,
      academicYearName:
        calendarData.academic_year?.name ||
        calendarData.academic_year ||
        currentAcademicRecord?.academic_year?.name ||
        summaryData?.academic_year ||
        FALLBACK_TEXT,
    };
  }, [calendarEvents, importantDeadlines, calendarData, currentAcademicRecord, summaryData]);


  async function requestWithFallback(primaryEndpoint, fallbackEndpoint = null) {
    try {
      const response = await api.get(primaryEndpoint);
      return { data: response.data, error: "" };
    } catch (primaryError) {
      if (!fallbackEndpoint) {
        return { data: null, error: extractApiMessage(primaryError) };
      }

      try {
        const response = await api.get(fallbackEndpoint);
        return { data: response.data, error: "" };
      } catch (fallbackError) {
        return { data: null, error: extractApiMessage(fallbackError) };
      }
    }
  }

  async function loadProfile() {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return null;
    }

    const profileResponse = await requestWithFallback("student/profile", "me");

    if (!profileResponse.data) {
      if (profileResponse.error.includes("Session expired")) {
        localStorage.removeItem("token");
        navigate("/login");
        return null;
      }
      setPageError(profileResponse.error || "Unable to load student profile.");
      return null;
    }

    const normalizedProfile = profileResponse.data.user
      ? {
          user: profileResponse.data.user,
          student: profileResponse.data.student || profileResponse.data.user?.student,
          current_academic_record: profileResponse.data.current_academic_record,
        }
      : profileResponse.data;

    setProfile(normalizedProfile);

    if (normalizedProfile.current_academic_record) {
      setCurrentRecord({ current_academic_record: normalizedProfile.current_academic_record });
    }

    return normalizedProfile;
  }

  async function loadStudentData(showRefreshState = false) {
    if (showRefreshState) setRefreshing(true);
    setPageError("");
    setSectionErrors({});

    try {
      const normalizedProfile = await loadProfile();
      if (!normalizedProfile) return;

      const resolvedUser = normalizedProfile.user || normalizedProfile;
      const resolvedStudent = normalizedProfile.student || resolvedUser?.student;
      const studentId = resolvedStudent?.id;

      if (!resolvedStudent) {
        setPageError("This account is not linked to a student profile.");
        return;
      }

      const [
        summaryRes,
        currentRecordRes,
        gradesRes,
        gradeObjectionsRes,
        attendanceRes,
        notificationsRes,
        scheduleRes,
        carriedRes,
        financeRes,
        paymentHistoryRes,
        examCardRes,
        academicCalendarRes,
        graduationEligibilityRes,
        courseMaterialsRes,
        officialDocumentsRes,
        examScheduleRes,
      ] = await Promise.all([
        requestWithFallback("student/academic-summary", studentId ? `students/${studentId}/academic-summary` : null),
        requestWithFallback("student/current-academic-record", studentId ? `students/${studentId}/current-academic-record` : null),
        requestWithFallback("student/grades", studentId ? `students/${studentId}/grades` : null),
        requestWithFallback("student/grade-objections"),
        requestWithFallback("student/attendance", studentId ? `students/${studentId}/attendance` : null),
        requestWithFallback("notifications/me"),
        requestWithFallback("student/class-schedule"),
        requestWithFallback("student/carried-courses", studentId ? `students/${studentId}/carried-courses` : null),
        studentId
          ? requestWithFallback("student/finance-status", `finance/students/${studentId}`)
          : Promise.resolve({ data: null, error: "" }),
        requestWithFallback("student/payment-history"),
        requestWithFallback("student/exam-card"),
        requestWithFallback("student/academic-calendar"),
        requestWithFallback("student/graduation-eligibility"),
        requestWithFallback("student/course-materials"),
        requestWithFallback("student/official-documents"),
        requestWithFallback("student/exam-schedule"),
      ]);

      const loadedSummaryData = summaryRes.data?.summary || summaryRes.data || null;
      const loadedCurrentRecord =
        currentRecordRes.data?.current_academic_record ||
        currentRecordRes.data?.currentAcademicRecord ||
        currentRecordRes.data ||
        normalizedProfile.current_academic_record ||
        null;

      const resolvedAcademicYearId =
        loadedCurrentRecord?.academic_year_id ||
        loadedCurrentRecord?.academic_year?.id ||
        loadedSummaryData?.academic_year_id ||
        loadedSummaryData?.academicYear?.id ||
        loadedSummaryData?.academic_year?.id ||
        null;

      let supplementaryEligibleRes = { data: null, error: "" };
      if (studentId && resolvedAcademicYearId) {
        supplementaryEligibleRes = await requestWithFallback(
          `students/${studentId}/supplementary/eligible?academic_year_id=${resolvedAcademicYearId}`
        );
      }

      const supplementaryRequestsRes = await requestWithFallback("student/supplementary-requests");
      const serviceRequestsRes = await requestWithFallback("student/service-requests");

      setSummary(summaryRes.data);
      setCurrentRecord((prev) => currentRecordRes.data || prev);
      setGrades(normalizeCollection(gradesRes.data, "grades"));
      setGradeObjections(normalizeCollection(gradeObjectionsRes.data, "grade_objections"));
      setSupplementaryEligibleCourses(normalizeCollection(supplementaryEligibleRes.data, "eligible_courses"));
      setSupplementaryRequests(
        normalizeCollection(supplementaryRequestsRes.data, "supplementary_requests").length
          ? normalizeCollection(supplementaryRequestsRes.data, "supplementary_requests")
          : normalizeCollection(supplementaryRequestsRes.data, "requests")
      );
      setServiceRequests(
        normalizeCollection(serviceRequestsRes.data, "service_requests").length
          ? normalizeCollection(serviceRequestsRes.data, "service_requests")
          : normalizeCollection(serviceRequestsRes.data, "requests")
      );
      setFinanceStatus(financeRes.data);
      setPaymentHistory(normalizePaymentHistoryPayload(paymentHistoryRes.data));
      setExamCard(normalizeExamCardPayload(examCardRes.data));
      setAcademicCalendar(normalizeAcademicCalendarPayload(academicCalendarRes.data));
      setGraduationEligibility(normalizeGraduationEligibilityPayload(graduationEligibilityRes.data));
      setCourseMaterials(normalizeCourseMaterialsPayload(courseMaterialsRes.data));
      setOfficialDocuments(normalizeOfficialDocumentsPayload(officialDocumentsRes.data));
      setExamSchedule(normalizeExamSchedulePayload(examScheduleRes.data));
      setAttendance(normalizeCollection(attendanceRes.data, "attendance"));
      setNotifications(normalizeCollection(notificationsRes.data, "notifications"));
      setSchedule(scheduleRes.data?.schedule || scheduleRes.data || null);
      setCarriedCourses(normalizeCollection(carriedRes.data, "carried_courses"));

      setSectionErrors({
        summary: summaryRes.error,
        currentRecord: currentRecordRes.error,
        grades: gradesRes.error,
        gradeObjections: gradeObjectionsRes.error,
        supplementaryEligibleCourses: supplementaryEligibleRes.error,
        supplementaryRequests: supplementaryRequestsRes.error,
        serviceRequests: serviceRequestsRes.error,
        finance: financeRes.error,
        paymentHistory: paymentHistoryRes.error,
        examCard: examCardRes.error,
        academicCalendar: academicCalendarRes.error,
        graduationEligibility: graduationEligibilityRes.error,
        courseMaterials: courseMaterialsRes.error,
        officialDocuments: officialDocumentsRes.error,
        examSchedule: examScheduleRes.error,
        attendance: attendanceRes.error,
        notifications: notificationsRes.error,
        schedule: scheduleRes.error,
        carriedCourses: carriedRes.error,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStudentData(false);
  }, []);

  useEffect(() => {
    saveStudentSettings(studentSettings);
  }, [studentSettings]);

  async function logout() {
    try {
      await api.post("logout");
    } catch {
      // Token may already be expired. Local logout still has to happen.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  }

  async function markNotificationAsRead(notificationId) {
    try {
      await api.patch(`notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item))
      );
    } catch (error) {
      setSectionErrors((prev) => ({ ...prev, notifications: extractApiMessage(error) }));
    }
  }

  async function markAllNotificationsAsRead() {
    try {
      await api.patch("notifications/read-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      setSectionErrors((prev) => ({ ...prev, notifications: extractApiMessage(error) }));
    }
  }

  function openGradeObjection(row) {
    setObjectionMessage({ type: "", text: "" });
    setObjectionForm({
      student_course_enrollment_id: row.enrollment_id || "",
      course_name: row.course_name || "Selected Course",
      objection_target: "exam",
      objection_text: "",
    });

    window.setTimeout(() => {
      document.getElementById("stp-objection-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function closeGradeObjectionForm() {
    setObjectionForm({
      student_course_enrollment_id: "",
      course_name: "",
      objection_target: "exam",
      objection_text: "",
    });
    setObjectionMessage({ type: "", text: "" });
  }

  async function submitGradeObjection(e) {
    e.preventDefault();
    setObjectionMessage({ type: "", text: "" });

    if (!student?.id) {
      setObjectionMessage({ type: "error", text: "Student profile was not loaded correctly." });
      return;
    }

    if (!objectionForm.student_course_enrollment_id) {
      setObjectionMessage({ type: "error", text: "Please select a course before submitting an objection." });
      return;
    }

    if (!objectionForm.objection_text.trim()) {
      setObjectionMessage({ type: "error", text: "Please write the reason for the objection." });
      return;
    }

    setSubmittingObjection(true);
    try {
      const response = await api.post("grade-objections", {
        student_id: student.id,
        student_course_enrollment_id: objectionForm.student_course_enrollment_id,
        objection_target: objectionForm.objection_target,
        objection_text: objectionForm.objection_text.trim(),
      });

      const createdObjection = response.data?.data;
      if (createdObjection) {
        setGradeObjections((prev) => [createdObjection, ...prev]);
      }

      setObjectionMessage({
        type: "success",
        text: response.data?.message || "Grade objection submitted successfully.",
      });
      setObjectionForm((prev) => ({ ...prev, objection_text: "" }));
    } catch (error) {
      setObjectionMessage({ type: "error", text: extractApiMessage(error) });
    } finally {
      setSubmittingObjection(false);
    }
  }

  function openSupplementaryRequest(course) {
    setSupplementaryMessage({ type: "", text: "" });
    setSupplementaryForm({
      student_course_enrollment_id: course.enrollment_id || "",
      course_name: course.course_name || "Selected Course",
      academic_year_id: currentAcademicYearId || course.academic_year_id || "",
      student_note: "",
    });

    window.setTimeout(() => {
      document.getElementById("stp-supplementary-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function closeSupplementaryForm() {
    setSupplementaryForm({
      student_course_enrollment_id: "",
      course_name: "",
      academic_year_id: "",
      student_note: "",
    });
    setSupplementaryMessage({ type: "", text: "" });
  }

  async function submitSupplementaryRequest(e) {
    e.preventDefault();
    setSupplementaryMessage({ type: "", text: "" });

    if (!student?.id) {
      setSupplementaryMessage({ type: "error", text: "Student profile was not loaded correctly." });
      return;
    }

    if (!supplementaryForm.student_course_enrollment_id) {
      setSupplementaryMessage({ type: "error", text: "Please select an eligible course first." });
      return;
    }

    if (!supplementaryForm.academic_year_id) {
      setSupplementaryMessage({ type: "error", text: "Current academic year was not detected." });
      return;
    }

    setSubmittingSupplementary(true);
    try {
      const response = await api.post("supplementary-requests", {
        student_id: student.id,
        student_course_enrollment_id: supplementaryForm.student_course_enrollment_id,
        academic_year_id: supplementaryForm.academic_year_id,
        student_note: supplementaryForm.student_note.trim() || null,
      });

      const createdRequest = response.data?.data;
      if (createdRequest) {
        setSupplementaryRequests((prev) => [createdRequest, ...prev]);
      }

      setSupplementaryEligibleCourses((prev) =>
        prev.filter((course) => Number(course.enrollment_id) !== Number(supplementaryForm.student_course_enrollment_id))
      );

      setSupplementaryMessage({
        type: "success",
        text: response.data?.message || "Supplementary exam request submitted successfully.",
      });
      setSupplementaryForm((prev) => ({ ...prev, student_note: "" }));
    } catch (error) {
      setSupplementaryMessage({ type: "error", text: extractApiMessage(error) });
    } finally {
      setSubmittingSupplementary(false);
    }
  }



  function updateServiceRequestForm(key, value) {
    setServiceRequestForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateStudentSetting(key, value) {
    setStudentSettings((prev) => ({ ...prev, [key]: value }));
    setSettingsMessage("Settings saved locally.");
    window.setTimeout(() => setSettingsMessage(""), 2500);
  }

  async function openRequestDetails(request) {
    setSelectedRequest(request);
    setRequestDetailsError("");

    if (request?.source !== "service" || !request?.raw_id) return;

    setRequestDetailsLoading(true);
    try {
      const response = await api.get(`student/service-requests/${request.raw_id}`);
      const rawRequest = response.data?.data || response.data;
      const normalized = normalizeServiceRequest(rawRequest, "service");
      setSelectedRequest(normalized);
      setServiceRequests((prev) => prev.map((item) => Number(item.id) === Number(rawRequest.id) ? rawRequest : item));
    } catch (error) {
      setRequestDetailsError(extractApiMessage(error));
    } finally {
      setRequestDetailsLoading(false);
    }
  }

  function closeRequestDetails() {
    setSelectedRequest(null);
    setRequestDetailsError("");
    setRequestDetailsLoading(false);
  }

  function openPhoneUpdateRequest() {
    setServiceRequestForm({
      request_type: "personal_info_update",
      subject: "Phone number update request",
      description: "Please update my phone number. I will provide the new number and any required verification details in this request.",
      priority: "normal",
      attachment: null,
    });
    setActiveTab("services");

    window.setTimeout(() => {
      document.getElementById("stp-service-request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  async function submitStudentServiceRequest(e) {
    e.preventDefault();
    setServiceRequestMessage({ type: "", text: "" });

    if (!serviceRequestForm.subject.trim()) {
      setServiceRequestMessage({ type: "error", text: "Please write a clear subject for your request." });
      return;
    }

    if (serviceRequestForm.attachment && serviceRequestForm.attachment.size > MAX_SERVICE_ATTACHMENT_SIZE) {
      setServiceRequestMessage({ type: "error", text: "Attachment size must not exceed 5 MB." });
      return;
    }

    setSubmittingServiceRequest(true);
    try {
      const formData = new FormData();
      formData.append("request_type", serviceRequestForm.request_type);
      formData.append("subject", serviceRequestForm.subject.trim());
      formData.append("description", serviceRequestForm.description.trim() || "");
      formData.append("priority", serviceRequestForm.priority);

      if (serviceRequestForm.attachment) {
        formData.append("attachment", serviceRequestForm.attachment);
      }

      const response = await api.post("student/service-requests", formData);

      const createdRequest = response.data?.data;
      if (createdRequest) {
        setServiceRequests((prev) => [createdRequest, ...prev]);
      }

      setServiceRequestMessage({
        type: "success",
        text: response.data?.message || "Student service request submitted successfully.",
      });
      setServiceRequestForm({
        request_type: serviceRequestForm.request_type,
        subject: "",
        description: "",
        priority: "normal",
        attachment: null,
      });

      const fileInput = document.getElementById("stp-service-attachment");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      setServiceRequestMessage({ type: "error", text: extractApiMessage(error) });
    } finally {
      setSubmittingServiceRequest(false);
    }
  }

  async function cancelStudentServiceRequest(requestId) {
    try {
      const response = await api.patch(`student/service-requests/${requestId}/cancel`);
      const updatedRequest = response.data?.data;
      if (updatedRequest) {
        setServiceRequests((prev) => prev.map((item) => item.id === updatedRequest.id ? updatedRequest : item));
        setSelectedRequest((prev) => {
          if (!prev || Number(prev.raw_id) !== Number(updatedRequest.id)) return prev;
          return normalizeServiceRequest(updatedRequest, "service");
        });
      }
      setServiceRequestMessage({ type: "success", text: response.data?.message || "Request cancelled successfully." });
    } catch (error) {
      setServiceRequestMessage({ type: "error", text: extractApiMessage(error) });
    }
  }

  function openFinancialReviewRequest() {
    setServiceRequestForm({
      request_type: "financial_review",
      subject: "Financial status review request",
      description: "Please review my tuition payment status, registration status, and receipt information.",
      priority: "normal",
      attachment: null,
    });
    setActiveTab("services");

    window.setTimeout(() => {
      document.getElementById("stp-service-request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function openStudentServiceShortcut(requestType, subject, description, priority = "normal") {
    setServiceRequestForm({
      request_type: requestType,
      subject,
      description,
      priority,
      attachment: null,
    });
    setServiceRequestMessage({ type: "", text: "" });
    setActiveTab("services");

    window.setTimeout(() => {
      document.getElementById("stp-service-request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }


  function handleOfficialDocumentAction(documentItem) {
    if (!documentItem) return;

    if (documentItem.mode === "instant") {
      if (documentItem.instantAction === "download_transcript") {
        downloadTranscriptPdf(documentItem);
        return;
      }

      if (documentItem.instantAction === "download_exam_card") {
        downloadExamCardPdf(documentItem);
        return;
      }
    }

    if (documentItem.requestType) {
      openStudentServiceShortcut(
        documentItem.requestType,
        documentItem.defaultSubject || `${documentItem.title} request`,
        documentItem.defaultDescription || `Please process my ${documentItem.title} request.`,
        documentItem.feeRequired ? "normal" : "normal"
      );
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setPasswordMessage({ type: "error", text: "New password confirmation does not match." });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await api.post("account/change-my-password", passwordForm);
      setPasswordMessage({ type: "success", text: response.data?.message || "Password changed successfully." });
      setPasswordForm({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (error) {
      setPasswordMessage({ type: "error", text: extractApiMessage(error) });
    } finally {
      setChangingPassword(false);
    }
  }

  const currentYearGrades = currentAcademicYearId
    ? grades.filter((row) => String(getRowAcademicYearId(row)) === String(currentAcademicYearId))
    : [];

  const recordedCurrentYearGrades = currentYearGrades.filter(hasRecordedGrade);
  const recordedAllGrades = grades.filter(hasRecordedGrade);

  const officialDocumentRows = useMemo(() => {
    return officialDocuments.length
      ? officialDocuments
      : buildOfficialDocumentsFallback(financialInfo, examCardRows, recordedAllGrades, currentAcademicRecord, student);
  }, [officialDocuments, financialInfo, examCardRows, recordedAllGrades, currentAcademicRecord, student]);

  const documentSummary = useMemo(() => {
    const instantCount = officialDocumentRows.filter((item) => item.mode === "instant").length;
    const requestCount = officialDocumentRows.filter((item) => item.mode !== "instant").length;
    const blockedCount = officialDocumentRows.filter((item) => item.available === false || item.status === "blocked").length;
    return {
      total: officialDocumentRows.length,
      instantCount,
      requestCount,
      blockedCount,
    };
  }, [officialDocumentRows]);

  const filteredOfficialDocuments = useMemo(() => {
    if (documentFilter === "instant") return officialDocumentRows.filter((item) => item.mode === "instant");
    if (documentFilter === "requests") return officialDocumentRows.filter((item) => item.mode !== "instant");
    if (documentFilter === "blocked") return officialDocumentRows.filter((item) => item.available === false || item.status === "blocked");
    return officialDocumentRows;
  }, [officialDocumentRows, documentFilter]);

  const totalPassed = recordedCurrentYearGrades.filter((row) => row.grade?.result_status === "passed").length;
  const totalFailed = recordedCurrentYearGrades.filter((row) => row.grade?.result_status === "failed").length;

  const currentYearAverage = calculateAcademicAverage(currentYearGrades);
  const cumulativeAverage = calculateAcademicAverage(grades);

  const currentYearAverageHint = recordedCurrentYearGrades.length
    ? "Current academic year"
    : "No recorded grades yet";

  const cumulativeAverageHint = recordedAllGrades.length
    ? "All recorded academic years"
    : "No recorded grades yet";

  const currentStudyYearNumber = getCurrentStudyYearNumber(currentAcademicRecord, summaryData);

  const gradeYearTabs = useMemo(() => {
    const numbers = new Set();

    grades.forEach((row) => {
      const yearNumber = getRowStudyYearNumber(row);
      if (yearNumber) numbers.add(yearNumber);
    });

    if (currentStudyYearNumber) {
      for (let year = 1; year <= currentStudyYearNumber; year += 1) {
        numbers.add(year);
      }
    }

    return Array.from(numbers)
      .sort((a, b) => a - b)
      .map((number) => ({
        key: String(number),
        number,
        label: studyYearLabel(number),
      }));
  }, [grades, currentStudyYearNumber]);

  useEffect(() => {
    if (!gradeYearTabs.length) {
      setSelectedGradeYear("");
      return;
    }

    const preferredKey =
      currentStudyYearNumber && gradeYearTabs.some((tab) => tab.key === String(currentStudyYearNumber))
        ? String(currentStudyYearNumber)
        : gradeYearTabs[0].key;

    setSelectedGradeYear((prev) => {
      if (prev && gradeYearTabs.some((tab) => tab.key === prev)) return prev;
      return preferredKey;
    });
  }, [gradeYearTabs, currentStudyYearNumber]);

  const filteredGradesByStudyYear = selectedGradeYear
    ? grades.filter((row) => String(getRowStudyYearNumber(row)) === String(selectedGradeYear))
    : grades;

  const gradeSemesterTabs = useMemo(() => {
    const numbers = new Set();

    filteredGradesByStudyYear.forEach((row) => {
      const semesterNumber = getRowSemesterNumber(row);
      if (semesterNumber) numbers.add(semesterNumber);
    });

    const semesterTabs = Array.from(numbers)
      .sort((a, b) => a - b)
      .map((number) => ({
        key: String(number),
        label: `Semester ${number}`,
      }));

    return [{ key: "all", label: "All Semesters" }, ...semesterTabs];
  }, [filteredGradesByStudyYear]);

  useEffect(() => {
    setSelectedGradeSemester((prev) => {
      if (gradeSemesterTabs.some((tab) => tab.key === prev)) return prev;
      return "all";
    });
  }, [gradeSemesterTabs]);

  const filteredGradesForDisplay =
    selectedGradeSemester === "all"
      ? filteredGradesByStudyYear
      : filteredGradesByStudyYear.filter((row) => String(getRowSemesterNumber(row)) === String(selectedGradeSemester));

  const activeGradeYearLabel =
    gradeYearTabs.find((tab) => tab.key === selectedGradeYear)?.label || "All Years";

  const academicPlanProgress = useMemo(
    () => buildAcademicPlanProgress(grades, currentStudyYearNumber),
    [grades, currentStudyYearNumber]
  );

  const academicStanding = getAcademicStandingInfo(
    summaryData?.academic_result || currentAcademicRecord?.academic_result,
    carriedCourses.length,
    supplementaryEligibleCourses.length
  );

  const attendanceRiskSummary = useMemo(() => getAttendanceRiskSummary(attendance), [attendance]);

  const attendanceOverallSummary = useMemo(
    () => getAttendanceOverallSummary(attendanceRiskSummary),
    [attendanceRiskSummary]
  );

  const filteredAttendanceAnalytics = useMemo(() => {
    if (attendanceAnalyticsFilter === "all") return attendanceRiskSummary;
    return attendanceRiskSummary.filter((item) => item.risk === attendanceAnalyticsFilter);
  }, [attendanceRiskSummary, attendanceAnalyticsFilter]);

  const riskyAttendanceCourses = attendanceRiskSummary.filter((item) => item.risk !== "safe");

  const nextActions = useMemo(() => {
    const actions = [];

    if (activeGradeObjectionsCount > 0) {
      actions.push({
        type: "warning",
        icon: "fa-solid fa-scale-balanced",
        title: "Objection under review",
        text: `You have ${activeGradeObjectionsCount} active grade objection${activeGradeObjectionsCount > 1 ? "s" : ""}.`,
        tab: "objections",
      });
    }

    if (supplementaryEligibleCourses.length > 0) {
      actions.push({
        type: "warning",
        icon: "fa-solid fa-file-circle-check",
        title: "Supplementary registration available",
        text: `${supplementaryEligibleCourses.length} course${supplementaryEligibleCourses.length > 1 ? "s are" : " is"} eligible for supplementary exam registration.`,
        tab: "supplementary",
      });
    }

    if (carriedCourses.length > 0) {
      actions.push({
        type: "danger",
        icon: "fa-solid fa-book-bookmark",
        title: "Carried courses require attention",
        text: `You currently have ${carriedCourses.length} carried course${carriedCourses.length > 1 ? "s" : ""}.`,
        tab: "carried",
      });
    }

    if (unreadCount > 0) {
      actions.push({
        type: "info",
        icon: "fa-solid fa-bell",
        title: "Unread notifications",
        text: `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`,
        tab: "notifications",
      });
    }

    if (financialInfo.blocked) {
      actions.push({
        type: "danger",
        icon: "fa-solid fa-wallet",
        title: "Financial status needs attention",
        text: "Your tuition or registration status may require review before completing student services.",
        tab: "finance",
      });
    }

    if (!graduationSummary.eligible && (graduationSummary.remainingCourses > 0 || graduationSummary.blockersCount > 0)) {
      actions.push({
        type: "warning",
        icon: "fa-solid fa-user-graduate",
        title: "Graduation requirements need review",
        text: "Review academic, financial, and registration requirements before graduation clearance.",
        tab: "graduation",
      });
    }

    if (examCardSummary.blockedCount > 0) {
      actions.push({
        type: "danger",
        icon: "fa-solid fa-id-card-clip",
        title: "Exam card has blocked exams",
        text: `${examCardSummary.blockedCount} exam${examCardSummary.blockedCount > 1 ? "s are" : " is"} currently blocked. Review eligibility reasons before exam day.`,
        tab: "examCard",
      });
    }

    if (calendarSummary.dueSoonCount > 0) {
      actions.push({
        type: "warning",
        icon: "fa-solid fa-calendar-check",
        title: "Important deadline approaching",
        text: `${calendarSummary.dueSoonCount} academic deadline${calendarSummary.dueSoonCount > 1 ? "s need" : " needs"} your attention soon.`,
        tab: "calendar",
      });
    }

    if (upcomingExams.length > 0) {
      actions.push({
        type: "info",
        icon: "fa-solid fa-calendar-days",
        title: "Upcoming exams available",
        text: `You have ${upcomingExams.length} upcoming exam${upcomingExams.length > 1 ? "s" : ""} in your schedule.`,
        tab: "examSchedule",
      });
    }

    if (activeServiceRequestsCount > 0) {
      actions.push({
        type: "info",
        icon: "fa-solid fa-headset",
        title: "Service requests in progress",
        text: `You have ${activeServiceRequestsCount} student service request${activeServiceRequestsCount > 1 ? "s" : ""} being processed.`,
        tab: "services",
      });
    }

    if (!recordedCurrentYearGrades.length) {
      actions.push({
        type: "info",
        icon: "fa-solid fa-square-poll-vertical",
        title: "No grades recorded yet",
        text: "Once the examinations department submits grades, they will appear here.",
        tab: "grades",
      });
    }

    if (riskyAttendanceCourses.length > 0) {
      actions.push({
        type: "warning",
        icon: "fa-solid fa-user-check",
        title: "Attendance needs review",
        text: `${riskyAttendanceCourses.length} course${riskyAttendanceCourses.length > 1 ? "s need" : " needs"} attendance attention.`,
        tab: "attendance",
      });
    }

    if (!actions.length) {
      actions.push({
        type: "success",
        icon: "fa-solid fa-circle-check",
        title: "Everything is up to date",
        text: "No urgent academic actions are required at this time.",
        tab: "overview",
      });
    }

    return actions;
  }, [
    activeGradeObjectionsCount,
    supplementaryEligibleCourses.length,
    carriedCourses.length,
    unreadCount,
    activeServiceRequestsCount,
    financialInfo.blocked,
    graduationSummary.eligible,
    graduationSummary.remainingCourses,
    graduationSummary.blockersCount,
    examCardSummary.blockedCount,
    calendarSummary.dueSoonCount,
    upcomingExams.length,
    recordedCurrentYearGrades.length,
    riskyAttendanceCourses.length,
  ]);

  function buildTranscriptLines(documentItem = null) {
    const studentName = user?.full_name || student?.user?.full_name || FALLBACK_TEXT;
    const studentNo = student?.student_number || summaryData?.student_number || FALLBACK_TEXT;
    const programName = student?.program?.name || summaryData?.program || FALLBACK_TEXT;
    const academicYearName =
      currentAcademicRecord?.academic_year?.name ||
      summaryData?.academic_year ||
      FALLBACK_TEXT;

    const rows = recordedAllGrades.length ? recordedAllGrades : grades;

    const lines = [
      "UNIVERSITY ACADEMIC TRANSCRIPT",
      "================================",
      `Student Name: ${studentName}`,
      `Student Number: ${studentNo}`,
      `Program: ${programName}`,
      `Academic Year: ${academicYearName}`,
      `Annual Average: ${currentYearAverage}`,
      `Cumulative Average: ${cumulativeAverage}`,
      `Generated At: ${formatDateTime(new Date().toISOString())}`,
      ...(documentItem?.verificationCode ? [`Verification Code: ${documentItem.verificationCode}`] : []),
      ...(getDocumentVerificationUrl(documentItem) ? [`Verify Online: ${getDocumentVerificationUrl(documentItem)}`] : []),
      "",
      "Courses",
      "-------",
    ];

    if (!rows.length) {
      lines.push("No grades are available yet.");
      return lines;
    }

    rows.forEach((row, index) => {
      const courseName = getRowCourseName(row);
      const courseCode = getRowCourseCode(row) || "N/A";
      const year = getRowAcademicYearName(row) || "N/A";
      const semester = getRowSemesterNumber(row) || "N/A";
      const grade = row.grade || row;
      const finalMark = hasRecordedGrade(row) ? formatValue(grade.final_mark) : "No grade";
      const status = statusLabels[grade.result_status] || formatValue(grade.result_status || "pending");

      wrapPdfText(
        `${index + 1}. ${courseCode} - ${courseName} | Year: ${year} | Semester: ${semester} | Final: ${finalMark} | Status: ${status}`,
        105
      ).forEach((line) => lines.push(line));
    });

    lines.push("");
    lines.push("Note: This transcript is generated from the student portal based on currently recorded grades.");
    if (documentItem?.verificationCode) {
      lines.push(`Verification: Use code ${documentItem.verificationCode} or scan the QR/link shown in the portal.`);
    }
    return lines;
  }

  function downloadTranscriptPdf(documentItem = null) {
    const studentNo = student?.student_number || "student";
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadSimplePdf(`transcript-${studentNo}-${timestamp}.pdf`, buildTranscriptLines(documentItem));
  }

  function printTranscript() {
    const lines = buildTranscriptLines();
    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Student Transcript</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; color: #10233f; }
            h1 { margin: 0 0 12px; }
            pre { white-space: pre-wrap; line-height: 1.55; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>Student Transcript</h1>
          <pre>${lines.map((line) => String(line).replace(/</g, "&lt;").replace(/>/g, "&gt;")).join("\\n")}</pre>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }


  function studentNameSafe() {
    return user?.full_name || student?.user?.full_name || student?.full_name || "Student";
  }

  function buildExamCardLines(documentItem = null) {
    const resolvedStudentName = examCard?.student?.full_name || studentNameSafe();
    const studentNo = examCard?.student?.student_number || student?.student_number || summaryData?.student_number || FALLBACK_TEXT;
    const programName = examCard?.student?.program_name || student?.program?.name || summaryData?.program_name || FALLBACK_TEXT;
    const academicYearName = examCard?.academic_year?.name || examCardRows[0]?.academicYear || summaryData?.academic_year || FALLBACK_TEXT;

    const lines = [
      "UNIVERSITY EXAM CARD",
      "====================",
      `Student Name: ${resolvedStudentName}`,
      `Student Number: ${studentNo}`,
      `Program: ${programName}`,
      `Academic Year: ${academicYearName}`,
      `Total Exams: ${examCardSummary.totalExams}`,
      `Allowed: ${examCardSummary.eligibleCount}`,
      `Blocked: ${examCardSummary.blockedCount}`,
      `Generated At: ${formatDateTime(new Date().toISOString())}`,
      ...(documentItem?.verificationCode ? [`Verification Code: ${documentItem.verificationCode}`] : []),
      ...(getDocumentVerificationUrl(documentItem) ? [`Verify Online: ${getDocumentVerificationUrl(documentItem)}`] : []),
      "",
      "Exam Eligibility Details",
      "------------------------",
    ];

    if (!examCardRows.length) {
      lines.push("No exam card data is available yet.");
      return lines;
    }

    examCardRows.forEach((exam, index) => {
      const reasons = exam.eligibilityReasons?.length ? ` | Reasons: ${exam.eligibilityReasons.join("; ")}` : "";
      wrapPdfText(
        `${index + 1}. ${exam.courseCode || "N/A"} - ${exam.courseName} | Type: ${exam.examType} | Date: ${formatDateTime(exam.examDate)} | Room: ${exam.examRoom} | Status: ${exam.eligibilityLabel}${reasons}`,
        105
      ).forEach((line) => lines.push(line));
    });

    lines.push("");
    lines.push("Note: This exam card is generated from the student portal based on the latest available academic, financial, attendance, and examination data.");
    if (documentItem?.verificationCode) {
      lines.push(`Verification: Use code ${documentItem.verificationCode} or scan the QR/link shown in the portal.`);
    }
    return lines;
  }

  function downloadExamCardPdf(documentItem = null) {
    const studentNo = examCard?.student?.student_number || student?.student_number || "student";
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadSimplePdf(`exam-card-${studentNo}-${timestamp}.pdf`, buildExamCardLines(documentItem));
  }

  function printExamCard() {
    const lines = buildExamCardLines();
    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Student Exam Card</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 28px; color: #10233f; }
            h1 { margin: 0 0 12px; }
            pre { white-space: pre-wrap; line-height: 1.55; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>Student Exam Card</h1>
          <pre>${lines.map((line) => String(line).replace(/</g, "&lt;").replace(/>/g, "&gt;")).join("\n")}</pre>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  if (loading) {
    return (
      <div className="stp2-page stp2-loading-page">
        <div className="stp2-loader-card">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <h2>Loading student portal...</h2>
          <p>Preparing your academic workspace.</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="stp2-page stp2-loading-page">
        <div className="stp2-loader-card stp2-error-card">
          <i className="fa-solid fa-circle-exclamation"></i>
          <h2>Unable to open student portal</h2>
          <p>{pageError}</p>
          <div className="stp2-inline-actions">
            <button className="stp2-btn primary" onClick={() => loadStudentData(true)} disabled={refreshing}>Try Again</button>
            <button className="stp2-btn ghost" onClick={logout}>Logout</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`stp2-page ${studentSettings.compactMode ? "compact" : ""} ${studentSettings.showSensitiveFinancialInfo ? "" : "hide-sensitive-finance"}`}>
      <aside className="stp2-sidebar">
        <div className="stp2-brand">
          <div className="stp2-brand-icon"><i className="fa-solid fa-user-graduate"></i></div>
          <div>
            <h2>Student Portal</h2>
            <p>University Management System</p>
          </div>
        </div>

        <div className="stp2-profile-mini">
          <div className="stp2-avatar">{initials}</div>
          <div>
            <strong>{studentName}</strong>
            <p>{student?.student_number || "No student number"}</p>
            <p>{student?.program?.name || summaryData?.program_name || "Student"}</p>
          </div>
        </div>

        <nav className="stp2-nav">
          {STUDENT_TABS.map((tab) => {
            const badge =
              tab.key === "notifications" ? unreadCount :
              tab.key === "objections" ? activeGradeObjectionsCount :
              tab.key === "supplementary" ? activeSupplementaryRequestsCount :
              tab.key === "services" ? activeServiceRequestsCount :
              tab.key === "finance" && financialInfo.blocked ? "!" :
              tab.key === "graduation" ? (graduationSummary.eligible ? null : (graduationSummary.blockersCount || graduationSummary.remainingCourses || "!")) :
              tab.key === "courseMaterials" ? courseMaterialsSummary.materialsCount :
              tab.key === "examCard" ? examCardSummary.blockedCount :
              tab.key === "calendar" ? calendarSummary.dueSoonCount :
              tab.key === "examSchedule" ? upcomingExams.length :
              null;

            return (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? "active" : ""}
                onClick={() => setActiveTab(tab.key)}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
                {badge ? <em>{badge}</em> : null}
              </button>
            );
          })}
        </nav>

        <button type="button" className="stp2-logout" onClick={logout}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          Logout
        </button>
      </aside>

      <main className="stp2-main">
        <section className="stp2-hero">
          <div>
            <p className="stp2-eyebrow">Student Workspace</p>
            <h1>Welcome, {studentName}</h1>
            <p>View your academic status, grades, attendance, notifications, and submit student requests from one clear workspace.</p>
          </div>
          <div className="stp2-hero-actions">
            <StatusBadge value={student?.is_active_registration} />
            <button className="stp2-btn light" onClick={() => loadStudentData(true)} disabled={refreshing}>
              <i className={`fa-solid fa-rotate ${refreshing ? "fa-spin" : ""}`}></i>
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </section>

        {activeTab === "overview" && (
          <>
        <section className="stp2-metrics">
          <MetricCard
            icon="fa-solid fa-chart-simple"
            title="Annual Average"
            value={currentYearAverage}
            hint={currentYearAverageHint}
            description="Calculated from the current academic year only."
          />
          <MetricCard
            icon="fa-solid fa-award"
            title="Cumulative Average"
            value={cumulativeAverage}
            hint={cumulativeAverageHint}
            description="Calculated from all recorded academic years."
          />
          <MetricCard icon="fa-solid fa-book-open" title="Courses" value={currentYearGrades.length} hint={`${totalPassed} passed / ${totalFailed} failed`} />
          {notifications.length > 0 && (
            <MetricCard icon="fa-solid fa-bell" title="Notifications" value={notifications.length} hint={`${unreadCount} unread`} />
          )}
          <MetricCard icon="fa-solid fa-scale-balanced" title="Objections" value={gradeObjections.length} hint={`${activeGradeObjectionsCount} active`} />
          <MetricCard icon="fa-solid fa-wallet" title="Finance" value={financialInfo.tuitionPaid ? "Paid" : "Unpaid"} hint={financialInfo.registrationStatus} />
          <MetricCard icon="fa-solid fa-calendar-days" title="Upcoming Exams" value={upcomingExams.length} hint={`${examSchedule.regular.length} regular / ${examSchedule.supplementary.length} supplementary`} />
          <MetricCard icon="fa-solid fa-headset" title="My Requests" value={allStudentRequests.length} hint={`${activeServiceRequestsCount} services in progress`} />
        </section>

        <div className="stp2-grid two stp2-smart-overview">
          <NextActionsCard actions={nextActions} onSelectTab={setActiveTab} />
          <AcademicStandingCard standing={academicStanding} />
          <FinancialStatusCard financialInfo={financialInfo} onOpenFinance={() => setActiveTab("finance")} />
          <AcademicPlanMiniCard progress={academicPlanProgress} onOpenProgress={() => setActiveTab("progress")} />
        </div>

        {riskyAttendanceCourses.length > 0 && (
          <section className="stp2-card stp2-attendance-risk-card">
            <CardHeader icon="fa-solid fa-user-check" title="Attendance Risk Alert" pill={`${riskyAttendanceCourses.length} warning`} />
            <div className="stp2-attendance-risk-list">
              {riskyAttendanceCourses.map((item) => (
                <article key={item.courseName} className={`stp2-attendance-risk-item ${item.risk}`}>
                  <div>
                    <strong>{item.courseName}</strong>
                    <p>{item.percentage}% attendance - {item.label}</p>
                  </div>
                  <span>{item.present}/{item.total}</span>
                </article>
              ))}
            </div>
          </section>
        )}

          <div className="stp2-grid two">
            <section className="stp2-card">
              <CardHeader icon="fa-solid fa-id-card" title="Personal Information" />
              <div className="stp2-info-list">
                <InfoItem label="Full Name" value={user?.full_name || student?.user?.full_name} />
                <InfoItem label="Email" value={user?.email} />
                <InfoItem label="Mobile" value={user?.mobile} />
                <InfoItem label="Birth Date" value={formatDate(user?.birth_date)} />
                <InfoItem label="Birth Place" value={user?.birth_place} />
                <InfoItem label="Gender" value={user?.gender} />
                <InfoItem label="Nationality" value={user?.nationality} />
                <InfoItem label="Address" value={user?.address} />
              </div>
            </section>

            <section className="stp2-card">
              <CardHeader icon="fa-solid fa-graduation-cap" title="Academic Status" />
              <ErrorNote message={sectionErrors.summary || sectionErrors.currentRecord} />
              <div className="stp2-info-list">
                <InfoItem label="Student Number" value={student?.student_number} />
                <InfoItem label="Program" value={student?.program?.name || summaryData?.program_name} />
                <InfoItem label="Specialization" value={student?.specialization?.name || summaryData?.specialization_name} />
                <InfoItem label="Academic Year" value={summaryData?.academic_year || currentAcademicRecord?.academic_year?.name} />
                <InfoItem label="Study Year" value={summaryData?.study_year || currentAcademicRecord?.study_year?.name} />
                <InfoItem label="Registration" value={<StatusBadge value={summaryData?.registration_status || currentAcademicRecord?.registration_status} />} />
                <InfoItem label="Academic Result" value={<StatusBadge value={summaryData?.academic_result || currentAcademicRecord?.academic_result} />} />
                <InfoItem label="Tuition Paid" value={<StatusBadge value={summaryData?.tuition_paid ?? currentAcademicRecord?.tuition_paid} />} />
                <InfoItem label="Receipt Number" value={<span className="stp2-sensitive-finance">{formatValue(financialInfo.receiptNumber)}</span>} />
              </div>
            </section>

          </div>
          </>
        )}


        {activeTab === "profile" && (
          <>
            <section className="stp2-card stp2-profile-file-hero">
              <div className="stp2-profile-identity">
                <div className="stp2-profile-avatar-xl">{initials}</div>
                <div>
                  <p className="stp2-profile-eyebrow">Student File</p>
                  <h2>{studentName}</h2>
                  <p>
                    {student?.student_number || summaryData?.student_number || "No student number"}
                    {" • "}
                    {student?.program?.name || summaryData?.program_name || "Program not assigned"}
                  </p>
                  <div className="stp2-profile-badges">
                    <StatusBadge value={student?.is_active_registration} />
                    <StatusBadge value={summaryData?.registration_status || currentAcademicRecord?.registration_status || "pending"} />
                    <StatusBadge value={summaryData?.academic_result || currentAcademicRecord?.academic_result || "in_progress"} />
                  </div>
                </div>
              </div>

              <div className="stp2-profile-completion-card">
                <div className="stp2-profile-completion-head">
                  <span>Profile completion</span>
                  <strong>{profileCompletion.percent}%</strong>
                </div>
                <div className="stp2-profile-progress-track">
                  <span style={{ width: `${profileCompletion.percent}%` }}></span>
                </div>
                <p>
                  {profileCompletion.missing.length
                    ? `Missing: ${profileCompletion.missing.slice(0, 4).join(", ")}${profileCompletion.missing.length > 4 ? "..." : ""}`
                    : "Your student file contains all key information needed by the portal."}
                </p>
              </div>
            </section>

            <div className="stp2-grid two stp2-profile-grid">
              <section className="stp2-card">
                <div className="stp2-section-head">
                  <CardHeader icon="fa-solid fa-address-card" title="Personal Details" />
                  <button
                    type="button"
                    className="stp2-btn light small"
                    onClick={() => openStudentServiceShortcut(
                      "personal_info_update",
                      "Personal information update request",
                      "Please review and update my personal information. I will provide the corrected details and any supporting document if required."
                    )}
                  >
                    <i className="fa-solid fa-user-pen"></i>
                    Request Update
                  </button>
                </div>
                <div className="stp2-info-list">
                  <InfoItem label="Full Name" value={user?.full_name || student?.user?.full_name} />
                  <InfoItem label="Email" value={user?.email} />
                  <InfoItem label="Mobile" value={user?.mobile} />
                  <InfoItem label="Birth Date" value={formatDate(user?.birth_date)} />
                  <InfoItem label="Birth Place" value={user?.birth_place} />
                  <InfoItem label="Gender" value={user?.gender} />
                  <InfoItem label="Nationality" value={user?.nationality} />
                  <InfoItem label="Address" value={user?.address} wide />
                </div>
              </section>

              <section className="stp2-card">
                <CardHeader icon="fa-solid fa-graduation-cap" title="Academic File" />
                <ErrorNote message={sectionErrors.summary || sectionErrors.currentRecord} />
                <div className="stp2-info-list">
                  <InfoItem label="Student Number" value={student?.student_number || summaryData?.student_number} />
                  <InfoItem label="Program" value={student?.program?.name || summaryData?.program_name} />
                  <InfoItem label="Specialization" value={student?.specialization?.name || summaryData?.specialization_name} />
                  <InfoItem label="Enrollment Date" value={formatDate(student?.enrollment_date)} />
                  <InfoItem label="Current Academic Year" value={summaryData?.academic_year || currentAcademicRecord?.academic_year?.name} />
                  <InfoItem label="Current Study Year" value={summaryData?.study_year || currentAcademicRecord?.study_year?.name} />
                  <InfoItem label="Registration Status" value={<StatusBadge value={summaryData?.registration_status || currentAcademicRecord?.registration_status} />} />
                  <InfoItem label="Academic Result" value={<StatusBadge value={summaryData?.academic_result || currentAcademicRecord?.academic_result} />} />
                  <InfoItem label="Active Registration" value={<StatusBadge value={student?.is_active_registration} />} />
                  <InfoItem label="Exhausted" value={<StatusBadge value={student?.is_exhausted} />} />
                </div>
              </section>
            </div>

            <div className="stp2-grid two stp2-profile-grid">
              <section className="stp2-card">
                <CardHeader icon="fa-solid fa-folder-open" title="Academic Documents" pill="Student copy" />
                <p className="stp2-card-note">
                  Download or request the most common academic documents directly from your student portal.
                </p>
                <div className="stp2-profile-action-grid">
                  <button type="button" className="stp2-profile-action" onClick={downloadTranscriptPdf}>
                    <i className="fa-solid fa-file-pdf"></i>
                    <strong>Download Unofficial Transcript</strong>
                    <span>Local PDF copy of recorded grades</span>
                  </button>
                  <button type="button" className="stp2-profile-action" onClick={printTranscript}>
                    <i className="fa-solid fa-print"></i>
                    <strong>Print Transcript</strong>
                    <span>Open printable student grade statement</span>
                  </button>
                  <button
                    type="button"
                    className="stp2-profile-action"
                    onClick={() => openStudentServiceShortcut(
                      "enrollment_certificate",
                      "Enrollment certificate request",
                      "Please issue an official enrollment certificate for my current academic year."
                    )}
                  >
                    <i className="fa-solid fa-id-card-clip"></i>
                    <strong>Enrollment Certificate</strong>
                    <span>Send official request to Student Affairs</span>
                  </button>
                  <button
                    type="button"
                    className="stp2-profile-action"
                    onClick={() => openStudentServiceShortcut(
                      "clearance_request",
                      "University clearance request",
                      "Please start my university clearance request and confirm the required steps with the relevant departments."
                    )}
                  >
                    <i className="fa-solid fa-circle-check"></i>
                    <strong>Clearance Request</strong>
                    <span>For graduation or administrative clearance</span>
                  </button>
                </div>
              </section>

              <section className="stp2-card">
                <CardHeader icon="fa-solid fa-bolt" title="Quick Student Services" />
                <div className="stp2-profile-service-list">
                  <button
                    type="button"
                    onClick={() => openStudentServiceShortcut(
                      "official_attendance_statement",
                      "Official attendance statement request",
                      "Please issue an official attendance statement for my current enrolled courses."
                    )}
                  >
                    <i className="fa-solid fa-user-check"></i>
                    <span>Official Attendance Statement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openStudentServiceShortcut(
                      "course_description_request",
                      "Course description request",
                      "Please provide an official course description for the course(s) I will list in this request."
                    )}
                  >
                    <i className="fa-solid fa-book-open"></i>
                    <span>Course Description Request</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openStudentServiceShortcut(
                      "registration_status_review",
                      "Registration status review request",
                      "Please review my registration status and confirm whether my academic registration is active and complete."
                    )}
                  >
                    <i className="fa-solid fa-clipboard-check"></i>
                    <span>Registration Status Review</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openStudentServiceShortcut(
                      "student_card_replacement",
                      "Student card replacement request",
                      "Please issue a replacement student card. I will attach any required document or explanation."
                    )}
                  >
                    <i className="fa-solid fa-id-badge"></i>
                    <span>Student Card Replacement</span>
                  </button>
                </div>
              </section>
            </div>
          </>
        )}



        {activeTab === "graduation" && (
          <div className="stp2-grid two stp2-graduation-page">
            <section className={`stp2-card stp2-wide stp2-graduation-hero ${graduationSummary.eligible ? "eligible" : "pending"}`}>
              <CardHeader
                icon="fa-solid fa-user-graduate"
                title="Graduation Eligibility"
                pill={graduationSummary.eligible ? "Eligible" : "Needs review"}
              />
              <ErrorNote message={sectionErrors.graduationEligibility} />

              <div className="stp2-graduation-status-band">
                <div className="stp2-graduation-status-icon">
                  <i className={graduationSummary.eligible ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation"}></i>
                </div>
                <div>
                  <span>Current graduation status</span>
                  <h3>{graduationEligibility.title}</h3>
                  <p>{graduationEligibility.message}</p>
                </div>
              </div>

              <div className="stp2-graduation-progress-block">
                <div className="stp2-graduation-progress-head">
                  <div>
                    <span>Study plan completion</span>
                    <strong>{graduationSummary.completionPercentage}%</strong>
                  </div>
                  <p>{graduationSummary.completedCourses}/{graduationSummary.totalCourses} courses completed</p>
                </div>
                <div className="stp2-progress-line">
                  <span style={{ width: `${Math.min(100, Math.max(0, graduationSummary.completionPercentage))}%` }}></span>
                </div>
              </div>

              <div className="stp2-metrics-grid stp2-graduation-summary-grid">
                <MetricCard icon="fa-solid fa-book-open-reader" title="Completed" value={graduationSummary.completedCourses} hint="Passed courses" />
                <MetricCard icon="fa-solid fa-list-check" title="Remaining" value={graduationSummary.remainingCourses} hint="Need completion" />
                <MetricCard icon="fa-solid fa-book-bookmark" title="Carried" value={graduationSummary.carriedCourses} hint="Retake attention" />
                <MetricCard icon="fa-solid fa-coins" title="Credits" value={`${graduationSummary.completedCredits}/${graduationSummary.totalCredits}`} hint="Completed / total" />
              </div>

              {graduationEligibility.requirements?.length ? (
                <div className="stp2-graduation-requirements-grid">
                  {graduationEligibility.requirements.map((requirement) => (
                    <article key={requirement.key} className={`stp2-requirement-card ${requirement.passed ? "passed" : "pending"}`}>
                      <div className="stp2-requirement-icon"><i className={requirement.icon}></i></div>
                      <div>
                        <strong>{requirement.title}</strong>
                        <p>{requirement.message}</p>
                      </div>
                      <StatusBadge value={requirement.passed ? "eligible" : "pending"} />
                    </article>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="stp2-card stp2-graduation-blockers-card">
              <CardHeader icon="fa-solid fa-clipboard-list" title="Graduation Checklist" pill={`${graduationSummary.blockersCount} items`} />
              {graduationEligibility.blockers?.length ? (
                <div className="stp2-graduation-blockers-list">
                  {graduationEligibility.blockers.map((blocker) => (
                    <article key={blocker.key} className={`stp2-graduation-blocker ${blocker.type || "warning"}`}>
                      <div>
                        <strong>{blocker.title}</strong>
                        <p>{blocker.message}</p>
                      </div>
                      {blocker.count !== null && blocker.count !== undefined ? <span>{blocker.count}</span> : null}
                      {blocker.actionTab ? (
                        <button type="button" className="stp2-btn light small" onClick={() => setActiveTab(blocker.actionTab)}>
                          Open
                        </button>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="All graduation checks passed" text="No pending academic, registration, or financial blockers were detected." />
              )}
            </section>

            <section className="stp2-card stp2-wide stp2-graduation-courses-card">
              <CardHeader icon="fa-solid fa-list-ul" title="Remaining Academic Items" pill={`${graduationEligibility.courses?.remaining?.length || 0} remaining`} />
              {(graduationEligibility.courses?.remaining?.length || graduationEligibility.courses?.carried?.length || graduationEligibility.courses?.failed?.length || graduationEligibility.courses?.inProgress?.length) ? (
                <div className="stp2-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Study Year</th>
                        <th>Semester</th>
                        <th>Mark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ...(graduationEligibility.courses?.remaining || []),
                        ...(graduationEligibility.courses?.carried || []),
                        ...(graduationEligibility.courses?.failed || []),
                        ...(graduationEligibility.courses?.inProgress || []),
                      ].map((course) => (
                        <tr key={`${course.id}-${course.category}`}>
                          <td>
                            <strong>{course.courseName}</strong>
                            <small>{course.courseCode}</small>
                          </td>
                          <td><StatusBadge value={course.status || course.category} /></td>
                          <td>{formatValue(course.studyYear)}</td>
                          <td>{formatValue(course.semesterNumber)}</td>
                          <td>{course.finalMark !== null && course.finalMark !== undefined ? course.finalMark : FALLBACK_TEXT}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No remaining courses" text="The academic plan does not show remaining courses based on the current records." />
              )}
            </section>
          </div>
        )}

        {activeTab === "courseMaterials" && (
          <section className="stp2-course-materials-page">
            <div className="stp2-grid two stp2-course-materials-layout">
              <div className="stp2-card stp2-course-materials-main-card">
                <CardHeader icon="fa-solid fa-folder-tree" title="Course Materials" pill={`${courseMaterialsSummary.materialsCount} resources`} />
                <p className="stp2-card-note">Access course descriptions, instructor information, and published learning resources for your enrolled courses.</p>
                <ErrorNote message={sectionErrors.courseMaterials} />

                <div className="stp2-metrics-grid stp2-course-materials-summary-grid">
                  <MetricCard icon="fa-solid fa-book" title="Courses" value={courseMaterialsSummary.totalCourses} hint="Enrolled courses" />
                  <MetricCard icon="fa-solid fa-file-lines" title="Materials" value={courseMaterialsSummary.materialsCount} hint="Published resources" />
                  <MetricCard icon="fa-solid fa-circle-check" title="Ready" value={courseMaterialsSummary.coursesWithMaterials} hint="Courses with materials" />
                  <MetricCard icon="fa-solid fa-chalkboard-user" title="Doctors" value={courseMaterialsSummary.doctorsCount} hint="Assigned instructors" />
                </div>

                <div className="stp2-filter-tabs stp2-course-materials-filters">
                  {[{ key: "all", label: "All" }, { key: "withMaterials", label: "With materials" }, { key: "withoutMaterials", label: "No materials yet" }, { key: "current", label: "Current courses" }].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className={courseMaterialsFilter === filter.key ? "active" : ""}
                      onClick={() => setCourseMaterialsFilter(filter.key)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {filteredCourseMaterials.length ? (
                  <div className="stp2-course-materials-list">
                    {filteredCourseMaterials.map((course) => (
                      <article key={course.id} className={`stp2-course-material-card ${(course.materials?.length || 0) ? "has-materials" : "empty-materials"}`}>
                        <div className="stp2-course-material-head">
                          <div>
                            <span>{course.courseCode || "Course"}</span>
                            <h3>{course.courseName}</h3>
                            <p>{course.description}</p>
                          </div>
                          <div className="stp2-course-material-icon"><i className="fa-solid fa-book-open"></i></div>
                        </div>

                        <div className="stp2-course-material-meta">
                          <InfoItem label="Study year" value={course.studyYear || FALLBACK_TEXT} />
                          <InfoItem label="Semester" value={course.semesterNumber ? `Semester ${course.semesterNumber}` : FALLBACK_TEXT} />
                          <InfoItem label="Credits" value={course.creditHours || 0} />
                          <InfoItem label="Status" value={<StatusBadge value={course.status} />} />
                        </div>

                        <div className="stp2-course-doctors">
                          <strong><i className="fa-solid fa-chalkboard-user"></i> Course instructors</strong>
                          {course.doctors?.length ? (
                            <div className="stp2-course-doctor-list">
                              {course.doctors.map((doctor) => (
                                <span key={doctor.id} className={doctor.primary ? "primary" : ""}>
                                  {doctor.name}{doctor.title ? ` - ${doctor.title}` : ""}{doctor.primary ? " • Primary" : ""}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p>No instructor assignment is published for this course yet.</p>
                          )}
                        </div>

                        <div className="stp2-course-resources">
                          <strong><i className="fa-solid fa-paperclip"></i> Published materials</strong>
                          {course.materials?.length ? (
                            <div className="stp2-course-resource-list">
                              {course.materials.map((material) => (
                                <a
                                  key={material.id}
                                  href={material.url || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={!material.url ? "disabled" : ""}
                                  onClick={(event) => {
                                    if (!material.url) event.preventDefault();
                                  }}
                                >
                                  <i className={material.icon}></i>
                                  <span>
                                    <strong>{material.title}</strong>
                                    <small>{material.description || material.fileName || material.type}</small>
                                  </span>
                                  {material.publishedAt ? <em>{formatDate(material.publishedAt)}</em> : null}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="stp2-course-no-materials">
                              <i className="fa-solid fa-circle-info"></i>
                              <span>No course materials have been published yet.</span>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No course materials" text="No enrolled courses or published resources are available for your current academic record." />
                )}
              </div>

              <div className="stp2-card stp2-course-materials-guidance-card">
                <CardHeader icon="fa-solid fa-circle-question" title="Materials Guide" />
                <div className="stp2-guidance-list">
                  <div>
                    <i className="fa-solid fa-book-open"></i>
                    <strong>Course descriptions</strong>
                    <p>Descriptions are shown from the academic course record when available.</p>
                  </div>
                  <div>
                    <i className="fa-solid fa-chalkboard-user"></i>
                    <strong>Instructor assignment</strong>
                    <p>Doctors appear based on the course assignment for the current academic year.</p>
                  </div>
                  <div>
                    <i className="fa-solid fa-file-lines"></i>
                    <strong>Published resources</strong>
                    <p>Files, links, videos, slides, notes, or assignments appear after they are published by the university.</p>
                  </div>
                  <div>
                    <i className="fa-solid fa-shield-halved"></i>
                    <strong>Student access</strong>
                    <p>Only materials for your enrolled courses are visible inside this portal.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "documents" && (
          <div className="stp2-grid two stp2-documents-center">
            <section className="stp2-card stp2-wide stp2-documents-hero-card">
              <CardHeader
                icon="fa-solid fa-folder-open"
                title="Official Documents Center"
                pill={`${documentSummary.total} services`}
              />
              <p className="stp2-card-note">
                Access instant student copies and submit official document requests from one organized center.
              </p>
              <ErrorNote message={sectionErrors.officialDocuments} />

              <div className="stp2-metrics-grid stp2-documents-summary-grid">
                <MetricCard icon="fa-solid fa-file-lines" title="Documents" value={documentSummary.total} hint="Available services" />
                <MetricCard icon="fa-solid fa-bolt" title="Instant" value={documentSummary.instantCount} hint="Download now" />
                <MetricCard icon="fa-solid fa-headset" title="Requests" value={documentSummary.requestCount} hint="Need processing" />
                <MetricCard icon="fa-solid fa-triangle-exclamation" title="Limited" value={documentSummary.blockedCount} hint="Need attention" />
              </div>

              <div className="stp2-exam-filter-tabs stp2-documents-filter-tabs">
                {[
                  { key: "all", label: "All" },
                  { key: "instant", label: "Instant" },
                  { key: "requests", label: "Official Requests" },
                  { key: "blocked", label: "Limited" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={documentFilter === filter.key ? "active" : ""}
                    onClick={() => setDocumentFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {filteredOfficialDocuments.length ? (
                <div className="stp2-documents-grid">
                  {filteredOfficialDocuments.map((documentItem) => (
                    <article className={`stp2-document-card ${documentItem.status || "available"}`} key={documentItem.id}>
                      <div className="stp2-document-icon"><i className={documentItem.icon}></i></div>
                      <div className="stp2-document-body">
                        <div className="stp2-document-title-row">
                          <div>
                            <span className="stp2-document-category">{documentItem.category}</span>
                            <h3>{documentItem.title}</h3>
                          </div>
                          <StatusBadge value={documentItem.status === "limited" ? "pending" : documentItem.status === "available" ? true : documentItem.status} />
                        </div>
                        <p>{documentItem.description}</p>

                        {documentItem.verificationCode ? (
                          <div className="stp2-document-verification-box">
                            <div className="stp2-document-ref">
                              <i className="fa-solid fa-shield-halved"></i>
                              <span data-i18n-skip="true">{documentItem.verificationCode}</span>
                            </div>
                            {getDocumentVerificationUrl(documentItem) ? (
                              <div className="stp2-document-qr-row">
                                <img
                                  src={getQrImageUrl(getDocumentVerificationUrl(documentItem))}
                                  alt="Document verification QR code"
                                  className="stp2-document-qr"
                                  data-i18n-skip="true"
                                />
                                <div>
                                  <strong>Document verification</strong>
                                  <p>Scan the QR code or open the verification page to confirm this document.</p>
                                  <a href={getDocumentVerificationUrl(documentItem)} target="_blank" rel="noreferrer">
                                    Verify document
                                  </a>
                                </div>
                              </div>
                            ) : null}
                            {documentItem.issuedAt ? (
                              <span className="stp2-document-issued">Issued: {formatDateTime(documentItem.issuedAt)}</span>
                            ) : null}
                          </div>
                        ) : null}

                        {documentItem.reasons?.length ? (
                          <ul className="stp2-document-reasons">
                            {documentItem.reasons.map((reason, index) => <li key={`${documentItem.id}-reason-${index}`}>{reason}</li>)}
                          </ul>
                        ) : null}

                        <div className="stp2-document-footer">
                          <span>{documentItem.mode === "instant" ? "Instant student copy" : documentItem.feeRequired ? "May require fee / approval" : "Official request workflow"}</span>
                          <button
                            className={`stp2-btn small ${documentItem.mode === "instant" ? "primary" : "light"}`}
                            type="button"
                            disabled={documentItem.available === false}
                            onClick={() => handleOfficialDocumentAction(documentItem)}
                          >
                            {documentItem.mode === "instant" ? "Download" : "Request"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No documents available"
                  text="Official document services will appear here once the student file is loaded."
                />
              )}
            </section>

            <section className="stp2-card stp2-documents-guidance-card">
              <CardHeader icon="fa-solid fa-circle-info" title="Document Rules" />
              <div className="stp2-guidance-list">
                <div>
                  <i className="fa-solid fa-bolt"></i>
                  <div>
                    <strong>Instant documents</strong>
                    <p>Student-copy documents can be downloaded directly from the portal and are marked as generated copies.</p>
                  </div>
                </div>
                <div>
                  <i className="fa-solid fa-stamp"></i>
                  <div>
                    <strong>Official documents</strong>
                    <p>Certified documents must be requested and reviewed by the responsible university office.</p>
                  </div>
                </div>
                <div>
                  <i className="fa-solid fa-wallet"></i>
                  <div>
                    <strong>Financial clearance</strong>
                    <p>Some official documents may require tuition clearance before final approval.</p>
                  </div>
                </div>
                <div>
                  <i className="fa-solid fa-paperclip"></i>
                  <div>
                    <strong>Attachments</strong>
                    <p>When needed, upload supporting files from the My Requests form after choosing the document service.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="stp2-finance-page-grid">
            <section className={`stp2-card stp2-finance-status-card ${financialInfo.tuitionPaid ? "paid" : "unpaid"}`}>
              <CardHeader icon="fa-solid fa-wallet" title="Financial Status" pill={financialInfo.statusLabel} />
              <ErrorNote message={sectionErrors.finance} />

              <div className="stp2-finance-hero-card">
                <div>
                  <span>Tuition Status</span>
                  <strong>{financialInfo.tuitionPaid ? "Paid" : "Unpaid"}</strong>
                  <p>
                    {financialInfo.tuitionPaid
                      ? "Your tuition payment is marked as cleared for this academic record."
                      : "Your tuition payment is not marked as paid yet. You may request a financial review if this is incorrect."}
                  </p>
                </div>
                <StatusBadge value={financialInfo.tuitionPaid} />
              </div>

              <div className="stp2-finance-summary-strip">
                <article>
                  <span>Payment Records</span>
                  <strong>{paymentSummary.totalRecords}</strong>
                </article>
                <article>
                  <span>Paid Records</span>
                  <strong>{paymentSummary.paidCount}</strong>
                </article>
                <article>
                  <span>Unpaid / Pending</span>
                  <strong>{paymentSummary.unpaidCount}</strong>
                </article>
                <article>
                  <span>Last Payment</span>
                  <strong>{formatDate(paymentSummary.lastPaymentDate)}</strong>
                </article>
              </div>

              <div className="stp2-info-list compact">
                <InfoItem label="Academic Year" value={financialInfo.academicYear} />
                <InfoItem label="Study Year" value={financialInfo.studyYear} />
                <InfoItem label="Registration Status" value={<StatusBadge value={financialInfo.registrationStatus} />} />
                <InfoItem label="Tuition Amount" value={<span className="stp2-sensitive-finance">{formatMoney(financialInfo.tuitionAmount, financialInfo.currency)}</span>} />
                <InfoItem label="Paid Amount" value={<span className="stp2-sensitive-finance">{formatMoney(financialInfo.paidAmount, financialInfo.currency)}</span>} />
                <InfoItem label="Remaining Amount" value={<span className="stp2-sensitive-finance">{formatMoney(financialInfo.remainingAmount, financialInfo.currency)}</span>} />
                <InfoItem label="Receipt Number" value={<span className="stp2-sensitive-finance">{formatValue(financialInfo.receiptNumber)}</span>} />
                <InfoItem label="Receipt Date" value={formatDate(financialInfo.receiptDate)} />
              </div>

              <div className="stp2-finance-actions">
                <button className="stp2-btn primary" type="button" onClick={openFinancialReviewRequest}>
                  <i className="fa-solid fa-headset"></i>
                  Request Financial Review
                </button>
                <button className="stp2-btn light" type="button" onClick={() => window.print()}>
                  <i className="fa-solid fa-print"></i>
                  Print Status
                </button>
              </div>
            </section>

            <section className="stp2-card stp2-finance-history-card">
              <div className="stp2-section-head">
                <CardHeader icon="fa-solid fa-clock-rotate-left" title="Payment History" pill={`${paymentSummary.totalRecords} records`} />
                <button className="stp2-btn small light" type="button" onClick={openFinancialReviewRequest}>
                  <i className="fa-solid fa-circle-question"></i>
                  Ask Finance
                </button>
              </div>
              <ErrorNote message={sectionErrors.paymentHistory} />

              {paymentSummary.rows.length ? (
                <div className="stp2-table-wrap stp2-finance-history-table-wrap">
                  <table className="stp2-finance-history-table">
                    <thead>
                      <tr>
                        <th>Academic Year</th>
                        <th>Study Year</th>
                        <th>Status</th>
                        <th>Tuition</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>Receipt</th>
                        <th>Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentSummary.rows.map((row) => (
                        <tr key={row.id} className={row.isCurrent ? "current" : ""}>
                          <td>
                            <strong>{row.academicYear}</strong>
                            {row.isCurrent && <small>Current</small>}
                          </td>
                          <td>{row.studyYear}</td>
                          <td><StatusBadge value={row.paymentStatus} /></td>
                          <td><span className="stp2-sensitive-finance">{formatMoney(row.tuitionAmount, row.currency)}</span></td>
                          <td><span className="stp2-sensitive-finance">{formatMoney(row.paidAmount, row.currency)}</span></td>
                          <td><span className="stp2-sensitive-finance">{formatMoney(row.remainingAmount, row.currency)}</span></td>
                          <td><span className="stp2-sensitive-finance">{formatValue(row.receiptNumber)}</span></td>
                          <td>{formatDate(row.receiptDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No payment history" text="Payment records will appear here after the finance department updates your academic record." />
              )}
            </section>

            <section className="stp2-card stp2-finance-guidance-card">
              <CardHeader icon="fa-solid fa-circle-info" title="What does this mean?" />
              <div className="stp2-finance-guidance-list">
                <article>
                  <i className="fa-solid fa-circle-check"></i>
                  <div>
                    <strong>Paid</strong>
                    <p>Your tuition is confirmed and the receipt information is recorded if available.</p>
                  </div>
                </article>
                <article>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <div>
                    <strong>Unpaid / Not Registered</strong>
                    <p>You may need to contact the Finance Department or submit a financial review request.</p>
                  </div>
                </article>
                <article>
                  <i className="fa-solid fa-file-invoice"></i>
                  <div>
                    <strong>Payment History</strong>
                    <p>The history is based on academic financial records and receipt information entered by the finance department.</p>
                  </div>
                </article>
              </div>
            </section>
          </div>
        )}

        {activeTab === "examCard" && (
          <div className="stp2-grid two stp2-exam-card-view">
            <section className="stp2-card stp2-wide stp2-exam-card-main">
              <div className="stp2-section-head">
                <CardHeader
                  icon="fa-solid fa-id-card-clip"
                  title="Exam Card & Eligibility"
                  pill={`${examCardSummary.eligibleCount}/${examCardSummary.totalExams} allowed`}
                />
                <div className="stp2-row-actions">
                  <button className="stp2-btn small light" type="button" onClick={printExamCard}>
                    <i className="fa-solid fa-print"></i>
                    Print
                  </button>
                  <button className="stp2-btn small primary" type="button" onClick={downloadExamCardPdf}>
                    <i className="fa-solid fa-file-pdf"></i>
                    Download PDF
                  </button>
                </div>
              </div>
              <ErrorNote message={sectionErrors.examCard} />

              <div className="stp2-metrics-grid stp2-exam-card-summary-grid">
                <MetricCard icon="fa-solid fa-calendar-check" title="Total Exams" value={examCardSummary.totalExams} hint="Exam card items" />
                <MetricCard icon="fa-solid fa-circle-check" title="Allowed" value={examCardSummary.eligibleCount} hint="Eligible exams" />
                <MetricCard icon="fa-solid fa-ban" title="Blocked" value={examCardSummary.blockedCount} hint="Need action" />
                <MetricCard icon="fa-solid fa-wallet" title="Tuition" value={examCardSummary.tuitionPaid ? "Paid" : "Unpaid"} hint="Financial clearance" />
              </div>

              {examCardRows.length ? (
                <div className="stp2-exam-card-table-wrap">
                  <table className="stp2-exam-card-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Room</th>
                        <th>Attendance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examCardRows.map((exam) => (
                        <tr key={exam.id}>
                          <td>
                            <strong>{exam.courseName}</strong>
                            <span>{exam.courseCode || FALLBACK_TEXT}</span>
                          </td>
                          <td>{exam.examType === "supplementary" ? "Supplementary" : "Regular"}</td>
                          <td>{formatDateTime(exam.examDate)}</td>
                          <td>{exam.examRoom}</td>
                          <td>
                            {exam.attendanceRequired === null || exam.attendanceRequired === undefined
                              ? "No limit"
                              : `${exam.attendanceCount}/${exam.attendanceRequired}`}
                          </td>
                          <td>
                            <StatusBadge value={exam.eligible ? "eligible" : "blocked"} />
                            {exam.eligibilityReasons?.length ? (
                              <ul className="stp2-exam-reasons">
                                {exam.eligibilityReasons.map((reason, index) => (
                                  <li key={`${exam.id}-reason-${index}`}>{reason}</li>
                                ))}
                              </ul>
                            ) : (
                              <small className="stp2-exam-ok">Ready for exam entry</small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No exam card available"
                  text="Your exam card will appear when the examinations department publishes exam schedules for your enrolled or approved supplementary courses."
                />
              )}
            </section>

            <section className="stp2-card stp2-exam-eligibility-card">
              <CardHeader icon="fa-solid fa-shield-halved" title="Eligibility Checks" />
              <div className="stp2-exam-guidance-list">
                <article>
                  <i className="fa-solid fa-user-check"></i>
                  <div>
                    <strong>Registration</strong>
                    <p>Status: {statusLabels[examCardSummary.registrationStatus] || formatValue(examCardSummary.registrationStatus)}</p>
                  </div>
                </article>
                <article>
                  <i className="fa-solid fa-wallet"></i>
                  <div>
                    <strong>Financial Clearance</strong>
                    <p>{examCardSummary.tuitionPaid ? "Tuition payment is cleared." : "Tuition payment is not cleared yet."}</p>
                  </div>
                </article>
                <article>
                  <i className="fa-solid fa-user-clock"></i>
                  <div>
                    <strong>Attendance</strong>
                    <p>Regular exams check attendance records against the required attendance count for each course.</p>
                  </div>
                </article>
                <article>
                  <i className="fa-solid fa-file-circle-check"></i>
                  <div>
                    <strong>Supplementary Exams</strong>
                    <p>Supplementary exams appear only when the request is approved or completed.</p>
                  </div>
                </article>
              </div>
            </section>
          </div>
        )}


        {activeTab === "calendar" && (
          <div className="stp2-grid two stp2-calendar-view">
            <section className="stp2-card stp2-wide stp2-calendar-main-card">
              <div className="stp2-section-head">
                <CardHeader
                  icon="fa-solid fa-calendar-check"
                  title="Academic Calendar"
                  pill={calendarSummary.academicYearName}
                />
                <div className="stp2-exam-filter-tabs stp2-calendar-filter-tabs">
                  {[
                    { key: "upcoming", label: "Upcoming" },
                    { key: "deadlines", label: "Deadlines" },
                    { key: "past", label: "Past" },
                    { key: "all", label: "All" },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className={calendarFilter === filter.key ? "active" : ""}
                      onClick={() => setCalendarFilter(filter.key)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
              <ErrorNote message={sectionErrors.academicCalendar} />

              <div className="stp2-metrics-grid stp2-calendar-summary-grid">
                <MetricCard icon="fa-solid fa-calendar-days" title="Calendar Items" value={calendarSummary.totalEvents} hint="Academic events" />
                <MetricCard icon="fa-solid fa-clock" title="Upcoming" value={calendarSummary.upcomingCount} hint="Pending items" />
                <MetricCard icon="fa-solid fa-hourglass-half" title="Deadlines" value={calendarSummary.deadlinesCount} hint="Student actions" />
                <MetricCard icon="fa-solid fa-bell" title="Due Soon" value={calendarSummary.dueSoonCount} hint="Needs attention" />
              </div>

              {displayedCalendarEvents.length ? (
                <div className="stp2-calendar-timeline">
                  {displayedCalendarEvents.map((item) => (
                    <article className={`stp2-calendar-item ${item.status || "pending"}`} key={item.id}>
                      <div className="stp2-calendar-datebox">
                        <strong>{formatDate(item.date)}</strong>
                        {item.endDate ? <span>to {formatDate(item.endDate)}</span> : <span>{item.badge}</span>}
                      </div>
                      <div className="stp2-calendar-icon"><i className={item.icon}></i></div>
                      <div className="stp2-calendar-body">
                        <div className="stp2-calendar-title-row">
                          <h3>{item.title}</h3>
                          <StatusBadge value={item.status || "pending"} />
                        </div>
                        <p>{item.description || "No additional details."}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No calendar items available"
                  text="Academic calendar items will appear when academic dates, exam schedules, or student deadlines are available."
                />
              )}
            </section>

            <section className="stp2-card stp2-calendar-deadlines-card">
              <CardHeader icon="fa-solid fa-list-check" title="Important Deadlines" pill={`${importantDeadlines.length} items`} />
              {importantDeadlines.length ? (
                <div className="stp2-deadline-list">
                  {importantDeadlines.map((deadline) => (
                    <article className={`stp2-deadline-item ${deadline.status || "pending"}`} key={deadline.id}>
                      <i className={deadline.icon}></i>
                      <div>
                        <div className="stp2-deadline-head">
                          <strong>{deadline.title}</strong>
                          <span>{formatDate(deadline.date)}</span>
                        </div>
                        <p>{deadline.description || "Review this deadline carefully."}</p>
                        {deadline.action_tab ? (
                          <button type="button" className="stp2-link-btn" onClick={() => setActiveTab(deadline.action_tab)}>
                            Open related section
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No active deadlines"
                  text="You currently have no pending student action deadlines."
                />
              )}
            </section>
          </div>
        )}

        {activeTab === "examSchedule" && (
          <div className="stp2-grid two stp2-exam-schedule-view">
            <section className="stp2-card stp2-wide stp2-exam-schedule-card">
              <div className="stp2-section-head">
                <CardHeader
                  icon="fa-solid fa-calendar-days"
                  title="Exam Schedule"
                  pill={`${displayedExamSchedules.length} shown`}
                />
                <div className="stp2-exam-filter-tabs" role="tablist" aria-label="Filter exam schedule">
                  {[
                    { key: "upcoming", label: "Upcoming" },
                    { key: "regular", label: "Regular" },
                    { key: "supplementary", label: "Supplementary" },
                    { key: "past", label: "Past" },
                    { key: "all", label: "All" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={examScheduleFilter === item.key ? "active" : ""}
                      onClick={() => setExamScheduleFilter(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <ErrorNote message={sectionErrors.examSchedule} />

              {displayedExamSchedules.length ? (
                <div className="stp2-exam-list">
                  {displayedExamSchedules.map((exam, index) => (
                    <article className={`stp2-exam-card ${exam.exam_type}`} key={exam.id || `${exam.exam_type}-${getExamCourseCode(exam)}-${index}`}>
                      <div className="stp2-exam-datebox">
                        <strong>{formatDate(getExamDateValue(exam))}</strong>
                        <span>{formatTime(getExamDateValue(exam))}</span>
                      </div>
                      <div className="stp2-exam-main">
                        <div className="stp2-exam-head">
                          <div>
                            <h3>{getExamCourseName(exam)}</h3>
                            <p>{getExamCourseCode(exam)} · Semester {exam.semester_number || FALLBACK_TEXT}</p>
                          </div>
                          <StatusBadge value={exam.exam_type === "supplementary" ? "Supplementary" : "Regular"} />
                        </div>
                        <div className="stp2-exam-meta">
                          <span><i className="fa-solid fa-door-open"></i> {getExamRoom(exam)}</span>
                          <span><i className="fa-solid fa-calendar-check"></i> {exam.academic_year?.name || exam.academic_year || exam.academicYear?.name || examSchedule.academic_year?.name || FALLBACK_TEXT}</span>
                          <span><i className="fa-solid fa-clock"></i> {formatDateTime(getExamDateValue(exam))}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No exam schedule available"
                  text="Your regular or supplementary exam schedule has not been published yet. Once the examinations department publishes it, it will appear here."
                />
              )}
            </section>

            <section className="stp2-card stp2-exam-guidance-card">
              <CardHeader icon="fa-solid fa-circle-info" title="Exam Guidance" />
              <div className="stp2-exam-guidance-list">
                <article>
                  <i className="fa-solid fa-calendar-check"></i>
                  <div>
                    <strong>Regular Exams</strong>
                    <p>These exams are linked to the courses you are enrolled in for the academic year.</p>
                  </div>
                </article>
                <article>
                  <i className="fa-solid fa-file-circle-check"></i>
                  <div>
                    <strong>Supplementary Exams</strong>
                    <p>Supplementary schedules appear only for approved supplementary exam registrations.</p>
                  </div>
                </article>
                <article>
                  <i className="fa-solid fa-bell"></i>
                  <div>
                    <strong>Check Regularly</strong>
                    <p>Always review date, time, and room before the exam day in case the schedule is updated.</p>
                  </div>
                </article>
              </div>
            </section>
          </div>
        )}

        {activeTab === "schedule" && (
          <section className="stp2-card stp2-wide">
              <CardHeader icon="fa-solid fa-calendar-week" title="Class Schedule" pill={schedule?.name} />
              <ErrorNote message={sectionErrors.schedule} />
              {schedule?.items?.length ? (
                <div className="stp2-schedule-grid">
                  {schedule.items.map((item) => (
                    <article key={item.id || `${item.day_of_week}-${item.start_time}`}>
                      <strong>{item.day_of_week || item.day || "Day"}</strong>
                      <span>{formatValue(item.start_time)} - {formatValue(item.end_time)}</span>
                      <p>{item.course?.name || item.course_name || "Course"}</p>
                      <small>{item.room || item.classroom || "No room"}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No schedule available" text="Your weekly class schedule is not available yet." />
              )}
            </section>

        )}

        {activeTab === "carried" && (
          <section className="stp2-card stp2-wide">
              <CardHeader icon="fa-solid fa-book-bookmark" title="Carried Courses" pill={`${carriedCourses.length} courses`} />
              <ErrorNote message={sectionErrors.carriedCourses} />
              {carriedCourses.length ? (
                <div className="stp2-table-wrap">
                  <table className="stp2-table">
                    <thead>
                      <tr><th>Course</th><th>Code</th><th>Credit Hours</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {carriedCourses.map((course, index) => (
                        <tr key={course.id || index}>
                          <td>{course.course?.name || course.course_name || course.name || FALLBACK_TEXT}</td>
                          <td>{course.course?.code || course.course_code || course.code || FALLBACK_TEXT}</td>
                          <td>{course.course?.credit_hours || course.credit_hours || FALLBACK_TEXT}</td>
                          <td><StatusBadge value={course.status || course.result_status || "carried"} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No carried courses" text="You currently have no carried courses." />
              )}
            </section>
        )}


        {activeTab === "progress" && (
          <AcademicPlanProgressSection
            progress={academicPlanProgress}
            currentStudyYearNumber={currentStudyYearNumber}
            onOpenGrades={() => setActiveTab("grades")}
          />
        )}

        {activeTab === "grades" && (
          <section className="stp2-card">
            <CardHeader icon="fa-solid fa-square-poll-vertical" title="Grades" pill={`${filteredGradesForDisplay.length} courses`} />
            <ErrorNote message={sectionErrors.grades} />
            <div className="stp2-grade-tools">
              {gradeYearTabs.length ? (
                <div className="stp2-grade-year-tabs" role="tablist" aria-label="Filter grades by study year">
                  {gradeYearTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={selectedGradeYear === tab.key ? "active" : ""}
                      onClick={() => {
                        setSelectedGradeYear(tab.key);
                        setSelectedGradeSemester("all");
                      }}
                    >
                      <span>{tab.label}</span>
                      <em>
                        {grades.filter((row) => String(getRowStudyYearNumber(row)) === tab.key).length} courses
                      </em>
                    </button>
                  ))}
                </div>
              ) : null}

              {gradeSemesterTabs.length > 1 ? (
                <div className="stp2-semester-tabs" role="tablist" aria-label="Filter grades by semester">
                  {gradeSemesterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={selectedGradeSemester === tab.key ? "active" : ""}
                      onClick={() => setSelectedGradeSemester(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="stp2-transcript-actions">
                <button className="stp2-btn small light" type="button" onClick={printTranscript}>
                  <i className="fa-solid fa-print"></i>
                  Print Grades
                </button>
                <button className="stp2-btn small primary" type="button" onClick={downloadTranscriptPdf}>
                  <i className="fa-solid fa-file-pdf"></i>
                  Download Transcript PDF
                </button>
              </div>
            </div>
            {filteredGradesForDisplay.length ? (
              <div className="stp2-table-wrap">
                <table className="stp2-table grades-table">
                  <thead>
                    <tr>
                      <th>Course</th><th>Code</th><th>Coursework</th><th>Practical</th><th>Exam</th><th>Final</th><th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGradesForDisplay.map((row) => {
                      const enrollmentId = row.id || row.enrollment_id || row.student_course_enrollment_id;
                      const existingObjection = objectionsByEnrollment[enrollmentId];
                      const finalMark = Number(row.grade?.final_mark || 0);
                      const hasRecordedGrade = row.grade?.final_mark !== null && row.grade?.final_mark !== undefined;

                      return (
                        <tr key={enrollmentId || row.course?.id}>
                          <td>{row.course?.name || row.course_name || FALLBACK_TEXT}</td>
                          <td>{row.course?.code || row.course_code || FALLBACK_TEXT}</td>
                          <td>{formatValue(row.grade?.coursework_mark)}</td>
                          <td>{formatValue(row.grade?.practical_mark)}</td>
                          <td>{formatValue(row.grade?.exam_mark)}</td>
                          <td>
                            <div className="stp2-mark">
                              <strong>{formatValue(row.grade?.final_mark)}</strong>
                              <span><i style={{ width: `${Math.min(finalMark, 100)}%` }} /></span>
                            </div>
                          </td>
                          <td><StatusBadge value={row.grade?.result_status || "pending"} /></td>
                          <td>
                            {existingObjection ? (
                              <div className="stp2-status-stack">
                                <StatusBadge value={existingObjection.status} />
                                <small>{objectionTargetLabels[existingObjection.objection_target] || existingObjection.objection_target}</small>
                              </div>
                            ) : (
                              <button className="stp2-btn small light" type="button" disabled={!hasRecordedGrade} onClick={() => openGradeObjection(row)}>
                                Object
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title={`No grades for ${activeGradeYearLabel}`} text="No grades recorded for the selected year/semester yet. Once the examinations department submits grades, they will appear here." />
            )}

            {objectionForm.student_course_enrollment_id && (
              <form id="stp-objection-form" className="stp2-form-panel" onSubmit={submitGradeObjection}>
                <div className="stp2-form-head">
                  <div>
                    <h2>Submit Grade Objection</h2>
                    <p>Course: {objectionForm.course_name}</p>
                  </div>
                  <button className="stp2-btn small ghost" type="button" onClick={closeGradeObjectionForm}>Cancel</button>
                </div>
                <label>
                  Objection Target
                  <select value={objectionForm.objection_target} onChange={(e) => setObjectionForm((prev) => ({ ...prev, objection_target: e.target.value }))}>
                    <option value="coursework">Coursework Mark</option>
                    <option value="practical">Practical Mark</option>
                    <option value="exam">Exam Mark</option>
                  </select>
                </label>
                <label>
                  Objection Details
                  <textarea rows="5" value={objectionForm.objection_text} onChange={(e) => setObjectionForm((prev) => ({ ...prev, objection_text: e.target.value }))} placeholder="Write the reason for the grade objection..." required />
                </label>
                {objectionMessage.text && <div className={`stp2-form-message ${objectionMessage.type}`}>{objectionMessage.text}</div>}
                <button className="stp2-btn primary" type="submit" disabled={submittingObjection}>{submittingObjection ? "Submitting..." : "Submit Objection"}</button>
              </form>
            )}
          </section>
        )}

        {activeTab === "objections" && (
          <section className="stp2-card">
            <CardHeader icon="fa-solid fa-scale-balanced" title="Grade Objections" pill={`${gradeObjections.length} requests`} />
            <ErrorNote message={sectionErrors.gradeObjections} />
            {gradeObjections.length ? (
              <div className="stp2-list-grid">
                {gradeObjections.map((objection) => (
                  <article className="stp2-request-card" key={objection.id}>
                    <div className="stp2-request-head">
                      <div>
                        <h3>{objection.course_name || objection.enrollment?.course?.name || "Course"}</h3>
                        <p>Target: {objectionTargetLabels[objection.objection_target] || objection.objection_target}</p>
                      </div>
                      <StatusBadge value={objection.status} />
                    </div>
                    <ObjectionTimeline status={objection.status} />
                    <p>{objection.objection_text}</p>
                    <div className="stp2-info-list compact">
                      <InfoItem label="Submitted" value={formatDate(objection.submitted_at || objection.created_at)} />
                      <InfoItem label="Doctor Response" value={objection.doctor_response} />
                      <InfoItem label="Exam Note" value={objection.exam_department_note} />
                      <InfoItem label="Final Decision" value={objection.final_exam_decision_note} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No grade objections" text="You have not submitted any grade objections yet." />
            )}
          </section>
        )}

        {activeTab === "supplementary" && (
          <div className="stp2-grid two">
            <section className="stp2-card stp2-wide">
              <CardHeader icon="fa-solid fa-file-circle-check" title="Supplementary Exam Registration" pill="Max 4 requests" />
              <SupplementaryEligibilityNote />
              <ErrorNote message={sectionErrors.supplementaryEligibleCourses} />
              {!currentAcademicYearId && <ErrorNote message="Current academic year was not detected." />}
              {supplementaryEligibleCourses.length ? (
                <div className="stp2-table-wrap">
                  <table className="stp2-table">
                    <thead><tr><th>Course</th><th>Code</th><th>Academic Year</th><th>Semester</th><th>Final</th><th>Action</th></tr></thead>
                    <tbody>
                      {supplementaryEligibleCourses.map((course) => (
                        <tr key={course.enrollment_id}>
                          <td>{course.course_name || FALLBACK_TEXT}</td>
                          <td>{course.course_code || FALLBACK_TEXT}</td>
                          <td>{course.academic_year || currentAcademicRecord?.academic_year?.name || summaryData?.academic_year || FALLBACK_TEXT}</td>
                          <td>{course.semester_number || FALLBACK_TEXT}</td>
                          <td>{course.final_mark ?? 0}</td>
                          <td><button className="stp2-btn small light" type="button" disabled={activeSupplementaryRequestsCount >= 4} onClick={() => openSupplementaryRequest(course)}>Request</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState title="No eligible supplementary courses" text="There are no courses currently eligible for supplementary exam registration." />
              )}

              {supplementaryForm.student_course_enrollment_id && (
                <form id="stp-supplementary-form" className="stp2-form-panel" onSubmit={submitSupplementaryRequest}>
                  <div className="stp2-form-head">
                    <div><h2>Submit Supplementary Request</h2><p>Course: {supplementaryForm.course_name}</p></div>
                    <button className="stp2-btn small ghost" type="button" onClick={closeSupplementaryForm}>Cancel</button>
                  </div>
                  <label>Student Note<textarea rows="4" value={supplementaryForm.student_note} onChange={(e) => setSupplementaryForm((prev) => ({ ...prev, student_note: e.target.value }))} placeholder="Optional note for the exams department..." /></label>
                  {supplementaryMessage.text && <div className={`stp2-form-message ${supplementaryMessage.type}`}>{supplementaryMessage.text}</div>}
                  <button className="stp2-btn primary" type="submit" disabled={submittingSupplementary}>{submittingSupplementary ? "Submitting..." : "Submit Supplementary Request"}</button>
                </form>
              )}
            </section>

            <section className="stp2-card stp2-wide">
              <CardHeader icon="fa-solid fa-clock-rotate-left" title="My Supplementary Requests" pill={`${supplementaryRequests.length} requests`} />
              <ErrorNote message={sectionErrors.supplementaryRequests} />
              {supplementaryRequests.length ? (
                <div className="stp2-list-grid">
                  {supplementaryRequests.map((request) => (
                    <article className="stp2-request-card" key={request.id}>
                      <div className="stp2-request-head">
                        <div><h3>{request.course_name || request.enrollment?.course?.name || "Course"}</h3><p>{formatDate(request.created_at || request.submitted_at)}</p></div>
                        <StatusBadge value={request.status} />
                      </div>
                      <p>{request.student_note || "No student note."}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No supplementary requests" text="You have not submitted supplementary exam requests yet." />
              )}
            </section>
          </div>
        )}


        {activeTab === "services" && (
          <div className="stp2-grid two">
            <section className="stp2-card stp2-wide stp2-services-card">
              <CardHeader icon="fa-solid fa-headset" title="Student Services" pill="New request" />
              <p className="stp2-card-note">
                Submit administrative requests to Student Affairs, then track the response from the same place.
              </p>

              <div className="stp2-service-types-grid">
                {serviceRequestTypes.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    className={serviceRequestForm.request_type === type.key ? "active" : ""}
                    onClick={() => updateServiceRequestForm("request_type", type.key)}
                  >
                    <i className={type.icon}></i>
                    <span>
                      <strong>{type.label}</strong>
                      <em>{type.description}</em>
                    </span>
                  </button>
                ))}
              </div>

              <form id="stp-service-request-form" className="stp2-form-panel plain" onSubmit={submitStudentServiceRequest}>
                <div className="stp2-form-head">
                  <div>
                    <h2>{serviceRequestLabel(serviceRequestForm.request_type)}</h2>
                    <p>Write a clear subject and details so the responsible department can process your request.</p>
                  </div>
                </div>

                <label>
                  Priority
                  <select value={serviceRequestForm.priority} onChange={(e) => updateServiceRequestForm("priority", e.target.value)}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label>
                  Subject
                  <input
                    value={serviceRequestForm.subject}
                    onChange={(e) => updateServiceRequestForm("subject", e.target.value)}
                    placeholder="Example: Request official transcript for scholarship application"
                    required
                  />
                </label>

                <label>
                  Request Details
                  <textarea
                    rows="5"
                    value={serviceRequestForm.description}
                    onChange={(e) => updateServiceRequestForm("description", e.target.value)}
                    placeholder="Explain the request and include any useful details."
                  />
                </label>

                <label className="stp2-file-upload">
                  Attachment <small>Optional, max 5 MB</small>
                  <input
                    id="stp-service-attachment"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => updateServiceRequestForm("attachment", e.target.files?.[0] || null)}
                  />
                  {serviceRequestForm.attachment ? (
                    <span>
                      <i className="fa-solid fa-paperclip"></i>
                      {serviceRequestForm.attachment.name} • {formatFileSize(serviceRequestForm.attachment.size)}
                    </span>
                  ) : (
                    <em>Attach receipt, identity document, or supporting file if needed.</em>
                  )}
                </label>

                {serviceRequestMessage.text && <div className={`stp2-form-message ${serviceRequestMessage.type}`}>{serviceRequestMessage.text}</div>}

                <button className="stp2-btn primary" type="submit" disabled={submittingServiceRequest}>
                  {submittingServiceRequest ? "Submitting..." : "Submit Service Request"}
                </button>
              </form>
            </section>

            <section className="stp2-card stp2-wide">
              <CardHeader icon="fa-solid fa-clock-rotate-left" title="My Requests Timeline" pill={`${allStudentRequests.length} total`} />
              <ErrorNote message={sectionErrors.serviceRequests} />
              {allStudentRequests.length ? (
                <div className="stp2-list-grid stp2-unified-requests-list">
                  {allStudentRequests.map((request) => (
                    <article className="stp2-request-card stp2-unified-request" key={request.id}>
                      <div className="stp2-request-head">
                        <div className="stp2-request-title-wrap">
                          <i className={request.icon}></i>
                          <div>
                            <h3>{request.title}</h3>
                            <p>{request.type} • {formatDate(request.created_at)}</p>
                          </div>
                        </div>
                        <StatusBadge value={request.status} />
                      </div>

                      <p>{request.description || request.subtitle || "No request details provided."}</p>
                      {request.response ? <div className="stp2-response-note"><strong>Response:</strong> {request.response}</div> : null}
                      {request.attachment_url || request.attachment_name ? (
                        <div className="stp2-attachment-preview">
                          <i className="fa-solid fa-paperclip"></i>
                          {request.attachment_url ? (
                            <a href={request.attachment_url} target="_blank" rel="noreferrer">
                              {request.attachment_name || "View attachment"}
                            </a>
                          ) : (
                            <span>{request.attachment_name}</span>
                          )}
                          {request.attachment_size ? <small>{formatFileSize(request.attachment_size)}</small> : null}
                        </div>
                      ) : null}

                      <div className="stp2-request-actions">
                        <button className="stp2-btn small light" type="button" onClick={() => openRequestDetails(request)}>
                          <i className="fa-solid fa-eye"></i>
                          View Details
                        </button>
                        {requestCanBeCancelled(request) ? (
                          <button className="stp2-btn small ghost" type="button" onClick={() => cancelStudentServiceRequest(request.raw_id)}>
                            Cancel Request
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No requests yet" text="Your service, objection, and supplementary requests will appear here." />
              )}
            </section>
          </div>
        )}


        {activeTab === "attendance" && (
          <div className="stp2-attendance-page">
            <section className="stp2-card stp2-attendance-overview-card">
              <div className="stp2-section-head">
                <CardHeader icon="fa-solid fa-user-check" title="Attendance Analytics" pill={`${attendance.length} records`} />
                <select
                  className="stp2-attendance-filter"
                  value={attendanceAnalyticsFilter}
                  onChange={(event) => setAttendanceAnalyticsFilter(event.target.value)}
                >
                  <option value="all">All Courses</option>
                  <option value="safe">Safe</option>
                  <option value="warning">Warning</option>
                  <option value="danger">At Risk</option>
                </select>
              </div>

              <ErrorNote message={sectionErrors.attendance} />

              {attendance.length ? (
                <>
                  <div className="stp2-attendance-metrics">
                    <article>
                      <span>Overall Attendance</span>
                      <strong>{attendanceOverallSummary.overallPercentage}%</strong>
                      <p>{attendanceOverallSummary.totalPresent}/{attendanceOverallSummary.totalSessions} attended sessions</p>
                    </article>
                    <article>
                      <span>Absences</span>
                      <strong>{attendanceOverallSummary.totalAbsent}</strong>
                      <p>{attendanceOverallSummary.totalLate} late / {attendanceOverallSummary.totalExcused} excused</p>
                    </article>
                    <article>
                      <span>Safe Courses</span>
                      <strong>{attendanceOverallSummary.safeCourses}</strong>
                      <p>Attendance is 85% or higher</p>
                    </article>
                    <article className={attendanceOverallSummary.riskCourses ? "danger" : attendanceOverallSummary.warningCourses ? "warning" : ""}>
                      <span>Needs Attention</span>
                      <strong>{attendanceOverallSummary.warningCourses + attendanceOverallSummary.riskCourses}</strong>
                      <p>{attendanceOverallSummary.riskCourses} at risk / {attendanceOverallSummary.warningCourses} warning</p>
                    </article>
                  </div>

                  {filteredAttendanceAnalytics.length ? (
                    <div className="stp2-attendance-course-grid">
                      {filteredAttendanceAnalytics.map((item) => (
                        <article key={item.key} className={`stp2-attendance-course-card ${item.risk}`}>
                          <div className="stp2-attendance-course-head">
                            <div>
                              <strong>{item.courseName}</strong>
                              <span>{item.courseCode || "Course"}</span>
                            </div>
                            <b>{item.percentage}%</b>
                          </div>

                          <div className="stp2-attendance-progress" aria-label={`${item.percentage}% attendance`}>
                            <span style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }} />
                          </div>

                          <div className="stp2-attendance-course-stats">
                            <span>Present: <b>{item.present}</b></span>
                            <span>Absent: <b>{item.absent}</b></span>
                            <span>Late: <b>{item.late}</b></span>
                            <span>Total: <b>{item.total}</b></span>
                          </div>

                          <p>{item.message}</p>

                          {item.risk !== "safe" && (
                            <button
                              type="button"
                              className="stp2-btn small light"
                              onClick={() => {
                                setServiceRequestForm((prev) => ({
                                  ...prev,
                                  request_type: "attendance_review",
                                  subject: `Attendance review - ${item.courseName}`,
                                  description: `I would like to request a review of my attendance status for ${item.courseName}. Current attendance: ${item.percentage}%.`,
                                  priority: item.risk === "danger" ? "high" : "normal",
                                }));
                                setActiveTab("services");
                              }}
                            >
                              Request Attendance Review
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No courses in this filter" text="Change the attendance filter to view other courses." />
                  )}
                </>
              ) : (
                <EmptyState title="No attendance records" text="No attendance records were returned for your account." />
              )}
            </section>

            {attendance.length ? (
              <section className="stp2-card">
                <CardHeader icon="fa-solid fa-table-list" title="Attendance Records" pill={`${attendance.length} records`} />
                <div className="stp2-table-wrap">
                  <table className="stp2-table">
                    <thead><tr><th>Course</th><th>Date</th><th>Status</th><th>Note</th></tr></thead>
                    <tbody>
                      {attendance.map((record) => (
                        <tr key={record.id}>
                          <td>{record.course?.name || record.course_name || record.enrollment?.course?.name || FALLBACK_TEXT}</td>
                          <td>{formatDate(record.attendance_date || record.created_at)}</td>
                          <td><StatusBadge value={record.status || "registered"} /></td>
                          <td>{record.note || FALLBACK_TEXT}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </div>
        )}

        {activeTab === "notifications" && (
          <section className="stp2-card">
            <div className="stp2-section-head">
              <CardHeader icon="fa-solid fa-bell" title="Notifications" pill={`${unreadCount} unread`} />
              {unreadCount > 0 && <button className="stp2-btn small light" onClick={markAllNotificationsAsRead}>Mark all as read</button>}
            </div>
            <ErrorNote message={sectionErrors.notifications} />
            {notifications.length ? (
              <div className="stp2-list-grid">
                {notifications.map((notification) => (
                  <article className={`stp2-notification ${notification.is_read ? "read" : "unread"}`} key={notification.id}>
                    <div>
                      <h3>{notification.title || "Notification"}</h3>
                      <p>{notification.message || notification.body || FALLBACK_TEXT}</p>
                      <small>{formatDate(notification.created_at)}</small>
                    </div>
                    {!notification.is_read && <button className="stp2-btn small light" onClick={() => markNotificationAsRead(notification.id)}>Read</button>}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No notifications" text="You have no notifications at this time." />
            )}
          </section>
        )}

        {activeTab === "settings" && (
          <div className="stp2-grid two stp2-settings-page">
            <section className="stp2-card stp2-settings-card">
              <CardHeader icon="fa-solid fa-sliders" title="Student Preferences" />
              <p className="stp2-card-note">
                These settings are saved on this device and help you personalize the student portal experience.
              </p>

              <div className="stp2-settings-list">
                <label className="stp2-setting-row">
                  <span>
                    <strong>Preferred Language</strong>
                    <em>Choose the language preference for future localized features.</em>
                  </span>
                  <select value={studentSettings.language} onChange={(e) => updateStudentSetting("language", e.target.value)}>
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </label>

                <label className="stp2-setting-row">
                  <span>
                    <strong>Compact View</strong>
                    <em>Reduce spacing and make cards easier to scan on smaller screens.</em>
                  </span>
                  <input
                    type="checkbox"
                    checked={studentSettings.compactMode}
                    onChange={(e) => updateStudentSetting("compactMode", e.target.checked)}
                  />
                </label>

                <label className="stp2-setting-row">
                  <span>
                    <strong>Show Sensitive Financial Details</strong>
                    <em>Hide or blur tuition amount and receipt details when presenting your screen.</em>
                  </span>
                  <input
                    type="checkbox"
                    checked={studentSettings.showSensitiveFinancialInfo}
                    onChange={(e) => updateStudentSetting("showSensitiveFinancialInfo", e.target.checked)}
                  />
                </label>

                <label className="stp2-setting-row">
                  <span>
                    <strong>Portal Notifications</strong>
                    <em>Keep notification cards visible and mark important updates from the university.</em>
                  </span>
                  <input
                    type="checkbox"
                    checked={studentSettings.notificationsEnabled}
                    onChange={(e) => updateStudentSetting("notificationsEnabled", e.target.checked)}
                  />
                </label>

                <label className="stp2-setting-row">
                  <span>
                    <strong>Preferred Contact Method</strong>
                    <em>Used as a preference note for future service workflows.</em>
                  </span>
                  <select
                    value={studentSettings.preferredContactMethod}
                    onChange={(e) => updateStudentSetting("preferredContactMethod", e.target.value)}
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="portal">Portal Notifications</option>
                  </select>
                </label>
              </div>

              {settingsMessage ? <div className="stp2-form-message success">{settingsMessage}</div> : null}
            </section>

            <section className="stp2-card stp2-settings-card">
              <CardHeader icon="fa-solid fa-user-pen" title="Official Data Updates" />
              <p className="stp2-card-note">
                Personal information should not be changed directly by the student. Submit an official request and let Student Affairs review it.
              </p>

              <div className="stp2-settings-actions">
                <button className="stp2-btn primary" type="button" onClick={openPhoneUpdateRequest}>
                  <i className="fa-solid fa-phone"></i>
                  Request Phone Number Update
                </button>
                <button
                  className="stp2-btn light"
                  type="button"
                  onClick={() => {
                    setServiceRequestForm({
                      request_type: "personal_info_update",
                      subject: "Personal information update request",
                      description: "Please review and update my personal information according to the attached documents.",
                      priority: "normal",
                      attachment: null,
                    });
                    setActiveTab("services");
                  }}
                >
                  <i className="fa-solid fa-id-card"></i>
                  Request Personal Info Update
                </button>
              </div>

              <div className="stp2-settings-tip">
                <i className="fa-solid fa-shield-halved"></i>
                <p>For security reasons, official personal information changes are processed as reviewed service requests.</p>
              </div>
            </section>
          </div>
        )}

        {activeTab === "security" && (
          <section className="stp2-card stp2-security-card">
            <CardHeader icon="fa-solid fa-lock" title="Security Settings" />
            <form className="stp2-form-panel plain" onSubmit={changePassword}>
              <label>Current Password<input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))} required /></label>
              <label>New Password<input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))} required /></label>
              <label>Confirm New Password<input type="password" value={passwordForm.new_password_confirmation} onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password_confirmation: e.target.value }))} required /></label>
              {passwordMessage.text && <div className={`stp2-form-message ${passwordMessage.type}`}>{passwordMessage.text}</div>}
              <button className="stp2-btn primary" type="submit" disabled={changingPassword}>{changingPassword ? "Changing..." : "Change Password"}</button>
            </form>
          </section>
        )}
        {selectedRequest ? (
          <RequestDetailsModal
            request={selectedRequest}
            loading={requestDetailsLoading}
            error={requestDetailsError}
            onClose={closeRequestDetails}
            onCancel={cancelStudentServiceRequest}
          />
        ) : null}
      </main>
    </div>
  );
}


function RequestDetailsModal({ request, loading, error, onClose, onCancel }) {
  const timeline = buildRequestTimeline(request);
  const canCancel = requestCanBeCancelled(request);
  const portalRef = requestPortalReference(request);
  const sourceLabel = request?.source === "objection"
    ? "Grade Objection"
    : request?.source === "supplementary"
      ? "Supplementary Request"
      : "Student Service Request";

  return (
    <div className="stp2-modal-backdrop" role="dialog" aria-modal="true" aria-label="Request details">
      <div className="stp2-request-modal">
        <div className="stp2-request-modal-head">
          <div className="stp2-request-modal-title">
            <span><i className={request.icon || "fa-solid fa-file-circle-question"}></i></span>
            <div>
              <p>{sourceLabel}</p>
              <h2>{request.title}</h2>
              <em>{portalRef} • {request.department || "Student Affairs Department"}</em>
            </div>
          </div>
          <button className="stp2-modal-close" type="button" onClick={onClose} aria-label="Close request details">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {loading ? <div className="stp2-form-message info">Refreshing request details...</div> : null}
        {error ? <div className="stp2-form-message error">{error}</div> : null}

        <div className="stp2-request-modal-summary">
          <InfoItem label="Request Type" value={request.type} />
          <InfoItem label="Status" value={<StatusBadge value={request.status} />} />
          <InfoItem label="Priority" value={request.priority || "normal"} />
          <InfoItem label="Submitted At" value={formatDateTime(request.created_at)} />
          <InfoItem label="Last Update" value={formatDateTime(request.updated_at)} />
          <InfoItem label="Responsible Department" value={request.department || "Student Affairs Department"} />
        </div>

        <div className="stp2-ticket-timeline-wrap">
          <h3>Ticket Timeline</h3>
          <div className="stp2-ticket-timeline">
            {timeline.map((step, index) => (
              <div
                className={`stp2-ticket-step ${step.done ? "done" : ""} ${step.current ? "current" : ""} ${step.danger ? "danger" : ""}`}
                key={`${step.key}-${index}`}
              >
                <span>{step.done ? <i className="fa-solid fa-check"></i> : index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <em>{step.date ? formatDateTime(step.date) : "Pending"}</em>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stp2-request-modal-body">
          <section>
            <h3>Student Request Details</h3>
            <p>{request.description || request.subtitle || "No request details provided."}</p>
          </section>

          <section>
            <h3>Administrative Response</h3>
            {request.response ? (
              <p>{request.response}</p>
            ) : (
              <p className="stp2-muted-text">No administrative response has been added yet.</p>
            )}
            {request.reviewed_by ? <small>Reviewed by: {request.reviewed_by}</small> : null}
          </section>

          <section>
            <h3>Attachments</h3>
            {request.attachment_url || request.attachment_name ? (
              <div className="stp2-attachment-preview wide">
                <i className="fa-solid fa-paperclip"></i>
                {request.attachment_url ? (
                  <a href={request.attachment_url} target="_blank" rel="noreferrer">
                    {request.attachment_name || "View attachment"}
                  </a>
                ) : (
                  <span>{request.attachment_name}</span>
                )}
                {request.attachment_size ? <small>{formatFileSize(request.attachment_size)}</small> : null}
              </div>
            ) : (
              <p className="stp2-muted-text">No attachments were added to this request.</p>
            )}
          </section>
        </div>

        <div className="stp2-request-modal-actions">
          <button className="stp2-btn light" type="button" onClick={onClose}>Close</button>
          {canCancel ? (
            <button className="stp2-btn ghost" type="button" onClick={() => onCancel(request.raw_id)}>
              Cancel Request
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AcademicPlanMiniCard({ progress, onOpenProgress }) {
  const summary = progress?.summary || {};

  return (
    <section className="stp2-card stp2-plan-mini-card">
      <CardHeader icon="fa-solid fa-diagram-project" title="Plan Progress" />
      <div className="stp2-plan-mini-stats">
        <article>
          <strong>{formatValue(summary.total, 0)}</strong>
          <span>Total Courses</span>
        </article>
        <article>
          <strong>{formatValue(summary.passed + summary.conditional + summary.supplementary, 0)}</strong>
          <span>Completed</span>
        </article>
        <article className={summary.failed || summary.repeated ? "attention" : ""}>
          <strong>{formatValue((summary.failed || 0) + (summary.repeated || 0), 0)}</strong>
          <span>Needs Review</span>
        </article>
      </div>
      <button className="stp2-btn small light" type="button" onClick={onOpenProgress}>
        View Academic Plan
      </button>
    </section>
  );
}

function AcademicPlanProgressSection({ progress, currentStudyYearNumber, onOpenGrades }) {
  const years = progress?.years || [];
  const summary = progress?.summary || {};

  return (
    <div className="stp2-plan-progress-page">
      <section className="stp2-card stp2-plan-progress-card">
        <div className="stp2-section-head">
          <CardHeader icon="fa-solid fa-diagram-project" title="Academic Plan Progress Map" pill={`${summary.total || 0} courses`} />
          <button className="stp2-btn small light" type="button" onClick={onOpenGrades}>
            <i className="fa-solid fa-square-poll-vertical"></i>
            Open Grades
          </button>
        </div>

        <div className="stp2-plan-summary-grid">
          <article>
            <span>Total Courses</span>
            <strong>{formatValue(summary.total, 0)}</strong>
            <p>All loaded enrollments across years</p>
          </article>
          <article className="success">
            <span>Passed / Completed</span>
            <strong>{formatValue((summary.passed || 0) + (summary.supplementary || 0), 0)}</strong>
            <p>Passed normally or after supplementary</p>
          </article>
          <article className="warning">
            <span>Conditional</span>
            <strong>{formatValue(summary.conditional, 0)}</strong>
            <p>Conditionally promoted courses</p>
          </article>
          <article className={summary.failed || summary.repeated ? "danger" : "success"}>
            <span>Needs Attention</span>
            <strong>{formatValue((summary.failed || 0) + (summary.repeated || 0), 0)}</strong>
            <p>Failed or repeated courses</p>
          </article>
        </div>

        {years.length ? (
          <div className="stp2-plan-timeline">
            {years.map((year) => (
              <article key={year.year} className={`stp2-plan-year-card ${year.isCurrent ? "current" : ""}`}>
                <div className="stp2-plan-year-header">
                  <div>
                    <span>{year.isCurrent ? "Current Study Year" : "Study Year"}</span>
                    <h3>{year.label}</h3>
                  </div>
                  <div className="stp2-plan-year-stats">
                    <b>{year.average}</b>
                    <small>Average</small>
                  </div>
                </div>

                <div className="stp2-plan-year-pills">
                  <span>{year.summary.total} Courses</span>
                  <span>{year.summary.passed} Passed</span>
                  <span>{year.summary.conditional} Conditional</span>
                  <span>{year.summary.failed} Failed</span>
                  <span>{year.summary.in_progress} In Progress</span>
                </div>

                {year.semesters.length ? (
                  <div className="stp2-plan-semesters">
                    {year.semesters.map((semester) => (
                      <section key={`${year.year}-${semester.semester}`} className="stp2-plan-semester">
                        <div className="stp2-plan-semester-head">
                          <strong>{semester.label}</strong>
                          <span>{semester.summary.total} courses</span>
                        </div>

                        <div className="stp2-plan-course-grid">
                          {semester.courses.map((course) => (
                            <article key={course.id} className={`stp2-plan-course-card ${course.category}`}>
                              <div>
                                <strong>{course.courseName}</strong>
                                <span>{course.courseCode || "No code"}</span>
                              </div>
                              <div className="stp2-plan-course-meta">
                                <StatusBadge value={course.status || course.category} />
                                <em>{course.finalMark !== null ? course.finalMark : "No grade"}</em>
                              </div>
                              <p>
                                {course.categoryLabel}
                                {course.isRepeated ? " • Repeated" : ""}
                                {course.isSupplementary ? " • Supplementary" : ""}
                                {course.academicYear ? ` • ${course.academicYear}` : ""}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No courses loaded for this year" text="Courses will appear here after enrollment or grade data is available." />
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No academic plan data" text="No grades or enrollments were loaded yet." />
        )}

        <div className="stp2-plan-legend">
          <span className="passed">Passed</span>
          <span className="conditional">Conditional</span>
          <span className="failed">Failed</span>
          <span className="in-progress">In Progress</span>
          <span className="repeated">Repeated</span>
          <span className="supplementary">Supplementary</span>
        </div>
      </section>
    </div>
  );
}

function FinancialStatusCard({ financialInfo, onOpenFinance }) {
  return (
    <section className={`stp2-card stp2-finance-mini-card ${financialInfo.tuitionPaid ? "paid" : "unpaid"}`}>
      <CardHeader icon="fa-solid fa-wallet" title="Financial Status" />
      <div className="stp2-finance-mini-content">
        <div>
          <strong>{financialInfo.statusLabel}</strong>
          <p>
            {financialInfo.tuitionPaid
              ? "Your tuition payment is marked as paid."
              : "Your tuition payment or registration status may need review."}
          </p>
        </div>
        <StatusBadge value={financialInfo.tuitionPaid} />
      </div>
      <div className="stp2-info-list compact">
        <InfoItem label="Registration" value={<StatusBadge value={financialInfo.registrationStatus} />} />
        <InfoItem label="Receipt" value={financialInfo.receiptNumber} />
      </div>
      <button className="stp2-btn small light" type="button" onClick={onOpenFinance}>
        View Financial Details
      </button>
    </section>
  );
}

function NextActionsCard({ actions, onSelectTab }) {
  return (
    <section className="stp2-card stp2-next-actions-card">
      <CardHeader icon="fa-solid fa-list-check" title="What should I do now?" />
      <div className="stp2-next-actions-list">
        {actions.map((action, index) => (
          <button
            key={`${action.title}-${index}`}
            type="button"
            className={`stp2-next-action ${action.type}`}
            onClick={() => onSelectTab(action.tab)}
          >
            <i className={action.icon}></i>
            <span>
              <strong>{action.title}</strong>
              <em>{action.text}</em>
            </span>
            <b><i className="fa-solid fa-chevron-right"></i></b>
          </button>
        ))}
      </div>
    </section>
  );
}

function AcademicStandingCard({ standing }) {
  return (
    <section className={`stp2-card stp2-standing-card ${standing.type}`}>
      <CardHeader icon={standing.icon} title="Academic Standing" />
      <div className="stp2-standing-content">
        <strong>{standing.title}</strong>
        <p>{standing.message}</p>
      </div>
      <div className="stp2-standing-legend">
        <span><b className="success"></b>Promoted: eligible for the next year.</span>
        <span><b className="warning"></b>Carried: promoted with carried courses.</span>
        <span><b className="danger"></b>Failed: progression requirements not met.</span>
      </div>
    </section>
  );
}

function ObjectionTimeline({ status }) {
  const activeIndex = getObjectionStepIndex(status);
  const steps = [
    { key: "submitted", label: "Submitted" },
    { key: "sent_to_doctor", label: "Sent to Doctor" },
    { key: "doctor_responded", label: "Doctor Responded" },
    { key: "final_decision", label: "Final Decision" },
  ];

  return (
    <div className="stp2-objection-timeline">
      {steps.map((step, index) => (
        <div
          key={step.key}
          className={`stp2-timeline-step ${index <= activeIndex ? "done" : ""} ${index === activeIndex ? "current" : ""}`}
        >
          <span>{index + 1}</span>
          <p>{step.label}</p>
        </div>
      ))}
    </div>
  );
}

function SupplementaryEligibilityNote() {
  return (
    <div className="stp2-eligibility-note">
      <strong>Eligibility rules shown here are based on the current academic workflow:</strong>
      <ul>
        <li>Final mark is within the allowed supplementary range.</li>
        <li>The course is failed and eligible for another attempt.</li>
        <li>The course was not already requested for supplementary registration.</li>
        <li>Maximum allowed supplementary requests: 4 courses.</li>
      </ul>
    </div>
  );
}

function CardHeader({ icon, title, pill }) {
  return (
    <div className="stp2-card-title-row">
      <div className="stp2-card-title-icon"><i className={icon}></i></div>
      <h2>{title}</h2>
      {pill ? <span className="stp2-soft-pill">{pill}</span> : null}
    </div>
  );
}

function MetricCard({ icon, title, value, hint, description }) {
  return (
    <div className="stp2-metric-card">
      <div className="stp2-metric-icon"><i className={icon}></i></div>
      <div>
        <p>{title}</p>
        <h3>{formatValue(value)}</h3>
        <span>{hint}</span>
        {description ? <small className="stp2-average-help">{description}</small> : null}
      </div>
    </div>
  );
}

function InfoItem({ label, value, wide = false }) {
  return (
    <div className={`stp2-info-item ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{typeof value === "object" && value !== null ? value : formatValue(value)}</strong>
    </div>
  );
}

function StatCard({ title, value, hint }) {
  return <MetricCard icon="fa-solid fa-circle-info" title={title} value={value} hint={hint} />;
}
