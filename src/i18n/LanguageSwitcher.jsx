import { useTranslation } from 'react-i18next';
import { setLanguage } from './index';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language || 'en';

  const base =
    'px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors';
  const active = 'bg-[#c5a55a] text-[#003366]';
  const inactive = 'text-gray-300 hover:text-white';

  return (
    <div
      className="inline-flex items-center gap-1"
      role="group"
      aria-label={t('common.language')}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`${base} ${current === 'en' ? active : inactive}`}
        aria-pressed={current === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`${base} ${current === 'es' ? active : inactive}`}
        aria-pressed={current === 'es'}
      >
        ES
      </button>
    </div>
  );
}
