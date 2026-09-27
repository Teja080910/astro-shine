'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { Pagination, unwrapList } from '@/components/Pagination';
import { api } from '@/lib/api';

export default function ReleasesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [appName, setAppName] = useState('');
  const [platform, setPlatform] = useState('android');
  const [version, setVersion] = useState('');
  const [buildNumber, setBuildNumber] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('q', debouncedSearch);
    api.get<any>(`/releases?${params.toString()}`)
      .then((res) => {
        const list = unwrapList<any>(res);
        setData(list.data);
        setTotal(list.total);
        setTotalPages(list.totalPages);
      })
      .catch((e) => setError(e.message || 'Failed to load releases'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openForm = (r: any) => {
    setSelected(r);
    setAppName(r?.appName || '');
    setPlatform(r?.platform || 'android');
    setVersion(r?.version || '');
    setBuildNumber(String(r?.buildNumber ?? ''));
    setReleaseNotes(r?.releaseNotes || '');
    setDownloadUrl(r?.downloadUrl || '');
    setIsMandatory(r?.isMandatory || false);
  };

  const handleSave = async () => {
    if (!appName || !version || !buildNumber) return;
    const payload = { appName, platform, version, buildNumber: parseInt(buildNumber), releaseNotes, downloadUrl, isMandatory };
    try {
      if (selected?.id) {
        await api.put(`/releases/${selected.id}`, payload);
        setSelected(null);
        fetchData();
      } else {
        await api.post('/releases', payload);
        setSelected(null);
        if (page !== 1) setPage(1);
        else fetchData();
      }
    } catch (e: any) { alert(e.message || 'Failed to save'); }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">App Releases</h1>
        <button onClick={() => openForm(null)} className="gradient-btn">Add Release</button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by app, platform or version..." onEnter={() => { setDebouncedSearch(search); setPage(1); }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading releases...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <>
          <Table headers={['App', 'Platform', 'Version', 'Build', 'Mandatory', 'Status', 'Date', '']} emptyMessage="No releases found">
            {data.map((r: any) => (
              <tr key={r.id} className="border-b border-divider hover:bg-surface-light/50">
                <td className="px-4 py-3 text-text-primary font-bold">{r.appName}</td>
                <td className="px-4 py-3"><Badge variant="info">{r.platform}</Badge></td>
                <td className="px-4 py-3 text-text-secondary">{r.version}</td>
                <td className="px-4 py-3 text-text-secondary">{r.buildNumber}</td>
                <td className="px-4 py-3">{r.isMandatory ? <Badge variant="danger">Yes</Badge> : <Badge variant="info">No</Badge>}</td>
                <td className="px-4 py-3">{r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
                <td className="px-4 py-3 text-text-muted text-sm">{r.releasedAt ? formatDate(r.releasedAt) : formatDate(r.createdAt)}</td>
                <td className="px-4 py-3"><button onClick={() => openForm(r)} className="text-primary-light hover:underline text-sm font-medium">Edit</button></td>
              </tr>
            ))}
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </>
      )}

      <CustomModal open={!!selected || selected === null} onClose={() => setSelected(undefined)} title={selected?.id ? 'Edit Release' : 'Add Release'}>
        <div className="space-y-4 text-text-secondary text-sm p-2">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-text-primary font-medium mb-1">App Name</label><input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} className="input-field text-sm" /></div>
            <div><label className="block text-text-primary font-medium mb-1">Platform</label><select value={platform} onChange={(e) => setPlatform(e.target.value)} className="input-field text-sm"><option value="android">Android</option><option value="ios">iOS</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-text-primary font-medium mb-1">Version</label><input type="text" value={version} onChange={(e) => setVersion(e.target.value)} className="input-field text-sm" placeholder="1.0.0" /></div>
            <div><label className="block text-text-primary font-medium mb-1">Build Number</label><input type="number" value={buildNumber} onChange={(e) => setBuildNumber(e.target.value)} className="input-field text-sm" /></div>
          </div>
          <div><label className="block text-text-primary font-medium mb-1">Release Notes</label><textarea value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} className="input-field h-20 text-sm" /></div>
          <div><label className="block text-text-primary font-medium mb-1">Download URL</label><input type="text" value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} className="input-field text-sm" /></div>
          <label className="flex items-center gap-2 text-text-primary"><input type="checkbox" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)} className="w-4 h-4" /> Mandatory Update</label>
          <div className="flex gap-3 pt-3 border-t border-divider">
            <GradientButton onClick={handleSave}>Save</GradientButton>
            <GradientButton onClick={() => setSelected(null)}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
