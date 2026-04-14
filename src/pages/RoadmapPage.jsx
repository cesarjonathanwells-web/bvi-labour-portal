import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2, Clock, Sparkles, ArrowLeft, Phone, Mail, Shield,
} from 'lucide-react';
import { DEPARTMENT_INFO } from '../data/constants';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

function PhaseColumn({ title, timeline, icon: Icon, accentClass, iconBg, items }) {
  return (
    <div className={`rounded-2xl border ${accentClass} bg-white p-6 shadow-sm flex flex-col`}>
      <div className="flex items-start gap-3 mb-1">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#003366]">{title}</h2>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-0.5">{timeline}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-3 text-sm text-gray-700">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 leading-relaxed">
            <span className="mt-0.5 flex-shrink-0 text-gray-300">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RoadmapPage() {
  const { t } = useTranslation();
  const phase1Items = t('roadmap.phase1.items', { returnObjects: true }) || [];
  const phase2Items = t('roadmap.phase2.items', { returnObjects: true }) || [];
  const phase3Items = t('roadmap.phase3.items', { returnObjects: true }) || [];

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

      <section className="bg-gradient-to-br from-[#003366] via-[#004d99] to-[#003366] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-6">
            <Shield size={14} className="text-[#c5a55a]" />
            <span className="text-gray-200">{t('roadmap.hero_badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4 max-w-3xl mx-auto">
            {t('roadmap.hero_title_prefix')} <span className="text-[#c5a55a]">{t('roadmap.hero_title_highlight')}</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            {t('roadmap.hero_lead')}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <PhaseColumn
            title={t('roadmap.phase1.title')}
            timeline={t('roadmap.phase1.timeline')}
            icon={CheckCircle2}
            accentClass="border-green-200"
            iconBg="bg-green-600"
            items={phase1Items}
          />
          <PhaseColumn
            title={t('roadmap.phase2.title')}
            timeline={t('roadmap.phase2.timeline')}
            icon={Clock}
            accentClass="border-amber-200"
            iconBg="bg-amber-500"
            items={phase2Items}
          />
          <PhaseColumn
            title={t('roadmap.phase3.title')}
            timeline={t('roadmap.phase3.timeline')}
            icon={Sparkles}
            accentClass="border-purple-200"
            iconBg="bg-[#7c3aed]"
            items={phase3Items}
          />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <h2 className="text-xl font-bold text-[#003366] mb-2">{t('roadmap.cta_heading')}</h2>
          <p className="text-sm text-gray-600 mb-5">
            {t('roadmap.cta_sub')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <a href={`tel:${DEPARTMENT_INFO.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 text-[#003366] font-semibold hover:underline">
              <Phone size={16} /> {DEPARTMENT_INFO.phone}
            </a>
            <span className="hidden sm:inline text-gray-300">·</span>
            <a href={`mailto:${DEPARTMENT_INFO.email}`} className="inline-flex items-center gap-2 text-[#003366] font-semibold hover:underline">
              <Mail size={16} /> {DEPARTMENT_INFO.email}
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
