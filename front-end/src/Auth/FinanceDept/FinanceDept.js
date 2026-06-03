import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/axios";

const FALLBACK = "Not available";

const financePermissions = [
  "set annual tuition fees",
  "update tuition payment status",
  "view dashboard",
];

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "fees", label: "Annual Tuition Fees" },
  { id: "students", label: "Student Payments" },
  { id: "receipts", label: "Receipt Confirmation" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
];

const emptyFeeForm = {
  program_id: "",
  academic_year_id: "",
  study_year_id: "",
  amount: "",
  is_active: true,
  notes: "",
};

const emptyPaymentForm = {
  tuition_paid: true,
  payment_receipt_number: "",
  payment_receipt_date: "",
  notes: "",
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

function money(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return FALLBACK;
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(numeric);
}

function toBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function getEmployeeDepartment(user) {
  return user?.employee?.department?.name || user?.department?.name || FALLBACK;
}

function initials(name) {
  return String(name || "FD")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FD";
}

function recordKey(row) {
  return row?.student_academic_record_id || row?.record_id || row?.id;
}

function studentLabel(row) {
  return row?.student_name || row?.student?.user?.full_name || row?.student?.full_name || FALLBACK;
}

function studentNumber(row) {
  return row?.student_number || row?.student?.student_number || FALLBACK;
}

function StatusBadge({ value }) {
  const raw = String(value ?? "unknown").toLowerCase();
  const type = raw.includes("paid") || raw.includes("registered") || raw.includes("active") || raw === "true" || value === true
    ? "success"
    : raw.includes("not") || raw.includes("pending") || raw.includes("false") || raw.includes("stopped") || value === false
      ? "danger"
      : "warning";
  return <span className={`fdp-badge ${type}`}>{formatValue(value)}</span>;
}

function ErrorNote({ message }) {
  if (!message) return null;
  return <div className="fdp-error-note">{message}</div>;
}

function EmptyState({ title, text }) {
  return (
    <div className="fdp-empty">
      <div className="fdp-empty-icon">i</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function InfoItem({ label, value, wide = false }) {
  return (
    <div className={`fdp-info-item ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{formatValue(value)}</strong>
    </div>
  );
}

function TextField({ label, value, onChange, type = "text", placeholder = "", disabled = false }) {
  return (
    <label className="fdp-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} disabled={disabled} />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="fdp-field wide">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows="3" />
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder = "Select", disabled = false, allowEmpty = true }) {
  return (
    <label className="fdp-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
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

function CheckField({ label, checked, onChange }) {
  return (
    <label className="fdp-check-field">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export default function FinanceDept() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lookupError, setLookupError] = useState("");

  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [studyYears, setStudyYears] = useState([]);
  const [tuitionFees, setTuitionFees] = useState([]);
  const [financialRows, setFinancialRows] = useState([]);
  const [studentFinance, setStudentFinance] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const [feeForm, setFeeForm] = useState(emptyFeeForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedFinancialRow, setSelectedFinancialRow] = useState(null);
  const [selectedFinanceRecordId, setSelectedFinanceRecordId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");

  const canSetFees = permissions.includes("set annual tuition fees");
  const canUpdatePayments = permissions.includes("update tuition payment status");

  const stats = useMemo(() => {
    const paid = financialRows.filter((row) => toBoolean(row.tuition_paid)).length;
    const unpaid = financialRows.filter((row) => !toBoolean(row.tuition_paid)).length;
    const totalAmount = financialRows.reduce((sum, row) => sum + (Number(row.tuition_amount) || 0), 0);
    const activeFees = tuitionFees.filter((fee) => fee.is_active !== false).length;
    return {
      paid,
      unpaid,
      totalRows: financialRows.length,
      totalAmount,
      activeFees,
      feeDefinitions: tuitionFees.length,
    };
  }, [financialRows, tuitionFees]);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return financialRows.filter((row) => {
      const matchesSearch = !search || [
        row.student_name,
        row.student_number,
        row.program,
        row.academic_year,
        row.study_year,
        row.payment_receipt_number,
      ].some((value) => String(value || "").toLowerCase().includes(search));

      const matchesPayment = paymentFilter === "all"
        || (paymentFilter === "paid" && toBoolean(row.tuition_paid))
        || (paymentFilter === "unpaid" && !toBoolean(row.tuition_paid));

      const matchesYear = academicYearFilter === "all" || String(row.academic_year || "") === String(academicYearFilter);
      return matchesSearch && matchesPayment && matchesYear;
    });
  }, [financialRows, searchTerm, paymentFilter, academicYearFilter]);

  const yearNames = useMemo(() => {
    const values = new Set(financialRows.map((row) => row.academic_year).filter(Boolean));
    return Array.from(values).sort();
  }, [financialRows]);

  useEffect(() => {
    boot();
  }, []);

  async function boot() {
    setLoading(true);
    setError("");
    try {
      const me = await api.get("/me");
      const fullUser = me.data.user || me.data || JSON.parse(localStorage.getItem("user") || "null");
      const userPermissions = me.data.permissions || JSON.parse(localStorage.getItem("permissions") || "[]");
      setUser(fullUser);
      setPermissions(userPermissions);
      localStorage.setItem("user", JSON.stringify(fullUser));
      localStorage.setItem("permissions", JSON.stringify(userPermissions));
      await Promise.allSettled([loadLookups(), loadFinanceData(), loadNotifications()]);
    } catch (requestError) {
      setError(extractApiMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function loadLookups() {
    setLookupError("");
    try {
      const [programRes, yearRes, studyYearRes] = await Promise.all([
        api.get("/programs"),
        api.get("/academic-years"),
        api.get("/study-years"),
      ]);
      setPrograms(normalizeCollection(programRes.data, "programs"));
      setAcademicYears(normalizeCollection(yearRes.data, "academic_years"));
      setStudyYears(normalizeCollection(studyYearRes.data, "study_years"));
    } catch (requestError) {
      setLookupError(extractApiMessage(requestError));
    }
  }

  async function loadFinanceData() {
    const requests = [];
    requests.push(api.get("/finance/tuition-fees"));
    requests.push(api.get("/finance/students-status"));
    const [feesResult, statusResult] = await Promise.allSettled(requests);

    if (feesResult.status === "fulfilled") {
      setTuitionFees(normalizeCollection(feesResult.value.data));
    }

    if (statusResult.status === "fulfilled") {
      setFinancialRows(normalizeCollection(statusResult.value.data));
    }

    const errors = [feesResult, statusResult]
      .filter((result) => result.status === "rejected")
      .map((result) => extractApiMessage(result.reason));

    if (errors.length) setError(errors[0]);
  }

  async function loadNotifications() {
    try {
      const response = await api.get("/notifications/me");
      setNotifications(normalizeCollection(response.data, "notifications"));
    } catch {
      setNotifications([]);
    }
  }

  function flash(message, type = "success") {
    if (type === "success") {
      setSuccess(message);
      setError("");
    } else {
      setError(message);
      setSuccess("");
    }
    window.setTimeout(() => {
      setSuccess("");
      setError("");
    }, 5000);
  }

  async function logout() {
    try {
      await api.post("/logout");
    } catch {
      // Clear local session even if backend logout fails.
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    navigate("/login");
  }

  function normalizeMoneyInput(value) {
  return String(value ?? "")
    .replaceAll(",", "")
    .replace(/\s/g, "")
    .trim();
}
  async function saveFee(event) {
    event.preventDefault();
    if (!canSetFees) return flash("You do not have permission to set annual tuition fees.", "danger");
    if (!feeForm.program_id || !feeForm.academic_year_id || !feeForm.study_year_id || feeForm.amount === "") {
      return flash("Please select program, academic year, study year, and amount.", "danger");
    }

    setBusy(true);
    try {
      const body = {
        program_id: Number(feeForm.program_id),
        academic_year_id: Number(feeForm.academic_year_id),
        study_year_id: Number(feeForm.study_year_id),
        amount: normalizeMoneyInput(feeForm.amount),
        is_active: toBoolean(feeForm.is_active),
        notes: feeForm.notes || null,
      };
      await api.post("/finance/tuition-fees", body);
      setFeeForm(emptyFeeForm);
      await loadFinanceData();
      flash("Tuition fee saved successfully.");
    } catch (requestError) {
      flash(extractApiMessage(requestError), "danger");
    } finally {
      setBusy(false);
    }
  }

  function editFee(fee) {
    setFeeForm({
      program_id: fee.program_id || fee.program?.id || "",
      academic_year_id: fee.academic_year_id || fee.academicYear?.id || fee.academic_year?.id || "",
      study_year_id: fee.study_year_id || fee.studyYear?.id || fee.study_year?.id || "",
      amount: fee.amount ?? "",
      is_active: fee.is_active !== false,
      notes: fee.notes || "",
    });
    setActiveTab("fees");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function selectFinancialRow(row) {
    setSelectedFinancialRow(row);
    setSelectedStudentId(row.student_id || "");
    setSelectedFinanceRecordId(recordKey(row) || "");
    setPaymentForm({
      tuition_paid: toBoolean(row.tuition_paid),
      payment_receipt_number: row.payment_receipt_number || "",
      payment_receipt_date: row.payment_receipt_date ? String(row.payment_receipt_date).slice(0, 10) : "",
      notes: "",
    });
    setStudentFinance(null);

    if (row.student_id) {
      try {
        const response = await api.get(`/finance/students/${row.student_id}`);
        setStudentFinance(response.data);
      } catch (requestError) {
        flash(extractApiMessage(requestError), "danger");
      }
    }
  }

  async function loadStudentFinanceById(event) {
    event?.preventDefault?.();
    if (!selectedStudentId) return flash("Please enter or select a student ID.", "danger");

    setBusy(true);
    try {
      const response = await api.get(`/finance/students/${selectedStudentId}`);
      setStudentFinance(response.data);
      const firstRecord = response.data.finance_records?.[0];
      if (firstRecord) {
        setSelectedFinanceRecordId(firstRecord.record_id);
        setPaymentForm({
          tuition_paid: toBoolean(firstRecord.tuition_paid),
          payment_receipt_number: firstRecord.payment_receipt_number || "",
          payment_receipt_date: firstRecord.payment_receipt_date ? String(firstRecord.payment_receipt_date).slice(0, 10) : "",
          notes: "",
        });
      }
      setActiveTab("receipts");
    } catch (requestError) {
      flash(extractApiMessage(requestError), "danger");
    } finally {
      setBusy(false);
    }
  }

  function chooseFinanceRecord(record) {
    setSelectedFinanceRecordId(record.record_id);
    setPaymentForm({
      tuition_paid: toBoolean(record.tuition_paid),
      payment_receipt_number: record.payment_receipt_number || "",
      payment_receipt_date: record.payment_receipt_date ? String(record.payment_receipt_date).slice(0, 10) : "",
      notes: "",
    });
  }

  async function updatePaymentStatus(event) {
    event.preventDefault();
    if (!canUpdatePayments) return flash("You do not have permission to update tuition payment status.", "danger");
    if (!selectedFinanceRecordId) return flash("Please select a student academic record first.", "danger");
    if (paymentForm.tuition_paid && (!paymentForm.payment_receipt_number || !paymentForm.payment_receipt_date)) {
      return flash("Receipt number and receipt date are required when confirming payment.", "danger");
    }

    setBusy(true);
    try {
      const body = {
        tuition_paid: toBoolean(paymentForm.tuition_paid),
        payment_receipt_number: paymentForm.tuition_paid ? paymentForm.payment_receipt_number : null,
        payment_receipt_date: paymentForm.tuition_paid ? paymentForm.payment_receipt_date : null,
        notes: paymentForm.notes || null,
      };
      await api.patch(`/finance/student-academic-records/${selectedFinanceRecordId}/tuition-status`, body);
      await loadFinanceData();
      if (selectedStudentId) {
        const response = await api.get(`/finance/students/${selectedStudentId}`);
        setStudentFinance(response.data);
      }
      flash("Student tuition payment status updated successfully.");
    } catch (requestError) {
      flash(extractApiMessage(requestError), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function markNotificationAsRead(notificationId) {
    try {
      await api.patch(`/notifications/${notificationId}/read`, { is_read: true });
      await loadNotifications();
    } catch (requestError) {
      flash(extractApiMessage(requestError), "danger");
    }
  }

  async function markAllNotificationsRead() {
    try {
      await api.patch("/notifications/read-all");
      await loadNotifications();
      flash("Notifications marked as read.");
    } catch (requestError) {
      flash(extractApiMessage(requestError), "danger");
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.new_password_confirmation) {
      return flash("Please complete all password fields.", "danger");
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      return flash("Password confirmation does not match.", "danger");
    }

    setBusy(true);
    try {
      await api.post("/account/change-my-password", passwordForm);
      setPasswordForm(emptyPasswordForm);
      flash("Password changed successfully.");
    } catch (requestError) {
      flash(extractApiMessage(requestError), "danger");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="fdp-page">
        <style>{styles}</style>
        <div className="fdp-loader-card">
          <div className="fdp-spinner" />
          <h2>Loading finance department workspace</h2>
          <p>Preparing tuition fees, student payment status, and receipt confirmation tools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fdp-page">
      <style>{styles}</style>

      <header className="fdp-header">
        <div className="fdp-header-left">
          <div className="fdp-logo">FD</div>
          <div>
            <span className="fdp-kicker">University Finance Department</span>
            <h1>Finance Department Portal</h1>
            <p>Manage annual tuition fees, payment confirmation, receipts, and student financial status.</p>
          </div>
        </div>
        <div className="fdp-header-actions">
          <button className="fdp-btn ghost" onClick={boot}>Refresh</button>
          <button className="fdp-btn ghost" onClick={logout}>Logout</button>
        </div>
      </header>

      {success && <div className="fdp-alert success">{success}</div>}
      {error && <div className="fdp-alert danger">{error}</div>}
      {lookupError && <div className="fdp-warning-box">Lookup warning: {lookupError}. Apply the backend finance lookup permission patch if programs, academic years, or study years are empty.</div>}

      <section className="fdp-hero-grid">
        <div className="fdp-profile-card">
          <div className="fdp-avatar">{initials(user?.full_name)}</div>
          <div>
            <span>Signed in as</span>
            <h2>{formatValue(user?.full_name)}</h2>
            <p>{formatValue(user?.email)}</p>
            <small>{getEmployeeDepartment(user)}</small>
          </div>
        </div>
        <Metric label="Student Records" value={stats.totalRows} note="Financial academic records" />
        <Metric label="Paid" value={stats.paid} note="Confirmed payments" />
        <Metric label="Pending" value={stats.unpaid} note="Not paid or incomplete" />
        <Metric label="Fee Rules" value={stats.feeDefinitions} note={`${stats.activeFees} active`} />
        <Metric label="Expected Fees" value={money(stats.totalAmount)} note="From listed records" />
      </section>

      <nav className="fdp-tabs">
        {tabs.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <Overview
          permissions={permissions}
          tuitionFees={tuitionFees}
          financialRows={financialRows}
          stats={stats}
          onSelectRow={(row) => {
            selectFinancialRow(row);
            setActiveTab("receipts");
          }}
        />
      )}

      {activeTab === "fees" && (
        <FeesTab
          feeForm={feeForm}
          setFeeForm={setFeeForm}
          programs={programs}
          academicYears={academicYears}
          studyYears={studyYears}
          tuitionFees={tuitionFees}
          saveFee={saveFee}
          editFee={editFee}
          busy={busy}
          canSetFees={canSetFees}
        />
      )}

      {activeTab === "students" && (
        <StudentsTab
          rows={filteredRows}
          rawRows={financialRows}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          academicYearFilter={academicYearFilter}
          setAcademicYearFilter={setAcademicYearFilter}
          yearNames={yearNames}
          selectedFinancialRow={selectedFinancialRow}
          selectFinancialRow={selectFinancialRow}
          goToReceipts={() => setActiveTab("receipts")}
        />
      )}

      {activeTab === "receipts" && (
        <ReceiptsTab
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
          loadStudentFinanceById={loadStudentFinanceById}
          selectedFinancialRow={selectedFinancialRow}
          studentFinance={studentFinance}
          selectedFinanceRecordId={selectedFinanceRecordId}
          chooseFinanceRecord={chooseFinanceRecord}
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          updatePaymentStatus={updatePaymentStatus}
          busy={busy}
          canUpdatePayments={canUpdatePayments}
        />
      )}

      {activeTab === "notifications" && (
        <NotificationsTab
          notifications={notifications}
          markNotificationAsRead={markNotificationAsRead}
          markAllNotificationsRead={markAllNotificationsRead}
        />
      )}

      {activeTab === "account" && (
        <AccountTab
          user={user}
          permissions={permissions}
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          changePassword={changePassword}
          busy={busy}
        />
      )}
    </div>
  );
}

function Metric({ label, value, note }) {
  return (
    <div className="fdp-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}

function Overview({ permissions, tuitionFees, financialRows, stats, onSelectRow }) {
  const latestPending = financialRows.filter((row) => !toBoolean(row.tuition_paid)).slice(0, 8);

  return (
    <div className="fdp-content-grid">
      <div className="fdp-card">
        <div className="fdp-card-title-row">
          <div>
            <span className="fdp-section-kicker">Scope</span>
            <h2>Finance responsibilities</h2>
          </div>
        </div>
        <div className="fdp-scope-list">
          <div className="fdp-scope-item">
            <strong>Annual tuition setup</strong>
            <p>Define tuition amount per program, academic year, and study year.</p>
          </div>
          <div className="fdp-scope-item">
            <strong>Payment confirmation</strong>
            <p>Confirm whether tuition is paid, and register receipt number and date.</p>
          </div>
          <div className="fdp-scope-item">
            <strong>Registration impact</strong>
            <p>The backend updates registration status according to tuition status and student registration activity.</p>
          </div>
        </div>
      </div>

      <div className="fdp-card">
        <div className="fdp-card-title-row">
          <div>
            <span className="fdp-section-kicker">Permissions</span>
            <h2>Available finance permissions</h2>
          </div>
        </div>
        <div className="fdp-pill-list">
          {financePermissions.map((permission) => (
            <span key={permission} className={`fdp-permission-pill ${permissions.includes(permission) ? "enabled" : "disabled"}`}>
              {permission}
            </span>
          ))}
        </div>
      </div>

      <div className="fdp-card wide-card">
        <div className="fdp-card-title-row">
          <div>
            <span className="fdp-section-kicker">Payment risk</span>
            <h2>Pending tuition confirmations</h2>
          </div>
          <span className="fdp-total-chip">{stats.unpaid} pending</span>
        </div>
        {latestPending.length === 0 ? (
          <EmptyState title="No pending payments" text="All listed student academic records are marked as paid." />
        ) : (
          <div className="fdp-table-wrap">
            <table className="fdp-table compact-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Program</th>
                  <th>Academic Year</th>
                  <th>Study Year</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {latestPending.map((row) => (
                  <tr key={recordKey(row)}>
                    <td><strong>{studentLabel(row)}</strong><small>{studentNumber(row)}</small></td>
                    <td>{formatValue(row.program)}</td>
                    <td>{formatValue(row.academic_year)}</td>
                    <td>{formatValue(row.study_year)}</td>
                    <td>{money(row.tuition_amount)}</td>
                    <td><StatusBadge value={row.tuition_paid ? "Paid" : "Pending"} /></td>
                    <td><button className="fdp-btn small primary" onClick={() => onSelectRow(row)}>Confirm</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="fdp-card wide-card">
        <div className="fdp-card-title-row">
          <div>
            <span className="fdp-section-kicker">Current fee definitions</span>
            <h2>Recently configured tuition fees</h2>
          </div>
        </div>
        <FeeTable tuitionFees={tuitionFees.slice(0, 8)} compact />
      </div>
    </div>
  );
}

function FeesTab({ feeForm, setFeeForm, programs, academicYears, studyYears, tuitionFees, saveFee, editFee, busy, canSetFees }) {
  return (
    <div className="fdp-content-grid fees-grid">
      <div className="fdp-card">
        <div className="fdp-card-title-row">
          <div>
            <span className="fdp-section-kicker">Annual fees</span>
            <h2>Create or update tuition fee</h2>
          </div>
        </div>
        {!canSetFees && <ErrorNote message="Your account does not have set annual tuition fees permission." />}
        <form className="fdp-form single" onSubmit={saveFee}>
          <SelectField label="Program" value={feeForm.program_id} onChange={(value) => setFeeForm((prev) => ({ ...prev, program_id: value }))} options={programs} />
          <SelectField label="Academic Year" value={feeForm.academic_year_id} onChange={(value) => setFeeForm((prev) => ({ ...prev, academic_year_id: value }))} options={academicYears} />
          <SelectField label="Study Year" value={feeForm.study_year_id} onChange={(value) => setFeeForm((prev) => ({ ...prev, study_year_id: value }))} options={studyYears} />
          <TextField label="Amount" type="number" value={feeForm.amount} onChange={(value) => setFeeForm((prev) => ({ ...prev, amount: value }))} placeholder="Example: 500" />
          <CheckField label="Active tuition fee" checked={toBoolean(feeForm.is_active)} onChange={(value) => setFeeForm((prev) => ({ ...prev, is_active: value }))} />
          <TextAreaField label="Notes" value={feeForm.notes} onChange={(value) => setFeeForm((prev) => ({ ...prev, notes: value }))} placeholder="Internal finance notes" />
          <div className="fdp-form-footer full">
            <span>Same program + academic year + study year will be updated automatically by the backend.</span>
            <div className="fdp-action-row">
              <button type="button" className="fdp-btn" onClick={() => setFeeForm(emptyFeeForm)}>Reset</button>
              <button type="submit" className="fdp-btn primary" disabled={busy || !canSetFees}>{busy ? "Saving..." : "Save Tuition Fee"}</button>
            </div>
          </div>
        </form>
      </div>

      <div className="fdp-card">
        <div className="fdp-card-title-row">
          <div>
            <span className="fdp-section-kicker">Fee rules</span>
            <h2>Configured tuition fees</h2>
          </div>
        </div>
        <FeeTable tuitionFees={tuitionFees} onEdit={editFee} />
      </div>
    </div>
  );
}

function FeeTable({ tuitionFees, onEdit, compact = false }) {
  if (!tuitionFees || tuitionFees.length === 0) {
    return <EmptyState title="No tuition fees" text="No annual tuition fee has been configured yet." />;
  }

  return (
    <div className="fdp-table-wrap compact-height">
      <table className={`fdp-table ${compact ? "compact-table" : ""}`}>
        <thead>
          <tr>
            <th>Program</th>
            <th>Academic Year</th>
            <th>Study Year</th>
            <th>Amount</th>
            <th>Active</th>
            {!compact && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {tuitionFees.map((fee) => (
            <tr key={fee.id || `${fee.program_id}-${fee.academic_year_id}-${fee.study_year_id}`}>
              <td>{fee.program?.name || fee.program_name || fee.program || formatValue(fee.program_id)}</td>
              <td>{fee.academic_year?.name || fee.academicYear?.name || fee.academic_year || formatValue(fee.academic_year_id)}</td>
              <td>{fee.study_year?.name || fee.studyYear?.name || fee.study_year || formatValue(fee.study_year_id)}</td>
              <td><strong>{money(fee.amount)}</strong></td>
              <td><StatusBadge value={fee.is_active !== false ? "Active" : "Inactive"} /></td>
              {!compact && <td><button className="fdp-btn small" onClick={() => onEdit(fee)}>Edit</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentsTab({ rows, rawRows, searchTerm, setSearchTerm, paymentFilter, setPaymentFilter, academicYearFilter, setAcademicYearFilter, yearNames, selectedFinancialRow, selectFinancialRow, goToReceipts }) {
  return (
    <div className="fdp-card wide-card">
      <div className="fdp-card-title-row">
        <div>
          <span className="fdp-section-kicker">Student financial status</span>
          <h2>Payment tracking</h2>
        </div>
        <span className="fdp-total-chip">{rows.length} / {rawRows.length} records</span>
      </div>

      <div className="fdp-filter-row">
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by student name, number, program, year, receipt..." />
        <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
          <option value="all">All payments</option>
          <option value="paid">Paid only</option>
          <option value="unpaid">Pending only</option>
        </select>
        <select value={academicYearFilter} onChange={(event) => setAcademicYearFilter(event.target.value)}>
          <option value="all">All academic years</option>
          {yearNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No matching records" text="Change filters or refresh the finance data." />
      ) : (
        <div className="fdp-table-wrap compact-height">
          <table className="fdp-table compact-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Program</th>
                <th>Academic Year</th>
                <th>Study Year</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Receipt</th>
                <th>Registration</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={recordKey(row)} className={recordKey(selectedFinancialRow) === recordKey(row) ? "selected" : ""}>
                  <td><strong>{studentLabel(row)}</strong><small>{studentNumber(row)}</small></td>
                  <td>{formatValue(row.program)}</td>
                  <td>{formatValue(row.academic_year)}</td>
                  <td>{formatValue(row.study_year)}</td>
                  <td>{money(row.tuition_amount)}</td>
                  <td><StatusBadge value={row.tuition_paid ? "Paid" : "Pending"} /></td>
                  <td>{formatValue(row.payment_receipt_number)}<small>{formatDate(row.payment_receipt_date)}</small></td>
                  <td><StatusBadge value={row.registration_status} /></td>
                  <td>
                    <div className="fdp-action-row">
                      <button className="fdp-btn small" onClick={() => selectFinancialRow(row)}>Details</button>
                      <button className="fdp-btn small primary" onClick={() => { selectFinancialRow(row); goToReceipts(); }}>Receipt</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReceiptsTab({ selectedStudentId, setSelectedStudentId, loadStudentFinanceById, selectedFinancialRow, studentFinance, selectedFinanceRecordId, chooseFinanceRecord, paymentForm, setPaymentForm, updatePaymentStatus, busy, canUpdatePayments }) {
  const records = studentFinance?.finance_records || [];
  const selectedRecord = records.find((record) => String(record.record_id) === String(selectedFinanceRecordId));

  return (
    <div className="fdp-content-grid receipts-grid">
      <div className="fdp-card">
        <div className="fdp-card-title-row">
          <div>
            <span className="fdp-section-kicker">Lookup</span>
            <h2>Student finance details</h2>
          </div>
        </div>
        <form className="fdp-form single" onSubmit={loadStudentFinanceById}>
          <TextField label="Student ID" value={selectedStudentId} onChange={setSelectedStudentId} placeholder="Backend student ID" />
          <button className="fdp-btn primary" disabled={busy}>{busy ? "Loading..." : "Load Student Finance"}</button>
        </form>

        {selectedFinancialRow && (
          <div className="fdp-mini-panel">
            <h3>Selected from list</h3>
            <InfoItem label="Student" value={studentLabel(selectedFinancialRow)} />
            <InfoItem label="Student Number" value={studentNumber(selectedFinancialRow)} />
            <InfoItem label="Academic Year" value={selectedFinancialRow.academic_year} />
            <InfoItem label="Study Year" value={selectedFinancialRow.study_year} />
            <InfoItem label="Tuition Amount" value={money(selectedFinancialRow.tuition_amount)} />
            <InfoItem label="Payment" value={selectedFinancialRow.tuition_paid ? "Paid" : "Pending"} />
          </div>
        )}
      </div>

      <div className="fdp-card">
        <div className="fdp-card-title-row">
          <div>
            <span className="fdp-section-kicker">Payment confirmation</span>
            <h2>Confirm receipt and update status</h2>
          </div>
        </div>
        {!canUpdatePayments && <ErrorNote message="Your account does not have update tuition payment status permission." />}
        {!studentFinance && !selectedFinancialRow && <EmptyState title="No student selected" text="Select a row from Student Payments or enter a student ID." />}

        {studentFinance && (
          <div className="fdp-student-box">
            <div className="fdp-student-header">
              <div>
                <span className="fdp-section-kicker">Student</span>
                <h2>{formatValue(studentFinance.student?.student_number)}</h2>
                <p>{formatValue(studentFinance.student?.program_name)} {studentFinance.student?.specialization_name ? `- ${studentFinance.student.specialization_name}` : ""}</p>
              </div>
              <StatusBadge value={studentFinance.student?.is_active_registration ? "Active registration" : "Stopped registration"} />
            </div>

            {records.length === 0 ? (
              <EmptyState title="No finance records" text="This student has no academic finance records in the current response." />
            ) : (
              <div className="fdp-record-list">
                {records.map((record) => (
                  <button key={record.record_id} className={`fdp-record-card ${String(selectedFinanceRecordId) === String(record.record_id) ? "active" : ""}`} onClick={() => chooseFinanceRecord(record)}>
                    <strong>{formatValue(record.academic_year)} - {formatValue(record.study_year)}</strong>
                    <span>{money(record.tuition_fee?.amount)} | {record.tuition_paid ? "Paid" : "Pending"}</span>
                    <small>Receipt: {formatValue(record.payment_receipt_number)} | {formatDate(record.payment_receipt_date)}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(selectedFinanceRecordId || selectedFinancialRow) && (
          <form className="fdp-form single receipt-form" onSubmit={updatePaymentStatus}>
            {selectedRecord && (
              <div className="fdp-info-grid compact">
                <InfoItem label="Selected Record" value={`#${selectedRecord.record_id}`} />
                <InfoItem label="Registration Status" value={selectedRecord.registration_status} />
                <InfoItem label="Current Amount" value={money(selectedRecord.tuition_fee?.amount)} />
                <InfoItem label="Current Payment" value={selectedRecord.tuition_paid ? "Paid" : "Pending"} />
              </div>
            )}
            <label className="fdp-field">
              <span>Payment Status</span>
              <select value={String(paymentForm.tuition_paid)} onChange={(event) => setPaymentForm((prev) => ({ ...prev, tuition_paid: event.target.value === "true" }))}>
                <option value="true">Paid - Confirm receipt</option>
                <option value="false">Not paid / Pending</option>
              </select>
            </label>
            <TextField label="Receipt Number" value={paymentForm.payment_receipt_number} onChange={(value) => setPaymentForm((prev) => ({ ...prev, payment_receipt_number: value }))} placeholder="REC-001" disabled={!paymentForm.tuition_paid} />
            <TextField label="Receipt Date" type="date" value={paymentForm.payment_receipt_date} onChange={(value) => setPaymentForm((prev) => ({ ...prev, payment_receipt_date: value }))} disabled={!paymentForm.tuition_paid} />
            <TextAreaField label="Finance Notes" value={paymentForm.notes} onChange={(value) => setPaymentForm((prev) => ({ ...prev, notes: value }))} placeholder="Optional internal notes" />
            <div className="fdp-warning-box">
              When tuition is confirmed as paid, the backend requires receipt number and date, then updates the student's registration status and sends an automatic notification.
            </div>
            <div className="fdp-form-footer full">
              <span>Selected academic record ID: {formatValue(selectedFinanceRecordId)}</span>
              <button className="fdp-btn primary" disabled={busy || !canUpdatePayments}>{busy ? "Updating..." : "Update Tuition Status"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function NotificationsTab({ notifications, markNotificationAsRead, markAllNotificationsRead }) {
  return (
    <div className="fdp-card wide-card">
      <div className="fdp-card-title-row">
        <div>
          <span className="fdp-section-kicker">Notifications</span>
          <h2>My notifications</h2>
        </div>
        <button className="fdp-btn" onClick={markAllNotificationsRead}>Mark all as read</button>
      </div>
      {notifications.length === 0 ? (
        <EmptyState title="No notifications" text="There are no notifications for this account yet." />
      ) : (
        <div className="fdp-notification-list">
          {notifications.map((notification) => (
            <div key={notification.id} className="fdp-notification">
              <div>
                <strong>{formatValue(notification.title)}</strong>
                <p>{formatValue(notification.message)}</p>
                <small>{formatDate(notification.created_at)}</small>
              </div>
              <div>
                <StatusBadge value={notification.is_read ? "Read" : "Unread"} />
                {!notification.is_read && <button className="fdp-btn small" onClick={() => markNotificationAsRead(notification.id)}>Read</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountTab({ user, permissions, passwordForm, setPasswordForm, changePassword, busy }) {
  return (
    <div className="fdp-content-grid account-grid">
      <div className="fdp-card">
        <div className="fdp-card-title-row">
          <div>
            <span className="fdp-section-kicker">Profile</span>
            <h2>Account information</h2>
          </div>
        </div>
        <div className="fdp-info-grid compact">
          <InfoItem label="Full Name" value={user?.full_name} />
          <InfoItem label="Email" value={user?.email} />
          <InfoItem label="Type" value={user?.type} />
          <InfoItem label="Department" value={getEmployeeDepartment(user)} />
          <InfoItem label="Job Title" value={user?.employee?.job_title} />
          <InfoItem label="Employee Active" value={user?.employee?.is_active} />
        </div>
        <h3 className="fdp-mini-title">Permissions</h3>
        <div className="fdp-pill-list">
          {permissions.length === 0 ? <span className="fdp-permission-pill disabled">No permissions returned</span> : permissions.map((permission) => <span key={permission} className="fdp-permission-pill enabled">{permission}</span>)}
        </div>
      </div>

      <div className="fdp-card">
        <div className="fdp-card-title-row">
          <div>
            <span className="fdp-section-kicker">Security</span>
            <h2>Change password</h2>
          </div>
        </div>
        <form className="fdp-form single" onSubmit={changePassword}>
          <TextField label="Current Password" type="password" value={passwordForm.current_password} onChange={(value) => setPasswordForm((prev) => ({ ...prev, current_password: value }))} />
          <TextField label="New Password" type="password" value={passwordForm.new_password} onChange={(value) => setPasswordForm((prev) => ({ ...prev, new_password: value }))} />
          <TextField label="Confirm New Password" type="password" value={passwordForm.new_password_confirmation} onChange={(value) => setPasswordForm((prev) => ({ ...prev, new_password_confirmation: value }))} />
          <button className="fdp-btn primary" disabled={busy}>{busy ? "Updating..." : "Change Password"}</button>
        </form>
      </div>
    </div>
  );
}

const styles = `
:root {
  --fdp-main: #2980b9;
  --fdp-main-dark: #1f6694;
  --fdp-main-soft: rgba(41, 128, 185, 0.12);
  --fdp-bg: #f5f8fb;
  --fdp-card: #ffffff;
  --fdp-text: #172033;
  --fdp-muted: #64748b;
  --fdp-border: #e2e8f0;
  --fdp-danger: #dc2626;
  --fdp-success: #16a34a;
  --fdp-warning: #d97706;
}

.fdp-page {
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(41, 128, 185, 0.18), transparent 32%), var(--fdp-bg);
  padding: 28px;
  color: var(--fdp-text);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.fdp-header {
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

.fdp-header-left { display: flex; align-items: center; gap: 18px; }
.fdp-logo { width: 64px; height: 64px; border-radius: 22px; background: rgba(255,255,255,.15); display: grid; place-items: center; font-weight: 900; font-size: 24px; }
.fdp-kicker, .fdp-section-kicker { text-transform: uppercase; letter-spacing: .08em; font-size: 12px; font-weight: 800; color: #8ec8ee; }
.fdp-section-kicker { color: var(--fdp-main); }
.fdp-header h1 { margin: 4px 0 6px; font-size: 34px; }
.fdp-header p { margin: 0; color: rgba(255,255,255,.82); }
.fdp-header-actions { display: flex; gap: 10px; flex-wrap: wrap; }

.fdp-alert, .fdp-warning-box, .fdp-error-note { border-radius: 18px; padding: 14px 16px; margin: 16px 0 0; }
.fdp-alert.success { background: #dcfce7; color: #166534; }
.fdp-alert.danger, .fdp-error-note { background: #fee2e2; color: #991b1b; }
.fdp-warning-box { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; }

.fdp-hero-grid { display: grid; grid-template-columns: 1.5fr repeat(5, 1fr); gap: 16px; margin: 22px 0; }
.fdp-profile-card, .fdp-metric-card, .fdp-card, .fdp-loader-card { background: var(--fdp-card); border: 1px solid var(--fdp-border); border-radius: 24px; box-shadow: 0 14px 34px rgba(15, 23, 42, .08); }
.fdp-profile-card { padding: 18px; display: flex; align-items: center; gap: 16px; }
.fdp-avatar { width: 58px; height: 58px; border-radius: 20px; background: var(--fdp-main-soft); color: var(--fdp-main-dark); display: grid; place-items: center; font-size: 22px; font-weight: 900; }
.fdp-profile-card h2 { margin: 3px 0; font-size: 20px; }
.fdp-profile-card p, .fdp-profile-card small, .fdp-profile-card span { display: block; margin: 0; color: var(--fdp-muted); }
.fdp-metric-card { padding: 18px; }
.fdp-metric-card span { color: var(--fdp-muted); font-size: 13px; font-weight: 700; }
.fdp-metric-card strong { display: block; font-size: 28px; margin: 8px 0 5px; word-break: break-word; }
.fdp-metric-card p { margin: 0; color: var(--fdp-muted); font-size: 13px; }

.fdp-tabs { display: flex; gap: 10px; flex-wrap: wrap; margin: 16px 0 22px; }
.fdp-tabs button { border: 1px solid var(--fdp-border); background: #fff; color: var(--fdp-muted); padding: 12px 16px; border-radius: 999px; cursor: pointer; font-weight: 800; }
.fdp-tabs button.active { background: var(--fdp-main); border-color: var(--fdp-main); color: white; box-shadow: 0 10px 24px rgba(41,128,185,.28); }

.fdp-content-grid { display: grid; grid-template-columns: minmax(320px, .9fr) minmax(520px, 1.5fr); gap: 18px; align-items: start; }
.fdp-content-grid.fees-grid, .fdp-content-grid.receipts-grid, .fdp-content-grid.account-grid { grid-template-columns: minmax(340px, .7fr) minmax(620px, 1.4fr); }
.fdp-card { padding: 20px; }
.fdp-card.wide-card { grid-column: 1 / -1; }
.fdp-card-title-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 16px; }
.fdp-card h2 { margin: 2px 0 0; font-size: 21px; }
.fdp-total-chip { background: var(--fdp-main-soft); color: var(--fdp-main-dark); border-radius: 999px; padding: 8px 12px; font-weight: 900; font-size: 13px; }

.fdp-btn { border: 0; border-radius: 14px; padding: 11px 16px; cursor: pointer; font-weight: 900; background: #eef2f7; color: var(--fdp-text); transition: .18s ease; }
.fdp-btn:hover { transform: translateY(-1px); }
.fdp-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
.fdp-btn.primary { background: var(--fdp-main); color: white; }
.fdp-btn.ghost { background: rgba(255,255,255,.14); color: inherit; border: 1px solid rgba(255,255,255,.26); }
.fdp-btn.small { padding: 8px 11px; border-radius: 11px; font-size: 12px; }
.fdp-action-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.fdp-scope-list { display: grid; gap: 12px; }
.fdp-scope-item { padding: 16px; background: #f8fafc; border: 1px solid var(--fdp-border); border-radius: 18px; }
.fdp-scope-item p { margin: 6px 0 0; color: var(--fdp-muted); line-height: 1.5; }

.fdp-pill-list { display: flex; flex-wrap: wrap; gap: 8px; }
.fdp-permission-pill { padding: 8px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; }
.fdp-permission-pill.enabled { background: #dcfce7; color: #166534; }
.fdp-permission-pill.disabled { background: #f1f5f9; color: #94a3b8; }

.fdp-filter-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.fdp-filter-row input, .fdp-filter-row select { flex: 1; min-width: 170px; border: 1px solid var(--fdp-border); border-radius: 14px; padding: 12px; background: #fff; }

.fdp-table-wrap { width: 100%; overflow: auto; border: 1px solid var(--fdp-border); border-radius: 18px; }
.fdp-table-wrap.compact-height { max-height: 680px; }
.fdp-table { width: 100%; border-collapse: collapse; background: #fff; }
.fdp-table th, .fdp-table td { text-align: left; border-bottom: 1px solid var(--fdp-border); padding: 12px; vertical-align: top; }
.fdp-table th { background: #f8fafc; color: var(--fdp-muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
.fdp-table tr:last-child td { border-bottom: 0; }
.fdp-table tr.selected td { background: var(--fdp-main-soft); }
.fdp-table small { display: block; color: var(--fdp-muted); margin-top: 4px; }
.fdp-table.compact-table th, .fdp-table.compact-table td { padding: 10px; font-size: 13px; }

.fdp-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.fdp-form.single { grid-template-columns: 1fr; }
.fdp-field { display: flex; flex-direction: column; gap: 7px; }
.fdp-field.wide, .fdp-form-footer.full { grid-column: 1 / -1; }
.fdp-field span, .fdp-check-field span { color: var(--fdp-muted); font-size: 13px; font-weight: 800; }
.fdp-field input, .fdp-field select, .fdp-field textarea { border: 1px solid var(--fdp-border); border-radius: 14px; padding: 12px; background: #fff; font: inherit; outline: none; }
.fdp-field input:focus, .fdp-field select:focus, .fdp-field textarea:focus { border-color: var(--fdp-main); box-shadow: 0 0 0 4px var(--fdp-main-soft); }
.fdp-check-field { display: flex; align-items: center; gap: 10px; padding: 12px; background: #f8fafc; border: 1px solid var(--fdp-border); border-radius: 14px; }
.fdp-check-field input { width: 18px; height: 18px; }
.fdp-form-footer { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.fdp-form-footer span { color: var(--fdp-muted); font-size: 13px; }
.receipt-form { margin-top: 18px; }

.fdp-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 18px; }
.fdp-info-grid.compact { grid-template-columns: repeat(2, 1fr); }
.fdp-info-item { background: #f8fafc; border: 1px solid var(--fdp-border); border-radius: 16px; padding: 12px; }
.fdp-info-item.wide { grid-column: 1 / -1; }
.fdp-info-item span { display: block; color: var(--fdp-muted); font-size: 12px; margin-bottom: 5px; font-weight: 800; }
.fdp-info-item strong { font-size: 14px; }

.fdp-mini-panel { margin-top: 16px; display: grid; gap: 10px; }
.fdp-mini-panel h3, .fdp-mini-title { margin: 14px 0 4px; font-size: 16px; }
.fdp-student-header { display: flex; justify-content: space-between; gap: 14px; align-items: start; border-bottom: 1px solid var(--fdp-border); padding-bottom: 16px; margin-bottom: 16px; }
.fdp-student-header h2 { margin: 3px 0; font-size: 24px; }
.fdp-student-header p { margin: 0; color: var(--fdp-muted); }
.fdp-record-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.fdp-record-card { text-align: left; border: 1px solid var(--fdp-border); border-radius: 16px; padding: 14px; background: #fff; cursor: pointer; }
.fdp-record-card.active { border-color: var(--fdp-main); box-shadow: 0 0 0 4px var(--fdp-main-soft); }
.fdp-record-card span, .fdp-record-card small { display: block; margin-top: 6px; color: var(--fdp-muted); }

.fdp-badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 900; }
.fdp-badge.success { background: #dcfce7; color: #166534; }
.fdp-badge.danger { background: #fee2e2; color: #991b1b; }
.fdp-badge.warning { background: #fef3c7; color: #92400e; }
.fdp-badge.neutral { background: #f1f5f9; color: #475569; }

.fdp-empty { text-align: center; padding: 26px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 18px; }
.fdp-empty-icon { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: var(--fdp-main-soft); color: var(--fdp-main-dark); margin: 0 auto 10px; font-weight: 900; }
.fdp-empty h3 { margin: 0 0 6px; }
.fdp-empty p { margin: 0; color: var(--fdp-muted); }

.fdp-notification-list { display: grid; gap: 12px; }
.fdp-notification { display: flex; justify-content: space-between; gap: 14px; border: 1px solid var(--fdp-border); border-radius: 16px; padding: 14px; background: #fff; }
.fdp-notification p { margin: 6px 0; color: var(--fdp-muted); }
.fdp-notification small { color: var(--fdp-muted); }

.fdp-loader-card { max-width: 520px; margin: 12vh auto; padding: 34px; text-align: center; }
.fdp-loader-card p { color: var(--fdp-muted); }
.fdp-spinner { width: 44px; height: 44px; border-radius: 50%; border: 4px solid #e2e8f0; border-top-color: var(--fdp-main); margin: 0 auto 18px; animation: fdp-spin .9s linear infinite; }
@keyframes fdp-spin { to { transform: rotate(360deg); } }

@media (max-width: 1280px) {
  .fdp-hero-grid { grid-template-columns: repeat(3, 1fr); }
  .fdp-profile-card { grid-column: 1 / -1; }
  .fdp-content-grid, .fdp-content-grid.fees-grid, .fdp-content-grid.receipts-grid, .fdp-content-grid.account-grid { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
  .fdp-page { padding: 16px; }
  .fdp-header, .fdp-header-left, .fdp-header-actions, .fdp-card-title-row, .fdp-form-footer, .fdp-notification, .fdp-student-header { flex-direction: column; align-items: flex-start; }
  .fdp-hero-grid, .fdp-info-grid, .fdp-info-grid.compact, .fdp-form, .fdp-record-list { grid-template-columns: 1fr; }
  .fdp-header h1 { font-size: 25px; }
  .fdp-btn, .fdp-header-actions, .fdp-header-actions .fdp-btn { width: 100%; }
}
`;
