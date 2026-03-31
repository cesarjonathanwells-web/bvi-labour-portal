import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FileDisputeForm from '../components/disputes/FileDisputeForm';
import DisputeTracker from '../components/disputes/DisputeTracker';
import DisputeList from '../components/disputes/DisputeList';
import {
  FileText, Search, ListFilter, AlertTriangle,
} from 'lucide-react';

const TABS = {
  FILE: 'file',
  TRACK: 'track',
  ADMIN: 'admin',
};

export default function DisputesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.portal === 'worker' ? TABS.TRACK : TABS.FILE);

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { id: TABS.FILE, label: 'File a Dispute', icon: FileText, show: true },
    { id: TABS.TRACK, label: 'Track My Disputes', icon: Search, show: true },
    { id: TABS.ADMIN, label: 'All Disputes', icon: ListFilter, show: isAdmin },
  ].filter(n => n.show);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="page-title !mb-0 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-[#c5a55a]" />
              Disputes &amp; Complaints
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              File workplace complaints, track case progress, and seek resolution through the Department of Labour
            </p>
          </div>
          {/* Tab navigation */}
          <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === item.id
                      ? 'border-[#003366] text-[#003366]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(item.id)}>
                  <Icon className="w-4 h-4" />{item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === TABS.FILE && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-[#003366] mb-1">Before Filing a Dispute</h3>
            <ul className="text-sm text-gray-700 space-y-1 list-disc ml-4">
              <li>Ensure you have attempted to resolve the matter with your employer first</li>
              <li>Gather all relevant documentation (contracts, pay stubs, correspondence)</li>
              <li>Complaints should be filed within 12 months of the incident</li>
              <li>For emergencies involving immediate safety concerns, contact the department directly at 1(284) 468-4780</li>
            </ul>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === TABS.FILE && (
          <FileDisputeForm onSuccess={() => setActiveTab(TABS.TRACK)} />
        )}

        {activeTab === TABS.TRACK && <DisputeTracker />}

        {activeTab === TABS.ADMIN && <DisputeList />}
      </div>
    </div>
  );
}
