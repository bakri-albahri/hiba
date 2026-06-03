import { useEffect, useMemo, useState } from 'react';
import api from '../Api/axios';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-line' },
  { key: 'courses', label: 'My Courses', icon: 'fa-solid fa-book-open' },
  { key: 'attendance', label: 'Attendance', icon: 'fa-solid fa-user-check' },
  { key: 'objections', label: 'Grade Objections', icon: 'fa-solid fa-scale-balanced' },
  { key: 'notifications', label: 'Notifications', icon: 'fa-solid fa-bell' },
  { key: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
];

const emptyAttendance = {
  course_id: '',
  academic_year_id: '',
  student_number: '',
  attendance_date: new Date().toISOString().slice(0, 10),
};

const emptyPassword = {
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
};

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

function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (['approved', 'active', 'doctor_responded', 'read'].includes(value)) return 'good';
  if (['sent_to_doctor', 'under_review', 'submitted', 'pending'].includes(value)) return 'warn';
  if (['rejected', 'rejected_by_exams', 'inactive'].includes(value)) return 'bad';
  return 'muted';
}

export default function DocProfile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [me, setMe] = useState(null);
  const [courses, setCourses] = useState([]);
  const [objections, setObjections] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [attendanceForm, setAttendanceForm] = useState(emptyAttendance);
  const [responseForms, setResponseForms] = useState({});
  const [passwordForm, setPasswordForm] = useState(emptyPassword);

  const doctor = me?.doctor || me?.user?.doctor || me?.data?.doctor || null;
  const user = me?.user || me || {};
  const doctorId = doctor?.id;

  const normalizedCourses = useMemo(() => {
    return courses.map((item) => {
      const assignment = item.course ? item : item.pivot ? { course: item } : item;
      return {
        id: assignment.id || `${assignment.course_id || assignment.course?.id}-${assignment.academic_year_id || assignment.academicYear?.id}`,
        assignment_id: assignment.id,
        course_id: assignment.course_id || assignment.course?.id || item.id,
        course_code: assignment.course?.code || item.code,
        course_name: assignment.course?.name || item.name,
        academic_year_id: assignment.academic_year_id || assignment.academicYear?.id || item.pivot?.academic_year_id,
        academic_year_name: assignment.academicYear?.name || item.academic_year?.name || item.pivot?.academic_year_id,
        semester_number: assignment.semester_number || item.pivot?.semester_number,
        is_primary: assignment.is_primary || item.pivot?.is_primary,
      };
    });
  }, [courses]);

  const activeObjections = useMemo(
    () => objections.filter((o) => ['sent_to_doctor', 'doctor_responded'].includes(o.status)),
    [objections]
  );

  const pendingDoctorResponses = useMemo(
    () => objections.filter((o) => o.status === 'sent_to_doctor').length,
    [objections]
  );

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setError('');
    try {
      const [profileRes, notificationsRes] = await Promise.allSettled([
        api.get('/doctor-portal/profile'),
        api.get('/notifications/me'),
      ]);

      if (profileRes.status === 'fulfilled') {
        const profile = profileRes.value.data;
        setMe(profile);
        await loadDoctorData(profile);
      } else {
        const fallback = await api.get('/me');
        setMe(fallback.data);
        await loadDoctorData(fallback.data);
      }

      if (notificationsRes.status === 'fulfilled') {
        setNotifications(asArray(notificationsRes.value.data));
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load doctor profile.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDoctorData(profile = me) {
    const currentDoctor = profile?.doctor || profile?.user?.doctor || profile?.data?.doctor;
    const id = currentDoctor?.id;
    const requests = [
      api.get('/doctor-portal/courses').catch(() => (id ? api.get(`/doctors/${id}/courses`) : Promise.resolve({ data: [] }))),
      api.get('/doctor-portal/grade-objections').catch(() => Promise.resolve({ data: [] })),
      api.get('/doctor-portal/attendance').catch(() => Promise.resolve({ data: [] })),
    ];

    const [courseRes, objectionRes, attendanceRes] = await Promise.all(requests);
    const coursePayload = courseRes.data?.courseAssignments || courseRes.data?.doctor?.courseAssignments || courseRes.data?.course_assignments || courseRes.data?.courseAssignments || courseRes.data;
    setCourses(asArray(coursePayload));
    setObjections(asArray(objectionRes.data));
    setAttendanceRecords(asArray(attendanceRes.data));
  }

  function showSuccess(message) {
    setSuccess(message);
    setError('');
    setTimeout(() => setSuccess(''), 4000);
  }

  function showError(err, fallback) {
    setError(err?.response?.data?.message || err?.response?.data?.error || fallback);
    setSuccess('');
  }

  function chooseCourse(value) {
    const selected = normalizedCourses.find((item) => String(item.course_id) === String(value));
    setAttendanceForm((prev) => ({
      ...prev,
      course_id: value,
      academic_year_id: selected?.academic_year_id || prev.academic_year_id,
    }));
  }

  async function recordAttendance(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/doctor-portal/attendance/record', {
        ...attendanceForm,
        doctor_id: doctorId,
      });
      setAttendanceForm((prev) => ({ ...emptyAttendance, attendance_date: prev.attendance_date }));
      showSuccess('Attendance recorded successfully.');
      await loadDoctorData();
    } catch (err) {
      showError(err, 'Failed to record attendance.');
    } finally {
      setActionLoading(false);
    }
  }

  function updateResponseForm(id, key, value) {
    setResponseForms((prev) => ({
      ...prev,
      [id]: {
        doctor_response: '',
        doctor_suggested_coursework_mark: '',
        doctor_suggested_practical_mark: '',
        doctor_suggested_exam_mark: '',
        ...(prev[id] || {}),
        [key]: value,
      },
    }));
  }

  async function submitDoctorResponse(objection) {
    const form = responseForms[objection.id] || {};
    if (!form.doctor_response?.trim()) {
      setError('Please write the doctor response before sending it.');
      return;
    }

    const payload = {
      doctor_response: form.doctor_response,
      doctor_suggested_coursework_mark: form.doctor_suggested_coursework_mark === '' ? null : Number(form.doctor_suggested_coursework_mark),
      doctor_suggested_practical_mark: form.doctor_suggested_practical_mark === '' ? null : Number(form.doctor_suggested_practical_mark),
      doctor_suggested_exam_mark: form.doctor_suggested_exam_mark === '' ? null : Number(form.doctor_suggested_exam_mark),
    };

    setActionLoading(true);
    try {
      await api.patch(`/grade-objections/${objection.id}/doctor-response`, payload);
      setResponseForms((prev) => ({ ...prev, [objection.id]: {} }));
      showSuccess('Doctor response sent to examinations department.');
      await loadDoctorData();
    } catch (err) {
      showError(err, 'Failed to send doctor response.');
    } finally {
      setActionLoading(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/account/change-my-password', passwordForm);
      setPasswordForm(emptyPassword);
      showSuccess('Password changed successfully.');
    } catch (err) {
      showError(err, 'Failed to change password.');
    } finally {
      setActionLoading(false);
    }
  }

  async function markNotificationRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`, { is_read: true });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      showError(err, 'Failed to mark notification as read.');
    }
  }

  async function logout() {
    try {
      await api.post('/logout');
    } catch (_) {}
    localStorage.removeItem('token');
    window.location.pathname = '/login';
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loaderCard}>
          <i className="fa-solid fa-spinner fa-spin" style={styles.loaderIcon}></i>
          <h2 style={styles.loaderTitle}>Loading doctor portal...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brandBox}>
          <div style={styles.brandIcon}><i className="fa-solid fa-user-doctor"></i></div>
          <div>
            <h2 style={styles.brandTitle}>Doctor Portal</h2>
            <p style={styles.brandSubtitle}>University Management System</p>
          </div>
        </div>

        <div style={styles.profileMini}>
          <div style={styles.avatar}>{String(user?.full_name || 'D').slice(0, 1).toUpperCase()}</div>
          <div>
            <strong style={styles.name}>{fmt(user?.full_name, 'Doctor')}</strong>
            <p style={styles.smallText}>{fmt(doctor?.academic_title, 'Academic Staff')}</p>
            <p style={styles.smallText}>{fmt(doctor?.employee_number, 'No employee number')}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{ ...styles.navItem, ...(activeTab === tab.key ? styles.navItemActive : {}) }}
            >
              <i className={tab.icon} style={styles.navIcon}></i>
              {tab.label}
              {tab.key === 'objections' && pendingDoctorResponses > 0 ? <span style={styles.navBadge}>{pendingDoctorResponses}</span> : null}
            </button>
          ))}
        </nav>

        <button type="button" onClick={logout} style={styles.logoutBtn}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
        </button>
      </aside>

      <main style={styles.main}>
        <section style={styles.hero}>
          <div>
            <p style={styles.eyebrow}>Doctor Workspace</p>
            <h1 style={styles.title}>Welcome, {fmt(user?.full_name, 'Doctor')}</h1>
            <p style={styles.subtitle}>Manage your teaching assignments, record attendance, and respond to grade objections sent by examinations.</p>
          </div>
          <div style={styles.heroActions}>
            <button type="button" onClick={loadPage} style={styles.secondaryBtn}>
              <i className="fa-solid fa-rotate"></i> Refresh
            </button>
          </div>
        </section>

        {error ? <div style={styles.alertError}><i className="fa-solid fa-circle-exclamation"></i> {error}</div> : null}
        {success ? <div style={styles.alertSuccess}><i className="fa-solid fa-circle-check"></i> {success}</div> : null}

        {activeTab === 'overview' && (
          <>
            <section style={styles.grid4}>
              <Metric title="Assigned Courses" value={normalizedCourses.length} icon="fa-solid fa-book" />
              <Metric title="Pending Objections" value={pendingDoctorResponses} icon="fa-solid fa-scale-balanced" />
              <Metric title="Attendance Records" value={attendanceRecords.length} icon="fa-solid fa-user-check" />
              <Metric title="Notifications" value={notifications.filter((n) => !n.is_read).length} icon="fa-solid fa-bell" />
            </section>

            <section style={styles.twoColumns}>
              <div style={styles.card}>
                <CardTitle icon="fa-solid fa-id-card" title="Doctor Information" />
                <InfoRow label="Full Name" value={user?.full_name} />
                <InfoRow label="Email" value={user?.email} />
                <InfoRow label="Mobile" value={user?.mobile} />
                <InfoRow label="Academic Title" value={doctor?.academic_title} />
                <InfoRow label="Employee Number" value={doctor?.employee_number} />
                <InfoRow label="Department" value={doctor?.department?.name || doctor?.department_name} />
                <InfoRow label="Status" value={doctor?.is_active ? 'Active' : 'Inactive'} badge={doctor?.is_active ? 'good' : 'bad'} />
              </div>

              <div style={styles.card}>
                <CardTitle icon="fa-solid fa-list-check" title="Today Focus" />
                <div style={styles.focusItem}>
                  <strong>{pendingDoctorResponses}</strong>
                  <span>objection response{pendingDoctorResponses === 1 ? '' : 's'} waiting for your review.</span>
                </div>
                <div style={styles.focusItem}>
                  <strong>{normalizedCourses.length}</strong>
                  <span>course assignment{normalizedCourses.length === 1 ? '' : 's'} linked to your account.</span>
                </div>
                <div style={styles.focusItem}>
                  <strong>{notifications.filter((n) => !n.is_read).length}</strong>
                  <span>unread notification{notifications.filter((n) => !n.is_read).length === 1 ? '' : 's'}.</span>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'courses' && (
          <section style={styles.card}>
            <CardTitle icon="fa-solid fa-book-open" title="My Teaching Assignments" />
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Course Code</th>
                    <th style={styles.th}>Course Name</th>
                    <th style={styles.th}>Academic Year</th>
                    <th style={styles.th}>Semester</th>
                    <th style={styles.th}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedCourses.map((course) => (
                    <tr key={course.id}>
                      <td style={styles.td}>{fmt(course.course_code)}</td>
                      <td style={styles.td}>{fmt(course.course_name)}</td>
                      <td style={styles.td}>{fmt(course.academic_year_name)}</td>
                      <td style={styles.td}>{fmt(course.semester_number)}</td>
                      <td style={styles.td}><Badge type={course.is_primary ? 'good' : 'muted'}>{course.is_primary ? 'Primary' : 'Assigned'}</Badge></td>
                    </tr>
                  ))}
                  {!normalizedCourses.length ? <EmptyRow colSpan={5} text="No course assignments found." /> : null}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'attendance' && (
          <section style={styles.twoColumnsWide}>
            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-user-check" title="Record Student Attendance" />
              <form onSubmit={recordAttendance} style={styles.formGrid}>
                <label style={styles.label}>Course</label>
                <select style={styles.input} value={attendanceForm.course_id} onChange={(e) => chooseCourse(e.target.value)} required>
                  <option value="">Select course</option>
                  {normalizedCourses.map((course) => (
                    <option key={course.id} value={course.course_id}>
                      {course.course_code ? `${course.course_code} - ` : ''}{course.course_name} / {course.academic_year_name}
                    </option>
                  ))}
                </select>

                <label style={styles.label}>Academic Year ID</label>
                <input style={styles.input} value={attendanceForm.academic_year_id} onChange={(e) => setAttendanceForm((p) => ({ ...p, academic_year_id: e.target.value }))} required />

                <label style={styles.label}>Student Number</label>
                <input style={styles.input} placeholder="20250001" value={attendanceForm.student_number} onChange={(e) => setAttendanceForm((p) => ({ ...p, student_number: e.target.value }))} required />

                <label style={styles.label}>Attendance Date</label>
                <input type="date" style={styles.input} value={attendanceForm.attendance_date} onChange={(e) => setAttendanceForm((p) => ({ ...p, attendance_date: e.target.value }))} />

                <button type="submit" style={styles.primaryBtn} disabled={actionLoading}>
                  <i className="fa-solid fa-check"></i> Record Attendance
                </button>
              </form>
            </div>

            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-clock-rotate-left" title="Recent Attendance Records" />
              <div style={styles.stackList}>
                {attendanceRecords.slice(0, 8).map((record) => (
                  <div key={record.id} style={styles.listItem}>
                    <div>
                      <strong>{fmt(record.enrollment?.course?.name || record.course_name, 'Course')}</strong>
                      <p style={styles.smallText}>Student: {fmt(record.enrollment?.student?.student_number || record.student_number)}</p>
                    </div>
                    <Badge type="good">{dateOnly(record.attendance_date || record.recorded_at)}</Badge>
                  </div>
                ))}
                {!attendanceRecords.length ? <p style={styles.emptyText}>No attendance records yet.</p> : null}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'objections' && (
          <section style={styles.card}>
            <CardTitle icon="fa-solid fa-scale-balanced" title="Grade Objections Sent to Doctor" />
            <div style={styles.objectionGrid}>
              {activeObjections.map((objection) => {
                const grade = objection.enrollment?.grade;
                const form = responseForms[objection.id] || {};
                const disabled = objection.status !== 'sent_to_doctor';
                return (
                  <article key={objection.id} style={styles.objectionCard}>
                    <div style={styles.objectionHeader}>
                      <div>
                        <h3 style={styles.objectionTitle}>{fmt(objection.enrollment?.course?.name, 'Course')}</h3>
                        <p style={styles.smallText}>{fmt(objection.student?.user?.full_name, 'Student')} • #{fmt(objection.student?.student_number || objection.student?.id)}</p>
                      </div>
                      <Badge type={statusClass(objection.status)}>{String(objection.status || '').replaceAll('_', ' ')}</Badge>
                    </div>

                    <div style={styles.gradeStrip}>
                      <span>Coursework: <b>{fmt(grade?.coursework_mark)}</b></span>
                      <span>Practical: <b>{fmt(grade?.practical_mark)}</b></span>
                      <span>Exam: <b>{fmt(grade?.exam_mark)}</b></span>
                      <span>Final: <b>{fmt(grade?.final_mark)}</b></span>
                    </div>

                    <InfoRow label="Target" value={objection.objection_target_label || objection.objection_target} />
                    <InfoRow label="Exam Department Note" value={objection.exam_department_note} />
                    <div style={styles.noteBox}>{fmt(objection.objection_text, 'No objection text.')}</div>

                    {objection.doctor_response ? (
                      <div style={styles.responseBox}>
                        <strong>Submitted Doctor Response</strong>
                        <p>{objection.doctor_response}</p>
                        <div style={styles.gradeStrip}>
                          <span>Suggested Coursework: <b>{fmt(objection.doctor_suggested_coursework_mark)}</b></span>
                          <span>Suggested Practical: <b>{fmt(objection.doctor_suggested_practical_mark)}</b></span>
                          <span>Suggested Exam: <b>{fmt(objection.doctor_suggested_exam_mark)}</b></span>
                        </div>
                      </div>
                    ) : null}

                    <div style={{ ...styles.formGrid, marginTop: 14 }}>
                      <label style={styles.label}>Doctor Response</label>
                      <textarea
                        style={styles.textarea}
                        value={form.doctor_response || ''}
                        disabled={disabled}
                        onChange={(e) => updateResponseForm(objection.id, 'doctor_response', e.target.value)}
                        placeholder="Write your review after checking the student's paper or coursework."
                      />

                      <div style={styles.threeInputs}>
                        <div>
                          <label style={styles.label}>Suggested Coursework /100</label>
                          <input type="number" min="0" max="100" style={styles.input} disabled={disabled} value={form.doctor_suggested_coursework_mark || ''} onChange={(e) => updateResponseForm(objection.id, 'doctor_suggested_coursework_mark', e.target.value)} />
                        </div>
                        <div>
                          <label style={styles.label}>Suggested Practical /100</label>
                          <input type="number" min="0" max="100" style={styles.input} disabled={disabled} value={form.doctor_suggested_practical_mark || ''} onChange={(e) => updateResponseForm(objection.id, 'doctor_suggested_practical_mark', e.target.value)} />
                        </div>
                        <div>
                          <label style={styles.label}>Suggested Exam /100</label>
                          <input type="number" min="0" max="100" style={styles.input} disabled={disabled} value={form.doctor_suggested_exam_mark || ''} onChange={(e) => updateResponseForm(objection.id, 'doctor_suggested_exam_mark', e.target.value)} />
                        </div>
                      </div>

                      <button type="button" style={disabled ? styles.disabledBtn : styles.primaryBtn} disabled={disabled || actionLoading} onClick={() => submitDoctorResponse(objection)}>
                        <i className="fa-solid fa-paper-plane"></i> Send Response to Exams Department
                      </button>
                    </div>
                  </article>
                );
              })}
              {!activeObjections.length ? <p style={styles.emptyText}>No grade objections currently assigned to you.</p> : null}
            </div>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section style={styles.card}>
            <CardTitle icon="fa-solid fa-bell" title="My Notifications" />
            <div style={styles.stackList}>
              {notifications.map((notification) => (
                <div key={notification.id} style={styles.notificationItem}>
                  <div>
                    <strong>{fmt(notification.title, 'Notification')}</strong>
                    <p style={styles.notificationMessage}>{fmt(notification.message)}</p>
                    <p style={styles.smallText}>{dateOnly(notification.created_at)}</p>
                  </div>
                  <button type="button" style={notification.is_read ? styles.disabledSmallBtn : styles.smallBtn} disabled={notification.is_read} onClick={() => markNotificationRead(notification.id)}>
                    {notification.is_read ? 'Read' : 'Mark read'}
                  </button>
                </div>
              ))}
              {!notifications.length ? <p style={styles.emptyText}>No notifications found.</p> : null}
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section style={styles.twoColumns}>
            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-lock" title="Change Password" />
              <form onSubmit={changePassword} style={styles.formGrid}>
                <label style={styles.label}>Current Password</label>
                <input type="password" style={styles.input} value={passwordForm.current_password} onChange={(e) => setPasswordForm((p) => ({ ...p, current_password: e.target.value }))} required />
                <label style={styles.label}>New Password</label>
                <input type="password" style={styles.input} value={passwordForm.new_password} onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))} required />
                <label style={styles.label}>Confirm New Password</label>
                <input type="password" style={styles.input} value={passwordForm.new_password_confirmation} onChange={(e) => setPasswordForm((p) => ({ ...p, new_password_confirmation: e.target.value }))} required />
                <button type="submit" style={styles.primaryBtn} disabled={actionLoading}>Update Password</button>
              </form>
            </div>

            <div style={styles.card}>
              <CardTitle icon="fa-solid fa-circle-info" title="Doctor Permissions Note" />
              <p style={styles.paragraph}>According to the system workflow, the doctor does not enter grades directly. Grade entry is handled by the Examinations Department. The doctor can record attendance and respond to grade objections after they are sent by Examinations.</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Metric({ title, value, icon }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricIcon}><i className={icon}></i></div>
      <div>
        <p style={styles.metricTitle}>{title}</p>
        <h3 style={styles.metricValue}>{value}</h3>
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

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} style={styles.emptyTd}>{text}</td>
    </tr>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f4f7fb', display: 'flex', color: '#10233f', fontFamily: 'Inter, Arial, sans-serif' },
  sidebar: { width: 290, background: 'linear-gradient(180deg, #10233f 0%, #183b66 100%)', color: '#fff', padding: 22, position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 },
  brandBox: { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,.12)' },
  brandIcon: { width: 46, height: 46, borderRadius: 16, background: 'rgba(255,255,255,.12)', display: 'grid', placeItems: 'center', fontSize: 20 },
  brandTitle: { margin: 0, fontSize: 20, fontWeight: 800 },
  brandSubtitle: { margin: '4px 0 0', fontSize: 12, opacity: .72 },
  profileMini: { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,.08)', borderRadius: 18, padding: 14 },
  avatar: { width: 46, height: 46, borderRadius: 14, background: '#e8f2ff', color: '#183b66', fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 20 },
  name: { display: 'block', fontSize: 14 },
  smallText: { margin: '4px 0 0', fontSize: 12, color: 'inherit', opacity: .72 },
  nav: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 },
  navItem: { border: 0, color: '#dbeafe', background: 'transparent', textAlign: 'left', padding: '12px 13px', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, position: 'relative' },
  navItemActive: { background: '#fff', color: '#183b66', boxShadow: '0 10px 26px rgba(0,0,0,.18)' },
  navIcon: { width: 18 },
  navBadge: { marginLeft: 'auto', minWidth: 22, height: 22, borderRadius: 99, background: '#ef4444', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12 },
  logoutBtn: { marginTop: 'auto', border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.08)', color: '#fff', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' },
  main: { flex: 1, padding: 28, boxSizing: 'border-box', overflow: 'auto' },
  hero: { background: 'linear-gradient(135deg, #ffffff 0%, #e8f2ff 100%)', border: '1px solid #e2e8f0', borderRadius: 28, padding: 26, display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', boxShadow: '0 18px 50px rgba(15,23,42,.08)', marginBottom: 18 },
  eyebrow: { margin: 0, color: '#2563eb', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 900 },
  title: { margin: '6px 0 8px', fontSize: 31, lineHeight: 1.15 },
  subtitle: { margin: 0, color: '#64748b', maxWidth: 760 },
  heroActions: { display: 'flex', gap: 10 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(170px, 1fr))', gap: 16, marginBottom: 18 },
  metricCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 22, padding: 18, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 32px rgba(15,23,42,.06)' },
  metricIcon: { width: 45, height: 45, borderRadius: 15, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center', fontSize: 18 },
  metricTitle: { margin: 0, color: '#64748b', fontSize: 13, fontWeight: 700 },
  metricValue: { margin: '3px 0 0', fontSize: 25 },
  twoColumns: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))', gap: 18 },
  twoColumnsWide: { display: 'grid', gridTemplateColumns: 'minmax(320px, 460px) 1fr', gap: 18 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 22, boxShadow: '0 12px 32px rgba(15,23,42,.06)' },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 },
  cardTitleIcon: { width: 38, height: 38, borderRadius: 13, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' },
  cardTitle: { margin: 0, fontSize: 19 },
  infoRow: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  infoLabel: { color: '#64748b', fontSize: 13, fontWeight: 700 },
  infoValue: { fontSize: 14, textAlign: 'right' },
  badge: { display: 'inline-flex', alignItems: 'center', borderRadius: 99, padding: '6px 10px', fontSize: 12, fontWeight: 800, background: '#f1f5f9', color: '#475569', textTransform: 'capitalize' },
  badgeGood: { background: '#dcfce7', color: '#166534' },
  badgeWarn: { background: '#fef3c7', color: '#92400e' },
  badgeBad: { background: '#fee2e2', color: '#991b1b' },
  focusItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: '1px solid #f1f5f9', color: '#64748b' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '13px 12px', color: '#64748b', fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  td: { padding: '14px 12px', borderBottom: '1px solid #f1f5f9', fontSize: 14, verticalAlign: 'top' },
  emptyTd: { padding: 25, textAlign: 'center', color: '#94a3b8' },
  formGrid: { display: 'grid', gap: 10 },
  label: { fontSize: 12, fontWeight: 800, color: '#475569' },
  input: { border: '1px solid #dbe3ef', borderRadius: 13, padding: '12px 13px', outline: 'none', fontSize: 14, background: '#fff', boxSizing: 'border-box', width: '100%' },
  textarea: { border: '1px solid #dbe3ef', borderRadius: 13, padding: '12px 13px', outline: 'none', minHeight: 96, resize: 'vertical', fontSize: 14, fontFamily: 'inherit' },
  primaryBtn: { border: 0, borderRadius: 14, padding: '12px 16px', background: '#2563eb', color: '#fff', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryBtn: { border: '1px solid #dbe3ef', borderRadius: 14, padding: '12px 16px', background: '#fff', color: '#183b66', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  smallBtn: { border: 0, borderRadius: 12, padding: '9px 12px', background: '#2563eb', color: '#fff', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' },
  disabledBtn: { border: 0, borderRadius: 14, padding: '12px 16px', background: '#cbd5e1', color: '#64748b', fontWeight: 900, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  disabledSmallBtn: { border: 0, borderRadius: 12, padding: '9px 12px', background: '#e2e8f0', color: '#64748b', fontWeight: 800, cursor: 'not-allowed', whiteSpace: 'nowrap' },
  stackList: { display: 'grid', gap: 10 },
  listItem: { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', border: '1px solid #eef2f7', borderRadius: 16, padding: 14, background: '#fbfdff' },
  notificationItem: { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', border: '1px solid #eef2f7', borderRadius: 16, padding: 14, background: '#fbfdff' },
  notificationMessage: { margin: '6px 0', color: '#475569', fontSize: 14 },
  objectionGrid: { display: 'grid', gap: 16 },
  objectionCard: { border: '1px solid #e2e8f0', borderRadius: 22, padding: 18, background: '#fbfdff' },
  objectionHeader: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 12 },
  objectionTitle: { margin: 0, fontSize: 18 },
  gradeStrip: { display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' },
  noteBox: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 13, color: '#334155', marginTop: 10, lineHeight: 1.5 },
  responseBox: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 13, color: '#1e3a8a', marginTop: 12 },
  threeInputs: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  emptyText: { color: '#94a3b8', textAlign: 'center', padding: 18 },
  paragraph: { color: '#475569', lineHeight: 1.7 },
  alertError: { background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 15, padding: '12px 14px', marginBottom: 16, fontWeight: 700 },
  alertSuccess: { background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 15, padding: '12px 14px', marginBottom: 16, fontWeight: 700 },
  loaderCard: { margin: 'auto', background: '#fff', borderRadius: 24, padding: 34, textAlign: 'center', boxShadow: '0 18px 50px rgba(15,23,42,.1)' },
  loaderIcon: { fontSize: 36, color: '#2563eb' },
  loaderTitle: { margin: '14px 0 0' },
};
