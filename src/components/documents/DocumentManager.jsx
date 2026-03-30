import { useState, useMemo } from 'react';
import {
  FileText, Image, File, Grid3x3, List, Search, Filter, Download, Eye,
  Trash2, FolderOpen, HardDrive, ChevronDown, X, AlertTriangle,
} from 'lucide-react';
import { DOCUMENT_TYPES } from '../../data/constants';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/helpers';

const MAX_STORAGE = 50 * 1024 * 1024; // 50 MB simulated cap

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType, size = 'w-5 h-5') {
  if (mimeType?.startsWith('image/')) return <Image className={`${size} text-green-600`} />;
  if (mimeType === 'application/pdf') return <FileText className={`${size} text-red-500`} />;
  return <File className={`${size} text-gray-500`} />;
}

function getTypeLabel(typeId) {
  return DOCUMENT_TYPES.find((dt) => dt.id === typeId)?.label || typeId || 'Unknown';
}

function getStatusBadge(status) {
  const styles = {
    uploaded: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

export default function DocumentManager() {
  const { user } = useAuth();
  const { getDocsByUser, documents } = useApp();

  const userDocs = useMemo(
    () => (user ? getDocsByUser(user.id) : []),
    [user, documents]
  );

  const [view, setView] = useState('grid'); // 'grid' | 'list' | 'categories'
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const filtered = useMemo(() => {
    let list = userDocs;
    if (filterType) list = list.filter((d) => d.type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.fileName?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          getTypeLabel(d.type).toLowerCase().includes(q)
      );
    }
    return list;
  }, [userDocs, filterType, search]);

  const usedStorage = useMemo(
    () => userDocs.reduce((acc, d) => acc + (d.fileSize || 0), 0),
    [userDocs]
  );

  const categories = useMemo(() => {
    const map = {};
    userDocs.forEach((d) => {
      const label = getTypeLabel(d.type);
      if (!map[label]) map[label] = [];
      map[label].push(d);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [userDocs]);

  const handleDelete = (doc) => setDeleteTarget(doc);

  const confirmDelete = () => {
    // In a real app we would call a deleteDocument function from context.
    // For now, we just close the dialog. The context doesn't expose delete yet.
    setDeleteTarget(null);
  };

  const handleView = (doc) => {
    if (doc.data) {
      setPreviewDoc(doc);
    }
  };

  const handleDownload = (doc) => {
    if (!doc.data) return;
    const a = document.createElement('a');
    a.href = doc.data;
    a.download = doc.fileName || 'document';
    a.click();
  };

  // ---- Render helpers ----
  const renderGridCard = (doc) => (
    <div
      key={doc.id}
      className="card-hover flex flex-col gap-3 group"
    >
      {/* Thumbnail */}
      <div className="h-28 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
        {doc.mimeType?.startsWith('image/') && doc.data ? (
          <img src={doc.data} alt="" className="w-full h-full object-cover" />
        ) : (
          getFileIcon(doc.mimeType, 'w-10 h-10')
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{doc.fileName}</p>
        <p className="text-xs text-gray-500 truncate">{getTypeLabel(doc.type)}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">{formatFileSize(doc.fileSize)}</span>
          {getStatusBadge(doc.status)}
        </div>
        <p className="text-xs text-gray-400 mt-1">{formatDate(doc.uploadedAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => handleView(doc)}
          className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-[#003366]"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDownload(doc)}
          className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-[#003366]"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(doc)}
          className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderListRow = (doc) => (
    <div
      key={doc.id}
      className="flex items-center gap-4 px-4 py-3 bg-white border border-gray-100 rounded-lg hover:shadow-md hover:border-[#c5a55a] transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        {getFileIcon(doc.mimeType)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{doc.fileName}</p>
        <p className="text-xs text-gray-500">{getTypeLabel(doc.type)}</p>
      </div>
      <div className="hidden sm:block text-xs text-gray-400 w-20 text-right">
        {formatFileSize(doc.fileSize)}
      </div>
      <div className="hidden md:block w-28">{getStatusBadge(doc.status)}</div>
      <div className="hidden lg:block text-xs text-gray-400 w-32 text-right">
        {formatDate(doc.uploadedAt)}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => handleView(doc)}
          className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-[#003366]"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDownload(doc)}
          className="p-1.5 rounded hover:bg-blue-50 text-gray-500 hover:text-[#003366]"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(doc)}
          className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Storage Indicator */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <HardDrive className="w-4 h-4" />
            Storage Usage
          </div>
          <span className="text-xs text-gray-500">
            {formatFileSize(usedStorage)} / {formatFileSize(MAX_STORAGE)}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usedStorage / MAX_STORAGE > 0.8 ? 'bg-red-500' : 'bg-[#003366]'
            }`}
            style={{ width: `${Math.min((usedStorage / MAX_STORAGE) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {userDocs.length} document{userDocs.length !== 1 ? 's' : ''} uploaded
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            className="input-field pl-10 pr-8 appearance-none min-w-[180px]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {DOCUMENT_TYPES.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 self-start">
          {[
            { id: 'grid', icon: Grid3x3, label: 'Grid' },
            { id: 'list', icon: List, label: 'List' },
            { id: 'categories', icon: FolderOpen, label: 'Categories' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                view === id
                  ? 'bg-white shadow text-[#003366]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-500">No documents found</p>
          <p className="text-sm text-gray-400">
            {userDocs.length === 0
              ? 'Upload your first document to get started.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(renderGridCard)}
        </div>
      ) : view === 'list' ? (
        <div className="space-y-2">{filtered.map(renderListRow)}</div>
      ) : (
        /* Categories view */
        <div className="space-y-6">
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No categories yet.</p>
          ) : (
            categories.map(([label, docs]) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="w-5 h-5 text-[#c5a55a]" />
                  <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {docs.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {docs.map(renderGridCard)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Delete Document</h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteTarget.fileName}</span>?
            </p>
            <p className="text-xs text-gray-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-outline text-sm px-4 py-2"
              >
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-danger text-sm px-4 py-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                {getFileIcon(previewDoc.mimeType)}
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {previewDoc.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getTypeLabel(previewDoc.type)} &middot;{' '}
                    {formatFileSize(previewDoc.fileSize)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
              {previewDoc.mimeType?.startsWith('image/') ? (
                <img
                  src={previewDoc.data}
                  alt={previewDoc.fileName}
                  className="max-w-full max-h-[60vh] rounded shadow"
                />
              ) : previewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewDoc.data}
                  title={previewDoc.fileName}
                  className="w-full h-[60vh] rounded"
                />
              ) : (
                <p className="text-gray-500 text-sm">Preview not available for this file type.</p>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => handleDownload(previewDoc)}
                className="btn-primary text-sm px-4 py-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
