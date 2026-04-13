import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';

const DISMISS_KEY = 'bvi_demo_banner_dismissed';

export default function DemoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(sessionStorage.getItem(DISMISS_KEY) !== '1');
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
        <Info size={14} className="flex-shrink-0" />
        <p className="flex-1">
          <span className="font-semibold">Demo environment.</span>{' '}
          This is a prototype of the BVI Labour Portal. Data is stored in your browser only and is not connected to live Department of Labour systems.
        </p>
        <button
          type="button"
          onClick={() => { sessionStorage.setItem(DISMISS_KEY, '1'); setVisible(false); }}
          aria-label="Dismiss demo notice"
          className="p-1 rounded hover:bg-amber-200 transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
