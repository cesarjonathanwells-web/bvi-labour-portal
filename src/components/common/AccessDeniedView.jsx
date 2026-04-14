import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, HelpCircle } from 'lucide-react';

/**
 * Route-level access-denied view. Rendered by the department permission
 * guard whenever a signed-in user tries to visit a page their role
 * doesn't cover. Explicit "you don't have access" is better UX than a
 * silent redirect back to the dashboard — the user otherwise wonders
 * whether the click did anything.
 */
export default function AccessDeniedView({
  requiredPermission,
  dashboardPath = '/dept/dashboard',
  dashboardLabel = 'department dashboard',
}) {
  return (
    <div className="max-w-xl mx-auto mt-16 text-center px-4">
      <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-10 h-10 text-[#7c3aed]" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
      <p className="text-gray-600 mb-1">
        Your role does not include permission to open this page.
      </p>
      {requiredPermission && (
        <p className="text-sm text-gray-500 mb-6">
          Required permission: <span className="font-mono text-[#7c3aed]">{requiredPermission}</span>
        </p>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg font-semibold text-sm hover:bg-[#6d28d9] transition-colors"
        >
          <ArrowLeft size={14} /> Back to {dashboardLabel}
        </Link>
        <Link
          to="/faq"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          <HelpCircle size={14} /> Help &amp; FAQ
        </Link>
      </div>
      <p className="text-xs text-gray-400 mt-8">
        If you believe you should have access, contact your supervisor — the Department can update your role permissions.
      </p>
    </div>
  );
}
