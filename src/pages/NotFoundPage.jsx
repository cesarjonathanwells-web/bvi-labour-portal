import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-white flex flex-col">
      {/* Top bar */}
      <div className="bg-[#003366] text-white px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#c5a55a] flex items-center justify-center font-bold text-[#003366] text-xs">
            BVI
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-[#c5a55a]">BVI Government</p>
            <p className="text-[10px] text-gray-300">Department of Labour &amp; Workforce Development</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {/* Large 404 */}
          <div className="relative mb-8">
            <h1 className="text-[120px] sm:text-[160px] font-extrabold text-[#003366]/10 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <HelpCircle className="w-12 h-12 text-[#c5a55a] mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-[#003366]">Page Not Found</h2>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-2 text-lg">
            The page you are looking for does not exist or has been moved.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            If you believe this is an error, please contact the Department of Labour.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard" className="btn-primary justify-center">
              <Home size={18} /> Go to Dashboard
            </Link>
            <Link to="/" className="btn-outline justify-center">
              <ArrowLeft size={18} /> Back to Home
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Quick Links</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/permits" className="text-sm text-[#003366] hover:text-[#c5a55a] font-medium transition-colors">
                Work Permits
              </Link>
              <span className="text-gray-300">|</span>
              <Link to="/disputes" className="text-sm text-[#003366] hover:text-[#c5a55a] font-medium transition-colors">
                Disputes
              </Link>
              <span className="text-gray-300">|</span>
              <Link to="/jobs" className="text-sm text-[#003366] hover:text-[#c5a55a] font-medium transition-colors">
                Job Search
              </Link>
              <span className="text-gray-300">|</span>
              <Link to="/fees/calculator" className="text-sm text-[#003366] hover:text-[#c5a55a] font-medium transition-colors">
                Fee Calculator
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#003366] text-gray-400 text-center py-4 text-xs">
        <p>Government of the Virgin Islands &mdash; Department of Labour &amp; Workforce Development</p>
      </div>
    </div>
  );
}
