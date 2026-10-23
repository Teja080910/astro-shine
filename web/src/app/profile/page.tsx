'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { ImageUpload } from '@/components/ImageUpload';
import { useAuthStore, type AdminUser } from '@/store/auth';
import { api } from '@/lib/api';
import { imageSrc } from '@/lib/media';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';

export default function ProfilePage() {
  const { admin, updateAdmin } = useAuthStore();
  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [phone, setPhone] = useState(admin?.phone || '');
  const [avatar, setAvatar] = useState(admin?.avatar || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    api.get<AdminUser>('/users/profile')
      .then((profile) => {
        updateAdmin(profile);
        setName(profile.name || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        setAvatar(profile.avatar || '');
      })
      .catch((e) => setError(e.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [updateAdmin]);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) { setError('Name is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.put<AdminUser>('/users/profile', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        avatar: avatar || null,
      });
      updateAdmin(updated);
      setName(updated.name || '');
      setEmail(updated.email || '');
      setPhone(updated.phone || '');
      setAvatar(updated.avatar || '');
      setSuccess('Profile updated successfully');
    } catch (e: any) {
      setError(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) { setPasswordError('Current password is required'); return; }
    if (newPassword.length < 6) { setPasswordError('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match'); return; }

    setPasswordSaving(true);
    try {
      await api.post('/users/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password changed successfully');
    } catch (e: any) {
      setPasswordError(e.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">My Profile</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your account details, profile photo, and password</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading profile...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6 items-start">
          <section className="glass-card-solid p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-tr from-primary to-accent-gold flex items-center justify-center text-white font-black text-4xl shadow-lg ring-4 ring-primary/10">
                {avatar ? (
                  <img src={imageSrc(avatar)} alt={name || 'Admin'} className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase() || 'A'
                )}
              </div>
              <h2 className="text-xl font-extrabold text-text-primary mt-4">{name || 'Admin'}</h2>
              <p className="text-sm text-text-secondary break-all mt-1">{email}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck size={13} />
                {admin?.role || 'admin'}
              </span>
            </div>

            <div className="border-t border-divider mt-6 pt-5">
              <label className="block text-text-primary font-semibold text-sm mb-3">Profile Photo</label>
              <ImageUpload
                value={avatar ? [avatar] : []}
                onChange={(urls) => setAvatar(urls[0] || '')}
                hint="PNG, JPG or WEBP. Square images look best."
              />
            </div>
          </section>

          <div className="space-y-6">
            <section className="glass-card-solid p-6">
              <div className="flex items-center gap-2 mb-5">
                <User size={18} className="text-accent-gold" />
                <h2 className="text-lg font-extrabold text-text-primary">Basic Details</h2>
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-2xl px-4 py-3 mb-5 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="font-medium">{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-success/10 border border-success/20 text-success text-sm rounded-2xl px-4 py-3 mb-5 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="font-medium">{success}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-text-secondary text-sm font-bold mb-2">Full Name</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"><User size={17} /></span>
                      <input
                        className="input-field pl-11"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Admin name"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm font-bold mb-2">Phone</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"><Phone size={17} /></span>
                      <input
                        className="input-field pl-11"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        inputMode="tel"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary text-sm font-bold mb-2">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"><Mail size={17} /></span>
                    <input
                      type="email"
                      className="input-field pl-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@astroshine.com"
                      required
                    />
                  </div>
                  <p className="text-text-muted text-xs mt-2">Use this email to sign in to the admin panel.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={saving} className="gradient-btn inline-flex items-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </section>

            <section className="glass-card-solid p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lock size={18} className="text-accent-gold" />
                <h2 className="text-lg font-extrabold text-text-primary">Change Password</h2>
              </div>

              {passwordError && (
                <div className="bg-danger/10 border border-danger/20 text-danger text-sm rounded-2xl px-4 py-3 mb-5 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="font-medium">{passwordError}</span>
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-success/10 border border-success/20 text-success text-sm rounded-2xl px-4 py-3 mb-5 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span className="font-medium">{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-text-secondary text-sm font-bold mb-2">Current Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"><Lock size={17} /></span>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      className="input-field pl-11 pr-12"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                      {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-text-secondary text-sm font-bold mb-2">New Password</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"><Lock size={17} /></span>
                      <input
                        type={showNew ? 'text' : 'password'}
                        className="input-field pl-11 pr-12"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                        {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm font-bold mb-2">Confirm New Password</label>
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="input-field"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={passwordSaving} className="gradient-btn inline-flex items-center gap-2">
                    {passwordSaving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
