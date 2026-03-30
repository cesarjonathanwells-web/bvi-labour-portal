import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import JobSearch from '../components/jobs/JobSearch';
import JobDetail from '../components/jobs/JobDetail';
import ApplicationForm from '../components/jobs/ApplicationForm';
import PostJobForm from '../components/jobs/PostJobForm';
import MyApplications from '../components/jobs/MyApplications';
import ManageJobs from '../components/jobs/ManageJobs';
import {
  Search, PlusCircle, FileText, Briefcase, ChevronRight,
} from 'lucide-react';

const TABS = {
  SEARCH: 'search',
  DETAIL: 'detail',
  APPLY: 'apply',
  POST: 'post',
  MY_APPS: 'my-applications',
  MANAGE: 'manage',
};

export default function JobsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.SEARCH);
  const [selectedJob, setSelectedJob] = useState(null);

  const isEmployer = user?.role === 'employer';
  const isAdmin = user?.role === 'admin';
  const isJobseeker = user?.role === 'jobseeker' || user?.role === 'employee';

  const navItems = [
    { id: TABS.SEARCH, label: 'Find Jobs', icon: Search, show: true },
    { id: TABS.POST, label: 'Post a Job', icon: PlusCircle, show: isEmployer || isAdmin },
    { id: TABS.MY_APPS, label: 'My Applications', icon: FileText, show: isJobseeker || isAdmin },
    { id: TABS.MANAGE, label: 'Manage Jobs', icon: Briefcase, show: isEmployer || isAdmin },
  ].filter(n => n.show);

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setActiveTab(TABS.DETAIL);
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setActiveTab(TABS.APPLY);
  };

  const handleBackToSearch = () => {
    setSelectedJob(null);
    setActiveTab(TABS.SEARCH);
  };

  const handleBackToDetail = () => {
    setActiveTab(TABS.DETAIL);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="page-title !mb-0">Jobs &amp; Employment</h1>
            <p className="text-gray-600 text-sm mt-1">
              Find opportunities, post vacancies, and manage applications across the British Virgin Islands
            </p>
          </div>
          {/* Tab navigation */}
          <div className="flex gap-1 overflow-x-auto pb-0 -mb-px">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id ||
                (item.id === TABS.SEARCH && (activeTab === TABS.DETAIL || activeTab === TABS.APPLY));
              return (
                <button key={item.id}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-[#003366] text-[#003366]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (item.id === TABS.SEARCH) handleBackToSearch();
                    else setActiveTab(item.id);
                  }}>
                  <Icon className="w-4 h-4" />{item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Breadcrumb for sub-views */}
      {(activeTab === TABS.DETAIL || activeTab === TABS.APPLY) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <button className="hover:text-[#003366] hover:underline" onClick={handleBackToSearch}>Jobs</button>
            <ChevronRight className="w-3 h-3" />
            {activeTab === TABS.APPLY ? (
              <>
                <button className="hover:text-[#003366] hover:underline" onClick={handleBackToDetail}>
                  {selectedJob?.title}
                </button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-900 font-medium">Apply</span>
              </>
            ) : (
              <span className="text-gray-900 font-medium">{selectedJob?.title}</span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === TABS.SEARCH && (
          <JobSearch onViewJob={handleViewJob} onApply={handleApply} />
        )}

        {activeTab === TABS.DETAIL && selectedJob && (
          <JobDetail job={selectedJob} onBack={handleBackToSearch} onApply={handleApply} />
        )}

        {activeTab === TABS.APPLY && selectedJob && (
          <ApplicationForm
            job={selectedJob}
            onBack={handleBackToDetail}
            onSuccess={() => setActiveTab(TABS.MY_APPS)}
          />
        )}

        {activeTab === TABS.POST && (
          <PostJobForm onSuccess={() => setActiveTab(TABS.MANAGE)} />
        )}

        {activeTab === TABS.MY_APPS && <MyApplications />}

        {activeTab === TABS.MANAGE && <ManageJobs />}
      </div>
    </div>
  );
}
