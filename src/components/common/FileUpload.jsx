import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, AlertCircle } from 'lucide-react';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024, // 10 MB default
  multiple = false,
  onUpload,
  label = 'Upload files',
}) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);

  const validateFile = useCallback(
    (file) => {
      const errs = [];
      if (maxSize && file.size > maxSize) {
        errs.push(`${file.name} exceeds ${formatBytes(maxSize)} limit.`);
      }
      if (accept) {
        const accepted = accept.split(',').map((t) => t.trim());
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        const matches = accepted.some(
          (a) =>
            a === ext ||
            a === file.type ||
            (a.endsWith('/*') && file.type.startsWith(a.replace('/*', '/')))
        );
        if (!matches) {
          errs.push(`${file.name} is not an accepted file type.`);
        }
      }
      return errs;
    },
    [accept, maxSize]
  );

  const processFiles = useCallback(
    (incoming) => {
      const fileList = Array.from(incoming);
      const allErrors = [];
      const valid = [];

      fileList.forEach((file) => {
        const errs = validateFile(file);
        if (errs.length > 0) {
          allErrors.push(...errs);
        } else {
          valid.push({
            file,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            preview: file.type.startsWith('image/')
              ? URL.createObjectURL(file)
              : null,
            progress: 0,
          });
        }
      });

      setErrors(allErrors);

      if (valid.length > 0) {
        const updated = multiple ? [...files, ...valid] : valid.slice(0, 1);
        setFiles(updated);

        // Simulate upload progress for each new file
        valid.forEach((v) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 30 + 10;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
            }
            setFiles((prev) =>
              prev.map((f) =>
                f.id === v.id ? { ...f, progress: Math.min(100, progress) } : f
              )
            );
          }, 200);
        });

        if (onUpload) {
          onUpload(valid.map((v) => v.file));
        }
      }
    },
    [files, multiple, onUpload, validateFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeFile = (id) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const isImage = (file) => file?.file?.type?.startsWith('image/');

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={label}
        className={`relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          dragActive
            ? 'border-[#003366] bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
      >
        <Upload
          size={28}
          className={`${dragActive ? 'text-[#003366]' : 'text-gray-400'}`}
          aria-hidden="true"
        />
        <p className="text-sm text-gray-600 text-center">
          <span className="font-medium text-[#003366]">Click to upload</span>{' '}
          or drag and drop
        </p>
        <p className="text-xs text-gray-400">
          {accept ? `Accepted: ${accept}` : 'Any file type'}
          {maxSize ? ` | Max: ${formatBytes(maxSize)}` : ''}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-2 space-y-1" role="alert">
          {errors.map((err, i) => (
            <p key={i} className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle size={14} aria-hidden="true" />
              {err}
            </p>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Uploaded files">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
            >
              {/* Preview or icon */}
              {isImage(f) && f.preview ? (
                <img
                  src={f.preview}
                  alt={`Preview of ${f.file.name}`}
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
              ) : isImage(f) ? (
                <Image
                  size={20}
                  className="text-gray-400 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <FileText
                  size={20}
                  className="text-gray-400 shrink-0"
                  aria-hidden="true"
                />
              )}

              {/* Info + progress */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {f.file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatBytes(f.file.size)}
                </p>
                {f.progress < 100 && (
                  <div
                    className="mt-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(f.progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-[#003366] rounded-full transition-all duration-300"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Remove */}
              <button
                onClick={() => removeFile(f.id)}
                aria-label={`Remove ${f.file.name}`}
                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
