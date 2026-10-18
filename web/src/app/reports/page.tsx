'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { api } from '@/lib/api';
import type { Report } from '@astro-shine/shared-types';

const REASONS = ['spam', 'harassment', 'fake_profile', 'inappropriate', 'other'] as const;
const STATUSES = ['pending', 'reviewed'] as const;

function reportTarget(r: Report): { role: string; name?: string; id?: string } {
  if (r.reportedAstrologerId || r.reportedAstrologerName) {
    return { role: 'Astrologer', name: r.reportedAstrologerName, id: r.reportedAstrologerId };
  }
  if (r.reportedUserId || r.reportedUserName) {
    return { role: 'User', name: r.reportedUserName, id: r.reportedUserId };
  }
  return { role: 'Unknown' };
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="text-text-primary font-medium break-words">{children}</div>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [editing, setEditing] = useState<Report | null>(null);
  const [form, setForm] = useState({ reason: 'other' as string, description: '', status: 'pending' as string });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [actionError, setActionError] = useState('');
  const [viewing, setViewing] = useState<Report | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const fetchReports = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    api.get<any>(`/reports?${params.toString()}`)
      .then((res) => {
        const { data, total, totalPages } = unwrapList<Report>(res);
        setData(data);
        setTotal(total);
        setTotalPages(totalPages);
      })
      .catch((e) => setError(e.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const openView = (r: Report) => {
    setViewing(r);
    setResolveError('');
  };

  const resolve = async (report: Report) => {
    setResolving(true);
    setResolveError('');
    try {
      const updated = await api.put<Report>(`/reports/${report.id}/resolve`, {});
      const next: Report = {
        ...report,
        ...(updated || {}),
        status: 'reviewed',
        resolvedAt: updated?.resolvedAt || new Date().toISOString(),
      };
      setData(prev => prev.map(r => (r.id === report.id ? { ...r, ...next } : r)));
      setViewing(prev => (prev && prev.id === report.id ? { ...prev, ...next } : prev));
    } catch (e: any) {
      setResolveError(e.message || 'Failed to resolve report');
    } finally {
      setResolving(false);
    }
  };

  const openEdit = (r: Report) => {
    setEditing(r);
    setForm({
      reason: r.reason || 'other',
      description: r.description || '',
      status: r.status || 'pending',
    });
    setFormError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setFormError('');
    try {
      await api.put(`/reports/${editing.id}`, {
        reason: form.reason,
        description: form.description.trim() || null,
        status: form.status,
      });
      setEditing(null);
      fetchReports();
    } catch (e: any) {
      setFormError(e.message || 'Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError('');
    try {
      await api.del(`/reports/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchReports();
    } catch (e: any) {
      setActionError(e.message || 'Failed to delete report');
    }
  };

  const viewedTarget = viewing ? reportTarget(viewing) : null;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Reports</h1>
        <span className="text-text-secondary">{total} total</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search reports by reason or status..." onEnter={(v) => { setDebouncedSearch(v); setPage(1); }} />
      </div>

      {resolveError && !viewing && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-2 text-sm mb-4">{resolveError}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading reports...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <Table headers={['Reporter', 'Reported Target', 'Reason', 'Description', 'Status', 'Date', '']} emptyMessage="No reports found">
          {data.map(r => (
            <tr key={r.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary">
                <div className="font-medium">{r.reporterName || 'Unknown'}</div>
                <div className="text-xs text-text-muted capitalize">{r.reporterRole} ({r.reporterId?.slice(0, 8)}...)</div>
              </td>
              <td className="px-4 py-3 text-text-primary">
                {r.reportedAstrologerName ? (
                  <div>
                    <span className="font-medium text-amber-400">Astro: </span>
                    <span className="font-medium">{r.reportedAstrologerName}</span>
                  </div>
                ) : r.reportedUserName ? (
                  <div>
                    <span className="font-medium text-blue-400">User: </span>
                    <span>{r.reportedUserName}</span>
                  </div>
                ) : r.reportedAstrologerId ? (
                  <div>Astro: {r.reportedAstrologerId?.slice(0, 8)}...</div>
                ) : (
                  <div>User: {r.reportedUserId?.slice(0, 8) || 'N/A'}...</div>
                )}
              </td>
              <td className="px-4 py-3 text-text-secondary capitalize">{r.reason?.replace(/_/g, ' ')}</td>
              <td className="px-4 py-3 text-text-muted text-sm max-w-xs truncate" title={r.description || undefined}>{r.description || '—'}</td>
              <td className="px-4 py-3">{r.status === 'reviewed' ? <Badge variant="success">Reviewed</Badge> : <Badge variant="warning">Pending</Badge>}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(r.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <button onClick={() => openView(r)} className="text-primary-light hover:underline text-sm font-medium">View</button>
                  {r.status !== 'reviewed' && (
                    <button onClick={() => resolve(r)} disabled={resolving} className="text-primary-light hover:underline text-sm font-medium disabled:opacity-50">Resolve</button>
                  )}
                  <button onClick={() => openEdit(r)} className="text-primary-light hover:underline text-sm font-medium">Edit</button>
                  <button onClick={() => { setDeleteTarget(r); setActionError(''); }} className="text-danger hover:underline text-sm font-medium">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {!loading && !error && total > 0 && (
        <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
      )}

      <CustomModal open={!!viewing} onClose={() => setViewing(null)} title="Report Details">
        {viewing && (
          <div className="space-y-4 text-text-secondary text-sm">
            {resolveError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-2">{resolveError}</div>
            )}

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-text-muted mb-1">Status</div>
                {viewing.status === 'reviewed' ? <Badge variant="success">Reviewed</Badge> : <Badge variant="warning">Pending</Badge>}
              </div>
              <div className="text-right min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-text-muted mb-1">Report ID</div>
                <div className="text-xs font-mono text-text-primary break-all">{viewing.id}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label="Reporter">
                {viewing.reporterName || 'Unknown'}
                <div className="text-xs font-normal text-text-muted capitalize mt-0.5">
                  {viewing.reporterRole} · {viewing.reporterId?.slice(0, 8) || '—'}…
                </div>
              </DetailField>
              <DetailField label={`Reported ${viewedTarget?.role || 'Target'}`}>
                {viewedTarget?.name || 'Unknown'}
                <div className="text-xs font-normal text-text-muted mt-0.5">
                  {viewedTarget?.id ? `${viewedTarget.id.slice(0, 8)}…` : 'No ID'}
                </div>
              </DetailField>
              <DetailField label="Reason">
                <span className="capitalize">{viewing.reason?.replace(/_/g, ' ')}</span>
              </DetailField>
              <DetailField label="Filed">{formatDate(viewing.createdAt)}</DetailField>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-text-muted mb-1">Description</div>
              <p
                className="text-text-primary whitespace-pre-wrap break-words rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--surface-light)' }}
              >
                {viewing.description || 'No description provided.'}
              </p>
            </div>

            {viewing.status === 'reviewed' && (
              <div className="text-xs text-text-muted">
                Resolved {formatDate(viewing.resolvedAt)}
                {viewing.resolvedBy ? ` by admin ${viewing.resolvedBy.slice(0, 8)}…` : ''}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-6">
              {viewing.status !== 'reviewed' && (
                <GradientButton onClick={() => resolve(viewing)} disabled={resolving}>
                  {resolving ? 'Resolving...' : 'Resolve Report'}
                </GradientButton>
              )}
              <GradientButton onClick={() => { const r = viewing; setViewing(null); openEdit(r); }}>Edit</GradientButton>
              <GradientButton variant="danger" onClick={() => setViewing(null)}>Close</GradientButton>
            </div>
          </div>
        )}
      </CustomModal>

      <CustomModal open={!!editing} onClose={() => setEditing(null)} title="Edit Report">
        {editing && (
          <div className="space-y-4 text-text-secondary text-sm">
            {formError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-2">{formError}</div>
            )}
            <p><span className="font-medium text-text-primary">Reporter:</span> {editing.reporterName || 'Unknown'}</p>
            <div>
              <label className="block text-text-primary font-medium mb-1">Reason</label>
              <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-field text-sm">
                {REASONS.map(reason => (
                  <option key={reason} value={reason}>{reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-text-primary font-medium mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field h-24 text-sm" placeholder="Report description" />
            </div>
            <div>
              <label className="block text-text-primary font-medium mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field text-sm">
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <GradientButton onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </GradientButton>
              <GradientButton variant="danger" onClick={() => setEditing(null)}>Cancel</GradientButton>
            </div>
          </div>
        )}
      </CustomModal>

      <CustomModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Report">
        {deleteTarget && (
          <div className="space-y-4 text-text-secondary text-sm">
            {actionError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg px-4 py-2">{actionError}</div>
            )}
            <p>Delete this report filed by <span className="font-bold text-text-primary">{deleteTarget.reporterName || 'Unknown'}</span>? This cannot be undone.</p>
            <div className="flex gap-3 mt-6">
              <GradientButton variant="danger" onClick={handleDelete}>Delete</GradientButton>
              <GradientButton onClick={() => setDeleteTarget(null)}>Cancel</GradientButton>
            </div>
          </div>
        )}
      </CustomModal>
    </AdminLayout>
  );
}
