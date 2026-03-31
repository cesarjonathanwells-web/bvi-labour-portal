import { useState, useMemo, useRef } from 'react';
import {
  Calculator, DollarSign, ToggleLeft, ToggleRight, Info, Printer,
  ChevronDown, AlertCircle, CheckCircle2, BarChart3,
} from 'lucide-react';
import { calculateWorkPermitFee, formatCurrency } from '../../utils/feeCalculator';
import { FEE_TIERS, DOMESTIC_RATE, APPLICATION_FEE, FEE_CAP } from '../../data/constants';

const PERMIT_OPTIONS = [
  { id: 'new', label: 'New Work Permit', duration: 'Up to 3 years', proRate: 1 },
  { id: 'renewal', label: 'Work Permit Renewal', duration: 'Up to 1 year', proRate: 1 },
  { id: 'temporary', label: 'Temporary Work Permit', duration: 'Up to 3 months', proRate: 0.25 },
  { id: 'periodic', label: 'Periodic Work Permit', duration: '1 year (short periods)', proRate: 1 },
  { id: 'self-employed', label: 'Self-Employed Work Permit', duration: 'Up to 3 years', proRate: 1 },
];

const DURATION_OPTIONS = [
  { months: 1, label: '1 Month', factor: 1 / 12 },
  { months: 2, label: '2 Months', factor: 2 / 12 },
  { months: 3, label: '3 Months', factor: 3 / 12 },
  { months: 6, label: '6 Months', factor: 6 / 12 },
  { months: 9, label: '9 Months', factor: 9 / 12 },
  { months: 12, label: '12 Months (Full Year)', factor: 1 },
];

function parseSalaryInput(raw) {
  return parseFloat(raw.replace(/[^0-9.]/g, '')) || 0;
}

function formatSalaryDisplay(raw) {
  const num = parseSalaryInput(raw);
  if (!raw || num === 0) return '';
  return new Intl.NumberFormat('en-US').format(num);
}

export default function FeeCalculator() {
  const printRef = useRef(null);

  const [salaryRaw, setSalaryRaw] = useState('');
  const [isDomestic, setIsDomestic] = useState(false);
  const [permitType, setPermitType] = useState('new');
  const [durationMonths, setDurationMonths] = useState(12);
  const [showSchedule, setShowSchedule] = useState(false);

  const salary = parseSalaryInput(salaryRaw);
  const showDuration = permitType === 'temporary' || permitType === 'periodic';
  const durationFactor =
    DURATION_OPTIONS.find((d) => d.months === durationMonths)?.factor || 1;

  const calculation = useMemo(
    () => calculateWorkPermitFee(salary, isDomestic),
    [salary, isDomestic]
  );

  // Pro-rated amounts
  const proRatedPermitFee =
    Math.round(calculation.permitFee * durationFactor * 100) / 100;
  const proRatedTotal =
    Math.round((proRatedPermitFee + APPLICATION_FEE) * 100) / 100;
  const isProRated = showDuration && durationFactor < 1;

  // Bar chart max for scaling
  const barMax = Math.max(
    ...calculation.breakdown.map((b) => b.amount || 0),
    APPLICATION_FEE,
    1
  );

  const handleSalaryChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setSalaryRaw(raw);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>Fee Calculation - BVI Department of Labour</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; color: #333; }
          h1 { color: #003366; font-size: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-size: 13px; }
          .total { font-weight: bold; font-size: 18px; color: #003366; }
          .note { font-size: 12px; color: #666; margin-top: 20px; }
        </style></head><body>
        ${printRef.current.innerHTML}
        <p class="note">Calculated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p class="note">Fees effective July 1, 2017 &mdash; BVI Department of Labour and Workforce Development</p>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Input */}
        <div>
          <label htmlFor="fee-salary" className="label-field">Annual Salary</label>
          <div className="relative">
            <DollarSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              id="fee-salary"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className="input-field pl-10 text-lg font-semibold"
              value={formatSalaryDisplay(salaryRaw)}
              onChange={handleSalaryChange}
              aria-label="Annual salary in USD"
            />
          </div>
          {salary > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Monthly: {formatCurrency(salary / 12)}
            </p>
          )}
        </div>

        {/* Permit Type */}
        <div>
          <label htmlFor="fee-permitType" className="label-field">Permit Type</label>
          <div className="relative">
            <select
              id="fee-permitType"
              className="input-field appearance-none pr-10"
              value={permitType}
              onChange={(e) => setPermitType(e.target.value)}
            >
              {PERMIT_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.duration})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Domestic Toggle */}
        <div>
          <label className="label-field">Worker Classification</label>
          <button
            type="button"
            onClick={() => setIsDomestic(!isDomestic)}
            aria-pressed={isDomestic}
            aria-label={isDomestic ? 'Domestic worker classification enabled' : 'Non-domestic worker classification'}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border-2 transition-all ${
              isDomestic
                ? 'border-[#006633] bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {isDomestic ? (
              <ToggleRight className="w-8 h-8 text-[#006633] shrink-0" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-gray-400 shrink-0" />
            )}
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">
                {isDomestic ? 'Domestic Worker' : 'Non-Domestic Worker'}
              </p>
              <p className="text-xs text-gray-500">
                {isDomestic
                  ? `Flat rate of ${DOMESTIC_RATE * 100}% of annual salary`
                  : 'Standard tiered fee structure'}
              </p>
            </div>
          </button>
        </div>

        {/* Duration (conditional) */}
        {showDuration && (
          <div>
            <label htmlFor="fee-duration" className="label-field">Duration</label>
            <div className="relative">
              <select
                id="fee-duration"
                className="input-field appearance-none pr-10"
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.months} value={d.months}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Live Calculation Results */}
      <div ref={printRef} className="space-y-6">
        <div className="bg-gradient-to-br from-[#003366] to-blue-800 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5" />
            <h3 className="text-lg font-bold">Fee Calculation</h3>
          </div>

          {salary <= 0 ? (
            <p className="text-blue-200 text-sm">
              Enter an annual salary above to see the fee calculation.
            </p>
          ) : (
            <>
              {/* Tier Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="text-blue-200 text-xs uppercase tracking-wider">
                      <th className="text-left py-2 pr-4">Salary Range</th>
                      <th className="text-right py-2 px-4">Rate</th>
                      <th className="text-right py-2 px-4">Taxable</th>
                      <th className="text-right py-2 pl-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.breakdown.map((row, i) => (
                      <tr key={i} className="border-t border-white/10">
                        <td className="py-2 pr-4 font-medium">{row.tier}</td>
                        <td className="py-2 px-4 text-right text-blue-200">
                          {row.rate || `${DOMESTIC_RATE * 100}%`}
                        </td>
                        <td className="py-2 px-4 text-right text-blue-200">
                          {formatCurrency(row.taxable || row.salary || 0)}
                        </td>
                        <td className="py-2 pl-4 text-right font-semibold">
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-white/20 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Permit Fee (Subtotal)</span>
                  <span className="font-semibold">
                    {formatCurrency(calculation.permitFee)}
                  </span>
                </div>

                {calculation.capped && (
                  <div className="flex items-center gap-2 bg-yellow-500/20 rounded-lg px-3 py-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-yellow-300 shrink-0" />
                    <span className="text-yellow-100">
                      Fee capped at {formatCurrency(FEE_CAP)}. Original calculated fee
                      exceeded the maximum.
                    </span>
                  </div>
                )}

                {isProRated && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-200">
                      Pro-rated ({durationMonths} month
                      {durationMonths !== 1 ? 's' : ''})
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(proRatedPermitFee)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Application Fee</span>
                  <span className="font-semibold">
                    {formatCurrency(APPLICATION_FEE)}
                  </span>
                </div>

                <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/20">
                  <span>Total Due</span>
                  <span className="text-[#c5a55a]">
                    {formatCurrency(isProRated ? proRatedTotal : calculation.total)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Visual Bar Chart */}
        {salary > 0 && calculation.breakdown.length > 0 && (
          <div className="card">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <BarChart3 className="w-4 h-4" />
              Fee Breakdown
            </h4>
            <div className="space-y-3">
              {calculation.breakdown.map((row, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{row.tier}</span>
                    <span className="font-semibold">{formatCurrency(row.amount)}</span>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max((row.amount / barMax) * 100, 2)}%`,
                        background:
                          i === 0
                            ? '#003366'
                            : i === 1
                            ? '#c5a55a'
                            : '#006633',
                      }}
                    />
                  </div>
                </div>
              ))}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Application Fee</span>
                  <span className="font-semibold">{formatCurrency(APPLICATION_FEE)}</span>
                </div>
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max((APPLICATION_FEE / barMax) * 100, 2)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print / Save Button */}
      {salary > 0 && (
        <div className="flex justify-end">
          <button onClick={handlePrint} className="btn-outline text-sm">
            <Printer className="w-4 h-4" />
            Print / Save Calculation
          </button>
        </div>
      )}

      {/* Fee Schedule Reference */}
      <div>
        <button
          type="button"
          onClick={() => setShowSchedule(!showSchedule)}
          className="flex items-center gap-2 text-sm font-semibold text-[#003366] hover:underline"
        >
          <Info className="w-4 h-4" />
          {showSchedule ? 'Hide' : 'View'} Fee Schedule Reference
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showSchedule ? 'rotate-180' : ''}`}
          />
        </button>

        {showSchedule && (
          <div className="mt-4 card border-[#003366]/20">
            <h4 className="text-sm font-bold text-[#003366] mb-3">
              Work Permit Fee Schedule
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="text-left py-2 px-3 rounded-l-lg">Salary Range</th>
                    <th className="text-right py-2 px-3 rounded-r-lg">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {FEE_TIERS.map((tier, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="py-2 px-3 text-gray-700">{tier.label}</td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-800">
                        {tier.rate * 100}%
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-100">
                    <td className="py-2 px-3 text-gray-700">Domestic Workers</td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-800">
                      {DOMESTIC_RATE * 100}%
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="py-2 px-3 text-gray-700">Application Fee</td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-800">
                      {formatCurrency(APPLICATION_FEE)}
                    </td>
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="py-2 px-3 text-gray-700">Maximum Permit Fee</td>
                    <td className="py-2 px-3 text-right font-semibold text-red-600">
                      {formatCurrency(FEE_CAP)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-[#006633] shrink-0" />
                Fees effective July 1, 2017
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-[#006633] shrink-0" />
                Pro-rated for periods less than 1 year
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-[#006633] shrink-0" />
                Tiered rates apply cumulatively (each tier applies only to the salary within that range)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
