import { useState } from 'react';
import { FileText, Upload, Camera } from 'lucide-react';
import DocumentUpload from '../components/documents/DocumentUpload';
import DocumentManager from '../components/documents/DocumentManager';
import PhotoUpload from '../components/documents/PhotoUpload';

const TABS = [
  { id: 'manager', label: 'My Documents', icon: FileText },
  { id: 'upload', label: 'Upload Documents', icon: Upload },
  { id: 'photo', label: 'Passport Photo', icon: Camera },
];

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('manager');
  const [photoBase64, setPhotoBase64] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="page-title flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Document Management
          </h1>
          <p className="text-gray-500 -mt-4">
            Upload, organize, and manage all documents required for your applications.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'bg-white shadow text-[#003366]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card">
          {activeTab === 'manager' && <DocumentManager />}

          {activeTab === 'upload' && (
            <div>
              <h2 className="section-title">Upload New Documents</h2>
              <p className="text-sm text-gray-500 mb-6">
                Select the document type, then drag and drop or browse to upload your files.
                Accepted formats: PDF, JPG, PNG (max 5 MB each).
              </p>
              <DocumentUpload
                onUploadComplete={() => setActiveTab('manager')}
              />
            </div>
          )}

          {activeTab === 'photo' && (
            <div className="max-w-md mx-auto">
              <h2 className="section-title text-center">Passport-Size Photograph</h2>
              <p className="text-sm text-gray-500 mb-6 text-center">
                Upload a recent passport-size photo that meets the requirements below.
              </p>
              <PhotoUpload value={photoBase64} onChange={setPhotoBase64} />
              {photoBase64 && (
                <p className="text-center text-sm text-green-600 font-medium mt-4">
                  Photo saved successfully. It will be used in your applications.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
