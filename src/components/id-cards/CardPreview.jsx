import { useState } from 'react';
import { ArrowLeft, CreditCard, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkPermitCard from './WorkPermitCard';

export default function CardPreview({ permit }) {
  const [showBack, setShowBack] = useState(false);
  const navigate = useNavigate();

  if (!permit) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">No Permit Selected</h2>
        <p className="text-gray-500 mb-6">Please select an approved permit to preview the work permit card.</p>
        <button onClick={() => navigate('/permits')} className="btn-primary">
          <ArrowLeft size={16} /> Go to Permits
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title mb-1">Work Permit Card Preview</h1>
          <p className="text-gray-500 text-sm">
            Permit #{permit.permitNumber} &mdash;{' '}
            <span className="font-medium text-[#003366]">
              {showBack ? 'Back Side' : 'Front Side'}
            </span>
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="btn-outline text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Card display area */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 sm:p-12 flex flex-col items-center border border-gray-200">
        {/* Label */}
        <div className="flex items-center gap-2 mb-6">
          <RotateCcw
            size={14}
            className={`text-gray-400 transition-transform ${showBack ? 'rotate-180' : ''}`}
          />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {showBack ? 'Back of Card' : 'Front of Card'}
          </span>
        </div>

        {/* The card itself with shadow */}
        <div className="shadow-2xl rounded-xl">
          <WorkPermitCard
            permit={permit}
            showBack={showBack}
            onFlip={() => setShowBack(prev => !prev)}
          />
        </div>
      </div>

      {/* Side-by-side thumbnail preview */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Both Sides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setShowBack(false)}
            className={`rounded-xl border-2 p-3 transition-all ${
              !showBack ? 'border-[#003366] shadow-lg' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Front</div>
            <div className="transform scale-[0.5] origin-top-left" style={{ width: 428, height: 270 }}>
              <WorkPermitCard permit={permit} showBack={false} />
            </div>
          </button>
          <button
            onClick={() => setShowBack(true)}
            className={`rounded-xl border-2 p-3 transition-all ${
              showBack ? 'border-[#003366] shadow-lg' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Back</div>
            <div className="transform scale-[0.5] origin-top-left" style={{ width: 428, height: 270 }}>
              <WorkPermitCard permit={permit} showBack={true} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
