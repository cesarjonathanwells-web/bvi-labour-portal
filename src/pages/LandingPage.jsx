import { Link } from 'react-router-dom';
import {
  FileText, AlertTriangle, Search, Calculator, Shield, Users,
  ArrowRight, Phone, Mail, MapPin, Clock, ChevronRight, Briefcase,
  Globe, CheckCircle2, Star,
} from 'lucide-react';
import { DEPARTMENT_INFO } from '../data/constants';

const quickLinks = [
  {
    title: 'Apply for Work Permit',
    description: 'Submit a new work permit application for non-belonger employees.',
    icon: FileText,
    to: '/permits/new',
    color: 'bg-[#003366]',
    textColor: 'text-white',
  },
  {
    title: 'Check Permit Status',
    description: 'View the current status of your submitted work permit applications.',
    icon: Search,
    to: '/permits',
    color: 'bg-white',
    textColor: 'text-[#003366]',
    border: true,
  },
  {
    title: 'File a Dispute',
    description: 'Submit a labour dispute or complaint for investigation.',
    icon: AlertTriangle,
    to: '/disputes/new',
    color: 'bg-white',
    textColor: 'text-[#003366]',
    border: true,
  },
  {
    title: 'Search Jobs',
    description: 'Browse available job vacancies across the BVI.',
    icon: Briefcase,
    to: '/jobs',
    color: 'bg-white',
    textColor: 'text-[#003366]',
    border: true,
  },
  {
    title: 'Fee Calculator',
    description: 'Calculate work permit fees based on annual salary.',
    icon: Calculator,
    to: '/fees/calculator',
    color: 'bg-[#c5a55a]',
    textColor: 'text-[#003366]',
  },
];

const features = [
  { icon: Shield, title: 'Secure Portal', desc: 'All data is protected with modern security standards.' },
  { icon: Clock, title: 'Fast Processing', desc: 'Submit applications online and track progress in real time.' },
  { icon: CheckCircle2, title: 'Digital ID Cards', desc: 'Approved permits generate official digital work permit cards.' },
  { icon: Globe, title: '24/7 Access', desc: 'Access the portal anytime, from anywhere in the world.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ========= NAVIGATION BAR ========= */}
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
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 text-sm font-medium text-white hover:text-[#c5a55a] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 text-sm font-medium bg-[#c5a55a] text-[#003366] rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Register
            </Link>
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-6">
              <Star size={14} className="text-[#c5a55a]" />
              <span className="text-gray-200">Official Government Portal</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Welcome to the{' '}
              <span className="text-[#c5a55a]">BVI Labour Department</span>{' '}
              Portal
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              Your one-stop digital platform for work permits, labour dispute resolution,
              job vacancies, and workforce development services in the British Virgin Islands.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#c5a55a] text-[#003366] rounded-xl font-bold text-base hover:bg-yellow-500 transition-colors shadow-lg"
              >
                Get Started <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/30 text-white rounded-xl font-bold text-base hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" className="w-full">
            <path d="M0,60 C360,120 1080,0 1440,60 L1440,100 L0,100 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ========= QUICK LINKS ========= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#003366] mb-3">How Can We Help You?</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Access all the services you need from the Department of Labour and Workforce Development.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              to={link.to}
              className={`group relative rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 ${
                link.color
              } ${link.border ? 'border-2 border-gray-200 hover:border-[#c5a55a]' : 'shadow-lg'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                link.border ? 'bg-blue-50' : 'bg-white/20'
              }`}>
                <link.icon className={`w-6 h-6 ${link.border ? 'text-[#003366]' : link.textColor}`} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${link.textColor}`}>
                {link.title}
              </h3>
              <p className={`text-sm ${link.border ? 'text-gray-500' : 'text-white/80'}`}>
                {link.description}
              </p>
              <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${
                link.border ? 'text-[#003366]' : link.textColor
              } opacity-0 group-hover:opacity-100 transition-opacity`}>
                Learn more <ChevronRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========= FEATURES ========= */}
      <section className="bg-[#f0f4f8] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#003366] mb-3">Why Use This Portal?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              A modern, efficient way to interact with the Department of Labour.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 mx-auto rounded-xl bg-[#003366]/5 flex items-center justify-center mb-4">
                  <f.icon className="w-7 h-7 text-[#003366]" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= DEPARTMENT INFO ========= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* About */}
          <div>
            <h2 className="text-3xl font-bold text-[#003366] mb-4">About the Department</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              The {DEPARTMENT_INFO.name} is responsible for regulating the labour market in
              the British Virgin Islands. Our mandate includes processing work permits, resolving
              labour disputes, enforcing labour standards, and promoting workforce development.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Under the {DEPARTMENT_INFO.ministry}, we work to ensure a fair and
              productive labour environment for both employers and workers.
            </p>
            <div className="bg-green-50 rounded-xl p-5 border border-green-100">
              <p className="text-sm text-green-700 font-medium mb-1">Current Minimum Wage</p>
              <p className="text-3xl font-bold text-[#006633]">{DEPARTMENT_INFO.minimumWage}</p>
              <p className="text-xs text-gray-500 mt-1">Effective since {DEPARTMENT_INFO.minimumWageEffective}</p>
            </div>
          </div>

          {/* Contact card */}
          <div className="bg-[#003366] rounded-2xl p-8 text-white shadow-xl">
            <h3 className="text-xl font-bold text-[#c5a55a] mb-6">Contact Us</h3>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#c5a55a]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Address</p>
                  <p className="text-sm font-medium">{DEPARTMENT_INFO.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-lg">
                  <Phone className="w-5 h-5 text-[#c5a55a]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Phone</p>
                  <p className="text-sm font-medium">{DEPARTMENT_INFO.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-lg">
                  <Mail className="w-5 h-5 text-[#c5a55a]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium">{DEPARTMENT_INFO.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-lg">
                  <Clock className="w-5 h-5 text-[#c5a55a]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Office Hours</p>
                  <p className="text-sm font-medium">{DEPARTMENT_INFO.hours}</p>
                  <p className="text-xs text-gray-400 mt-1">Cashier: {DEPARTMENT_INFO.cashierHours}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/10 rounded-lg">
                  <Users className="w-5 h-5 text-[#c5a55a]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Commissioner</p>
                  <p className="text-sm font-medium">{DEPARTMENT_INFO.commissioner}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex gap-3">
              <Link
                to="/login"
                className="flex-1 text-center py-2.5 bg-[#c5a55a] text-[#003366] rounded-lg font-bold text-sm hover:bg-yellow-500 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center py-2.5 border border-white/30 text-white rounded-lg font-bold text-sm hover:bg-white/10 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========= FOOTER ========= */}
      <footer className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-xs">
                  BVI
                </div>
                <span className="font-bold text-[#c5a55a]">BVI Government</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                {DEPARTMENT_INFO.name}
              </p>
              <p className="text-xs text-gray-500 mt-2">{DEPARTMENT_INFO.ministry}</p>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-bold text-sm mb-4 text-[#c5a55a]">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/permits/new" className="hover:text-white transition-colors">Work Permits</Link></li>
                <li><Link to="/disputes/new" className="hover:text-white transition-colors">Labour Disputes</Link></li>
                <li><Link to="/jobs" className="hover:text-white transition-colors">Job Vacancies</Link></li>
                <li><Link to="/fees/calculator" className="hover:text-white transition-colors">Fee Calculator</Link></li>
              </ul>
            </div>

            {/* Information */}
            <div>
              <h4 className="font-bold text-sm mb-4 text-[#c5a55a]">Information</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span className="hover:text-white transition-colors cursor-default">Minimum Wage: {DEPARTMENT_INFO.minimumWage}</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Office: {DEPARTMENT_INFO.hours}</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Cashier: {DEPARTMENT_INFO.cashierHours}</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-sm mb-4 text-[#c5a55a]">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{DEPARTMENT_INFO.phone}</li>
                <li>{DEPARTMENT_INFO.email}</li>
                <li>{DEPARTMENT_INFO.address}</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} Government of the Virgin Islands. All rights reserved.</p>
            <p className="mt-1">{DEPARTMENT_INFO.name}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
