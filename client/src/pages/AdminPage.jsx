import React, { useEffect, useState, useCallback } from 'react';
import { userAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { Shield, Trash2, Search, X, Users, Crown, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

const RoleBadge = ({ role }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 20,
    fontSize: 12, fontWeight: 600,
    background: role === 'admin' ? 'rgba(124,92,252,0.2)' : 'rgba(96,165,250,0.12)',
    color: role === 'admin' ? 'var(--accent-light)' : 'var(--info)',
    border: `1px solid ${role === 'admin' ? 'rgba(124,92,252,0.3)' : 'rgba(96,165,250,0.2)'}`,
  }}>
    {role === 'admin' ? <Crown size={10} /> : <UserCheck size={10} />}
    {role}
  </span>
);

const AdminPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [roleLoading, setRoleLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});

  const searchTimer = React.useRef(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAllUsers({ search: search || undefined, page, limit: 15 });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSearchChange = (v) => {
    setSearchInput(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(v); setPage(1); }, 400);
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role to "${newRole}"?`)) return;
    setRoleLoading(r => ({ ...r, [userId]: true }));
    try {
      const res = await userAPI.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: res.data.user.role } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setRoleLoading(r => ({ ...r, [userId]: false }));
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}" and all their tasks? This cannot be undone.`)) return;
    setDeleteLoading(d => ({ ...d, [userId]: true }));
    try {
      await userAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      setPagination(p => ({ ...p, total: p.total - 1 }));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setDeleteLoading(d => ({ ...d, [userId]: false }));
    }
  };

  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Shield size={24} color="var(--accent)" />
          <h1 style={{ fontSize: 28 }}>User Management</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          Manage all registered users, assign roles, and remove accounts.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Users', value: pagination.total, icon: Users, color: 'var(--accent)' },
          { label: 'Admins', value: adminCount, icon: Crown, color: 'var(--warning)' },
          { label: 'Members', value: pagination.total - adminCount, icon: UserCheck, color: 'var(--success)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px' }}>
            <div style={{ width: 42, height: 42, background: `${color}22`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 24, fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>{value}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search by name or email…"
          style={{ paddingLeft: 38, paddingRight: searchInput ? 38 : 14 }}
        />
        {searchInput && (
          <button onClick={() => handleSearchChange('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <LoadingSpinner />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <Users size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No users found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '14px 20px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const isSelf = u._id === currentUser?._id;
                  return (
                    <tr
                      key={u._id}
                      style={{
                        borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                        background: isSelf ? 'rgba(124,92,252,0.04)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => !isSelf && (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => !isSelf && (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Name */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36,
                            background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                          }}>
                            {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {u.name} {isSelf && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(you)</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</span>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 20px' }}>
                        <RoleBadge role={u.role} />
                      </td>

                      {/* Joined */}
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px' }}>
                        {isSelf ? (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 14px', fontSize: 12 }}
                              disabled={roleLoading[u._id]}
                              onClick={() => handleRoleToggle(u._id, u.role)}
                            >
                              {roleLoading[u._id] ? '…' : u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: 12 }}
                              disabled={deleteLoading[u._id]}
                              onClick={() => handleDelete(u._id, u.name)}
                            >
                              {deleteLoading[u._id] ? '…' : <Trash2 size={13} />}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={p === page ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '8px 14px', minWidth: 40, fontSize: 13 }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
