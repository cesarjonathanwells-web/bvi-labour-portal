import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPortalBasePath } from '../../utils/helpers';
import {
  FileText,
  RefreshCw,
  Clock,
  Calendar,
  Briefcase,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { PERMIT_TYPES } from '../../data/constants';

const TYPE_CONFIG = {
  new: {
    icon: FileText,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    accent: 'group-hover:border-blue-400',
    description:
      'Apply for a new work permit for a foreign national to be employed in the BVI. Requires employer sponsorship and full documentation.',
    subRoute: 'apply/new',
  },
  renewal: {
    icon: RefreshCw,
    color: 'bg-green-50 text-green-600 border-green-200',
    accent: 'group-hover:border-green-400',
    description:
      'Renew an existing work permit before it expires. Begin the process at least 4 weeks before the expiry date to avoid gaps in employment authorization.',
    subRoute: 'apply/renewal',
  },
  temporary: {
    icon: Clock,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    accent: 'group-hover:border-purple-400',
    description:
      'For short-term assignments up to 3 months. Ideal for project-based work, consultants, or seasonal positions.',
    subRoute: 'apply/temporary',
  },
  periodic: {
    icon: Calendar,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    accent: 'group-hover:border-orange-400',
    description:
      'For workers who visit the BVI for short periods throughout the year, such as auditors, trainers, or service technicians.',
    subRoute: 'apply/new',
  },
  'self-employed': {
    icon: Briefcase,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    accent: 'group-hover:border-teal-400',
    description:
      'For foreign nationals who wish to operate their own business in the BVI. Requires a valid trade license and business plan.',
    subRoute: 'apply/new',
  },
  emergency: {
    icon: AlertTriangle,
    color: 'bg-red-50 text-red-600 border-red-200',
    accent: 'group-hover:border-red-400',
    description:
      'Expedited permit for urgent, unforeseen circumstances lasting up to 7 days. Requires justification and supporting evidence.',
    subRoute: 'apply/temporary',
  },
};

export default function PermitTypeSelector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const portalBase = getPortalBasePath(user?.portal);
  const types = Object.values(PERMIT_TYPES);

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Apply for a Work Permit</h1>
        <p className="text-gray-600 max-w-2xl">
          Select the type of work permit you need. Each permit type has different
          requirements, processing times, and fee structures. If you are unsure
          which type applies, contact the Department of Labour for guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {types.map((type) => {
          const config = TYPE_CONFIG[type.id] || TYPE_CONFIG.new;
          const Icon = config.icon;

          return (
            <button
              key={type.id}
              onClick={() => navigate(`${portalBase}/permits/${config.subRoute}`)}
              className={`group card-hover text-left flex flex-col h-full ${config.accent}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`p-3 rounded-lg border ${config.color} shrink-0`}
                >
                  <Icon size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {type.label}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-5 leading-relaxed flex-1">
                {config.description}
              </p>

              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium text-gray-800">
                    {type.duration}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Processing</span>
                  <span className="font-medium text-gray-800">
                    {type.processing}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Fee</span>
                  <span className="font-medium text-gray-800">{type.fee}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[#003366] font-semibold text-sm mt-auto pt-4 border-t border-gray-100 group-hover:gap-3 transition-all">
                Start Application <ArrowRight size={16} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 card bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <FileText size={20} className="text-[#003366] mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-[#003366] mb-1">
              Need help choosing?
            </h4>
            <p className="text-sm text-gray-700">
              If you are unsure which permit type is appropriate for your
              situation, please contact the Department of Labour at{' '}
              <span className="font-medium">1(284) 468-4780</span> or email{' '}
              <span className="font-medium">labour@gov.vg</span> during office
              hours (Monday - Friday, 8:30 a.m. to 4:30 p.m.).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
