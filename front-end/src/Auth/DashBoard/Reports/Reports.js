import { useEffect, useMemo, useState } from 'react';
import api from '../../Api/axios';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-pie' },
  { key: 'academic', label: 'Academic Workflow', icon: 'fa-solid fa-graduation-cap' },
  { key: 'student', label: 'Student Report', icon: 'fa-solid fa-user-graduate' },
  { key: 'department', label: 'Department Report', icon: 'fa-solid fa-building-columns' },
];

function unwrap(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  if (payload.data) return payload.data;
  return payload;
}

function asArray(payload) {
  const value = unwrap(payload);
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
}

function fmt(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
}

function dateOnly(value) {
  if (!value) return '—';
  return String(value).slice(0, 10);
}

function normalizeStatus(value) {
  return String(value || '').replaceAll('_', ' ');
}

function statusType(value) {
  const status = String(value || '').toLowerCase();
  if (['active', 'registered', 'passed', 'promoted', 'approved', 'paid', 'true', 'conditionally_passed'].includes(status)) return 'good';
  if (['pending', 'in_progress', 'submitted', 'under_review', 'sent_to_doctor', 'doctor_responded', 'not_registered'].includes(status)) return 'warn';
  if (['failed', 'exhausted', 'stopped', 'inactive', 'rejected', 'unpaid', 'false', 'carried'].includes(status)) return 'bad';
  return 'muted';
}

function numberValue(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function percentValue(part, total) {
  const p = numberValue(part);
  const t = numberValue(total);
  if (!t) return '0%';
  return `${Math.round((p / t) * 100)}%`;
}

function pickNested(value, keys = [], fallback = undefined) {
  for (const key of keys) {
    if (value && value[key] !== undefined && value[key] !== null) return value[key];
  }
  return fallback;
}

function isActiveStatus(status) {
  return ['submitted', 'under_review', 'sent_to_doctor', 'doctor_responded', 'pending', 'approved'].includes(String(status || '').toLowerCase());
}

function gradeFinal(enrollment) {
  return enrollment?.grade?.final_mark ?? enrollment?.final_mark ?? null;
}

function optionLabelStudent(student) {
  const name = student?.user?.full_name || student?.full_name || `Student #${student?.id}`;
  const number = student?.student_number ? ` - ${student.student_number}` : '';
  return `${name}${number}`;
}

function studentSearchText(student) {
  return [
    student?.id,
    student?.student_number,
    student?.user?.full_name,
    student?.full_name,
    student?.user?.email,
    student?.email,
    student?.program?.name,
    student?.specialization?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function normalizeSearch(value) {
  return String(value || '').trim().toLowerCase();
}

function findStudentBySearch(students, value) {
  const query = normalizeSearch(value);
  if (!query) return null;

  const exactMatch = students.find((student) => {
    const id = String(student?.id || '').toLowerCase();
    const number = String(student?.student_number || '').toLowerCase();
    const name = String(student?.user?.full_name || student?.full_name || '').toLowerCase();
    const email = String(student?.user?.email || student?.email || '').toLowerCase();
    const optionLabel = optionLabelStudent(student).toLowerCase();

    return id === query || number === query || name === query || email === query || optionLabel === query;
  });

  if (exactMatch) return exactMatch;

  const partialMatches = students.filter((student) => {
    const haystack = studentSearchText(student);
    const optionLabel = optionLabelStudent(student).toLowerCase();
    return haystack.includes(query) || optionLabel.includes(query);
  });

  return partialMatches.length === 1 ? partialMatches[0] : null;
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [overview, setOverview] = useState(null);
  const [academicSummary, setAcademicSummary] = useState(null);
  const [userSummary, setUserSummary] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [supplementaryRequests, setSupplementaryRequests] = useState([]);
  const [gradeObjections, setGradeObjections] = useState([]);

  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [studentReport, setStudentReport] = useState(null);
  const [departmentReport, setDepartmentReport] = useState(null);

  const dashboardMetrics = useMemo(() => {
    const totals = overview?.totals || {};
    const academic = overview?.academic || {};
    return [
      { title: 'Students', value: totals.students || 0, icon: 'fa-solid fa-user-graduate' },
      { title: 'Doctors', value: totals.doctors || 0, icon: 'fa-solid fa-user-doctor' },
      { title: 'Departments', value: totals.departments || 0, icon: 'fa-solid fa-building' },
      { title: 'Grade Objections', value: academic.grade_objections || gradeObjections.length || 0, icon: 'fa-solid fa-scale-balanced' },
      { title: 'Supplementary Requests', value: academic.supplementary_requests || supplementaryRequests.length || 0, icon: 'fa-solid fa-file-circle-check' },
    ];
  }, [overview, gradeObjections.length, supplementaryRequests.length]);

  const academicResults = academicSummary?.results || {};
  const registrationStatus = academicSummary?.registration_status || {};
  const financeTuition = financialSummary?.tuition || {};
  const studentStats = studentReport?.statistics || {};
  const departmentStats = departmentReport?.statistics || {};
  const selectedStudent = studentReport?.student;
  const selectedDepartment = departmentReport?.department;

  const filteredStudents = useMemo(() => {
    const query = normalizeSearch(studentSearch);

    if (!query) {
      return students.slice(0, 20);
    }

    return students
      .filter((student) => studentSearchText(student).includes(query) || optionLabelStudent(student).toLowerCase().includes(query))
      .slice(0, 25);
  }, [students, studentSearch]);

  const resolvedStudentFromSearch = useMemo(() => {
    return findStudentBySearch(students, studentSearch || studentId);
  }, [students, studentSearch, studentId]);

  const workflowStats = useMemo(() => {
    const results = academicSummary?.results || {};
    const currentAcademicYear = academicSummary?.current_academic_year || overview?.current_academic_year || {};

    const objections = gradeObjections.length ? gradeObjections : asArray(overview?.grade_objections);
    const supplementary = supplementaryRequests.length ? supplementaryRequests : asArray(overview?.supplementary_requests);

    return {
      currentAcademicYear,
      passed: numberValue(results.passed),
      promoted: numberValue(results.promoted),
      failed: numberValue(results.failed),
      exhausted: numberValue(results.exhausted),
      inProgress: numberValue(results.in_progress),
      carriedCourses: numberValue(academicSummary?.carried_courses?.count),
      activeObjections: objections.filter((item) => isActiveStatus(item.status)).length,
      activeSupplementary: supplementary.filter((item) => isActiveStatus(item.status)).length,
      approvedSupplementary: supplementary.filter((item) => String(item.status || '').toLowerCase() === 'approved').length,
      rejectedSupplementary: supplementary.filter((item) => String(item.status || '').toLowerCase() === 'rejected').length,
    };
  }, [academicSummary, overview, gradeObjections, supplementaryRequests]);

  useEffect(() => {
    loadReportsPage();
  }, []);

  function showSuccess(message) {
    setSuccess(message);
    setError('');
    setTimeout(() => setSuccess(''), 4000);
  }

  function showError(err, fallback) {
    setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback);
    setSuccess('');
  }

  async function loadReportsPage() {
    setLoading(true);
    setError('');

    try {
      const [
        overviewRes,
        academicRes,
        userRes,
        financialRes,
        studentsRes,
        departmentsRes,
        supplementaryRes,
        gradeObjectionsRes,
      ] = await Promise.allSettled([
        api.get('/dashboard/overview'),
        api.get('/dashboard/academic-summary'),
        api.get('/dashboard/user-summary'),
        api.get('/dashboard/financial-summary'),
        api.get('/students'),
        api.get('/departments'),
        api.get('/supplementary-requests'),
        api.get('/grade-objections'),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);
      if (academicRes.status === 'fulfilled') setAcademicSummary(academicRes.value.data);
      if (userRes.status === 'fulfilled') setUserSummary(userRes.value.data);
      if (financialRes.status === 'fulfilled') setFinancialSummary(financialRes.value.data);
      if (studentsRes.status === 'fulfilled') setStudents(asArray(studentsRes.value.data));
      if (departmentsRes.status === 'fulfilled') setDepartments(asArray(departmentsRes.value.data));
      if (supplementaryRes.status === 'fulfilled') setSupplementaryRequests(asArray(supplementaryRes.value.data));
      if (gradeObjectionsRes.status === 'fulfilled') setGradeObjections(asArray(gradeObjectionsRes.value.data));

      const hardFailures = [overviewRes, academicRes, userRes, financialRes].filter((result) => result.status === 'rejected');
      if (hardFailures.length === 4) {
        throw hardFailures[0].reason;
      }
    } catch (err) {
      showError(err, 'Failed to load reports dashboard. Make sure the user has view dashboard / view reports permissions.');
    } finally {
      setLoading(false);
    }
  }

  async function generateStudentReport(e) {
    e.preventDefault();

    const searchValue = studentSearch || studentId;
    const matchedStudent = findStudentBySearch(students, searchValue);
    const resolvedStudentId = matchedStudent?.id || (String(searchValue || '').trim().match(/^\d+$/) ? String(searchValue).trim() : '');

    if (!resolvedStudentId) {
      setError('Please search by student name, student number, email, or enter a valid student ID.');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      const res = await api.get(`/reports/students/${resolvedStudentId}`);
      setStudentId(String(resolvedStudentId));
      if (matchedStudent) {
        setStudentSearch(optionLabelStudent(matchedStudent));
      }
      setStudentReport(res.data);
      showSuccess('Student report generated successfully.');
    } catch (err) {
      showError(err, 'Failed to generate student report.');
    } finally {
      setActionLoading(false);
    }
  }

  async function generateDepartmentReport(e) {
    e.preventDefault();
    if (!departmentId) {
      setError('Please select or enter a department ID first.');
      return;
    }

    setActionLoading(true);
    setError('');
    try {
      const res = await api.get(`/reports/departments/${departmentId}`);
      setDepartmentReport(res.data);
      showSuccess('Department report generated successfully.');
    } catch (err) {
      showError(err, 'Failed to generate department report.');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.pageShell}>
        <div style={styles.loaderCard}>
          <i className="fa-solid fa-spinner fa-spin" style={styles.loaderIcon}></i>
          <h2 style={styles.loaderTitle}>Loading reports...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageShell}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Reports Center</p>
          <h1 style={styles.title}>University Reports & Analytics</h1>
          <p style={styles.subtitle}>Review operational summaries, academic results, financial status, and detailed student or department reports.</p>
        </div>
        <div style={styles.heroActions}>
          <button type="button" style={styles.secondaryBtn} onClick={loadReportsPage}>
            <i className="fa-solid fa-rotate"></i> Refresh
          </button>
          <button type="button" style={styles.secondaryBtn} onClick={() => window.print()}>
            <i className="fa-solid fa-print"></i> Print
          </button>
        </div>
      </section>

      {error ? <div style={styles.alertError}><i className="fa-solid fa-circle-exclamation"></i> {error}</div> : null}
      {success ? <div style={styles.alertSuccess}><i className="fa-solid fa-circle-check"></i> {success}</div> : null}

      <div style={styles.tabsBar}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{ ...styles.tabBtn, ...(activeTab === tab.key ? styles.tabBtnActive : {}) }}
          >
            <i className={tab.icon}></i> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={styles.sectionStack}>
          <section style={styles.grid4}>
            {dashboardMetrics.map((item) => <Metric key={item.title} {...item} />)}
          </section>

          <section style={styles.twoColumns}>
            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-chart-line" title="Academic Summary" />
              <InfoRow label="Current Academic Year" value={academicSummary?.current_academic_year?.name || overview?.current_academic_year?.name} />
              <InfoRow label="Academic Records" value={academicSummary?.records_count} />
              <InfoRow label="Carried Courses" value={academicSummary?.carried_courses?.count} badge="warn" />
              <MiniBars
                items={[
                  { label: 'Passed', value: academicResults.passed, type: 'good' },
                  { label: 'Promoted', value: academicResults.promoted, type: 'good' },
                  { label: 'Failed', value: academicResults.failed, type: 'bad' },
                  { label: 'Exhausted', value: academicResults.exhausted, type: 'bad' },
                  { label: 'In Progress', value: academicResults.in_progress, type: 'warn' },
                ]}
              />
            </div>

            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-wallet" title="Financial Summary" />
              <InfoRow label="Current Academic Year" value={financialSummary?.current_academic_year?.name} />
              <InfoRow label="Financial Records" value={financialSummary?.records_count} />
              <InfoRow label="Paid Tuition" value={financeTuition.paid} badge="good" />
              <InfoRow label="Unpaid Tuition" value={financeTuition.unpaid} badge="bad" />
              <MiniBars
                items={[
                  { label: 'Registered', value: financialSummary?.registration_status?.registered, type: 'good' },
                  { label: 'Not Registered', value: financialSummary?.registration_status?.not_registered, type: 'warn' },
                  { label: 'Pending', value: financialSummary?.registration_status?.pending, type: 'warn' },
                  { label: 'Stopped', value: financialSummary?.registration_status?.stopped, type: 'bad' },
                ]}
              />
            </div>
          </section>

          <section style={styles.twoColumns}>
            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-users" title="Users Summary" />
              <SummaryBlock title="Students" data={userSummary?.students} />
              <SummaryBlock title="Employees" data={userSummary?.employees} />
              <SummaryBlock title="Doctors" data={userSummary?.doctors} />
              <SummaryBlock title="Departments" data={userSummary?.departments} />
            </div>

            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-circle-info" title="Reports Notes" />
              <p style={styles.paragraph}>Use the Academic Workflow tab to validate promotion, failed-course repetition, grade objections, and supplementary requests.</p>
              <p style={styles.paragraph}>Use the Student Report to review academic records, grades, attendance and grade objections for one student.</p>
              <p style={styles.paragraph}>Use the Department Report to review department staff, doctors, courses, manager status and activity indicators.</p>
              <p style={styles.paragraph}>If dropdown lists are empty, you can still enter the student ID or department ID manually if your account has permission to view reports.</p>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'academic' && (
        <div style={styles.sectionStack}>
          <section style={styles.grid4}>
            <Metric title="Passed" value={workflowStats.passed} icon="fa-solid fa-circle-check" />
            <Metric title="Conditionally Promoted" value={workflowStats.promoted} icon="fa-solid fa-arrow-up-right-dots" />
            <Metric title="Failed" value={workflowStats.failed} icon="fa-solid fa-circle-xmark" />
            <Metric title="Supplementary Requests" value={workflowStats.activeSupplementary} icon="fa-solid fa-file-circle-check" />
          </section>

          <section style={styles.twoColumns}>
            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-graduation-cap" title="Academic Year Workflow" />
              <InfoRow label="Current Academic Year" value={workflowStats.currentAcademicYear?.name} />
              <InfoRow label="Year Status" value={workflowStats.currentAcademicYear?.is_closed ? 'Closed' : 'Open'} badge={workflowStats.currentAcademicYear?.is_closed ? 'bad' : 'good'} />
              <InfoRow label="Students In Progress" value={workflowStats.inProgress} badge="warn" />
              <InfoRow label="Carried / Repeated Courses" value={workflowStats.carriedCourses} badge="warn" />
              <InfoRow label="Active Grade Objections" value={workflowStats.activeObjections} badge={workflowStats.activeObjections ? 'warn' : 'good'} />
              <InfoRow label="Active Supplementary Requests" value={workflowStats.activeSupplementary} badge={workflowStats.activeSupplementary ? 'warn' : 'good'} />
            </div>

            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-list-check" title="Academic Workflow Checklist" />
              <WorkflowCheck title="Grade Entry" text="Grades are entered per enrollment and final marks are calculated using 20% coursework, 20% practical, and 60% exam." />
              <WorkflowCheck title="Grade Objections" text="Student objection → exams department → doctor review → final exams decision → grade update." />
              <WorkflowCheck title="Year Closing" text="Passed students move forward, conditionally promoted students are treated as promoted, and failed students repeat only failed courses." />
              <WorkflowCheck title="Supplementary Exams" text="Available only during the open academic year for eligible failed courses, with a maximum of 4 requests per year." />
            </div>
          </section>

          <section style={styles.twoColumns}>
            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-scale-balanced" title="Grade Objections Snapshot" />
              <MiniBars
                items={[
                  { label: 'Submitted / Active', value: workflowStats.activeObjections, type: 'warn' },
                  { label: 'Total Loaded', value: gradeObjections.length, type: 'good' },
                ]}
              />
              <ReportTableInline
                headers={['Student', 'Course', 'Status', 'Submitted']}
                rows={gradeObjections.slice(0, 6).map((item) => [
                  fmt(item.student?.user?.full_name || item.student_name || item.student?.student_number),
                  fmt(item.enrollment?.course?.name || item.course_name),
                  <Badge type={statusType(item.status)}>{normalizeStatus(item.status)}</Badge>,
                  dateOnly(item.submitted_at || item.created_at),
                ])}
                empty="No grade objections loaded."
              />
            </div>

            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-file-circle-check" title="Supplementary Requests Snapshot" />
              <MiniBars
                items={[
                  { label: 'Active', value: workflowStats.activeSupplementary, type: 'warn' },
                  { label: 'Approved', value: workflowStats.approvedSupplementary, type: 'good' },
                  { label: 'Rejected', value: workflowStats.rejectedSupplementary, type: 'bad' },
                ]}
              />
              <ReportTableInline
                headers={['Student', 'Course', 'Status', 'Year']}
                rows={supplementaryRequests.slice(0, 6).map((item) => [
                  fmt(item.student?.user?.full_name || item.student?.student_number),
                  fmt(item.enrollment?.course?.name || item.course_name),
                  <Badge type={statusType(item.status)}>{normalizeStatus(item.status)}</Badge>,
                  fmt(item.academic_year?.name || item.academicYear?.name),
                ])}
                empty="No supplementary requests loaded."
              />
            </div>
          </section>
        </div>
      )}

      {activeTab === 'student' && (
        <div style={styles.sectionStack}>
          <section style={styles.card}>
            <CardTitle icon="fa-solid fa-user-graduate" title="Generate Student Report" />
            <form onSubmit={generateStudentReport} style={styles.searchFormWide}>
              <div style={styles.formFieldWide}>
                <label style={styles.label}>Search Student by Name or Student Number</label>
                <div style={styles.searchBox}>
                  <i className="fa-solid fa-magnifying-glass" style={styles.searchIcon}></i>
                  <input
                    style={styles.searchInput}
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setStudentId('');
                    }}
                    placeholder="Type student name, university number, email, or ID..."
                    list="student-report-search-list"
                  />
                  {studentSearch ? (
                    <button
                      type="button"
                      style={styles.clearSearchBtn}
                      onClick={() => {
                        setStudentSearch('');
                        setStudentId('');
                        setStudentReport(null);
                      }}
                      aria-label="Clear student search"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  ) : null}
                </div>

                <datalist id="student-report-search-list">
                  {filteredStudents.map((student) => (
                    <option key={student.id} value={optionLabelStudent(student)} />
                  ))}
                </datalist>

                <div style={styles.searchHintRow}>
                  {resolvedStudentFromSearch ? (
                    <span style={styles.selectedHint}>
                      <i className="fa-solid fa-circle-check"></i>
                      Selected: {optionLabelStudent(resolvedStudentFromSearch)}
                    </span>
                  ) : (
                    <span style={styles.mutedHint}>
                      You can search by full name, student number, email, or numeric ID.
                    </span>
                  )}
                </div>

                {studentSearch && filteredStudents.length > 0 ? (
                  <div style={styles.studentSuggestionBox}>
                    {filteredStudents.slice(0, 6).map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        style={styles.studentSuggestion}
                        onClick={() => {
                          setStudentId(String(student.id));
                          setStudentSearch(optionLabelStudent(student));
                        }}
                      >
                        <span style={styles.studentSuggestionText}>
                          <strong style={styles.studentSuggestionName}>{student?.user?.full_name || student?.full_name || `Student #${student.id}`}</strong>
                          <em style={styles.studentSuggestionNumber}>{student?.student_number || `ID: ${student.id}`}</em>
                        </span>
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button type="submit" style={styles.primaryBtn} disabled={actionLoading}>
                <i className="fa-solid fa-file-lines"></i> Generate
              </button>
              {studentReport ? (
                <button type="button" style={styles.secondaryBtn} onClick={() => downloadJson(`student-report-${selectedStudent?.student_number || studentId}.json`, studentReport)}>
                  <i className="fa-solid fa-download"></i> Export JSON
                </button>
              ) : null}
            </form>
          </section>

          {studentReport ? (
            <>
              <section style={styles.grid4}>
                <Metric title="Enrollments" value={studentStats.total_enrollments || 0} icon="fa-solid fa-book" />
                <Metric title="Graded Courses" value={studentStats.graded_courses || 0} icon="fa-solid fa-square-poll-vertical" />
                <Metric title="Passed Courses" value={studentStats.passed_courses || 0} icon="fa-solid fa-circle-check" />
                <Metric title="Pending Objections" value={studentStats.pending_grade_objections_count || 0} icon="fa-solid fa-scale-balanced" />
                <Metric title="Repeated / Carried" value={studentStats.carried_courses || 0} icon="fa-solid fa-book-bookmark" />
              </section>

              <section style={styles.twoColumns}>
                <div style={styles.card}>
                  <CardTitle icon="fa-solid fa-id-card" title="Student Information" />
                  <InfoRow label="Full Name" value={selectedStudent?.user?.full_name} />
                  <InfoRow label="Student Number" value={selectedStudent?.student_number} />
                  <InfoRow label="Email" value={selectedStudent?.user?.email} />
                  <InfoRow label="Program" value={selectedStudent?.program?.name} />
                  <InfoRow label="Specialization" value={selectedStudent?.specialization?.name} />
                  <InfoRow label="Registration" value={selectedStudent?.is_active_registration ? 'Active' : 'Stopped'} badge={selectedStudent?.is_active_registration ? 'good' : 'bad'} />
                  <InfoRow label="Exhausted" value={selectedStudent?.is_exhausted ? 'Yes' : 'No'} badge={selectedStudent?.is_exhausted ? 'bad' : 'good'} />
                </div>

                <div style={styles.card}>
                  <CardTitle icon="fa-solid fa-chart-simple" title="Student Statistics" />
                  <InfoRow label="Carried Courses" value={studentStats.carried_courses} badge="warn" />
                  <InfoRow label="Attendance Records" value={studentStats.attendance_records} />
                  <InfoRow label="Grade Objections" value={studentStats.grade_objections_count} />
                  <InfoRow label="Pending Grade Objections" value={studentStats.pending_grade_objections_count} badge="warn" />
                </div>
              </section>

              <ReportTable
                title="Academic Records"
                icon="fa-solid fa-calendar-days"
                headers={['Academic Year', 'Study Year', 'Result', 'Registration', 'Tuition', 'Receipt']}
                rows={(selectedStudent?.academic_records || selectedStudent?.academicRecords || []).map((record) => [
                  fmt(record.academic_year?.name || record.academicYear?.name),
                  fmt(record.study_year?.name || record.studyYear?.name),
                  <Badge type={statusType(record.academic_result)}>{normalizeStatus(record.academic_result)}</Badge>,
                  <Badge type={statusType(record.registration_status)}>{normalizeStatus(record.registration_status)}</Badge>,
                  <Badge type={record.tuition_paid ? 'good' : 'bad'}>{record.tuition_paid ? 'Paid' : 'Unpaid'}</Badge>,
                  fmt(record.payment_receipt_number),
                ])}
                empty="No academic records found."
              />

              <ReportTable
                title="Course Enrollments & Grades"
                icon="fa-solid fa-book-open"
                headers={['Course', 'Academic Year', 'Study Year', 'Semester', 'Coursework', 'Practical', 'Exam', 'Final Mark', 'Result', 'Repeated / Carried', 'Supplementary']}
                rows={(selectedStudent?.course_enrollments || selectedStudent?.courseEnrollments || []).map((enrollment) => [
                  `${fmt(enrollment.course?.code, '')}${enrollment.course?.code ? ' - ' : ''}${fmt(enrollment.course?.name)}`,
                  fmt(enrollment.academic_year?.name || enrollment.academicYear?.name),
                  fmt(enrollment.study_year?.name || enrollment.studyYear?.name),
                  fmt(enrollment.semester_number),
                  fmt(enrollment.grade?.coursework_mark),
                  fmt(enrollment.grade?.practical_mark),
                  fmt(enrollment.grade?.exam_mark),
                  fmt(gradeFinal(enrollment)),
                  <Badge type={statusType(enrollment.grade?.result_status)}>{normalizeStatus(enrollment.grade?.result_status)}</Badge>,
                  <Badge type={enrollment.is_carried || enrollment.status === 'enrolled' && enrollment.notes?.includes('failed') ? 'warn' : 'good'}>{enrollment.is_carried ? 'Carried' : enrollment.notes?.includes('failed') ? 'Repeated' : 'No'}</Badge>,
                  <Badge type={enrollment.is_supplementary ? 'warn' : 'good'}>{enrollment.is_supplementary ? 'Yes' : 'No'}</Badge>,
                ])}
                empty="No course enrollments found."
              />

              <ReportTable
                title="Grade Objections"
                icon="fa-solid fa-scale-balanced"
                headers={['Course', 'Target', 'Status', 'Doctor Response', 'Final Decision Note', 'Submitted']}
                rows={(studentReport.grade_objections || []).map((objection) => [
                  `${fmt(objection.course_code, '')}${objection.course_code ? ' - ' : ''}${fmt(objection.course_name)}`,
                  fmt(objection.objection_target_label || objection.objection_target),
                  <Badge type={statusType(objection.status)}>{normalizeStatus(objection.status)}</Badge>,
                  fmt(objection.doctor_response),
                  fmt(objection.final_exam_decision_note),
                  dateOnly(objection.submitted_at || objection.created_at),
                ])}
                empty="No grade objections found."
              />

              <ReportTable
                title="Supplementary Requests"
                icon="fa-solid fa-file-circle-check"
                headers={['Course', 'Academic Year', 'Status', 'Student Note', 'Exams Note', 'Reviewed']}
                rows={(studentReport.supplementary_requests || studentReport.supplementaryExamRequests || []).map((request) => [
                  `${fmt(request.enrollment?.course?.code || request.course_code, '')}${request.enrollment?.course?.code || request.course_code ? ' - ' : ''}${fmt(request.enrollment?.course?.name || request.course_name)}`,
                  fmt(request.academic_year?.name || request.academicYear?.name),
                  <Badge type={statusType(request.status)}>{normalizeStatus(request.status)}</Badge>,
                  fmt(request.student_note),
                  fmt(request.exam_department_note),
                  dateOnly(request.reviewed_at || request.created_at),
                ])}
                empty="No supplementary requests found."
              />
            </>
          ) : null}
        </div>
      )}

      {activeTab === 'department' && (
        <div style={styles.sectionStack}>
          <section style={styles.card}>
            <CardTitle icon="fa-solid fa-building-columns" title="Generate Department Report" />
            <form onSubmit={generateDepartmentReport} style={styles.searchForm}>
              <div style={styles.formField}>
                <label style={styles.label}>Select Department</label>
                <select style={styles.input} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                  <option value="">Select from list or enter ID manually</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name || department.description || `Department #${department.id}`}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>Department ID</label>
                <input style={styles.input} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} placeholder="Example: 1" />
              </div>
              <button type="submit" style={styles.primaryBtn} disabled={actionLoading}>
                <i className="fa-solid fa-file-lines"></i> Generate
              </button>
              {departmentReport ? (
                <button type="button" style={styles.secondaryBtn} onClick={() => downloadJson(`department-report-${selectedDepartment?.code || departmentId}.json`, departmentReport)}>
                  <i className="fa-solid fa-download"></i> Export JSON
                </button>
              ) : null}
            </form>
          </section>

          {departmentReport ? (
            <>
              <section style={styles.grid4}>
                <Metric title="Employees" value={departmentStats.employees_count || 0} icon="fa-solid fa-users" />
                <Metric title="Doctors" value={departmentStats.doctors_count || 0} icon="fa-solid fa-user-doctor" />
                <Metric title="Courses" value={departmentStats.courses_count || 0} icon="fa-solid fa-book" />
                <Metric title="Has Manager" value={departmentStats.has_manager ? 'Yes' : 'No'} icon="fa-solid fa-user-tie" />
              </section>

              <section style={styles.twoColumns}>
                <div style={styles.card}>
                  <CardTitle icon="fa-solid fa-building" title="Department Information" />
                  <InfoRow label="Name" value={selectedDepartment?.name} />
                  <InfoRow label="Code" value={selectedDepartment?.code} />
                  <InfoRow label="Description" value={selectedDepartment?.description} />
                  <InfoRow label="Status" value={selectedDepartment?.is_active ? 'Active' : 'Inactive'} badge={selectedDepartment?.is_active ? 'good' : 'bad'} />
                  <InfoRow label="Manager Type" value={departmentStats.manager_type} />
                </div>

                <div style={styles.card}>
                  <CardTitle icon="fa-solid fa-chart-simple" title="Department Statistics" />
                  <InfoRow label="Active Employees" value={departmentStats.active_employees_count} badge="good" />
                  <InfoRow label="Active Doctors" value={departmentStats.active_doctors_count} badge="good" />
                  <InfoRow label="Active Courses" value={departmentStats.active_courses_count} badge="good" />
                  <InfoRow label="Manager Assigned" value={departmentStats.has_manager ? 'Yes' : 'No'} badge={departmentStats.has_manager ? 'good' : 'warn'} />
                </div>
              </section>

              <ReportTable
                title="Department Employees"
                icon="fa-solid fa-users"
                headers={['Name', 'Email', 'Job Title', 'Hire Date', 'Status']}
                rows={(selectedDepartment?.employees || []).map((employee) => [
                  fmt(employee.user?.full_name),
                  fmt(employee.user?.email),
                  fmt(employee.job_title),
                  dateOnly(employee.hire_date),
                  <Badge type={employee.is_active ? 'good' : 'bad'}>{employee.is_active ? 'Active' : 'Inactive'}</Badge>,
                ])}
                empty="No employees found."
              />

              <ReportTable
                title="Department Doctors"
                icon="fa-solid fa-user-doctor"
                headers={['Name', 'Email', 'Academic Title', 'Employee Number', 'Status']}
                rows={(selectedDepartment?.doctors || []).map((doctor) => [
                  fmt(doctor.user?.full_name),
                  fmt(doctor.user?.email),
                  fmt(doctor.academic_title),
                  fmt(doctor.employee_number),
                  <Badge type={doctor.is_active ? 'good' : 'bad'}>{doctor.is_active ? 'Active' : 'Inactive'}</Badge>,
                ])}
                empty="No doctors found."
              />

              <ReportTable
                title="Department Courses"
                icon="fa-solid fa-book"
                headers={['Code', 'Name', 'Credit Hours', 'Max Mark', 'Pass Mark', 'Status']}
                rows={(selectedDepartment?.courses || []).map((course) => [
                  fmt(course.code),
                  fmt(course.name),
                  fmt(course.credit_hours),
                  fmt(course.max_mark),
                  fmt(course.pass_mark),
                  <Badge type={course.is_active ? 'good' : 'bad'}>{course.is_active ? 'Active' : 'Inactive'}</Badge>,
                ])}
                empty="No courses found."
              />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Metric({ title, value, icon }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricIcon}><i className={icon}></i></div>
      <div>
        <p style={styles.metricTitle}>{title}</p>
        <h3 style={styles.metricValue}>{fmt(value, 0)}</h3>
      </div>
    </div>
  );
}

function CardTitle({ icon, title }) {
  return (
    <div style={styles.cardTitleRow}>
      <div style={styles.cardTitleIcon}><i className={icon}></i></div>
      <h2 style={styles.cardTitle}>{title}</h2>
    </div>
  );
}

function InfoRow({ label, value, badge }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      {badge ? <Badge type={badge}>{fmt(value)}</Badge> : <strong style={styles.infoValue}>{fmt(value)}</strong>}
    </div>
  );
}

function Badge({ type = 'muted', children }) {
  const badgeStyle = {
    ...styles.badge,
    ...(type === 'good' ? styles.badgeGood : {}),
    ...(type === 'warn' ? styles.badgeWarn : {}),
    ...(type === 'bad' ? styles.badgeBad : {}),
  };
  return <span style={badgeStyle}>{children}</span>;
}

function MiniBars({ items }) {
  const max = Math.max(...items.map((item) => numberValue(item.value)), 1);
  return (
    <div style={styles.barsWrap}>
      {items.map((item) => (
        <div key={item.label} style={styles.barRow}>
          <div style={styles.barHeader}>
            <span>{item.label}</span>
            <strong>{numberValue(item.value)}</strong>
          </div>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${Math.max(4, (numberValue(item.value) / max) * 100)}%`, ...(item.type === 'good' ? styles.barGood : {}), ...(item.type === 'warn' ? styles.barWarn : {}), ...(item.type === 'bad' ? styles.barBad : {}) }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryBlock({ title, data }) {
  if (!data) return null;
  return (
    <div style={styles.summaryBlock}>
      <strong style={styles.summaryTitle}>{title}</strong>
      <div style={styles.summaryGrid}>
        {Object.entries(data).map(([key, value]) => (
          <span key={key} style={styles.summaryPill}>{normalizeStatus(key)}: <b>{fmt(value, 0)}</b></span>
        ))}
      </div>
    </div>
  );
}

function WorkflowCheck({ title, text }) {
  return (
    <div style={styles.workflowCheck}>
      <div style={styles.workflowCheckIcon}><i className="fa-solid fa-check"></i></div>
      <div>
        <strong style={styles.workflowCheckTitle}>{title}</strong>
        <p style={styles.workflowCheckText}>{text}</p>
      </div>
    </div>
  );
}

function ReportTableInline({ headers, rows, empty }) {
  return (
    <div style={styles.inlineTableWrap}>
      <table style={styles.inlineTable}>
        <thead>
          <tr>{headers.map((header) => <th key={header} style={styles.inlineTh}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={cellIndex} style={styles.inlineTd}>{cell}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={headers.length} style={styles.emptyTd}>{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReportTable({ title, icon, headers, rows, empty }) {
  return (
    <section style={styles.card}>
      <CardTitle icon={icon} title={title} />
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {headers.map((header) => <th key={header} style={styles.th}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => <td key={cellIndex} style={styles.td}>{cell}</td>)}
              </tr>
            )) : (
              <tr><td colSpan={headers.length} style={styles.emptyTd}>{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const styles = {
  pageShell: {
    width: '100%',
    maxWidth: 'none',
    minHeight: '100%',
    background: 'transparent',
    color: '#10233f',
    fontFamily: 'Inter, Arial, sans-serif',
    padding: 0,
    margin: 0,
    boxSizing: 'border-box',
    overflow: 'visible',
  },
  hero: {
    width: '100%',
    background: 'linear-gradient(135deg, #ffffff 0%, #e8f2ff 100%)',
    border: '1px solid #e2e8f0',
    borderRadius: 24,
    padding: 24,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 18,
    alignItems: 'center',
    boxShadow: '0 14px 35px rgba(15,23,42,.07)',
    marginBottom: 18,
    boxSizing: 'border-box',
  },
  eyebrow: {
    margin: 0,
    color: '#2563eb',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: 900,
  },
  title: {
    margin: '6px 0 8px',
    fontSize: 30,
    lineHeight: 1.15,
    color: '#10243d',
    fontWeight: 900,
  },
  subtitle: {
    margin: 0,
    color: '#64748b',
    maxWidth: 820,
    lineHeight: 1.5,
  },
  heroActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  tabsBar: {
    width: '100%',
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  tabBtn: {
    border: '1px solid #dbe3ef',
    color: '#183b66',
    background: '#fff',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    fontWeight: 800,
    boxShadow: '0 8px 22px rgba(15,23,42,.04)',
  },
  tabBtnActive: {
    background: '#183b66',
    color: '#fff',
    borderColor: '#183b66',
    boxShadow: '0 12px 28px rgba(24,59,102,.22)',
  },
  sectionStack: {
    width: '100%',
    display: 'grid',
    gap: 18,
  },
  grid4: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  twoColumns: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
    gap: 18,
  },
  card: {
    width: '100%',
    minWidth: 0,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 22,
    padding: 22,
    boxShadow: '0 10px 28px rgba(15,23,42,.055)',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  metricCard: {
    width: '100%',
    minWidth: 0,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 20,
    padding: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 10px 28px rgba(15,23,42,.055)',
    boxSizing: 'border-box',
  },
  metricIcon: {
    width: 45,
    height: 45,
    minWidth: 45,
    borderRadius: 15,
    background: '#eff6ff',
    color: '#2563eb',
    display: 'grid',
    placeItems: 'center',
    fontSize: 18,
  },
  metricTitle: {
    margin: 0,
    color: '#64748b',
    fontSize: 13,
    fontWeight: 700,
  },
  metricValue: {
    margin: '3px 0 0',
    fontSize: 25,
    color: '#10243d',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    marginBottom: 16,
  },
  cardTitleIcon: {
    width: 38,
    height: 38,
    minWidth: 38,
    borderRadius: 13,
    background: '#eff6ff',
    color: '#2563eb',
    display: 'grid',
    placeItems: 'center',
  },
  cardTitle: {
    margin: 0,
    fontSize: 19,
    color: '#10243d',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: 700,
  },
  infoValue: {
    fontSize: 14,
    textAlign: 'right',
    color: '#10233f',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 99,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 800,
    background: '#f1f5f9',
    color: '#475569',
    textTransform: 'capitalize',
    maxWidth: 260,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badgeGood: { background: '#dcfce7', color: '#166534' },
  badgeWarn: { background: '#fef3c7', color: '#92400e' },
  badgeBad: { background: '#fee2e2', color: '#991b1b' },
  searchForm: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
    alignItems: 'end',
  },
  searchFormWide: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 1fr) auto auto',
    gap: 12,
    alignItems: 'start',
  },
  formField: {
    display: 'grid',
    gap: 7,
    minWidth: 0,
  },
  formFieldWide: {
    display: 'grid',
    gap: 8,
    minWidth: 0,
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    color: '#94a3b8',
    fontSize: 14,
    zIndex: 1,
  },
  searchInput: {
    border: '1px solid #dbe3ef',
    borderRadius: 14,
    padding: '13px 44px 13px 40px',
    outline: 'none',
    fontSize: 14,
    background: '#fff',
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
    fontWeight: 700,
    color: '#10233f',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 11,
    border: 0,
    background: '#f1f5f9',
    color: '#64748b',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  },
  searchHintRow: {
    minHeight: 22,
    display: 'flex',
    alignItems: 'center',
  },
  selectedHint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    color: '#166534',
    fontSize: 12,
    fontWeight: 900,
  },
  mutedHint: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 700,
  },
  studentSuggestionBox: {
    display: 'grid',
    gap: 8,
    marginTop: 2,
  },
  studentSuggestion: {
    width: '100%',
    border: '1px solid #e2e8f0',
    background: '#fbfdff',
    borderRadius: 14,
    padding: '10px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    textAlign: 'left',
    cursor: 'pointer',
    color: '#10233f',
  },
  studentSuggestionText: {
    display: 'grid',
    gap: 2,
  },
  studentSuggestionName: {
    fontSize: 13,
    fontWeight: 900,
  },
  studentSuggestionNumber: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'normal',
    fontWeight: 800,
  },
  label: {
    fontSize: 12,
    fontWeight: 800,
    color: '#475569',
  },
  input: {
    border: '1px solid #dbe3ef',
    borderRadius: 13,
    padding: '12px 13px',
    outline: 'none',
    fontSize: 14,
    background: '#fff',
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
  },
  primaryBtn: {
    border: 0,
    borderRadius: 14,
    padding: '12px 16px',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 900,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    whiteSpace: 'nowrap',
  },
  secondaryBtn: {
    border: '1px solid #dbe3ef',
    borderRadius: 14,
    padding: '12px 16px',
    background: '#fff',
    color: '#183b66',
    fontWeight: 900,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    whiteSpace: 'nowrap',
  },
  paragraph: {
    color: '#475569',
    lineHeight: 1.7,
    margin: '0 0 12px',
  },
  barsWrap: {
    display: 'grid',
    gap: 13,
    marginTop: 16,
  },
  barRow: {
    display: 'grid',
    gap: 6,
  },
  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#475569',
    fontSize: 13,
    fontWeight: 800,
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    background: '#f1f5f9',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    background: '#94a3b8',
  },
  barGood: { background: '#22c55e' },
  barWarn: { background: '#f59e0b' },
  barBad: { background: '#ef4444' },
  summaryBlock: {
    border: '1px solid #eef2f7',
    borderRadius: 16,
    padding: 14,
    background: '#fbfdff',
    marginBottom: 10,
  },
  summaryTitle: {
    display: 'block',
    marginBottom: 10,
  },
  summaryGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryPill: {
    background: '#f1f5f9',
    borderRadius: 999,
    padding: '7px 10px',
    color: '#475569',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  tableWrap: {
    width: '100%',
    maxWidth: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    minWidth: 780,
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '13px 12px',
    color: '#64748b',
    fontSize: 12,
    textTransform: 'uppercase',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 14,
    verticalAlign: 'top',
    maxWidth: 320,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  },
  emptyTd: {
    padding: 25,
    textAlign: 'center',
    color: '#94a3b8',
  },
  alertError: {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    borderRadius: 15,
    padding: '12px 14px',
    marginBottom: 16,
    fontWeight: 700,
  },
  alertSuccess: {
    background: '#dcfce7',
    border: '1px solid #bbf7d0',
    color: '#166534',
    borderRadius: 15,
    padding: '12px 14px',
    marginBottom: 16,
    fontWeight: 700,
  },
  loaderCard: {
    margin: '60px auto',
    maxWidth: 340,
    background: '#fff',
    borderRadius: 24,
    padding: 34,
    textAlign: 'center',
    boxShadow: '0 18px 50px rgba(15,23,42,.1)',
  },
  loaderIcon: {
    fontSize: 36,
    color: '#2563eb',
  },
  loaderTitle: {
    margin: '14px 0 0',
  },
  workflowCheck: {
    display: 'grid',
    gridTemplateColumns: '36px 1fr',
    gap: 12,
    alignItems: 'start',
    border: '1px solid #eef2f7',
    borderRadius: 16,
    padding: 14,
    background: '#fbfdff',
    marginBottom: 10,
  },
  workflowCheckIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: '#dcfce7',
    color: '#166534',
    display: 'grid',
    placeItems: 'center',
    fontSize: 14,
  },
  workflowCheckTitle: {
    display: 'block',
    color: '#10233f',
    fontSize: 14,
    fontWeight: 900,
    marginBottom: 4,
  },
  workflowCheckText: {
    margin: 0,
    color: '#64748b',
    lineHeight: 1.5,
    fontSize: 13,
    fontWeight: 650,
  },
  inlineTableWrap: {
    width: '100%',
    overflowX: 'auto',
    marginTop: 14,
    border: '1px solid #eef2f7',
    borderRadius: 14,
  },
  inlineTable: {
    width: '100%',
    minWidth: 520,
    borderCollapse: 'collapse',
  },
  inlineTh: {
    textAlign: 'left',
    padding: '10px 11px',
    background: '#eff6ff',
    color: '#183b66',
    fontSize: 11,
    textTransform: 'uppercase',
    borderBottom: '1px solid #dbeafe',
    whiteSpace: 'nowrap',
  },
  inlineTd: {
    padding: '11px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 13,
    verticalAlign: 'top',
  },
};
