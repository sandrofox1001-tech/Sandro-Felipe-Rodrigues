interface Risk {
  title: string;
  level: 'Alto' | 'Médio' | 'Baixo';
  guidance: string;
}

interface RisksTabProps {
  risks: Risk[];
}

const RISK_STYLES = {
  Alto: {
    borderColor: 'border-l-[#f85149]',
    bgColor: 'bg-[rgba(248,81,73,0.05)]',
    badgeBg: 'bg-[rgba(248,81,73,0.15)] border-[rgba(248,81,73,0.3)]',
    badgeText: 'text-[#f85149]',
    icon: '🔴',
    sectionBg: 'bg-[rgba(248,81,73,0.04)] border-[rgba(248,81,73,0.15)]',
    headerColor: 'text-[#f85149]',
  },
  Médio: {
    borderColor: 'border-l-[#d29922]',
    bgColor: 'bg-[rgba(210,153,34,0.05)]',
    badgeBg: 'bg-[rgba(210,153,34,0.15)] border-[rgba(210,153,34,0.3)]',
    badgeText: 'text-[#d29922]',
    icon: '🟡',
    sectionBg: 'bg-[rgba(210,153,34,0.04)] border-[rgba(210,153,34,0.15)]',
    headerColor: 'text-[#d29922]',
  },
  Baixo: {
    borderColor: 'border-l-[#3fb950]',
    bgColor: 'bg-[rgba(63,185,80,0.05)]',
    badgeBg: 'bg-[rgba(63,185,80,0.15)] border-[rgba(63,185,80,0.3)]',
    badgeText: 'text-[#3fb950]',
    icon: '🟢',
    sectionBg: 'bg-[rgba(63,185,80,0.04)] border-[rgba(63,185,80,0.15)]',
    headerColor: 'text-[#3fb950]',
  },
} as const;

export default function RisksTab({ risks }: RisksTabProps) {
  if (!risks || risks.length === 0) {
    return (
      <div className="bg-[#1c2230] border border-[#21282f] rounded-lg p-8 text-center text-[#8b949e]">
        Nenhum risco identificado
      </div>
    );
  }

  const risksByLevel = {
    Alto: risks.filter((r) => r.level === 'Alto'),
    Médio: risks.filter((r) => r.level === 'Médio'),
    Baixo: risks.filter((r) => r.level === 'Baixo'),
  };

  const totalRisks = risks.length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Summary bar */}
      <div className="flex gap-3 flex-wrap">
        {(['Alto', 'Médio', 'Baixo'] as const).map((level) => {
          const count = risksByLevel[level].length;
          if (count === 0) return null;
          const styles = RISK_STYLES[level];
          return (
            <div key={level} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${styles.badgeBg} ${styles.badgeText}`}>
              <span>{styles.icon}</span>
              <span>{count} {level}{count > 1 ? 's' : ''}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#21282f] bg-[rgba(255,255,255,0.04)] text-xs font-semibold text-[#6e7681]">
          Total: {totalRisks}
        </div>
      </div>

      {/* Risk groups */}
      {(['Alto', 'Médio', 'Baixo'] as const).map((level) => {
        const levelRisks = risksByLevel[level];
        if (levelRisks.length === 0) return null;
        const styles = RISK_STYLES[level];

        return (
          <div key={level}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${styles.headerColor}`}>
              <span>{styles.icon}</span>
              Riscos {level}
              <span className="text-[#6e7681] font-normal normal-case tracking-normal">({levelRisks.length})</span>
            </h3>

            <div className="space-y-2.5 stagger-children">
              {levelRisks.map((risk, idx) => (
                <div
                  key={idx}
                  className={`${styles.bgColor} border-l-4 ${styles.borderColor} rounded-r-lg p-4 border border-l-4 border-[#21282f]`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${styles.badgeBg} ${styles.badgeText}`}>
                          {level}
                        </span>
                      </div>
                      <div className="font-semibold text-[#e6edf3] mb-2 text-sm">{risk.title}</div>
                      <div className="text-xs text-[#8b949e] leading-relaxed">{risk.guidance}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
