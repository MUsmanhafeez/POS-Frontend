'use client';

import { FormEvent, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import {
  Archive,
  AudioLines,
  CloudUpload,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Image as ImageIcon,
  Info,
  Pencil,
  Presentation,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, Field, FormActions, Modal } from '@/components/ui';
import { fieldClass } from '@/lib/ui';
import { useT } from '@/stores/locale';

type MediaItem = {
  id: string;
  name: string;
  url: string;
  alt?: string;
  mimeType?: string;
  folder?: string;
};

type NavKey =
  | 'my-files'
  | 'documents'
  | 'images'
  | 'videos'
  | 'audio'
  | 'archives'
  | 'pdfs'
  | 'spreadsheets'
  | 'presentations';

const FOLDERS: Array<{ key: NavKey; label: string; icon: typeof Folder; mode: 'folder' | 'type' }> = [
  { key: 'my-files', label: 'My Files', icon: FolderOpen, mode: 'folder' },
  { key: 'documents', label: 'Documents', icon: FileText, mode: 'type' },
  { key: 'images', label: 'Images', icon: ImageIcon, mode: 'type' },
  { key: 'videos', label: 'Videos', icon: Video, mode: 'type' },
  { key: 'audio', label: 'Audio', icon: AudioLines, mode: 'type' },
  { key: 'archives', label: 'Archives', icon: Archive, mode: 'type' },
];

const TYPES: Array<{ key: NavKey; label: string; icon: typeof Folder }> = [
  { key: 'pdfs', label: 'PDFs', icon: FileText },
  { key: 'spreadsheets', label: 'Spreadsheets', icon: FileSpreadsheet },
  { key: 'presentations', label: 'Presentations', icon: Presentation },
];

const TOOLBAR = [
  { id: 'refresh', label: 'Refresh', className: 'bg-emerald-500 hover:bg-emerald-600', icon: RefreshCw, needsFiles: true },
  { id: 'delete', label: 'Delete', className: 'bg-rose-500 hover:bg-rose-600', icon: Trash2, needsFiles: true },
  { id: 'info', label: 'Info', className: 'bg-sky-400 hover:bg-sky-500', icon: Info, needsFiles: true },
  { id: 'edit', label: 'Edit', className: 'bg-amber-400 hover:bg-amber-500', icon: Pencil, needsFiles: true },
  { id: 'folder', label: 'New folder', className: 'bg-teal-500 hover:bg-teal-600', icon: FolderPlus, needsFiles: false },
  { id: 'upload', label: 'Upload', className: 'bg-violet-600 hover:bg-violet-700', icon: Upload, needsFiles: false },
] as const;

function guessMime(name: string, url: string) {
  const src = `${name} ${url}`.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/.test(src)) return 'image/png';
  if (/\.(mp4|webm|mov|avi)(\?|$)/.test(src)) return 'video/mp4';
  if (/\.(mp3|wav|ogg|m4a)(\?|$)/.test(src)) return 'audio/mpeg';
  if (/\.pdf(\?|$)/.test(src)) return 'application/pdf';
  if (/\.(xls|xlsx|csv)(\?|$)/.test(src)) return 'application/vnd.ms-excel';
  if (/\.(ppt|pptx)(\?|$)/.test(src)) return 'application/vnd.ms-powerpoint';
  if (/\.(zip|rar|7z|tar|gz)(\?|$)/.test(src)) return 'application/zip';
  if (/\.(doc|docx|txt)(\?|$)/.test(src)) return 'application/msword';
  return 'application/octet-stream';
}

function isImage(item: MediaItem) {
  return String(item.mimeType || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(item.url);
}

export default function MediaPage() {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [nav, setNav] = useState<NavKey>('my-files');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [form, setForm] = useState({ name: '', url: '', alt: '', mime_type: 'image/*' });

  const hasFiles = items.length > 0;

  const navMeta = useMemo(() => {
    const all = [...FOLDERS, ...TYPES.map((t) => ({ ...t, mode: 'type' as const }))];
    return all.find((x) => x.key === nav) || FOLDERS[0];
  }, [nav]);

  async function load() {
    const params: Record<string, string> = {};
    if (search.trim()) params.search = search.trim();
    if (nav === 'my-files') {
      // all files
    } else if (FOLDERS.some((f) => f.key === nav && f.mode === 'type') || TYPES.some((t) => t.key === nav)) {
      params.type = nav;
    } else {
      params.folder = nav;
    }
    const { data } = await api.get('/media', { params });
    setItems(data.body || []);
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, search]);

  const selected = items.find((i) => i.id === selectedId) || null;
  const currentLabel =
    FOLDERS.find((f) => f.key === nav)?.label ||
    TYPES.find((t) => t.key === nav)?.label ||
    customFolders.find((f) => f === nav) ||
    'My Files';

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length) return;
    setSaving(true);
    setUploadStatus('');
    try {
      const folder =
        customFolders.includes(nav) || (nav !== 'my-files' && navMeta.mode === 'folder') ? nav : 'my-files';
      for (const file of files) {
        const url = await readFileAsDataUrl(file);
        await api.post('/media', {
          name: file.name,
          url,
          mime_type: file.type || guessMime(file.name, file.name),
          alt: file.name,
          folder,
        });
      }
      setUploadStatus(`${files.length} file(s) uploaded`);
      setUploadOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      setUploadStatus(t('Upload failed'));
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files).catch(console.error);
  }

  async function onEdit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/media/${selected.id}`, form);
      setEditOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!selected) {
      alert(t('Select a file first'));
      return;
    }
    if (!confirm(`Delete “${selected.name}”?`)) return;
    await api.delete(`/media/${selected.id}`);
    setSelectedId(null);
    await load();
  }

  function onToolbar(id: (typeof TOOLBAR)[number]['id']) {
    if (id === 'refresh') {
      load().catch(console.error);
      return;
    }
    if (id === 'delete') {
      onDelete().catch(console.error);
      return;
    }
    if (id === 'info') {
      if (!selected) {
        alert(t('Select a file first'));
        return;
      }
      setInfoOpen(true);
      return;
    }
    if (id === 'edit') {
      if (!selected) {
        alert(t('Select a file first'));
        return;
      }
      setForm({
        name: selected.name,
        url: selected.url,
        alt: selected.alt || '',
        mime_type: selected.mimeType || 'image/*',
      });
      setEditOpen(true);
      return;
    }
    if (id === 'folder') {
      setNewFolderName('');
      setFolderOpen(true);
      return;
    }
    if (id === 'upload') {
      setUploadStatus('');
      setDragOver(false);
      setUploadOpen(true);
    }
  }

  function createFolder(e: FormEvent) {
    e.preventDefault();
    const slug = newFolderName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!slug) return;
    if (!customFolders.includes(slug)) setCustomFolders((f) => [...f, slug]);
    setNav(slug as NavKey);
    setFolderOpen(false);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-plum" />
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">{t('Media')}</h1>
        </div>
        <div className="text-sm text-muted">
          {t('Home')} &gt; {t('Media')}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="grid min-h-[520px] lg:grid-cols-[220px_1fr]">
          {/* Media left nav */}
          <aside className="border-b border-border bg-surface-muted/40 p-3 lg:border-b-0 lg:border-e">
            <div className="mb-4">
              <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{t('Folders')}</div>
              <nav className="space-y-0.5">
                {FOLDERS.map((item) => {
                  const Icon = item.icon;
                  const active = nav === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setNav(item.key);
                        setSelectedId(null);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm ${
                        active ? 'bg-white font-semibold text-foreground shadow-sm' : 'text-foreground/80 hover:bg-white/70'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-muted" />
                      {t(item.label)}
                    </button>
                  );
                })}
                {customFolders.map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => {
                      setNav(folder as NavKey);
                      setSelectedId(null);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm capitalize ${
                      nav === folder ? 'bg-white font-semibold text-foreground shadow-sm' : 'text-foreground/80 hover:bg-white/70'
                    }`}
                  >
                    <Folder className="h-4 w-4 text-muted" />
                    {folder.replace(/-/g, ' ')}
                  </button>
                ))}
              </nav>
            </div>
            <div>
              <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{t('Types')}</div>
              <nav className="space-y-0.5">
                {TYPES.map((item) => {
                  const Icon = item.icon;
                  const active = nav === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setNav(item.key);
                        setSelectedId(null);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-sm ${
                        active ? 'bg-white font-semibold text-foreground shadow-sm' : 'text-foreground/80 hover:bg-white/70'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-muted" />
                      {t(item.label)}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main pane */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="relative min-w-[220px] max-w-md flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  className={`${fieldClass} ps-9`}
                  placeholder={t('Search in current folder...')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {TOOLBAR.map((btn) => {
                  const Icon = btn.icon;
                  const disabled = btn.needsFiles && !hasFiles;
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      title={t(btn.label)}
                      aria-label={t(btn.label)}
                      disabled={disabled || saving}
                      onClick={() => onToolbar(btn.id)}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm transition ${btn.className} disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-b border-border px-4 py-2 text-sm text-muted">{t(currentLabel)}</div>

            <div className="flex-1 p-4">
              {items.length === 0 ? (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                  <Folder className="mb-4 h-20 w-20 stroke-[1.25] text-muted/50" />
                  <p className="max-w-sm text-sm text-muted">
                    {t('This folder is empty. Start by uploading a file or creating a new folder.')}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {items.map((item) => {
                    const active = selectedId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        onDoubleClick={() => window.open(item.url, '_blank')}
                        className={`rounded-xl border p-3 text-left transition ${
                          active ? 'border-plum bg-plum/5 ring-2 ring-plum/20' : 'border-border hover:border-plum/40'
                        }`}
                      >
                        <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
                          {isImage(item) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt={item.alt || item.name} className="h-full w-full object-cover" />
                          ) : (
                            <FileText className="h-10 w-10 text-muted" />
                          )}
                        </div>
                        <div className="truncate text-sm font-medium text-foreground">{item.name}</div>
                        <div className="truncate text-xs text-muted">{item.mimeType || 'file'}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Modal open={uploadOpen} title={t('Upload Files')} onClose={() => setUploadOpen(false)} wide>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files).catch(console.error);
          }}
        />
        <button
          type="button"
          disabled={saving}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={onDrop}
          className={`flex min-h-[240px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
            dragOver ? 'border-brand bg-brand-soft/40' : 'border-border bg-surface-muted/30 hover:border-brand/50'
          } disabled:opacity-60`}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface text-muted shadow-sm">
            <CloudUpload className="h-8 w-8" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {saving ? t('Uploading...') : t('Drop files here or click to upload')}
          </p>
          {uploadStatus ? <p className="mt-2 text-xs text-muted">{uploadStatus}</p> : null}
        </button>
      </Modal>

      <Modal
        open={editOpen}
        title={t('Edit file')}
        onClose={() => setEditOpen(false)}
        footer={<FormActions formId="media-edit" onCancel={() => setEditOpen(false)} saving={saving} submitLabel={t('Save')} />}
      >
        <form id="media-edit" onSubmit={onEdit} className="space-y-3">
          <Field label={t('Name')}>
            <input className={fieldClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label={t('File URL')}>
            <input className={fieldClass} required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </Field>
          <Field label={t('Alt text')}>
            <input className={fieldClass} value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <Modal open={infoOpen} title={t('File info')} onClose={() => setInfoOpen(false)}>
        {selected ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">{t('Name')}</dt><dd className="font-medium">{selected.name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">{t('Type')}</dt><dd>{selected.mimeType || '—'}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">{t('Folder')}</dt><dd>{selected.folder || 'my-files'}</dd></div>
            <div><dt className="mb-1 text-muted">{t('URL')}</dt><dd className="break-all text-xs">{selected.url}</dd></div>
          </dl>
        ) : null}
      </Modal>

      <Modal
        open={folderOpen}
        title={t('Create folder')}
        onClose={() => setFolderOpen(false)}
        footer={<FormActions formId="folder-form" onCancel={() => setFolderOpen(false)} saving={false} submitLabel={t('Create')} />}
      >
        <form id="folder-form" onSubmit={createFolder} className="space-y-3">
          <Field label={t('Folder name')}>
            <input className={fieldClass} required value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
