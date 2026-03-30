export default function Tabs({ tabs = [], activeTab, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Tab navigation"
      className="flex border-b border-gray-200 overflow-x-auto"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              isActive
                ? 'text-[#003366]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            {tab.label}
            {/* Active underline */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003366] rounded-t" />
            )}
          </button>
        );
      })}
    </div>
  );
}
