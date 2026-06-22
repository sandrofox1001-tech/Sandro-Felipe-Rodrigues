interface Phase {
  phaseNumber: number;
  phaseName: string;
  description: string;
  estimatedDuration: string;
}

interface PhasesTabProps {
  phases: Phase[];
}

export default function PhasesTab({ phases }: PhasesTabProps) {
  if (!phases || phases.length === 0) {
    return (
      <div className="bg-[#1c2230] border border-[#21282f] rounded-lg p-8 text-center text-[#8b949e]">
        Nenhuma fase disponível
      </div>
    );
  }

  return (
    <div className="space-y-3 stagger-children">
      {phases.map((phase) => (
        <div
          key={phase.phaseNumber}
          className="bg-[#1c2230] border border-[#21282f] rounded-lg p-5 flex gap-4 hover:border-[#00d4aa] transition-all duration-200 group"
        >
          <div className="flex-shrink-0 pt-0.5">
            <div className="w-8 h-8 bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.3)] rounded-md flex items-center justify-center text-xs font-bold text-[#00d4aa] font-mono group-hover:bg-[rgba(0,212,170,0.2)] transition-colors">
              {String(phase.phaseNumber).padStart(2, '0')}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#e6edf3] mb-2 text-base">{phase.phaseName}</div>
            <div className="text-sm text-[#8b949e] leading-relaxed mb-3">{phase.description}</div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 bg-[rgba(255,107,53,0.1)] text-[#ff6b35] text-xs font-mono px-2.5 py-1 rounded border border-[rgba(255,107,53,0.2)]">
                <span>⏱</span>
                {phase.estimatedDuration}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
