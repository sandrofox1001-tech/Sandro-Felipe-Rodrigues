export default function AnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-2">
        <div className="h-4 w-24 bg-[#21282f] rounded" />
        <div className="h-4 w-32 bg-[#21282f] rounded" />
        <div className="h-4 w-20 bg-[#21282f] rounded" />
        <div className="h-4 w-28 bg-[#21282f] rounded" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1c2230] border border-[#21282f] rounded-lg p-5">
            <div className="h-3 w-20 bg-[#21282f] rounded mb-4" />
            <div className="h-7 w-28 bg-[#21282f] rounded" />
          </div>
        ))}
      </div>

      {/* Summary skeleton */}
      <div className="bg-[#1c2230] border border-[#21282f] rounded-lg p-5">
        <div className="h-4 w-36 bg-[#21282f] rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-[#21282f] rounded" />
          <div className="h-3 w-5/6 bg-[#21282f] rounded" />
          <div className="h-3 w-4/5 bg-[#21282f] rounded" />
          <div className="h-3 w-full bg-[#21282f] rounded" />
          <div className="h-3 w-3/4 bg-[#21282f] rounded" />
        </div>
      </div>

      {/* Processing indicator */}
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="flex gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#00d4aa]"
              style={{
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <span className="text-sm text-[#6e7681] font-mono">Processando análise com IA...</span>
      </div>
    </div>
  );
}
