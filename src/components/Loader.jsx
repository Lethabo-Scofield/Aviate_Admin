export function Spinner({ size = 24, className = "" }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
        <circle cx="12" cy="12" r="10" stroke="#e5e5ea" strokeWidth="3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="#1d1d1f" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <Spinner size={32} />
        <p className="text-sm text-[#86868b] mt-4 font-medium">Loading...</p>
      </div>
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`apple-card p-6 ${className}`}>
      <div className="skeleton h-3 w-24 mb-4" />
      <div className="skeleton h-7 w-20 mb-3" />
      <div className="skeleton h-2.5 w-32" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="apple-card p-4 flex items-center gap-4">
      <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1">
        <div className="skeleton h-3.5 w-40 mb-2" />
        <div className="skeleton h-2.5 w-56" />
      </div>
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonGrid({ cols = 4, rows = 1 }) {
  return (
    <div className={`grid gap-5`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
