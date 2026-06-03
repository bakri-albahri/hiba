import { useEffect, useMemo, useState } from 'react';
import api from '../../Api/axios';

const PERMISSION_GROUPS = [
  {
    key: 'dashboard_reports',
    title: 'Dashboard & Reports',
    icon: 'fa-solid fa-chart-line',
    permissions: [
      'view dashboard',
      'view reports',
      'view activity logs',
    ],
  },
  {
    key: 'users',
    title: 'Users',
    icon: 'fa-solid fa-users-gear',
    permissions: [
      'view users',
      'create users',
      'update users',
      'delete users',
    ],
  },
  {
    key: 'academic_structure',
    title: 'Academic Structure',
    icon: 'fa-solid fa-sitemap',
    permissions: [
      'manage academic structure',
      'manage departments',
      'manage doctor course assignments',
    ],
  },
  {
    key: 'employees_doctors',
    title: 'Employees & Doctors',
    icon: 'fa-solid fa-id-badge',
    permissions: [
      'create employees',
      'update employees',
      'assign employee permissions',
      'assign department managers',
      'create doctors',
      'update doctors',
      'delete doctors',
    ],
  },
  {
    key: 'student_affairs',
    title: 'Student Affairs',
    icon: 'fa-solid fa-user-graduate',
    permissions: [
      'view undergraduate students',
      'create undergraduate students',
      'update undergraduate students',
      'change undergraduate student status',
      'manage undergraduate schedules',
      'set course attendance limits',
      'send student notifications',
    ],
  },
  {
    key: 'higher_studies',
    title: 'Higher Studies',
    icon: 'fa-solid fa-graduation-cap',
    permissions: [
      'view postgraduate students',
      'create postgraduate students',
      'update postgraduate students',
      'manage postgraduate schedules',
    ],
  },
  {
    key: 'examinations',
    title: 'Examinations',
    icon: 'fa-solid fa-file-signature',
    permissions: [
      'manage student grades',
      'manage grade objections',
      'review supplementary requests',
      'manage exam schedules',
      'manage supplementary exam schedules',
      'close academic year',
    ],
  },
  {
    key: 'finance',
    title: 'Finance',
    icon: 'fa-solid fa-wallet',
    permissions: [
      'set annual tuition fees',
      'update tuition payment status',
    ],
  },
];

const KNOWN_PERMISSIONS = Array.from(new Set(PERMISSION_GROUPS.flatMap((group) => group.permissions))).sort();

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

function normalizePermissionName(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return String(value.name || value.permission || value.title || '').trim();
}

function normalizePermissionList(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : asArray(value);
  return Array.from(
    new Set(list.map(normalizePermissionName).filter(Boolean))
  ).sort();
}

function fmt(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
}

function dateOnly(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString();
  } catch (_) {
    return String(value).slice(0, 10);
  }
}

function getEmployeeName(employee) {
  return (
    employee?.user?.full_name ||
    employee?.full_name ||
    employee?.name ||
    `Employee #${employee?.id || '—'}`
  );
}

function getEmployeeEmail(employee) {
  return employee?.user?.email || employee?.email || '—';
}

function getEmployeeUserId(employee) {
  return employee?.user_id || employee?.user?.id || employee?.user?.user_id || employee?.id;
}

function getDepartmentName(employee) {
  return (
    employee?.department?.name ||
    employee?.department_name ||
    employee?.department?.code ||
    '—'
  );
}

function getEmployeeCurrentPermissions(employee) {
  const user = employee?.user || {};
  const direct =
    employee?.permissions ||
    employee?.direct_permissions ||
    employee?.assigned_permissions ||
    user?.permissions ||
    user?.direct_permissions ||
    user?.assigned_permissions ||
    user?.all_permissions ||
    [];

  const rolePermissions = [];
  const roles = user?.roles || employee?.roles || [];
  if (Array.isArray(roles)) {
    roles.forEach((role) => {
      if (Array.isArray(role?.permissions)) {
        role.permissions.forEach((permission) => rolePermissions.push(permission));
      }
    });
  }

  return normalizePermissionList([...asArray(direct), ...rolePermissions]);
}

function actionMessageFromError(error, fallback) {
  if (error?.response?.status === 401) return 'Session expired. Please login again.';
  if (error?.response?.status === 403) return 'This action is blocked by backend permissions.';
  if (error?.response?.status === 404) return 'Required backend endpoint was not found.';
  if (error?.response?.data?.errors) {
    const firstKey = Object.keys(error.response.data.errors)[0];
    const first = error.response.data.errors[firstKey]?.[0];
    if (first) return first;
  }
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;
}

function buildFallbackPermissions(existingPermissions = []) {
  return Array.from(new Set([...KNOWN_PERMISSIONS, ...existingPermissions])).sort();
}

export default function EmployeePermissions() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState(KNOWN_PERMISSIONS);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [originalPermissions, setOriginalPermissions] = useState([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [endpointNote, setEndpointNote] = useState('');

  useEffect(() => {
    loadPage();
  }, []);

  const selectedSet = useMemo(() => new Set(selectedPermissions), [selectedPermissions]);
  const originalSet = useMemo(() => new Set(originalPermissions), [originalPermissions]);

  const changedPermissions = useMemo(() => {
    const added = selectedPermissions.filter((permission) => !originalSet.has(permission));
    const removed = originalPermissions.filter((permission) => !selectedSet.has(permission));
    return { added, removed, total: added.length + removed.length };
  }, [selectedPermissions, originalPermissions, selectedSet, originalSet]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const departmentId = employee?.department_id || employee?.department?.id;
      const haystack = [
        getEmployeeName(employee),
        getEmployeeEmail(employee),
        employee?.job_title,
        employee?.employee_number,
        getDepartmentName(employee),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = !term || haystack.includes(term);
      const matchesDepartment = departmentFilter === 'all' || String(departmentId) === String(departmentFilter);
      return matchesSearch && matchesDepartment;
    });
  }, [employees, search, departmentFilter]);

  const groupedPermissions = useMemo(() => {
    const allKnown = new Set(availablePermissions);
    const searchValue = permissionSearch.trim().toLowerCase();

    const groups = PERMISSION_GROUPS.map((group) => {
      const permissions = group.permissions
        .filter((permission) => allKnown.has(permission) || selectedSet.has(permission))
        .filter((permission) => {
          if (showOnlySelected && !selectedSet.has(permission)) return false;
          if (searchValue && !permission.toLowerCase().includes(searchValue)) return false;
          return true;
        });

      return { ...group, permissions };
    });

    const groupedKnown = new Set(PERMISSION_GROUPS.flatMap((group) => group.permissions));
    const otherPermissions = availablePermissions
      .filter((permission) => !groupedKnown.has(permission))
      .filter((permission) => {
        if (showOnlySelected && !selectedSet.has(permission)) return false;
        if (searchValue && !permission.toLowerCase().includes(searchValue)) return false;
        return true;
      });

    const finalGroups = otherPermissions.length
      ? [
          ...groups,
          {
            key: 'other',
            title: 'Other Permissions',
            icon: 'fa-solid fa-key',
            permissions: otherPermissions,
          },
        ]
      : groups;

    return finalGroups.filter((group) => {
      if (groupFilter !== 'all' && group.key !== groupFilter) return false;
      return group.permissions.length > 0;
    });
  }, [availablePermissions, permissionSearch, groupFilter, showOnlySelected, selectedSet]);

  const metrics = useMemo(() => {
    return {
      employees: employees.length,
      departments: departments.length,
      permissions: availablePermissions.length,
      selected: selectedPermissions.length,
    };
  }, [employees.length, departments.length, availablePermissions.length, selectedPermissions.length]);

  async function loadPage() {
    setLoading(true);
    setPageError('');
    setActionMessage({ type: '', text: '' });

    try {
      const [employeesRes, departmentsRes, permissionsRes] = await Promise.allSettled([
        api.get('/employees'),
        api.get('/departments'),
        loadPermissions(),
      ]);

      if (employeesRes.status === 'fulfilled') {
        setEmployees(asArray(employeesRes.value.data));
      } else {
        setEmployees([]);
        setPageError(actionMessageFromError(employeesRes.reason, 'Failed to load employees.'));
      }

      if (departmentsRes.status === 'fulfilled') {
        setDepartments(asArray(departmentsRes.value.data));
      } else {
        setDepartments([]);
      }

      if (permissionsRes.status === 'fulfilled') {
        const permissionList = normalizePermissionList(permissionsRes.value);
        setAvailablePermissions(buildFallbackPermissions(permissionList));
      } else {
        setAvailablePermissions(KNOWN_PERMISSIONS);
        setEndpointNote('Permissions lookup endpoint was not found. The page is using the known system permissions list.');
      }

      if (employeesRes.status === 'rejected' && permissionsRes.status === 'rejected') {
        throw employeesRes.reason;
      }
    } catch (error) {
      setPageError(actionMessageFromError(error, 'Failed to load Employee Permissions page.'));
    } finally {
      setLoading(false);
    }
  }

  async function loadPermissions() {
    const candidates = [
      '/permissions',
      '/roles/permissions',
      '/role-permissions',
      '/roles-and-permissions/permissions',
      '/users/permissions',
    ];

    let lastError = null;
    for (const endpoint of candidates) {
      try {
        const response = await api.get(endpoint);
        setEndpointNote('');
        return response.data?.permissions || response.data;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  function showMessage(type, text) {
    setActionMessage({ type, text });
    if (text) {
      setTimeout(() => setActionMessage({ type: '', text: '' }), 4500);
    }
  }

  async function selectEmployee(employee) {
    const id = employee?.id;
    if (!id) return;

    setSelectedEmployeeId(id);
    setSelectedEmployee(employee);
    setDetailsLoading(true);
    setActionMessage({ type: '', text: '' });

    try {
      const response = await api.get(`/employees/${id}`);
      const detail = response.data?.data || response.data?.employee || response.data;
      setSelectedEmployee(detail);
      const current = getEmployeeCurrentPermissions(detail);
      setOriginalPermissions(current);
      setSelectedPermissions(current);
      setAvailablePermissions((prev) => buildFallbackPermissions([...prev, ...current]));
    } catch (error) {
      const current = getEmployeeCurrentPermissions(employee);
      setOriginalPermissions(current);
      setSelectedPermissions(current);
      setAvailablePermissions((prev) => buildFallbackPermissions([...prev, ...current]));
      showMessage('warning', actionMessageFromError(error, 'Employee details did not load. Showing permissions available in the list response.'));
    } finally {
      setDetailsLoading(false);
    }
  }

  function togglePermission(permission) {
    setSelectedPermissions((prev) => {
      const exists = prev.includes(permission);
      if (exists) return prev.filter((item) => item !== permission);
      return [...prev, permission].sort();
    });
  }

  function selectGroup(group) {
    const groupPermissions = group.permissions || [];
    setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupPermissions])).sort());
  }

  function clearGroup(group) {
    const groupSet = new Set(group.permissions || []);
    setSelectedPermissions((prev) => prev.filter((permission) => !groupSet.has(permission)));
  }

  function resetSelection() {
    setSelectedPermissions(originalPermissions);
    showMessage('success', 'Permission selection has been reset.');
  }

  function clearAllPermissions() {
    setSelectedPermissions([]);
  }

  async function savePermissions() {
    if (!selectedEmployee) {
      showMessage('danger', 'Please select an employee first.');
      return;
    }

    const employeeId = selectedEmployee.id;
    const userId = getEmployeeUserId(selectedEmployee);

    const payloadOptions = [
      { permissions: selectedPermissions },
      { permission_names: selectedPermissions },
      { permissionNames: selectedPermissions },
    ];

    const endpoints = [
      { method: 'patch', url: `/employees/${employeeId}/permissions` },
      { method: 'post', url: `/employees/${employeeId}/permissions` },
      { method: 'put', url: `/employees/${employeeId}/permissions` },
      { method: 'patch', url: `/employees/${employeeId}/assign-permissions` },
      { method: 'post', url: `/employees/${employeeId}/assign-permissions` },
      ...(userId ? [
        { method: 'patch', url: `/users/${userId}/permissions` },
        { method: 'post', url: `/users/${userId}/permissions` },
        { method: 'put', url: `/users/${userId}/permissions` },
        { method: 'patch', url: `/users/${userId}/sync-permissions` },
        { method: 'post', url: `/users/${userId}/sync-permissions` },
      ] : []),
    ];

    setSaving(true);
    setActionMessage({ type: '', text: '' });

    let lastError = null;

    for (const endpoint of endpoints) {
      for (const payload of payloadOptions) {
        try {
          await api[endpoint.method](endpoint.url, payload);
          setOriginalPermissions(selectedPermissions);
          showMessage('success', 'Employee permissions updated successfully.');
          await reloadSelectedEmployee(employeeId);
          setSaving(false);
          return;
        } catch (error) {
          lastError = error;
          if (![404, 405, 422].includes(error?.response?.status)) {
            break;
          }
        }
      }
    }

    setSaving(false);
    showMessage(
      'danger',
      `${actionMessageFromError(lastError, 'Failed to update permissions.')} If this remains 404, add a backend endpoint such as PATCH /api/employees/{employeeId}/permissions.`
    );
  }

  async function reloadSelectedEmployee(employeeId) {
    try {
      const response = await api.get(`/employees/${employeeId}`);
      const detail = response.data?.data || response.data?.employee || response.data;
      setSelectedEmployee(detail);
      const current = getEmployeeCurrentPermissions(detail);
      if (current.length) {
        setOriginalPermissions(current);
        setSelectedPermissions(current);
      }
    } catch (_) {
      // Keep local state if refresh fails.
    }
  }

  if (loading) {
    return (
      <div style={styles.pageShell}>
        <div style={styles.loaderCard}>
          <i className="fa-solid fa-spinner fa-spin" style={styles.loaderIcon}></i>
          <h2 style={styles.loaderTitle}>Loading employee permissions...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageShell}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Access Control Center</p>
          <h1 style={styles.title}>Employee Permissions</h1>
          <p style={styles.subtitle}>
            Assign department-based permissions to employees while keeping the university access model organized and auditable.
          </p>
        </div>

        <div style={styles.heroActions}>
          <button type="button" style={styles.secondaryBtn} onClick={loadPage}>
            <i className="fa-solid fa-rotate"></i> Refresh
          </button>
          <button type="button" style={styles.secondaryBtn} onClick={() => window.print()}>
            <i className="fa-solid fa-print"></i> Print
          </button>
        </div>
      </section>

      {pageError ? <div style={styles.alertError}><i className="fa-solid fa-circle-exclamation"></i> {pageError}</div> : null}
      {endpointNote ? <div style={styles.alertWarning}><i className="fa-solid fa-triangle-exclamation"></i> {endpointNote}</div> : null}
      {actionMessage.text ? (
        <div style={actionMessage.type === 'success' ? styles.alertSuccess : actionMessage.type === 'warning' ? styles.alertWarning : styles.alertError}>
          <i className={actionMessage.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'}></i> {actionMessage.text}
        </div>
      ) : null}

      <section style={styles.grid4}>
        <Metric title="Employees" value={metrics.employees} icon="fa-solid fa-id-badge" />
        <Metric title="Departments" value={metrics.departments} icon="fa-solid fa-building-columns" />
        <Metric title="Available Permissions" value={metrics.permissions} icon="fa-solid fa-key" />
        <Metric title="Selected Permissions" value={metrics.selected} icon="fa-solid fa-user-check" />
      </section>

      <section style={styles.twoColumnsWide}>
        <div style={styles.card}>
          <CardTitle icon="fa-solid fa-users" title="Employees" />

          <div style={styles.filterRow}>
            <input
              style={styles.input}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, email, job title..."
            />
            <select
              style={styles.input}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name || department.code || `Department #${department.id}`}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.employeeList}>
            {filteredEmployees.map((employee) => {
              const active = String(selectedEmployeeId) === String(employee.id);
              const initials = String(getEmployeeName(employee))
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('') || 'E';

              return (
                <button
                  key={employee.id}
                  type="button"
                  style={{ ...styles.employeeItem, ...(active ? styles.employeeItemActive : {}) }}
                  onClick={() => selectEmployee(employee)}
                >
                  <span style={{ ...styles.employeeAvatar, ...(active ? styles.employeeAvatarActive : {}) }}>{initials}</span>
                  <span style={styles.employeeText}>
                    <strong>{getEmployeeName(employee)}</strong>
                    <small>{fmt(employee.job_title, 'Employee')} • {getDepartmentName(employee)}</small>
                    <small>{getEmployeeEmail(employee)}</small>
                  </span>
                  <Badge type={employee.is_active === false ? 'bad' : 'good'}>{employee.is_active === false ? 'Inactive' : 'Active'}</Badge>
                </button>
              );
            })}

            {!filteredEmployees.length ? <p style={styles.emptyText}>No employees found.</p> : null}
          </div>
        </div>

        <div style={styles.card}>
          <CardTitle icon="fa-solid fa-user-shield" title="Selected Employee" />

          {!selectedEmployee ? (
            <div style={styles.emptyPanel}>
              <i className="fa-solid fa-user-lock"></i>
              <h3>Select an employee</h3>
              <p>Choose an employee from the list to review and update assigned permissions.</p>
            </div>
          ) : (
            <>
              {detailsLoading ? (
                <div style={styles.loadingLine}><i className="fa-solid fa-spinner fa-spin"></i> Loading employee details...</div>
              ) : null}

              <div style={styles.profileBox}>
                <div style={styles.profileAvatar}>
                  {String(getEmployeeName(selectedEmployee)).slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2>{getEmployeeName(selectedEmployee)}</h2>
                  <p>{fmt(selectedEmployee.job_title, 'Employee')} • {getDepartmentName(selectedEmployee)}</p>
                  <small>{getEmployeeEmail(selectedEmployee)}</small>
                </div>
              </div>

              <div style={styles.infoGrid}>
                <InfoRow label="Employee ID" value={selectedEmployee.id} />
                <InfoRow label="User ID" value={getEmployeeUserId(selectedEmployee)} />
                <InfoRow label="Hire Date" value={dateOnly(selectedEmployee.hire_date)} />
                <InfoRow label="Status" value={selectedEmployee.is_active === false ? 'Inactive' : 'Active'} badge={selectedEmployee.is_active === false ? 'bad' : 'good'} />
              </div>

              <div style={styles.changeBox}>
                <div>
                  <strong>{changedPermissions.total}</strong>
                  <span> pending change{changedPermissions.total === 1 ? '' : 's'}</span>
                </div>
                <div>
                  <Badge type="good">+{changedPermissions.added.length} added</Badge>
                  <Badge type="bad">-{changedPermissions.removed.length} removed</Badge>
                </div>
              </div>

              <div style={styles.actionBar}>
                <button type="button" style={styles.primaryBtn} onClick={savePermissions} disabled={saving || changedPermissions.total === 0}>
                  <i className="fa-solid fa-floppy-disk"></i> {saving ? 'Saving...' : 'Save Permissions'}
                </button>
                <button type="button" style={styles.secondaryBtn} onClick={resetSelection} disabled={saving}>
                  Reset
                </button>
                <button type="button" style={styles.dangerBtn} onClick={clearAllPermissions} disabled={saving}>
                  Clear All
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.permissionsHeader}>
          <CardTitle icon="fa-solid fa-key" title="Permission Matrix" />
          <div style={styles.permissionTools}>
            <input
              style={styles.permissionSearch}
              value={permissionSearch}
              onChange={(e) => setPermissionSearch(e.target.value)}
              placeholder="Search permission..."
            />
            <select style={styles.permissionSelect} value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
              <option value="all">All groups</option>
              {PERMISSION_GROUPS.map((group) => (
                <option key={group.key} value={group.key}>{group.title}</option>
              ))}
              <option value="other">Other Permissions</option>
            </select>
            <label style={styles.checkboxLine}>
              <input
                type="checkbox"
                checked={showOnlySelected}
                onChange={(e) => setShowOnlySelected(e.target.checked)}
              />
              Selected only
            </label>
          </div>
        </div>

        {!selectedEmployee ? (
          <div style={styles.emptyPanelSmall}>
            Select an employee first to enable permission editing.
          </div>
        ) : (
          <div style={styles.permissionGroups}>
            {groupedPermissions.map((group) => (
              <div key={group.key} style={styles.permissionGroup}>
                <div style={styles.groupHeader}>
                  <div style={styles.groupTitle}>
                    <span style={styles.groupIcon}><i className={group.icon}></i></span>
                    <div>
                      <h3>{group.title}</h3>
                      <p>{group.permissions.filter((permission) => selectedSet.has(permission)).length} of {group.permissions.length} selected</p>
                    </div>
                  </div>

                  <div style={styles.groupActions}>
                    <button type="button" style={styles.smallGhostBtn} onClick={() => selectGroup(group)}>Select group</button>
                    <button type="button" style={styles.smallGhostBtn} onClick={() => clearGroup(group)}>Clear group</button>
                  </div>
                </div>

                <div style={styles.permissionList}>
                  {group.permissions.map((permission) => {
                    const checked = selectedSet.has(permission);
                    const wasOriginal = originalSet.has(permission);
                    return (
                      <label key={permission} style={{ ...styles.permissionItem, ...(checked ? styles.permissionItemChecked : {}) }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(permission)}
                        />
                        <span>
                          <strong>{permission}</strong>
                          <small>
                            {checked && !wasOriginal ? 'Newly added' : !checked && wasOriginal ? 'Will be removed' : wasOriginal ? 'Currently assigned' : 'Not assigned'}
                          </small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {!groupedPermissions.length ? <p style={styles.emptyText}>No permissions match your filters.</p> : null}
          </div>
        )}
      </section>
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
  pageShell: { minHeight: '100%', background: '#f4f7fb', color: '#10233f', fontFamily: 'Inter, Arial, sans-serif', boxSizing: 'border-box' },
  hero: { background: 'linear-gradient(135deg, #ffffff 0%, #e8f2ff 100%)', border: '1px solid #e2e8f0', borderRadius: 28, padding: 26, display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', boxShadow: '0 18px 50px rgba(15,23,42,.08)', marginBottom: 18 },
  eyebrow: { margin: 0, color: '#2563eb', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 900 },
  title: { margin: '6px 0 8px', fontSize: 31, lineHeight: 1.15, color: '#10233f' },
  subtitle: { margin: 0, color: '#64748b', maxWidth: 760, lineHeight: 1.5 },
  heroActions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(170px, 1fr))', gap: 16, marginBottom: 18 },
  metricCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 22, padding: 18, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 32px rgba(15,23,42,.06)' },
  metricIcon: { width: 45, height: 45, borderRadius: 15, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center', fontSize: 18 },
  metricTitle: { margin: 0, color: '#64748b', fontSize: 13, fontWeight: 700 },
  metricValue: { margin: '3px 0 0', fontSize: 25 },
  twoColumnsWide: { display: 'grid', gridTemplateColumns: 'minmax(330px, 430px) minmax(0, 1fr)', gap: 18, marginBottom: 18 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 22, boxShadow: '0 12px 32px rgba(15,23,42,.06)', marginBottom: 18 },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 },
  cardTitleIcon: { width: 38, height: 38, borderRadius: 13, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' },
  cardTitle: { margin: 0, fontSize: 19 },
  filterRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 },
  input: { border: '1px solid #dbe3ef', borderRadius: 13, padding: '12px 13px', outline: 'none', fontSize: 14, background: '#fff', boxSizing: 'border-box', width: '100%' },
  employeeList: { display: 'grid', gap: 10, maxHeight: 560, overflowY: 'auto', paddingRight: 4 },
  employeeItem: { border: '1px solid #e2e8f0', background: '#fbfdff', color: '#10233f', borderRadius: 18, padding: 13, display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 12, alignItems: 'center', textAlign: 'left', cursor: 'pointer', transition: '.2s ease' },
  employeeItemActive: { background: '#eff6ff', borderColor: '#bfdbfe', boxShadow: '0 10px 24px rgba(37,99,235,.12)' },
  employeeAvatar: { width: 46, height: 46, borderRadius: 14, background: '#e8f2ff', color: '#183b66', fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 16 },
  employeeAvatarActive: { background: '#183b66', color: '#fff' },
  employeeText: { display: 'grid', gap: 4, minWidth: 0 },
  profileBox: { display: 'flex', alignItems: 'center', gap: 14, background: '#fbfdff', border: '1px solid #eef2f7', borderRadius: 20, padding: 15, marginBottom: 14 },
  profileAvatar: { width: 58, height: 58, borderRadius: 18, background: '#e8f2ff', color: '#183b66', fontWeight: 900, display: 'grid', placeItems: 'center', fontSize: 24 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0 18px' },
  changeBox: { marginTop: 14, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  actionBar: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 15 },
  primaryBtn: { border: 0, borderRadius: 14, padding: '12px 16px', background: '#2563eb', color: '#fff', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 },
  secondaryBtn: { border: '1px solid #dbe3ef', borderRadius: 14, padding: '12px 16px', background: '#fff', color: '#183b66', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, whiteSpace: 'nowrap' },
  dangerBtn: { border: '1px solid #fecaca', borderRadius: 14, padding: '12px 16px', background: '#fee2e2', color: '#991b1b', fontWeight: 900, cursor: 'pointer' },
  permissionsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' },
  permissionTools: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  permissionSearch: { border: '1px solid #dbe3ef', borderRadius: 13, padding: '11px 13px', outline: 'none', fontSize: 14, minWidth: 220 },
  permissionSelect: { border: '1px solid #dbe3ef', borderRadius: 13, padding: '11px 13px', outline: 'none', fontSize: 14, background: '#fff' },
  checkboxLine: { display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 800, color: '#475569', fontSize: 13 },
  permissionGroups: { display: 'grid', gap: 16 },
  permissionGroup: { border: '1px solid #e2e8f0', background: '#fbfdff', borderRadius: 22, padding: 16 },
  groupHeader: { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' },
  groupTitle: { display: 'flex', alignItems: 'center', gap: 12 },
  groupIcon: { width: 42, height: 42, borderRadius: 14, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' },
  groupActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  smallGhostBtn: { border: '1px solid #dbe3ef', background: '#fff', color: '#183b66', borderRadius: 12, padding: '8px 10px', cursor: 'pointer', fontWeight: 800 },
  permissionList: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(210px, 1fr))', gap: 10 },
  permissionItem: { display: 'flex', alignItems: 'flex-start', gap: 10, border: '1px solid #e2e8f0', background: '#fff', borderRadius: 15, padding: 12, cursor: 'pointer' },
  permissionItemChecked: { background: '#eff6ff', borderColor: '#bfdbfe' },
  infoRow: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  infoLabel: { color: '#64748b', fontSize: 13, fontWeight: 700 },
  infoValue: { fontSize: 14, textAlign: 'right' },
  badge: { display: 'inline-flex', alignItems: 'center', borderRadius: 99, padding: '6px 10px', fontSize: 12, fontWeight: 800, background: '#f1f5f9', color: '#475569', textTransform: 'capitalize', marginRight: 6 },
  badgeGood: { background: '#dcfce7', color: '#166534' },
  badgeWarn: { background: '#fef3c7', color: '#92400e' },
  badgeBad: { background: '#fee2e2', color: '#991b1b' },
  alertError: { background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 15, padding: '12px 14px', marginBottom: 16, fontWeight: 700 },
  alertSuccess: { background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 15, padding: '12px 14px', marginBottom: 16, fontWeight: 700 },
  alertWarning: { background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', borderRadius: 15, padding: '12px 14px', marginBottom: 16, fontWeight: 700 },
  emptyText: { color: '#94a3b8', textAlign: 'center', padding: 18 },
  emptyPanel: { color: '#64748b', textAlign: 'center', padding: '35px 18px', background: '#fbfdff', border: '1px dashed #cbd5e1', borderRadius: 20 },
  emptyPanelSmall: { color: '#64748b', textAlign: 'center', padding: 20, background: '#fbfdff', border: '1px dashed #cbd5e1', borderRadius: 18 },
  loadingLine: { color: '#64748b', display: 'flex', gap: 9, alignItems: 'center', padding: 12 },
  loaderCard: { margin: '60px auto', maxWidth: 340, background: '#fff', borderRadius: 24, padding: 34, textAlign: 'center', boxShadow: '0 18px 50px rgba(15,23,42,.1)' },
  loaderIcon: { fontSize: 36, color: '#2563eb' },
  loaderTitle: { margin: '14px 0 0' },
};
