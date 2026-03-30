import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, File, CheckCircle, AlertCircle } from 'lucide-react';
import { DOCUMENT_TYPES } from '../../data/constants';
import { fileToBase64, generateId } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type) {
  if (type?.startsWith('image/')) return <Image className="w-5 h-5 text-green-600" />;
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

export default function DocumentUpload({ onUploadComplete, preselectedType = '' }) {
  const { user } = useAuth();
  const { uploadDocument } = useApp();
  const fileInputRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedType, setSelectedType] = useState(preselectedType);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const validateFile = (file) => {
    const errs = [];
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errs.push(`"${file.name}" is not a supported format. Use PDF, JPG, or PNG.`);
    }
    if (file.size > MAX_SIZE) {
      errs.push(`"${file.name}" exceeds the 5 MB size limit (${formatFileSize(file.size)}).`);
    }
    return errs;
  };

  const handleFiles = useCallback((incoming) => {
    const newErrors = [];
    const valid = [];
    Array.from(incoming).forEach((f) => {
      const errs = validateFile(f);
      if (errs.length) {
        newErrors.push(...errs);
      } else {
        valid.push(f);
      }
    });
    setErrors(newErrors);
    setFiles((prev) => [...prev, ...valid]);

    // generate image previews
    valid.forEach((f) => {
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((p) =>
              p === f ? Object.assign(f, { preview: e.target.result }) : p
            )
          );
        };
        reader.readAsDataURL(f);
      }
    });
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    if (!selectedType) {
      setErrors(['Please select a document type.']);
      return;
    }

    setUploading(true);
    setErrors([]);
    const completed = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // simulate progress per file
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? Object.assign(f, { progress: 0 }) : f))
      );

      // animate progress
      for (let p = 0; p <= 100; p += 10) {
        await new Promise((r) => setTimeout(r, 40));
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? Object.assign(f, { progress: p }) : f))
        );
      }

      const base64 = await fileToBase64(file);
      const doc = uploadDocument({
        userId: user?.id,
        type: selectedType,
        description,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        data: base64,
        status: 'uploaded',
      });
      completed.push(doc);
    }

    setUploadedFiles(completed);
    setFiles([]);
    setDescription('');
    setUploading(false);
    onUploadComplete?.(completed);
  };

  return (
    <div className="space-y-6">
      {/* Document Type Selector */}
      <div>
        <label className="label-field">Document Type</label>
        <select
          className="input-field"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">-- Select document type --</option>
          {DOCUMENT_TYPES.map((dt) => (
            <option key={dt.id} value={dt.id}>
              {dt.label} {dt.required ? '*' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="label-field">Description (optional)</label>
        <input
          type="text"
          className="input-field"
          placeholder="Add a brief description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-[#003366] bg-blue-50 scale-[1.01]'
            : 'border-gray-300 hover:border-[#c5a55a] hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Upload
          className={`w-12 h-12 mx-auto mb-3 transition-colors ${
            dragOver ? 'text-[#003366]' : 'text-gray-400'
          }`}
        />
        <p className="text-lg font-semibold text-gray-700">
          {dragOver ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          or <span className="text-[#003366] font-medium underline">browse files</span>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Supported: PDF, JPG, PNG &middot; Max 5 MB per file
        </p>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Selected Files ({files.length})
          </h3>
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              {/* Preview or icon */}
              {file.preview ? (
                <img
                  src={file.preview}
                  alt=""
                  className="w-12 h-12 rounded object-cover border"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-white border flex items-center justify-center">
                  {getFileIcon(file.type)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)} &middot;{' '}
                  {file.type.split('/')[1]?.toUpperCase()}
                </p>
                {/* Progress bar */}
                {typeof file.progress === 'number' && (
                  <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#003366] rounded-full transition-all duration-150"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {!uploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary w-full justify-center"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {files.length} File{files.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {/* Completed uploads */}
      {uploadedFiles.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-800 font-semibold text-sm">
            <CheckCircle className="w-5 h-5" />
            Successfully uploaded {uploadedFiles.length} file
            {uploadedFiles.length !== 1 ? 's' : ''}
          </div>
          {uploadedFiles.map((doc) => (
            <div key={doc.id} className="text-sm text-green-700 ml-7">
              {doc.fileName} &middot; {formatFileSize(doc.fileSize)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
