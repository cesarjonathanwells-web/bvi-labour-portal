const sizeMap = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

export default function LoadingSpinner({ size = 'md', className = '' }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center justify-center ${className}`}
    >
      <div
        className={`${sizeMap[size] || sizeMap.md} rounded-full border-gray-200 border-t-[#003366] animate-spin`}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
