import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { formatDateShort, getStatusColor, getStatusLabel } from '../../utils/helpers';
import {
  Briefcase, FileText, Upload, User, Search, GraduationCap,
  ArrowRight, MapPin, DollarSign, Clock, Star, TrendingUp,
  Building2, BookOpen, Lightbulb, CheckCircle2
} from 'lucide-react';

const ACCENT = '#c5a55a';
const ACCENT_DARK = '#b3944a';

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
          <div className="w-12 h-12 border-4 border-[#c5a55a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const myApplications = getApplicationsByUser(user.id);
  const myNotifications = getNotificationsByUser(user.id);
  const openJobs = jobs.filter(j => j.status === 'open');

  // Profile completeness
  const profileFields = ['firstName', 'lastName', 'email', 'phone', 'skills', 'experience', 'education', 'resume'];
  const completedFields = profileFields.filter(f => user[f] && (typeof user[f] === 'string' ? user[f].trim() !== '' : true));
  const profilePct = Math.round((completedFields.length / profileFields.length) * 100);

  // Profile score (simple rating out of 5)
  const profileScore = Math.round((profilePct / 100) * 5 * 10) / 10;

  // Application statuses
  const pendingApps = myApplications.filter(a => a.status === 'submitted' || a.status === 'under_review');
  const acceptedApps = myApplications.filter(a => a.status === 'accepted' || a.status === 'approved');

  const statCards = [
    {
      title: 'Available Jobs',
      value: openJobs.length,
      subtitle: 'Open positions in BVI',
      icon: Briefcase,
      lightColor: 'bg-amber-50',
      textColor: 'text-[#c5a55a]',
    },
    {
      title: 'My Applications',
      value: myApplications.length,
      subtitle: `${pendingApps.length} pending, ${acceptedApps.length} accepted`,
      icon: FileText,
      lightColor: 'bg-blue-50',
      textColor: 'text-[#003366]',
    },
    {
      title: 'Profile Score',
      value: `${profileScore}/5`,
      isText: true,
      subtitle: profilePct < 100 ? 'Complete your profile to improve' : 'Excellent profile!',
      icon: Star,
      lightColor: profilePct >= 80 ? 'bg-green-50' : 'bg-amber-50',
      textColor: profilePct >= 80 ? 'text-green-600' : 'text-[#c5a55a]',
      valueColor: profilePct >= 80 ? 'text-green-600' : 'text-[#c5a55a]',
    },
    {
      title: 'Training Available',
      value: 0,
      subtitle: 'Workforce readiness courses',
      icon: GraduationCap,
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  // Top 5 matching jobs
  const latestJobs = openJobs.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome, {user?.firstName || 'Job Seeker'}!
          </h1>
          <p className="text-gray-500 mt-1">
            Your next opportunity in the British Virgin Islands is waiting. Let us help you find it.
          </p>
        </div>

        {/* Profile Completeness Banner */}
        {profilePct < 80 && (
          <div className="mb-6 bg-gradient-to-r from-[#c5a55a] to-[#d4b86a] rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Complete Your Profile to Stand Out</h3>
                <p className="text-gray-800 text-sm mt-1">
                  Employers are {3}x more likely to view candidates with complete profiles. You are {profilePct}% there!
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-36">
                  <div className="flex justify-between text-xs mb-1 text-gray-800">
                    <span className="font-semibold">{profilePct}%</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-white/40 rounded-full h-3">
                    <div
                      className="bg-gray-900 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${profilePct}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="bg-gray-900 text-[#c5a55a] px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map(card => (
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

          {/* Latest Job Listings (top 5) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Latest Job Listings</h2>
              <button
                onClick={() => navigate('/jobs')}
                className="text-sm text-[#c5a55a] hover:text-[#b3944a] flex items-center gap-1 font-medium"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {latestJobs.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {latestJobs.map(job => (
                  <div key={job.id} className="px-6 py-4 hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#c5a55a] to-[#b3944a] flex items-center justify-center text-white flex-shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{job.company || job.employerName || 'Employer'}</p>
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
                        className="text-xs bg-[#c5a55a] text-gray-900 px-4 py-1.5 rounded-lg hover:bg-[#b3944a] transition-colors whitespace-nowrap font-semibold"
                      >
                        Apply
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
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => navigate('/jobs')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#c5a55a] text-gray-900 rounded-lg hover:bg-[#b3944a] transition-colors font-semibold"
                >
                  <Search className="w-5 h-5" />
                  <span>Search Jobs</span>
                </button>
                <button
                  onClick={() => navigate('/documents')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-900 text-[#c5a55a] rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Resume</span>
                </button>
                <button
                  onClick={() => navigate('/training')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>View Training</span>
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 border-[#c5a55a] text-[#c5a55a] rounded-lg hover:bg-[#c5a55a] hover:text-gray-900 transition-colors font-medium"
                >
                  <User className="w-5 h-5" />
                  <span>Update Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Application Status Tracker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Application Status Tracker</h2>
              <span className="text-xs bg-[#c5a55a] text-gray-900 px-2.5 py-1 rounded-full font-semibold">
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
                      <div key={app.id} className="border border-gray-100 rounded-lg p-4 hover:border-[#c5a55a]/40 transition-colors">
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
                                  idx <= stepIdx ? 'bg-[#c5a55a]' : 'bg-gray-200'
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
                    className="mt-3 text-sm text-[#c5a55a] hover:text-[#b3944a] font-medium"
                  >
                    Browse available jobs
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#c5a55a]" /> How to Improve Your Application
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {[
                {
                  title: 'Complete Your Profile',
                  desc: 'Fill in all sections including skills, experience, and education. A 100% complete profile gets 3x more views.',
                  done: profilePct >= 100,
                },
                {
                  title: 'Upload Your Resume',
                  desc: 'Ensure your resume is up-to-date and highlights relevant BVI work experience.',
                  done: !!user?.resume,
                },
                {
                  title: 'Add Your Skills',
                  desc: 'List specific skills relevant to the BVI job market: hospitality, marine, construction, finance.',
                  done: !!user?.skills,
                },
                {
                  title: 'Apply to Multiple Jobs',
                  desc: 'Do not limit yourself to one application. Apply to at least 5 positions that match your qualifications.',
                  done: myApplications.length >= 5,
                },
                {
                  title: 'Explore Training Programmes',
                  desc: 'The RATED apprenticeship programme and workforce readiness courses can boost your employability.',
                  done: false,
                },
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    tip.done ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    {tip.done ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <span className="text-xs font-bold text-[#c5a55a]">{idx + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${tip.done ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                      {tip.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
