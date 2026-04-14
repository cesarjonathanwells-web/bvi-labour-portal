import { Link } from 'react-router-dom';
import {
  Building2, UserCheck, Briefcase, Shield,
  Phone, Mail, MapPin, Clock, ArrowRight, Star,
} from 'lucide-react';
import { DEPARTMENT_INFO } from '../data/constants';

const portals = [
  {
    id: 'business',
    title: 'Business Portal',
    subtitle: 'For Employers & Companies',
    description: 'Apply for work permits, post job vacancies, manage renewals, calculate fees',
    icon: Building2,
    color: '#003366',
    bgGradient: 'from-[#003366] to-[#004d99]',
    loginPath: '/business/login',
    registerPath: '/business/register',
    hasRegister: true,
  },
  {
    id: 'worker',
    title: 'Worker Portal',
    subtitle: 'For Work Permit Holders',
    description: 'Track your permit status, view your digital ID card, file workplace disputes',
    icon: UserCheck,
    color: '#006633',
    bgGradient: 'from-[#006633] to-[#008844]',
    loginPath: '/worker/login',
    registerPath: '/worker/register',
    hasRegister: true,
  },
  {
    id: 'jobs',
    title: 'Job Centre',
    subtitle: 'For Job Seekers',
    description: 'Search available positions, submit applications, access workforce training',
    icon: Briefcase,
    color: '#c5a55a',
    bgGradient: 'from-[#c5a55a] to-[#d4b86a]',
    loginPath: '/jobs/login',
    registerPath: '/jobs/register',
    hasRegister: true,
    darkText: true,
  },
  {
    id: 'dept',
    title: 'Department Access',
    subtitle: 'Department Staff Only',
    description: 'Authorized personnel access for case management and administration',
    icon: Shield,
    color: '#7c3aed',
    bgGradient: 'from-[#7c3aed] to-[#6d28d9]',
    loginPath: '/dept/login',
    hasRegister: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ========= GOVERNMENT HEADER ========= */}
      <nav className="bg-[#003366] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-sm">
              BVI
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold text-[#c5a55a]">BVI Government</p>
              <p className="text-[10px] text-gray-300">Department of Labour &amp; Workforce Development</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Phone size={14} />
            <span className="hidden sm:inline">{DEPARTMENT_INFO.phone}</span>
          </div>
        </div>
      </nav>

      {/* ========= HERO SECTION ========= */}
      <section className="relative bg-gradient-to-br from-[#003366] via-[#004d99] to-[#003366] text-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-[#c5a55a] blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-white blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-6">
            <Star size={14} className="text-[#c5a55a]" />
            <span className="text-gray-200">Official Government Digital Services</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4 max-w-4xl mx-auto">
            Department of Labour &amp;{' '}
            <span className="text-[#c5a55a]">Workforce Development</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-4 max-w-3xl mx-auto leading-relaxed">
            Access BVI labour services through our dedicated digital portals.
            Select the portal that matches your needs below.
          </p>

          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            Employers, work permit holders, job seekers, and department staff each have
            a specialized portal with the tools and services relevant to them.
          </p>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0,40 C360,100 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ========= PORTAL CARDS ========= */}
      <section className="bg-[#f8fafc] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#003366] mb-3">
              Choose Your Portal
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Each portal provides specialized services tailored to your role.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {portals.map((portal) => {
              const Icon = portal.icon;
              const textColor = portal.darkText ? 'text-[#003366]' : 'text-white';
              const subtextColor = portal.darkText ? 'text-[#003366]/70' : 'text-white/80';
              const btnPrimary = portal.darkText
                ? 'bg-[#003366] text-white hover:bg-[#002244]'
                : 'bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30';
              const btnSecondary = portal.darkText
                ? 'border border-[#003366]/30 text-[#003366] hover:bg-[#003366]/10'
                : 'bg-white text-gray-800 hover:bg-gray-100';

              return (
                <div
                  key={portal.id}
                  className={`relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${portal.bgGradient}`}
                >
                  {/* Decorative circle */}
                  <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5" />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

                  <div className="relative p-6 sm:p-8">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
                      portal.darkText ? 'bg-[#003366]/10' : 'bg-white/15'
                    }`}>
                      <Icon size={28} className={textColor} />
                    </div>

                    {/* Title */}
                    <h3 className={`text-xl font-bold mb-1 ${textColor}`}>
                      {portal.title}
                    </h3>
                    <p className={`text-sm font-medium mb-3 ${subtextColor}`}>
                      {portal.subtitle}
                    </p>

                    {/* Description */}
                    <p className={`text-sm mb-6 leading-relaxed ${subtextColor}`}>
                      {portal.description}
                    </p>

                    {/* Buttons */}
                    <div className="flex items-center gap-3">
                      <Link
                        to={portal.loginPath}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${btnSecondary}`}
                      >
                        Sign In <ArrowRight size={16} />
                      </Link>
                      {portal.hasRegister && (
                        <Link
                          to={portal.registerPath}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${btnPrimary}`}
                        >
                          Register
                        </Link>
                      )}
                      {!portal.hasRegister && (
                        <span className={`text-xs ${subtextColor} italic`}>
                          Staff accounts only
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========= QUICK INFO SECTION ========= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#003366]/5 flex items-center justify-center mb-4">
              <Phone size={22} className="text-[#003366]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-3">Contact Us</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>{DEPARTMENT_INFO.phone}</p>
              <p>{DEPARTMENT_INFO.email}</p>
              <p className="text-xs text-gray-400">Fax: {DEPARTMENT_INFO.fax}</p>
            </div>
          </div>

          {/* Hours */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#003366]/5 flex items-center justify-center mb-4">
              <Clock size={22} className="text-[#003366]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-3">Office Hours</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>{DEPARTMENT_INFO.hours}</p>
              <p className="text-xs text-gray-500">Cashier: {DEPARTMENT_INFO.cashierHours}</p>
              <p className="text-xs text-gray-400">Closed weekends and public holidays</p>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#003366]/5 flex items-center justify-center mb-4">
              <MapPin size={22} className="text-[#003366]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-3">Visit Us</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>{DEPARTMENT_INFO.address}</p>
              <p className="text-xs text-gray-500">Commissioner: {DEPARTMENT_INFO.commissioner}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========= FOOTER ========= */}
      <footer className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-xs">
                BVI
              </div>
              <div>
                <p className="text-sm font-bold text-[#c5a55a]">BVI Government</p>
                <p className="text-[11px] text-gray-400">{DEPARTMENT_INFO.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Mail size={14} />
                <span>{DEPARTMENT_INFO.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone size={14} />
                <span>{DEPARTMENT_INFO.phone}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs mb-4">
              <Link to="/roadmap" className="text-gray-300 hover:text-[#c5a55a] transition-colors">
                Delivery Roadmap
              </Link>
              <span className="hidden sm:inline text-gray-600">·</span>
              <Link to="/limitations" className="text-gray-300 hover:text-[#c5a55a] transition-colors">
                Known Limitations
              </Link>
              <span className="hidden sm:inline text-gray-600">·</span>
              <span className="text-gray-500 italic">Phase 2 Documentation (coming soon)</span>
            </div>
            <div className="text-center text-xs text-gray-500">
              <p>&copy; {new Date().getFullYear()} Government of the Virgin Islands. All rights reserved.</p>
              <p className="mt-1">{DEPARTMENT_INFO.name} &mdash; {DEPARTMENT_INFO.ministry}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
