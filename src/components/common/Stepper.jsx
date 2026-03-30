import { Check } from 'lucide-react';

export default function Stepper({ steps = [], currentStep = 0, onStepClick }) {
  const getStatus = (index) => {
    if (index < currentStep) return 'complete';
    if (index === currentStep) return 'active';
    return 'inactive';
  };

  return (
    <nav aria-label="Progress steps">
      {/* Desktop: Horizontal */}
      <ol className="hidden sm:flex items-center w-full">
        {steps.map((step, index) => {
          const status = getStatus(index);
          const isLast = index === steps.length - 1;
          const clickable = onStepClick && index < currentStep;

          return (
            <li
              key={index}
              className={`flex items-center ${isLast ? '' : 'flex-1'}`}
            >
              <button
                type="button"
                onClick={clickable ? () => onStepClick(index) : undefined}
                disabled={!clickable}
                aria-current={status === 'active' ? 'step' : undefined}
                className={`flex items-center gap-2 group ${
                  clickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shrink-0 transition-colors ${
                    status === 'complete'
                      ? 'bg-[#006633] text-white'
                      : status === 'active'
                      ? 'bg-[#003366] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {status === 'complete' ? (
                    <Check size={18} aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`text-sm font-medium whitespace-nowrap ${
                    status === 'active'
                      ? 'text-[#003366]'
                      : status === 'complete'
                      ? 'text-[#006633]'
                      : 'text-gray-500'
                  } ${clickable ? 'group-hover:underline' : ''}`}
                >
                  {step.label}
                </span>
              </button>

              {!isLast && (
                <div
                  aria-hidden="true"
                  className={`flex-1 h-0.5 mx-4 transition-colors ${
                    index < currentStep ? 'bg-[#006633]' : 'bg-gray-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: Vertical */}
      <ol className="flex sm:hidden flex-col gap-0">
        {steps.map((step, index) => {
          const status = getStatus(index);
          const isLast = index === steps.length - 1;
          const clickable = onStepClick && index < currentStep;

          return (
            <li key={index} className="flex items-stretch gap-3">
              {/* Circle + connecting line column */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={clickable ? () => onStepClick(index) : undefined}
                  disabled={!clickable}
                  aria-current={status === 'active' ? 'step' : undefined}
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 transition-colors ${
                    status === 'complete'
                      ? 'bg-[#006633] text-white'
                      : status === 'active'
                      ? 'bg-[#003366] text-white'
                      : 'bg-gray-200 text-gray-500'
                  } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  {status === 'complete' ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </button>
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className={`w-0.5 flex-1 min-h-6 ${
                      index < currentStep ? 'bg-[#006633]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <div className={`pt-1.5 pb-4 ${isLast ? 'pb-0' : ''}`}>
                <span
                  className={`text-sm font-medium ${
                    status === 'active'
                      ? 'text-[#003366]'
                      : status === 'complete'
                      ? 'text-[#006633]'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
