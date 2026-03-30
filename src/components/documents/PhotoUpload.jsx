import { useState, useRef } from 'react';
import { Camera, RotateCcw, Check, AlertCircle, User } from 'lucide-react';
import { fileToBase64 } from '../../utils/helpers';

const REQUIREMENTS = [
  'Recent photograph (taken within last 6 months)',
  'Passport-size (2" x 2")',
  'White or light-coloured background',
  'Full face visible, no sunglasses or hats',
  'Neutral facial expression',
  'High resolution, no blur',
];

export default function PhotoUpload({ value, onChange }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(value || null);
  const [error, setError] = useState('');

  const handleSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPG or PNG images are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5 MB.');
      return;
    }

    const base64 = await fileToBase64(file);
    setPreview(base64);
    onChange?.(base64);
  };

  const handleRetake = () => {
    setPreview(null);
    setError('');
    onChange?.(null);
    fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Requirements */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-[#003366] mb-2 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Passport Photo Requirements
        </h4>
        <ul className="space-y-1">
          {REQUIREMENTS.map((req, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#003366] mt-1.5 shrink-0" />
              {req}
            </li>
          ))}
        </ul>
      </div>

      {/* Upload area / Preview */}
      <div className="flex justify-center">
        {preview ? (
          <div className="relative">
            {/* Crop guideline overlay */}
            <div className="relative w-48 h-56 rounded-lg overflow-hidden border-2 border-[#003366] shadow-lg">
              <img
                src={preview}
                alt="Passport photo preview"
                className="w-full h-full object-cover"
              />
              {/* Corner crop guides */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Top-left */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white/70" />
                {/* Top-right */}
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/70" />
                {/* Bottom-left */}
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white/70" />
                {/* Bottom-right */}
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white/70" />
                {/* Center oval guide */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-40 border-2 border-dashed border-white/40 rounded-[50%]" />
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-48 h-56 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 hover:border-[#c5a55a] hover:bg-gray-50 transition-all cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <User className="w-10 h-10 text-gray-400 group-hover:text-[#003366] transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Upload Photo</p>
              <p className="text-xs text-gray-400">JPG or PNG</p>
            </div>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleSelect}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Action buttons */}
      {preview && (
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={handleRetake}
            className="btn-outline text-sm px-4 py-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retake
          </button>
          <button
            type="button"
            onClick={() => onChange?.(preview)}
            className="btn-success text-sm px-4 py-2"
          >
            <Check className="w-4 h-4" />
            Accept Photo
          </button>
        </div>
      )}
    </div>
  );
}
