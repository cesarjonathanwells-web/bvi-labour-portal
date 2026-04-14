import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import {
  HelpCircle, ArrowLeft, Search, ChevronDown, Phone, Mail, MessageCircle,
} from 'lucide-react';
import { DEPARTMENT_INFO } from '../data/constants';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

function FaqCard({ item, index }) {
  return (
    <details className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#003366] transition-colors">
      <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#003366]/10 text-[#003366] text-xs font-bold flex items-center justify-center mt-0.5">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-[#003366] uppercase tracking-wide mb-0.5">{item.category}</p>
            <p className="font-semibold text-gray-900 text-sm sm:text-base">{item.q}</p>
          </div>
        </div>
        <ChevronDown size={18} className="flex-shrink-0 text-gray-400 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-5 pb-5 pt-1 pl-[4.5rem]">
        <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
      </div>
    </details>
  );
}

export default function FAQPage() {
  const { t } = useTranslation();
  const faqs = t('faq.items', { returnObjects: true }) || [];
  const categories = t('faq.categories', { returnObjects: true }) || [];
  const allLabel = categories[0] || 'All';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(allLabel);

  const filtered = useMemo(() => {
    return faqs.filter(f => {
      if (category !== allLabel && f.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!f.q.toLowerCase().includes(q) && !f.a.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [search, category, faqs, allLabel]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="bg-[#003366] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-sm">BVI</div>
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-5">
            <HelpCircle size={14} className="text-[#c5a55a]" />
            <span className="text-gray-200">{t('faq.hero_badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
            {t('faq.hero_title')}
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            {t('faq.hero_lead', { count: faqs.length })}
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('faq.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field text-sm sm:w-64"
            aria-label={t('faq.filter_label')}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          <Trans
            i18nKey="faq.showing_count"
            values={{ shown: filtered.length, total: faqs.length }}
            components={{ 1: <span className="font-semibold text-gray-700" /> }}
          />
        </p>

        <div className="space-y-3">
          {filtered.map((item, i) => <FaqCard key={i} item={item} index={i} />)}
          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">{t('faq.no_results')}</p>
            </div>
          )}
        </div>

        <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
          <MessageCircle className="w-8 h-8 text-[#003366] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#003366] mb-2">{t('faq.cta_heading')}</h2>
          <p className="text-sm text-gray-600 mb-5">
            {t('faq.cta_sub', { hours: DEPARTMENT_INFO.hours })}
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
