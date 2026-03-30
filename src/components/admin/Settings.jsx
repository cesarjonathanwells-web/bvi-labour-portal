import {
  Settings as SettingsIcon, Building, Clock, Phone, Mail, MapPin,
  DollarSign, User, Info, Shield, Globe, CreditCard,
} from 'lucide-react';
import { DEPARTMENT_INFO, FEE_TIERS, DOMESTIC_RATE, APPLICATION_FEE, FEE_CAP, PERMIT_TYPES } from '../../data/constants';

function InfoRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[#003366]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-medium ${highlight ? 'text-[#003366]' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">System Settings</h1>
        <p className="text-gray-500 -mt-4 mb-6">Department information, fee schedule, and system configuration reference.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#003366]" />
            <h2 className="text-lg font-bold text-[#003366]">Department Information</h2>
          </div>
          <div className="px-6 py-2 divide-y divide-gray-50">
            <InfoRow icon={Building} label="Department" value={DEPARTMENT_INFO.name} highlight />
            <InfoRow icon={Shield} label="Ministry" value={DEPARTMENT_INFO.ministry} />
            <InfoRow icon={User} label="Commissioner" value={DEPARTMENT_INFO.commissioner} />
            <InfoRow icon={MapPin} label="Address" value={DEPARTMENT_INFO.address} />
            <InfoRow icon={Globe} label="Short Name" value={DEPARTMENT_INFO.shortName} />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#003366]" />
            <h2 className="text-lg font-bold text-[#003366]">Contact Information</h2>
          </div>
          <div className="px-6 py-2 divide-y divide-gray-50">
            <InfoRow icon={Phone} label="Phone" value={DEPARTMENT_INFO.phone} />
            <InfoRow icon={Phone} label="Fax" value={DEPARTMENT_INFO.fax} />
            <InfoRow icon={Mail} label="Email" value={DEPARTMENT_INFO.email} />
          </div>

          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-[#003366]" />
              <h3 className="font-bold text-[#003366]">Business Hours</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Office Hours</span>
                <span className="font-medium text-gray-800">{DEPARTMENT_INFO.hours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cashier Hours</span>
                <span className="font-medium text-gray-800">{DEPARTMENT_INFO.cashierHours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Schedule */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#003366]" />
            <h2 className="text-lg font-bold text-[#003366]">Fee Schedule</h2>
          </div>
          <div className="px-6 py-4">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[#003366] mb-1">Work Permit Fees (Based on Annual Salary)</p>
              <p className="text-xs text-gray-500">Fees are calculated as a percentage of the worker&apos;s annual gross salary.</p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Salary Range</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {FEE_TIERS.map((tier, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700">{tier.label}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#003366]">{(tier.rate * 100).toFixed(0)}%</td>
                  </tr>
                ))}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-700">Domestic Worker Rate</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[#003366]">{(DOMESTIC_RATE * 100).toFixed(0)}%</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-600">Application Fee</p>
                <p className="text-lg font-bold text-amber-700">${APPLICATION_FEE}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-xs text-red-600">Fee Cap (Max)</p>
                <p className="text-lg font-bold text-red-700">${FEE_CAP.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Minimum Wage & Permit Types */}
        <div className="space-y-6">
          {/* Minimum Wage */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#003366]" />
              <h2 className="text-lg font-bold text-[#003366]">Minimum Wage</h2>
            </div>
            <div className="px-6 py-5">
              <div className="bg-green-50 rounded-xl p-5 text-center">
                <p className="text-4xl font-bold text-[#006633]">{DEPARTMENT_INFO.minimumWage}</p>
                <p className="text-sm text-green-700 mt-1">Current Minimum Wage</p>
                <p className="text-xs text-gray-500 mt-2">
                  Effective since {DEPARTMENT_INFO.minimumWageEffective}
                </p>
              </div>
            </div>
          </div>

          {/* Permit Types Reference */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Info className="w-5 h-5 text-[#003366]" />
              <h2 className="text-lg font-bold text-[#003366]">Permit Types</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              {Object.values(PERMIT_TYPES).map(pt => (
                <div key={pt.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm font-semibold text-[#003366]">{pt.label}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                    <span>Duration: <strong className="text-gray-700">{pt.duration}</strong></span>
                    <span>Processing: <strong className="text-gray-700">{pt.processing}</strong></span>
                    <span>Fee: <strong className="text-gray-700">{pt.fee}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
