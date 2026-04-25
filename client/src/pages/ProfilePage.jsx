import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { User, Lock, Save, Eye, EyeOff, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profileForm.name.trim() || profileForm.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    setProfileLoading(true);
    try {
      const res = await userAPI.updateProfile({ name: profileForm.name.trim(), avatar: profileForm.avatar || undefined });
      updateUser(res.data.user);
      toast.success('Profile updated!');
      setProfileErrors({});
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Required';
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) errs.newPassword = 'At least 6 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setPwLoading(true);
    try {
      await userAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to change password';
      toast.error(msg);
      if (msg.toLowerCase().includes('current')) setPwErrors({ currentPassword: msg });
    } finally {
      setPwLoading(false);
    }
  };

  const setProfile = (k) => (e) => {
    setProfileForm(f => ({ ...f, [k]: e.target.value }));
    setProfileErrors(err => ({ ...err, [k]: '' }));
  };

  const setPw = (k) => (e) => {
    setPwForm(f => ({ ...f, [k]: e.target.value }));
    setPwErrors(err => ({ ...err, [k]: '' }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 700 }}>
      <div>
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Manage your account information</p>
      </div>

      {/* User card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 72, height: 72,
          background: 'linear-gradient(135deg, var(--accent), #a78bfa)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, color: 'white', flexShrink: 0,
          boxShadow: '0 0 24px var(--accent-glow)',
        }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : initials}
        </div>
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>{user?.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 8 }}>{user?.email}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: user?.role === 'admin' ? 'var(--accent-light)' : 'var(--text-muted)' }}>
              <Shield size={12} /> {user?.role === 'admin' ? 'Administrator' : 'Member'}
            </span>
            {user?.createdAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                <Calendar size={12} /> Joined {format(new Date(user.createdAt), 'MMM yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <User size={18} color="var(--accent)" />
          <h3 style={{ fontSize: 16 }}>Personal Information</h3>
        </div>

        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={setProfile('name')}
              placeholder="Your name"
              style={{ borderColor: profileErrors.name ? 'var(--danger)' : undefined }}
            />
            {profileErrors.name && <span className="form-error">{profileErrors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={user?.email}
              disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email cannot be changed</span>
          </div>

          <div className="form-group">
            <label className="form-label">Avatar URL</label>
            <input
              type="url"
              value={profileForm.avatar}
              onChange={setProfile('avatar')}
              placeholder="https://example.com/avatar.jpg"
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Optional: paste any image URL</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={profileLoading}>
              <Save size={15} /> {profileLoading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Lock size={18} color="var(--accent)" />
          <h3 style={{ fontSize: 16 }}>Change Password</h3>
        </div>

        <form onSubmit={handlePwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: 'Your current password' },
            { key: 'newPassword', label: 'New Password', placeholder: 'Min 6 characters' },
            { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Repeat new password' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm[key]}
                  onChange={setPw(key)}
                  placeholder={placeholder}
                  style={{ paddingRight: key === 'currentPassword' ? 14 : 44, borderColor: pwErrors[key] ? 'var(--danger)' : undefined }}
                />
                {key === 'newPassword' && (
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
              {pwErrors[key] && <span className="form-error">{pwErrors[key]}</span>}
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              <Lock size={15} /> {pwLoading ? 'Changing…' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
