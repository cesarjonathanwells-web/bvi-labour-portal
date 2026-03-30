import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDateShort, getStatusColor, getStatusLabel } from '../../utils/helpers';
import {
  Briefcase, FileText, Upload, User, Search, GraduationCap,
  ArrowRight, MapPin, DollarSign, Clock, Star, TrendingUp,
  CheckCircle2, Circle, Building2, BookOpen
} from 'lucide-react';

export default function JobSeekerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jobs, getApplicationsByUser, getNotificationsByUser } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const myApplications = getApplicationsByUser(user.id);
  const myNotifications = getNotificationsByUser(user.id);
  const openJobs = jobs.filter(j => j.status === 'open');

  // Profile completeness calculation
  const profileFields = ['firstName', 'lastName', 'email', 'phone', 'skills', 'experience', 'education', 'resume'];
  const completedFields = profileFields.filter(f => user[f] && (typeof user[f] === 'string' ? user[f].trim() !== '' : true));
  const profilePct = Math.round((completedFields.length / profileFields.length) * 100);

  // Application statuses
  const pendingApps = myApplications.filter(a => a.status === 'submitted' || a.status === 'under_review');
  const acceptedApps = myApplications.filter(a => a.status === 'accepted' || a.status === 'approved');

  const statCards = [
    {
      title: 'Jobs Available',
      value: openJobs.length,
      subtitle: 'Open positions in BVI',
      icon: Briefcase,
      lightColor: 'bg-blue-50',
      textColor: 'text-[#003366]',
    },
    {
      title: 'My Applications',
      value: myApplications.length,
      subtitle: `${pendingApps.length} pending review`,
      icon: FileText,
      lightColor: 'bg-green-50',
      textColor: 'text-[#006633]',
    },
    {
      title: 'Profile Completeness',
      value: `${profilePct}%`,
      isText: true,
      subtitle: profilePct < 100 ? 'Complete your profile' : 'Profile complete!',
      icon: User,
      lightColor: profilePct >= 80 ? 'bg-green-50' : 'bg-amber-50',
      textColor: profilePct >= 80 ? 'text-[#006633]' : 'text-[#c5a55a]',
      valueColor: profilePct >= 80 ? 'text-[#006633]' : 'text-[#c5a55a]',
    },
    {
      title: 'Training Programs',
      value: 0,
      subtitle: 'Available courses',
      icon: GraduationCap,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  // Featured jobs (just the most recent open ones)
  const featuredJobs = openJobs.slice(0, 3);
  const recentJobs = openJobs.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003366]">
            Welcome back, {user?.firstName || 'Job Seeker'}
          </h1>
          <p className="text-gray-500 mt-1">
            Discover opportunities in the British Virgin Islands and track your applications.
          </p>
        </div>

        {/* Profile completeness banner */}
        {profilePct < 80 && (
          <div className="mb-6 bg-gradient-to-r from-[#003366] to-[#004d99] rounded-xl p-5 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">Complete Your Profile</h3>
                <p className="text-blue-100 text-sm mt-1">
                  A complete profile increases your chances of being noticed by employers.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{profilePct}%</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-blue-900 rounded-full h-2">
                    <div
                      className="bg-[#c5a55a] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${profilePct}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="bg-[#c5a55a] text-[#003366] px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#d4b86a] transition-colors whitespace-nowrap"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.lightColor} p-3 rounded-lg`}>
                  <card.icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <h3 className={`text-3xl font-bold ${card.valueColor || 'text-gray-900'} ${card.isText ? 'text-2xl' : ''}`}>
                {card.value}
              </h3>
              <p className="text-sm font-medium text-gray-600 mt-1">{card.title}</p>
              <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Job Listings */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#003366]">Recent Job Listings</h2>
              <button
                onClick={() => navigate('/jobs')}
                className="text-sm text-[#003366] hover:text-[#c5a55a] flex items-center gap-1 font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {recentJobs.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentJobs.map(job => (
                  <div key={job.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#003366] flex items-center justify-center text-white flex-shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{job.company || job.employerName || 'Employer'}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {job.location && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="w-3 h-3" /> {job.location}
                              </span>
                            )}
                            {job.salary && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <DollarSign className="w-3 h-3" /> {job.salary}
                              </span>
                            )}
                            {job.type && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" /> {job.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="text-xs bg-[#003366] text-white px-3 py-1.5 rounded-lg hover:bg-[#002244] transition-colors whitespace-nowrap"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-gray-400">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No job listings available yet</p>
                <p className="text-xs mt-1">Check back soon for new opportunities</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-[#003366]">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => navigate('/jobs')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                >
                  <Search className="w-5 h-5" />
                  <span className="font-medium">Search Jobs</span>
                </button>
                <button
                  onClick={() => navigate('/documents/upload')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#006633] text-white rounded-lg hover:bg-[#005522] transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Upload Resume</span>
                </button>
                <button
                  onClick={() => navigate('/training')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#c5a55a] text-white rounded-lg hover:bg-[#b3944a] transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">View Training</span>
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 border-[#003366] text-[#003366] rounded-lg hover:bg-[#003366] hover:text-white transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Update Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Application Status Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#003366]">My Applications</h2>
              <span className="text-xs bg-[#003366] text-white px-2.5 py-1 rounded-full">
                {myApplications.length} total
              </span>
            </div>
            <div className="p-6">
              {myApplications.length > 0 ? (
                <div className="space-y-4">
                  {myApplications.slice(0, 5).map(app => {
                    const job = jobs.find(j => j.id === app.jobId);
                    const statusSteps = ['submitted', 'under_review', 'accepted'];
                    const stepIdx = statusSteps.indexOf(app.status);
                    return (
                      <div key={app.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{job?.title || 'Position'}</p>
                            <p className="text-xs text-gray-500">{job?.company || job?.employerName || 'Employer'}</p>
                          </div>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                          {statusSteps.map((step, idx) => (
                            <div key={step} className="flex items-center flex-1">
                              <div
                                className={`h-1.5 flex-1 rounded-full ${
                                  idx <= stepIdx ? 'bg-[#006633]' : 'bg-gray-200'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Applied {formatDateShort(app.appliedAt)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>No applications yet</p>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="mt-3 text-sm text-[#003366] hover:text-[#c5a55a] font-medium"
                  >
                    Browse available jobs
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Featured Jobs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#003366] flex items-center gap-2">
                <Star className="w-5 h-5 text-[#c5a55a]" /> Featured Jobs
              </h2>
            </div>
            <div className="p-6">
              {featuredJobs.length > 0 ? (
                <div className="space-y-4">
                  {featuredJobs.map(job => (
                    <div
                      key={job.id}
                      className="border border-[#c5a55a]/30 bg-gradient-to-r from-amber-50/50 to-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#c5a55a] to-[#b3944a] flex items-center justify-center text-white flex-shrink-0">
                          <Star className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{job.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{job.company || job.employerName || 'Employer'}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {job.location && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="w-3 h-3" /> {job.location}
                              </span>
                            )}
                            {job.category && (
                              <span className="inline-flex px-2 py-0.5 bg-[#003366]/10 text-[#003366] text-xs rounded-full">
                                {job.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Star className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>No featured jobs right now</p>
                  <p className="text-xs mt-1">New featured positions coming soon</p>
                </div>
              )}

              <button
                onClick={() => navigate('/jobs')}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#c5a55a] text-[#c5a55a] rounded-lg hover:bg-[#c5a55a] hover:text-white transition-colors font-medium text-sm"
              >
                Browse All Jobs <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
