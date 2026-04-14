import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import {
  AlertTriangle, ArrowLeft, ChevronDown, Info, Shield, Phone, Mail,
} from 'lucide-react';
import { DEPARTMENT_INFO } from '../data/constants';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

function LimitationCard({ title, body, index }) {
  return (
    <details className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-amber-300 transition-colors">
      <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-50 text-amber-800 text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <span className="font-semibold text-gray-900 text-sm sm:text-base">{title}</span>
        </div>
        <ChevronDown size={18} className="flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 pt-1 pl-[4.5rem]">
        <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
      </div>
    </details>
  );
}

export default function LimitationsPage() {
  const { t } = useTranslation();
  const items = t('limitations.items', { returnObjects: true }) || [];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="bg-[#003366] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-sm">
              BVI
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold text-[#c5a55a]">BVI Government</p>
              <p className="text-[10px] text-gray-300">Department of Labour &amp; Workforce Development</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
              <ArrowLeft size={16} /> {t('common.back_home')}
            </Link>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-5">
            <AlertTriangle size={14} />
            <span>{t('limitations.hero_badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4 max-w-3xl mx-auto">
            {t('limitations.hero_title')}
          </h1>
          <p className="text-base sm:text-lg text-amber-50 max-w-2xl mx-auto">
            <Trans i18nKey="limitations.hero_lead" components={{ 1: <strong /> }} />
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <Info size={18} className="text-[#003366] mt-0.5 flex-shrink-0" />
          <div className="text-sm text-[#003366]">
            <p className="font-semibold mb-1">{t('limitations.why_heading')}</p>
            <p className="text-gray-700">
              {t('limitations.why_body')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((l, i) => (
            <LimitationCard key={i} title={l.title} body={l.body} index={i} />
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
          <Shield className="w-8 h-8 text-[#003366] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#003366] mb-2">{t('limitations.cta_heading')}</h2>
          <p className="text-sm text-gray-600 mb-4">
            {t('limitations.cta_sub').split(t('limitations.cta_sub_link'))[0]}
            <Link to="/roadmap" className="font-semibold text-[#003366] hover:underline">{t('limitations.cta_sub_link')}</Link>
            {t('limitations.cta_sub').split(t('limitations.cta_sub_link'))[1] || ''}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm pt-4 border-t border-gray-100">
            <a href={`tel:${DEPARTMENT_INFO.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 text-[#003366] font-semibold hover:underline">
              <Phone size={14} /> {DEPARTMENT_INFO.phone}
            </a>
            <span className="hidden sm:inline text-gray-300">·</span>
            <a href={`mailto:${DEPARTMENT_INFO.email}`} className="inline-flex items-center gap-2 text-[#003366] font-semibold hover:underline">
              <Mail size={14} /> {DEPARTMENT_INFO.email}
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#003366] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} Government of the Virgin Islands. All rights reserved.</p>
          <p className="mt-1">{DEPARTMENT_INFO.name}</p>
        </div>
      </footer>
    </div>
  );
}
