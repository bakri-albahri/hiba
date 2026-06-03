import { useEffect, useMemo, useState } from 'react';
import api from '../../Api/axios';

const TABS = [
  { key: 'all', label: 'All Logs', icon: 'fa-solid fa-list-check' },
  { key: 'workflow', label: 'Academic Workflow', icon: 'fa-solid fa-graduation-cap' },
  { key: 'mine', label: 'My Logs', icon: 'fa-solid fa-user-clock' },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const CATEGORY_FILTERS = [
  { key: '', label: 'All Categories' },
  { key: 'academic', label: 'Academic Workflow' },
  { key: 'grades', label: 'Grades' },
  { key: 'objections', label: 'Grade Objections' },
  { key: 'supplementary', label: 'Supplementary Exams' },
  { key: 'year_closing', label: 'Year Closing' },
  { key: 'students', label: 'Students / Enrollments' },
  { key: 'finance', label: 'Finance' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'security', label: 'Security' },
];

const ACADEMIC_WORKFLOW_KEYWORDS = [
  'grade',
  'mark',
  'objection',
  'doctor response',
  'final decision',
  'supplementary',
  'academic year',
  'year closing',
  'close academic year',
  'promotion',
  'promoted',
  'conditionally',
  'failed course',
  'auto enroll',
  'auto-enroll',
  'enrollment',
  'student_course',
  'student course',
  'attendance',
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

function dateTime(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  } catch (_) {
    return String(value);
  }
}

function normalizeText(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .trim();
}

function actionType(log) {
  const value = getRawLogText(log).toLowerCase();

  if (
    value.includes('deleted') ||
    value.includes('delete') ||
    value.includes('failed') ||
    value.includes('rejected') ||
    value.includes('exhausted') ||
    value.includes('blocked')
  ) {
    return 'bad';
  }

  if (
    value.includes('updated') ||
    value.includes('update') ||
    value.includes('changed') ||
    value.includes('modified') ||
    value.includes('locked') ||
    value.includes('closed') ||
    value.includes('approved') ||
    value.includes('doctor_responded') ||
    value.includes('final_decision')
  ) {
    return 'warn';
  }

  if (
    value.includes('created') ||
    value.includes('create') ||
    value.includes('added') ||
    value.includes('submitted') ||
    value.includes('login') ||
    value.includes('auto-enrolled') ||
    value.includes('auto enrolled')
  ) {
    return 'good';
  }

  return 'muted';
}

function getRawLogText(log) {
  const values = [
    log?.action,
    log?.event,
    log?.description,
    log?.type,
    log?.log_name,
    log?.message,
    log?.entity_type,
    log?.subject_type,
    log?.model_type,
    log?.resource,
    log?.table_name,
    log?.ip_address,
    log?.user_agent,
    getEntity(log),
    getLogUser(log),
  ];

  const meta = getMeta(log);
  if (meta) values.push(meta);

  return values
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getLogCategory(log) {
  const value = getRawLogText(log);

  if (value.includes('supplementary')) return 'supplementary';
  if (value.includes('objection') || value.includes('doctor response') || value.includes('final decision')) return 'objections';
  if (value.includes('academic year') || value.includes('year closing') || value.includes('close academic year') || value.includes('promotion') || value.includes('promoted')) return 'year_closing';
  if (value.includes('grade') || value.includes('mark') || value.includes('studentcoursegrade') || value.includes('student_course_grade')) return 'grades';
  if (value.includes('student') || value.includes('enrollment') || value.includes('auto enroll') || value.includes('auto-enroll')) return 'students';
  if (value.includes('finance') || value.includes('tuition') || value.includes('payment') || value.includes('receipt')) return 'finance';
  if (value.includes('permission') || value.includes('role')) return 'permissions';
  if (value.includes('login') || value.includes('logout') || value.includes('password')) return 'security';

  return 'general';
}

function categoryLabel(category) {
  const found = CATEGORY_FILTERS.find((item) => item.key === category);
  if (found) return found.label;
  return category === 'general' ? 'General' : normalizeText(category);
}

function isAcademicWorkflowLog(log) {
  const value = getRawLogText(log);
  return ACADEMIC_WORKFLOW_KEYWORDS.some((keyword) => value.includes(keyword));
}

function getLogUser(log) {
  return (
    log?.user?.full_name ||
    log?.causer?.full_name ||
    log?.performed_by?.full_name ||
    log?.actor?.full_name ||
    log?.user_name ||
    log?.causer_name ||
    log?.performed_by_name ||
    log?.actor_name ||
    log?.user?.email ||
    log?.causer?.email ||
    'System'
  );
}

function getLogAction(log) {
  return (
    log?.action ||
    log?.event ||
    log?.description ||
    log?.type ||
    log?.log_name ||
    'activity'
  );
}

function getEntity(log) {
  const subject =
    log?.subject_type ||
    log?.model_type ||
    log?.entity_type ||
    log?.table_name ||
    log?.resource ||
    log?.subject ||
    log?.model ||
    '';

  const clean = typeof subject === 'string' ? subject.split('\\').pop() : '';
  const id = log?.subject_id || log?.model_id || log?.entity_id || log?.resource_id || '';

  if (clean && id) return `${clean} #${id}`;
  if (clean) return clean;
  if (id) return `Record #${id}`;
  return '—';
}

function getIp(log) {
  return log?.ip_address || log?.ip || log?.properties?.ip_address || log?.properties?.ip || '—';
}

function getMeta(log) {
  const meta =
    log?.properties ||
    log?.meta ||
    log?.changes ||
    log?.payload ||
    log?.data ||
    null;

  if (!meta) return null;
  if (typeof meta === 'string') return meta;

  try {
    return JSON.stringify(meta, null, 2);
  } catch (_) {
    return String(meta);
  }
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

export default function ActivityLogs() {
  const [activeTab, setActiveTab] = useState('all');
  const [logs, setLogs] = useState([]);
  const [myLogs, setMyLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filters, setFilters] = useState({
    search: '',
    action: '',
    category: '',
    user: '',
    entity: '',
    from: '',
    to: '',
  });

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filters, pageSize]);

  const sourceLogs = activeTab === 'mine' ? myLogs : logs;

  const filteredLogs = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const action = filters.action.trim().toLowerCase();
    const category = filters.category.trim().toLowerCase();
    const user = filters.user.trim().toLowerCase();
    const entity = filters.entity.trim().toLowerCase();
    const from = filters.from ? new Date(filters.from) : null;
    const to = filters.to ? new Date(filters.to) : null;

    return sourceLogs.filter((log) => {
      const created = new Date(log?.created_at || log?.updated_at || log?.timestamp || '');
      const logUser = getLogUser(log).toLowerCase();
      const logAction = String(getLogAction(log)).toLowerCase();
      const logEntity = getEntity(log).toLowerCase();
      const logCategory = getLogCategory(log);
      const haystack = getRawLogText(log);

      if (activeTab === 'workflow' && !isAcademicWorkflowLog(log)) return false;
      if (category && logCategory !== category) return false;
      if (search && !haystack.includes(search)) return false;
      if (action && !logAction.includes(action)) return false;
      if (user && !logUser.includes(user)) return false;
      if (entity && !logEntity.includes(entity)) return false;
      if (from && !Number.isNaN(created.getTime()) && created < from) return false;
      if (to && !Number.isNaN(created.getTime())) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }

      return true;
    });
  }, [sourceLogs, filters, activeTab]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  }, [filteredLogs.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedLogs = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize, totalPages]);

  const paginationStart = filteredLogs.length
    ? (Math.min(Math.max(currentPage, 1), totalPages) - 1) * pageSize + 1
    : 0;

  const paginationEnd = filteredLogs.length
    ? Math.min(paginationStart + pageSize - 1, filteredLogs.length)
    : 0;

  const metrics = useMemo(() => {
    const all = activeTab === 'mine' ? myLogs : activeTab === 'workflow' ? logs.filter(isAcademicWorkflowLog) : logs;
    return {
      total: all.length,
      creates: all.filter((log) => actionType(log) === 'good').length,
      updates: all.filter((log) => actionType(log) === 'warn').length,
      risky: all.filter((log) => actionType(log) === 'bad').length,
      workflow: all.filter(isAcademicWorkflowLog).length,
    };
  }, [logs, myLogs, activeTab]);

  async function loadPage() {
    setLoading(true);
    setError('');
    try {
      const [allRes, meRes] = await Promise.allSettled([
        api.get('/activity-logs'),
        api.get('/activity-logs/me'),
      ]);

      if (allRes.status === 'fulfilled') {
        setLogs(asArray(allRes.value.data));
      } else {
        setLogs([]);
        if (allRes.reason?.response?.status === 403) {
          setError('You do not have permission to view all activity logs.');
        }
      }

      if (meRes.status === 'fulfilled') {
        setMyLogs(asArray(meRes.value.data));
      } else {
        setMyLogs([]);
      }

      if (allRes.status === 'rejected' && meRes.status === 'rejected') {
        throw allRes.reason || meRes.reason;
      }
    } catch (err) {
      showError(err, 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  }

  function showError(err, fallback) {
    setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback);
    setSuccess('');
  }

  function showSuccess(message) {
    setSuccess(message);
    setError('');
    setTimeout(() => setSuccess(''), 3500);
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetFilters() {
    setFilters({
      search: '',
      action: '',
      category: '',
      user: '',
      entity: '',
      from: '',
      to: '',
    });
  }

  async function openLogDetails(log) {
    setSelectedLog(log);
    setDetailsLoading(true);
    setError('');

    try {
      if (log?.id) {
        const res = await api.get(`/activity-logs/${log.id}`);
        setSelectedLog(res.data?.data || res.data);
      }
    } catch (err) {
      showError(err, 'Failed to load activity log details.');
    } finally {
      setDetailsLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.pageShell}>
        <div style={styles.loaderCard}>
          <i className="fa-solid fa-spinner fa-spin" style={styles.loaderIcon}></i>
          <h2 style={styles.loaderTitle}>Loading activity logs...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageShell}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Audit Center</p>
          <h1 style={styles.title}>Activity Logs</h1>
          <p style={styles.subtitle}>
            Review sensitive administrative actions, academic workflow events, user activity, changes, and audit records across the university system.
          </p>
        </div>

        <div style={styles.heroActions}>
          <button type="button" style={styles.secondaryBtn} onClick={loadPage}>
            <i className="fa-solid fa-rotate"></i> Refresh
          </button>
          <button type="button" style={styles.secondaryBtn} onClick={() => window.print()}>
            <i className="fa-solid fa-print"></i> Print
          </button>
          <button type="button" style={styles.secondaryBtn} onClick={() => downloadJson(`activity-logs-${activeTab}.json`, filteredLogs)}>
            <i className="fa-solid fa-download"></i> Export JSON
          </button>
        </div>
      </section>

      {error ? <div style={styles.alertError}><i className="fa-solid fa-circle-exclamation"></i> {error}</div> : null}
      {success ? <div style={styles.alertSuccess}><i className="fa-solid fa-circle-check"></i> {success}</div> : null}

      <section style={styles.tabsBar}>
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
      </section>

      <section style={styles.grid4}>
        <Metric title="Total Logs" value={metrics.total} icon="fa-solid fa-clock-rotate-left" />
        <Metric title="Create / Login" value={metrics.creates} icon="fa-solid fa-circle-plus" />
        <Metric title="Updates" value={metrics.updates} icon="fa-solid fa-pen-to-square" />
        <Metric title="Risky / Delete" value={metrics.risky} icon="fa-solid fa-triangle-exclamation" />
        <Metric title="Academic Workflow" value={metrics.workflow} icon="fa-solid fa-graduation-cap" />
      </section>

      {activeTab === 'workflow' ? (
        <section style={styles.workflowPanel}>
          <CardTitle icon="fa-solid fa-route" title="Academic Workflow Audit Trail" />
          <p style={styles.workflowText}>
            This view focuses on the actions that matter most for the graduation project demo:
            grade entry, grade objections, doctor responses, final exam decisions, supplementary requests,
            academic year closing, promotion, and repeated failed courses.
          </p>
          <div style={styles.workflowChips}>
            {CATEGORY_FILTERS.filter((item) => ['grades', 'objections', 'supplementary', 'year_closing', 'students'].includes(item.key)).map((item) => (
              <button
                key={item.key}
                type="button"
                style={{ ...styles.quickChip, ...(filters.category === item.key ? styles.quickChipActive : {}) }}
                onClick={() => updateFilter('category', filters.category === item.key ? '' : item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section style={styles.card}>
        <CardTitle icon="fa-solid fa-filter" title="Filters" />
        <div style={styles.filtersGrid}>
          <div style={styles.formField}>
            <label style={styles.label}>Search</label>
            <input
              style={styles.input}
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by action, user, entity, IP..."
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>Action</label>
            <input
              style={styles.input}
              value={filters.action}
              onChange={(e) => updateFilter('action', e.target.value)}
              placeholder="created, updated, deleted..."
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>Category</label>
            <select
              style={styles.input}
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
            >
              {CATEGORY_FILTERS.map((item) => (
                <option key={item.key || 'all'} value={item.key}>{item.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>User</label>
            <input
              style={styles.input}
              value={filters.user}
              onChange={(e) => updateFilter('user', e.target.value)}
              placeholder="User name or email"
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>Entity</label>
            <input
              style={styles.input}
              value={filters.entity}
              onChange={(e) => updateFilter('entity', e.target.value)}
              placeholder="Student, Course, User..."
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>From</label>
            <input
              type="date"
              style={styles.input}
              value={filters.from}
              onChange={(e) => updateFilter('from', e.target.value)}
            />
          </div>

          <div style={styles.formField}>
            <label style={styles.label}>To</label>
            <input
              type="date"
              style={styles.input}
              value={filters.to}
              onChange={(e) => updateFilter('to', e.target.value)}
            />
          </div>

          <button type="button" style={styles.secondaryBtn} onClick={resetFilters}>
            <i className="fa-solid fa-eraser"></i> Reset
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <CardTitle icon="fa-solid fa-table-list" title={`${activeTab === 'mine' ? 'My' : activeTab === 'workflow' ? 'Academic Workflow' : 'All'} Activity Logs`} />

        <div style={styles.paginationToolbar}>
          <div style={styles.paginationInfo}>
            Showing <strong>{paginationStart}</strong> to <strong>{paginationEnd}</strong> of <strong>{filteredLogs.length}</strong> logs
          </div>

          <div style={styles.paginationControlsInline}>
            <label style={styles.paginationLabel}>Rows per page</label>
            <select
              style={styles.pageSizeSelect}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Entity</th>
                <th style={styles.th}>IP Address</th>
                <th style={styles.th}>Details</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log, index) => (
                <tr key={log.id || `${getLogAction(log)}-${paginationStart + index}`}>
                  <td style={styles.td}>{dateTime(log.created_at || log.timestamp || log.updated_at)}</td>
                  <td style={styles.td}>{fmt(getLogUser(log))}</td>
                  <td style={styles.td}>
                    <Badge type={actionType(log)}>{normalizeText(getLogAction(log))}</Badge>
                  </td>
                  <td style={styles.td}>
                    <Badge type={getLogCategory(log) === 'general' ? 'muted' : 'warn'}>{categoryLabel(getLogCategory(log))}</Badge>
                  </td>
                  <td style={styles.td}>{fmt(getEntity(log))}</td>
                  <td style={styles.td}>{fmt(getIp(log))}</td>
                  <td style={styles.td}>
                    <button type="button" style={styles.smallBtn} onClick={() => openLogDetails(log)}>
                      <i className="fa-solid fa-eye"></i> View
                    </button>
                  </td>
                </tr>
              ))}

              {!filteredLogs.length ? (
                <tr>
                  <td colSpan={7} style={styles.emptyTd}>No activity logs found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          styles={styles}
        />
      </section>

      {selectedLog ? (
        <section style={styles.detailsPanel}>
          <div style={styles.detailsHeader}>
            <CardTitle icon="fa-solid fa-magnifying-glass-chart" title="Activity Log Details" />
            <button type="button" style={styles.closeBtn} onClick={() => setSelectedLog(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {detailsLoading ? (
            <div style={styles.loadingLine}>
              <i className="fa-solid fa-spinner fa-spin"></i> Loading details...
            </div>
          ) : (
            <div style={styles.detailsGrid}>
              <InfoRow label="ID" value={selectedLog.id} />
              <InfoRow label="Action" value={normalizeText(getLogAction(selectedLog))} badge={actionType(selectedLog)} />
              <InfoRow label="Category" value={categoryLabel(getLogCategory(selectedLog))} badge={getLogCategory(selectedLog) === 'general' ? 'muted' : 'warn'} />
              <InfoRow label="User" value={getLogUser(selectedLog)} />
              <InfoRow label="Entity" value={getEntity(selectedLog)} />
              <InfoRow label="IP Address" value={getIp(selectedLog)} />
              <InfoRow label="Created At" value={dateTime(selectedLog.created_at || selectedLog.timestamp)} />
              <InfoRow label="Updated At" value={dateTime(selectedLog.updated_at)} />
              <InfoRow label="User Agent" value={selectedLog.user_agent || selectedLog.properties?.user_agent} />

              <div style={styles.fullRow}>
                <strong style={styles.infoLabel}>Description / Message</strong>
                <div style={styles.noteBox}>
                  {fmt(selectedLog.description || selectedLog.message || selectedLog.log_message || getLogAction(selectedLog))}
                </div>
              </div>

              {getMeta(selectedLog) ? (
                <div style={styles.fullRow}>
                  <strong style={styles.infoLabel}>Metadata</strong>
                  <pre style={styles.preBox}>{getMeta(selectedLog)}</pre>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function PaginationControls({ currentPage, totalPages, setCurrentPage, styles }) {
  const visiblePages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);

  for (let page = start; page <= end; page += 1) {
    visiblePages.push(page);
  }

  return (
    <div style={styles.paginationFooter}>
      <button
        type="button"
        style={{ ...styles.pageButton, ...(currentPage <= 1 ? styles.pageButtonDisabled : {}) }}
        disabled={currentPage <= 1}
        onClick={() => setCurrentPage(1)}
      >
        First
      </button>

      <button
        type="button"
        style={{ ...styles.pageButton, ...(currentPage <= 1 ? styles.pageButtonDisabled : {}) }}
        disabled={currentPage <= 1}
        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>

      {visiblePages[0] > 1 ? <span style={styles.paginationDots}>...</span> : null}

      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          style={{ ...styles.pageButton, ...(currentPage === page ? styles.pageButtonActive : {}) }}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages ? <span style={styles.paginationDots}>...</span> : null}

      <button
        type="button"
        style={{ ...styles.pageButton, ...(currentPage >= totalPages ? styles.pageButtonDisabled : {}) }}
        disabled={currentPage >= totalPages}
        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>

      <button
        type="button"
        style={{ ...styles.pageButton, ...(currentPage >= totalPages ? styles.pageButtonDisabled : {}) }}
        disabled={currentPage >= totalPages}
        onClick={() => setCurrentPage(totalPages)}
      >
        Last
      </button>
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

const styles = {
  pageShell: {
    minHeight: '100%',
    background: '#f4f7fb',
    color: '#10233f',
    fontFamily: 'Inter, Arial, sans-serif',
    boxSizing: 'border-box',
  },
  hero: {
    background: 'linear-gradient(135deg, #ffffff 0%, #e8f2ff 100%)',
    border: '1px solid #e2e8f0',
    borderRadius: 28,
    padding: 26,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 18,
    alignItems: 'center',
    boxShadow: '0 18px 50px rgba(15,23,42,.08)',
    marginBottom: 18,
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
    fontSize: 31,
    lineHeight: 1.15,
    color: '#10233f',
  },
  subtitle: {
    margin: 0,
    color: '#64748b',
    maxWidth: 760,
    lineHeight: 1.5,
  },
  heroActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  tabsBar: {
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
    padding: '12px 14px',
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
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 16,
    marginBottom: 18,
  },
  metricCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 22,
    padding: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 12px 32px rgba(15,23,42,.06)',
  },
  metricIcon: {
    width: 45,
    height: 45,
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
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 24,
    padding: 22,
    boxShadow: '0 12px 32px rgba(15,23,42,.06)',
    marginBottom: 18,
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
    borderRadius: 13,
    background: '#eff6ff',
    color: '#2563eb',
    display: 'grid',
    placeItems: 'center',
  },
  cardTitle: {
    margin: 0,
    fontSize: 19,
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
    alignItems: 'end',
  },
  formField: {
    display: 'grid',
    gap: 7,
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
  smallBtn: {
    border: 0,
    borderRadius: 12,
    padding: '9px 12px',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    gap: 7,
    alignItems: 'center',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  paginationToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 14,
    padding: '12px 14px',
    background: '#fbfdff',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
  },
  paginationInfo: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: 700,
  },
  paginationControlsInline: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  paginationLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: 800,
  },
  pageSizeSelect: {
    minWidth: 82,
    height: 40,
    border: '1px solid #dbe3ef',
    borderRadius: 12,
    padding: '0 12px',
    background: '#fff',
    color: '#183b66',
    fontWeight: 800,
    outline: 'none',
    cursor: 'pointer',
  },
  paginationFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 16,
  },
  pageButton: {
    minWidth: 40,
    minHeight: 38,
    border: '1px solid #dbe3ef',
    borderRadius: 12,
    background: '#fff',
    color: '#183b66',
    fontWeight: 900,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: '8px 12px',
  },
  pageButtonActive: {
    background: '#183b66',
    borderColor: '#183b66',
    color: '#fff',
    boxShadow: '0 10px 22px rgba(24,59,102,.18)',
  },
  pageButtonDisabled: {
    background: '#f1f5f9',
    color: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  paginationDots: {
    color: '#94a3b8',
    fontWeight: 900,
    padding: '0 2px',
  },
  table: {
    width: '100%',
    minWidth: 980,
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
  },
  emptyTd: {
    padding: 25,
    textAlign: 'center',
    color: '#94a3b8',
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
  },
  badgeGood: {
    background: '#dcfce7',
    color: '#166534',
  },
  badgeWarn: {
    background: '#fef3c7',
    color: '#92400e',
  },
  badgeBad: {
    background: '#fee2e2',
    color: '#991b1b',
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
  },
  detailsPanel: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 24,
    padding: 22,
    boxShadow: '0 12px 32px rgba(15,23,42,.06)',
    marginBottom: 18,
  },
  detailsHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  closeBtn: {
    border: '1px solid #e2e8f0',
    background: '#fff',
    color: '#10233f',
    width: 38,
    height: 38,
    borderRadius: 12,
    cursor: 'pointer',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))',
    gap: '0 24px',
  },
  fullRow: {
    gridColumn: '1 / -1',
    marginTop: 12,
  },
  noteBox: {
    background: '#fbfdff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 13,
    color: '#334155',
    marginTop: 10,
    lineHeight: 1.6,
  },
  preBox: {
    background: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    overflow: 'auto',
    fontSize: 12,
    lineHeight: 1.6,
    marginTop: 10,
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
  loadingLine: {
    color: '#64748b',
    display: 'flex',
    gap: 9,
    alignItems: 'center',
    padding: 18,
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
  workflowPanel: {
    background: '#fff',
    border: '1px solid #bfdbfe',
    borderRadius: 24,
    padding: 22,
    boxShadow: '0 12px 32px rgba(37,99,235,.08)',
    marginBottom: 18,
  },
  workflowText: {
    color: '#475569',
    lineHeight: 1.65,
    margin: '0 0 14px',
    fontWeight: 650,
  },
  workflowChips: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  quickChip: {
    border: '1px solid #dbe3ef',
    background: '#fff',
    color: '#183b66',
    borderRadius: 999,
    padding: '9px 13px',
    fontWeight: 900,
    fontSize: 12,
    cursor: 'pointer',
  },
  quickChipActive: {
    background: '#183b66',
    borderColor: '#183b66',
    color: '#fff',
  },
};
