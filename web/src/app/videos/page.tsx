'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, GradientButton, CustomModal } from '@/components/UIComponents';
import { SearchInput } from '@/components/SearchInput';
import { ImageUpload } from '@/components/ImageUpload';
import { Pagination, unwrapList } from '@/components/Pagination';
import { imageSrc } from '@/lib/media';
import { api } from '@/lib/api';

function getYouTubeId(url?: string | null): string | null {
  const m = (url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function videoThumb(v: any): string | null {
  const yt = getYouTubeId(v?.url);
  return v?.thumbnail || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null);
}

export default function VideosPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [preview, setPreview] = useState<any>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('q', debouncedSearch);
    api.get<any>(`/videos/admin?${params.toString()}`)
      .then((res) => {
        const list = unwrapList<any>(res);
        setData(list.data);
        setTotal(list.total);
        setTotalPages(list.totalPages);
      })
      .catch((e) => setError(e.message || 'Failed to load videos'))
      .finally(() => setLoading(false));
  }, [page, limit, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openForm = (v: any) => {
    setSelected(v);
    setShowForm(true);
    setTitle(v?.title || '');
    setDescription(v?.description || '');
    setUrl(v?.url || '');
    setCategory(v?.category || '');
    setDuration(String(v?.duration ?? ''));
    setThumbnail(v?.thumbnail || '');
    setUploadError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setSelected(null);
    setUploadError('');
    setUploadingVideo(false);
  };

  const handleVideoFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setUploadError('Please choose a video file (MP4, MOV, WEBM)');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Video must be 100MB or smaller');
      return;
    }
    setUploadingVideo(true);
    setUploadError('');
    try {
      try {
        const res = await api.upload(file, 'minio');
        setUrl(res.url);
      } catch {
        const res = await api.upload(file, 'local');
        setUrl(res.url);
      }
    } catch (e: any) {
      setUploadError(e.message || 'Video upload failed');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim() || uploadingVideo) return;
    const payload = { title, description, url, thumbnail: thumbnail || null, category, duration: duration ? parseInt(duration) : null };
    try {
      if (selected?.id) {
        await api.put(`/videos/${selected.id}`, payload);
        closeForm();
        fetchData();
      } else {
        await api.post('/videos', payload);
        closeForm();
        if (page !== 1) setPage(1);
        else fetchData();
      }
    } catch (e: any) { alert(e.message || 'Failed to save'); }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Videos</h1>
        <button onClick={() => openForm(null)} className="gradient-btn">Add Video</button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by title or category..." onEnter={() => { setDebouncedSearch(search); setPage(1); }} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading videos...</div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : (
        <>
          <Table headers={['', 'Title', 'Category', 'Duration', 'Status', 'Date', '']} emptyMessage="No videos found">
            {data.map((v: any) => (
              <tr key={v.id} className="border-b border-divider hover:bg-surface-light/50">
                <td className="px-4 py-2">
                  {videoThumb(v) ? (
                    <img src={imageSrc(videoThumb(v))} alt="" className="w-16 h-10 object-cover rounded border border-divider bg-surface-light" />
                  ) : (
                    <div className="w-16 h-10 rounded border border-divider bg-surface-light flex items-center justify-center text-text-muted text-xs">No cover</div>
                  )}
                </td>
                <td className="px-4 py-3 text-text-primary font-medium max-w-xs truncate">{v.title}</td>
                <td className="px-4 py-3 text-text-secondary">{v.category || '-'}</td>
                <td className="px-4 py-3 text-text-secondary">{v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, '0')}` : '-'}</td>
                <td className="px-4 py-3">{v.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</td>
                <td className="px-4 py-3 text-text-muted text-sm">{formatDate(v.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => setPreview(v)} className="text-primary-light hover:underline text-sm font-medium">View</button>
                    <button onClick={() => openForm(v)} className="text-primary-light hover:underline text-sm font-medium">Edit</button>
                  </div>
                </td>
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

      <CustomModal open={showForm} onClose={closeForm} title={selected?.id ? 'Edit Video' : 'Add Video'}>
        <div className="space-y-4 text-text-secondary text-sm p-2">
          <div><label className="block text-text-primary font-medium mb-1">Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field text-sm" /></div>
          <div><label className="block text-text-primary font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field h-20 text-sm" /></div>
          <div>
            <label className="block text-text-primary font-medium mb-1">Video URL</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="input-field text-sm" placeholder="https://... (YouTube link)" />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleVideoFile(e.target.files[0])}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                disabled={uploadingVideo}
                onClick={() => videoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-divider bg-surface-light/40 text-text-primary text-xs font-medium hover:border-primary-light hover:bg-primary/5 disabled:opacity-60"
              >
                {uploadingVideo ? 'Uploading...' : 'Upload video file'}
              </button>
              <span className="text-text-muted text-xs">or paste a YouTube link · MP4/MOV/WEBM up to 100MB</span>
            </div>
            {uploadError && <p className="text-red-400 text-xs mt-1">{uploadError}</p>}
          </div>
          <div>
            <label className="block text-text-primary font-medium mb-1">Thumbnail</label>
            <ImageUpload
              value={thumbnail ? [thumbnail] : []}
              onChange={(urls) => setThumbnail(urls[0] || '')}
              hint="Optional cover image (needed for uploaded videos; YouTube thumbnails are used automatically)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-text-primary font-medium mb-1">Category</label><input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="input-field text-sm" /></div>
            <div><label className="block text-text-primary font-medium mb-1">Duration (sec)</label><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="input-field text-sm" /></div>
          </div>
          <div className="flex gap-3 pt-3 border-t border-divider">
            <GradientButton onClick={handleSave} disabled={uploadingVideo}>Save</GradientButton>
            <button
              type="button"
              disabled={!url.trim()}
              onClick={() => setPreview({ title: title || 'Unsaved preview', description, url, thumbnail })}
              className="px-4 py-2 rounded-lg border border-divider bg-surface-light/40 text-text-primary text-sm font-medium hover:border-primary-light hover:bg-primary/5 disabled:opacity-50"
            >
              Preview
            </button>
            <GradientButton onClick={closeForm}>Cancel</GradientButton>
          </div>
        </div>
      </CustomModal>

      <CustomModal open={!!preview} onClose={() => setPreview(null)} title={preview?.title || 'Video Preview'}>
        <div className="p-2 text-text-secondary text-sm">
          {preview?.url ? (
            getYouTubeId(preview.url) ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(preview.url)}?autoplay=1`}
                className="w-full rounded-lg bg-black"
                style={{ aspectRatio: '16 / 9' }}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={preview?.title || 'Video preview'}
              />
            ) : (
              <video
                src={imageSrc(preview.url)}
                controls
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
                style={{ aspectRatio: '16 / 9' }}
              />
            )
          ) : (
            <p className="text-text-muted text-sm py-8 text-center">No video URL set for this video.</p>
          )}
          {preview?.description ? <p className="mt-3">{preview.description}</p> : null}
          <p className="text-text-muted text-xs mt-2 break-all">{preview?.url}</p>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
