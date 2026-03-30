import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { JOB_CATEGORIES, ISLANDS } from '../../data/constants';
import { formatDate } from '../../utils/helpers';
import {
  Search, Filter, MapPin, DollarSign, Briefcase, Calendar,
  LayoutGrid, List, X, SlidersHorizontal,
  Building2, ArrowUpDown, Inbox,
} from 'lucide-react';

export default function JobSearch({ onViewJob, onApply }) {
  const { jobs } = useApp();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    category: '', island: '', salaryMin: '', salaryMax: '',
    employmentType: '', datePosted: '',
  });

  const openJobs = jobs.filter(j => j.status === 'open');

  const filtered = useMemo(() => {
    let result = openJobs;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(j =>
        j.title?.toLowerCase().includes(s) ||
        j.description?.toLowerCase().includes(s) ||
        j.employerName?.toLowerCase().includes(s) ||
        j.category?.toLowerCase().includes(s)
      );
    }

    if (filters.category) result = result.filter(j => j.category === filters.category);
    if (filters.island) result = result.filter(j => j.location === filters.island);
    if (filters.employmentType) result = result.filter(j => j.employmentType === filters.employmentType);
    if (filters.salaryMin) result = result.filter(j => j.salaryMin >= Number(filters.salaryMin));
    if (filters.salaryMax) result = result.filter(j => j.salaryMax <= Number(filters.salaryMax) || j.salaryMin <= Number(filters.salaryMax));
    if (filters.datePosted) {
      const days = Number(filters.datePosted);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter(j => new Date(j.postedAt) >= cutoff);
    }

    // Sort
    switch (sortBy) {
      case 'newest': result.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)); break;
      case 'oldest': result.sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt)); break;
      case 'salary-high': result.sort((a, b) => (b.salaryMax || b.salaryMin) - (a.salaryMax || a.salaryMin)); break;
      case 'salary-low': result.sort((a, b) => a.salaryMin - b.salaryMin); break;
    }

    return result;
  }, [openJobs, search, filters, sortBy]);

  const clearFilters = () => {
    setFilters({ category: '', island: '', salaryMin: '', salaryMax: '', employmentType: '', datePosted: '' });
    setSearch('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || search;

  const JobCard = ({ job }) => {
    const salary = job.salaryMax && job.salaryMax !== job.salaryMin
      ? `$${Number(job.salaryMin).toLocaleString()} - $${Number(job.salaryMax).toLocaleString()}`
      : `$${Number(job.salaryMin).toLocaleString()}`;

    if (viewMode === 'list') {
      return (
        <div className="card-hover flex flex-col sm:flex-row sm:items-center gap-4"
          onClick={() => onViewJob?.(job)}>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{job.title}</h3>
              {job.belongerPreferred && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">Belonger Pref.</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.employerName}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{salary}/yr</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(job.postedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{job.employmentType}</span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{job.category}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="card-hover flex flex-col h-full" onClick={() => onViewJob?.(job)}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {job.employmentType}
          </span>
          <span className="text-xs text-gray-400">{formatDate(job.postedAt)}</span>
        </div>
        <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">{job.title}</h3>
        <p className="text-gray-600 text-sm mb-3 flex items-center gap-1">
          <Building2 className="w-3 h-3 flex-shrink-0" />{job.employerName}
        </p>
        <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1">{job.description}</p>
        <div className="space-y-2 mt-auto">
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
              <MapPin className="w-3 h-3" />{job.location}
            </span>
            <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
              <Briefcase className="w-3 h-3" />{job.category}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-semibold text-[#003366] text-sm flex items-center gap-1">
              <DollarSign className="w-4 h-4" />{salary}/yr
            </span>
            {job.belongerPreferred && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                Belonger Pref.
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Search bar */}
      <div className="bg-[#003366] rounded-xl p-6 mb-6">
        <h2 className="text-white text-xl font-bold mb-4">Find Your Next Opportunity in the BVI</h2>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" className="w-full pl-10 pr-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-[#c5a55a] outline-none text-gray-900"
              placeholder="Search by job title, company, or keyword..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-secondary flex items-center gap-2 px-4"
            onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Filter className="w-4 h-4" />Filter Jobs
            </h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-red-600 hover:underline flex items-center gap-1">
                <X className="w-3 h-3" />Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label-field">Category</label>
              <select className="input-field" value={filters.category}
                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
                <option value="">All Categories</option>
                {JOB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Island</label>
              <select className="input-field" value={filters.island}
                onChange={e => setFilters(f => ({ ...f, island: e.target.value }))}>
                <option value="">All Islands</option>
                {ISLANDS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Employment Type</label>
              <select className="input-field" value={filters.employmentType}
                onChange={e => setFilters(f => ({ ...f, employmentType: e.target.value }))}>
                <option value="">All Types</option>
                {['Full-time', 'Part-time', 'Temporary', 'Contract'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Min Salary (USD/yr)</label>
              <input type="number" className="input-field" placeholder="e.g., 20000" value={filters.salaryMin}
                onChange={e => setFilters(f => ({ ...f, salaryMin: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Max Salary (USD/yr)</label>
              <input type="number" className="input-field" placeholder="e.g., 80000" value={filters.salaryMax}
                onChange={e => setFilters(f => ({ ...f, salaryMax: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Date Posted</label>
              <select className="input-field" value={filters.datePosted}
                onChange={e => setFilters(f => ({ ...f, datePosted: e.target.value }))}>
                <option value="">Any Time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="14">Last 2 weeks</option>
                <option value="30">Last 30 days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-gray-600 text-sm">
          <span className="font-semibold">{filtered.length}</span> job{filtered.length !== 1 ? 's' : ''} found
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select className="input-field !w-auto !py-1.5 !px-2 text-sm" value={sortBy}
              onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="salary-high">Salary: High to Low</option>
              <option value="salary-low">Salary: Low to High</option>
            </select>
          </div>
          <div className="flex border rounded-lg overflow-hidden">
            <button className={`p-2 ${viewMode === 'grid' ? 'bg-[#003366] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setViewMode('grid')}><LayoutGrid className="w-4 h-4" /></button>
            <button className={`p-2 ${viewMode === 'list' ? 'bg-[#003366] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setViewMode('list')}><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Found</h3>
          <p className="text-gray-500 mb-4">
            {hasActiveFilters ? 'Try adjusting your filters or search terms.' : 'No jobs have been posted yet. Check back later!'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-outline">Clear Filters</button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}
    </div>
  );
}
