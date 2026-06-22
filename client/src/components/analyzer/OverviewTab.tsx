import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DollarSign, ShieldAlert, Calendar, Layers, PenTool, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BudgetBreakdownItem {
  category: string;
  materialCostEstimate: number;
  laborCostEstimate: number;
  totalCostEstimate: number;
}

interface Material {
  description: string;
  category: string;
  quantity: string;
  unit: string;
  phase: string;
}

interface Phase {
  phaseNumber: number;
  phaseName: string;
  description: string;
  estimatedDuration: string;
}

interface Risk {
  title: string;
  level: 'Alto' | 'Médio' | 'Baixo';
  guidance: string;
}

interface AnalysisResult {
  projectName: string;
  projectType: string;
  totalArea: string;
  estimatedDeadline: string;
  complexity: string;
  summary: string;
  estimatedMaterialCost: number;
  estimatedLaborCost: number;
  estimatedOtherCosts: number;
  estimatedTotalCost: number;
  budgetBreakdown: BudgetBreakdownItem[];
  materials: Material[];
  phases: Phase[];
  risks: Risk[];
}

interface OverviewTabProps {
  data: AnalysisResult;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function OverviewTab({ data }: OverviewTabProps) {
  const chartData = useMemo(() => {
    return data.budgetBreakdown?.map((item) => ({
      name: item.category,
      Materiais: item.materialCostEstimate,
      'Mão de Obra': item.laborCostEstimate,
      Total: item.totalCostEstimate,
    })) || [];
  }, [data.budgetBreakdown]);

  // Download complete system report in structured Markdown format
  const handleDownloadReport = () => {
    try {
      let reportContent = `# RELATÓRIO DO PLANEJAMENTO E ORÇAMENTO ESTIMADO\n`;
      reportContent += `==================================================\n\n`;
      reportContent += `PROJETO: ${data.projectName}\n`;
      reportContent += `TIPO: ${data.projectType}\n`;
      reportContent += `ÁREA DO PROJETO: ${data.totalArea}\n`;
      reportContent += `PRAZO ESTIMADO: ${data.estimatedDeadline}\n`;
      reportContent += `GRAU DE COMPLEXIDADE: ${data.complexity}\n\n`;

      reportContent += `--------------------------------------------------\n`;
      reportContent += `RESUMO EXECUTIVO DO PROJETO\n`;
      reportContent += `--------------------------------------------------\n`;
      reportContent += `${data.summary}\n\n`;

      reportContent += `--------------------------------------------------\n`;
      reportContent += `PLANEJAMENTO E CRONOGRAMA FINANCEIRO ESTIMADO (BRL)\n`;
      reportContent += `--------------------------------------------------\n`;
      reportContent += `CUSTO TOTAL GERAL: ${formatCurrency(data.estimatedTotalCost)}\n`;
      reportContent += `└─ Custo de Materiais: ${formatCurrency(data.estimatedMaterialCost)}\n`;
      reportContent += `└─ Custo de Mão de Obra: ${formatCurrency(data.estimatedLaborCost)}\n`;
      reportContent += `└─ Custos Indiretos (Taxas, Equipamentos, Contingências): ${formatCurrency(data.estimatedOtherCosts)}\n\n`;

      reportContent += `DETALHAMENTO POR ETAPAS:\n`;
      data.budgetBreakdown?.forEach((item) => {
        reportContent += `- ${item.category}:\n`;
        reportContent += `  * Materiais: ${formatCurrency(item.materialCostEstimate)}\n`;
        reportContent += `  * Mão de Obra: ${formatCurrency(item.laborCostEstimate)}\n`;
        reportContent += `  * Total Etapa: ${formatCurrency(item.totalCostEstimate)}\n`;
      });
      reportContent += `\n`;

      reportContent += `--------------------------------------------------\n`;
      reportContent += `FASES CRONOLÓGICAS DE EXECUÇÃO\n`;
      reportContent += `--------------------------------------------------\n`;
      data.phases?.forEach((phase) => {
        reportContent += `[Fase ${String(phase.phaseNumber).padStart(2, '0')}] ${phase.phaseName}\n`;
        reportContent += `Duração Estimada: ${phase.estimatedDuration}\n`;
        reportContent += `Descrição: ${phase.description}\n\n`;
      });

      reportContent += `--------------------------------------------------\n`;
      reportContent += `ANÁLISE DE RISCOS E MEDIDAS DE MITIGAÇÃO\n`;
      reportContent += `--------------------------------------------------\n`;
      data.risks?.forEach((risk) => {
        reportContent += `- ${risk.title} (Nível: ${risk.level})\n`;
        reportContent += `  Orientação Preventiva: ${risk.guidance}\n\n`;
      });

      reportContent += `--------------------------------------------------\n`;
      reportContent += `LISTA DE MATERIAIS EXTRAÍDA\n`;
      reportContent += `--------------------------------------------------\n`;
      data.materials?.forEach((mat) => {
        reportContent += `• [${mat.category}] ${mat.description} - Qtd: ${mat.quantity} ${mat.unit} (${mat.phase})\n`;
      });
      reportContent += `\n==================================================\n`;
      reportContent += `Documento gerado eletronicamente via Analisador de Projetos (IA).\n`;

      const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanProjName = data.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
      link.download = `planejamento_projeto_${cleanProjName}.md`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Relatório gerado com sucesso! Download iniciado.');
    } catch {
      toast.error('Erro ao gerar relatório técnico para download.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1c2230] border border-[#21282f] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.2)] flex items-center justify-center text-xl">
            📐
          </div>
          <div>
            <div className="text-[10px] text-[#6e7681] font-mono uppercase tracking-wider">Área Total</div>
            <div className="text-sm font-bold text-[#e6edf3] font-mono mt-0.5">{data.totalArea}</div>
          </div>
        </div>

        <div className="bg-[#1c2230] border border-[#21282f] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,153,255,0.1)] border border-[rgba(0,153,255,0.2)] flex items-center justify-center text-xl">
            ⏱
          </div>
          <div>
            <div className="text-[10px] text-[#6e7681] font-mono uppercase tracking-wider">Prazo Estimado</div>
            <div className="text-sm font-bold text-[#e6edf3] font-mono mt-0.5">{data.estimatedDeadline}</div>
          </div>
        </div>

        <div className="bg-[#1c2230] border border-[#21282f] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(255,107,53,0.1)] border border-[rgba(255,107,53,0.2)] flex items-center justify-center text-xl">
            ⚡
          </div>
          <div>
            <div className="text-[10px] text-[#6e7681] font-mono uppercase tracking-wider">Complexidade</div>
            <div className="text-sm font-bold text-[#e6edf3] font-mono mt-0.5">{data.complexity}</div>
          </div>
        </div>

        <div className="bg-[#1c2230] border border-[#00d4aa]/30 rounded-xl p-4 flex items-center gap-3 highlight-card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,212,170,0.02)] to-[rgba(0,153,255,0.02)] opacity-30 pointer-events-none" />
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,212,170,0.15)] border border-[rgba(0,212,170,0.3)] flex items-center justify-center text-xl">
            💰
          </div>
          <div>
            <div className="text-[10px] text-[#00d4aa] font-mono uppercase tracking-wider font-semibold">Custo Estimado</div>
            <div className="text-sm font-bold text-[#00d4aa] font-mono mt-0.5">{formatCurrency(data.estimatedTotalCost)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Resumo Executivo & Download */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1c2230] border border-[#21282f] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#e6edf3] flex items-center gap-2">
              <span className="text-sm">📝</span>
              Resumo Executivo
            </h3>
            <div className="text-xs text-[#8b949e] leading-relaxed space-y-3 font-sans">
              {data.summary ? (
                data.summary.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p>Resumo indisponível ou em processamento.</p>
              )}
            </div>
            
            <div className="pt-4 border-t border-[#21282f] flex">
              <Button
                onClick={handleDownloadReport}
                className="w-full bg-[#161b22] hover:bg-[#30363d] border border-[#21282f] text-sm text-[#00d4aa] font-mono py-2 py-5 cursor-pointer rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Salvar Planejamento (.MD)</span>
              </Button>
            </div>
          </div>

          <div className="bg-[#1c2230] border border-[#21282f] rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#e6edf3] flex items-center gap-2">
              <span className="text-sm">🎯</span>
              Foco da Análise IA
            </h3>
            <div className="space-y-2 text-xs text-[#8b949e]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00d4aa]" />
                <span>Quantitativo extraído de materiais</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00d4aa]" />
                <span>Orçamento e encargos de mão de obra</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00d4aa]" />
                <span>Fases construtivas ordenadas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00d4aa]" />
                <span>Riscos normativos estruturais</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Budget details & Interactive visualizer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1c2230] border border-[#21282f] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#e6edf3] flex items-center gap-2">
              <span className="text-sm">📈</span>
              Orçamento de Custos Detalhado
            </h3>

            {/* Overall cost boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#161b22] border border-[#21282f] rounded-lg p-3 text-center">
                <div className="text-[10px] text-[#6e7681] font-mono leading-none">MATERIAIS</div>
                <div className="text-xs font-semibold text-[#8b949e] font-mono mt-1">{formatCurrency(data.estimatedMaterialCost)}</div>
              </div>
              <div className="bg-[#161b22] border border-[#21282f] rounded-lg p-3 text-center">
                <div className="text-[10px] text-[#6e7681] font-mono leading-none">MÃO DE OBRA</div>
                <div className="text-xs font-semibold text-[#8b949e] font-mono mt-1">{formatCurrency(data.estimatedLaborCost)}</div>
              </div>
              <div className="bg-[#161b22] border border-[#21282f] rounded-lg p-3 text-center">
                <div className="text-[10px] text-[#6e7681] font-mono leading-none">FONTES INDIRETAS</div>
                <div className="text-xs font-semibold text-[#8b949e] font-mono mt-1">{formatCurrency(data.estimatedOtherCosts)}</div>
              </div>
            </div>

            {/* Stacked Chart */}
            {chartData.length > 0 && (
              <div className="pt-2">
                <div className="text-[10px] font-bold text-[#6e7681] uppercase tracking-wider mb-2 font-mono">Composição Financeira por Etapa</div>
                <div className="h-48 w-full font-mono text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <XAxis dataKey="name" stroke="#6e7681" tickSize={4} />
                      <YAxis stroke="#6e7681" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161b22',
                          borderColor: '#21282f',
                          borderRadius: '8px',
                          color: '#e6edf3',
                        }}
                        formatter={(value) => [formatCurrency(Number(value)), '']}
                      />
                      <Legend iconSize={8} />
                      <Bar dataKey="Materiais" stackId="a" fill="#0099ff" />
                      <Bar dataKey="Mão de Obra" stackId="a" fill="#00d4aa" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Cost breakdown table */}
            <div className="mt-4 border border-[#21282f] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#21282f] bg-[#161b22]">
                      <th className="px-3 py-2 text-left text-[#6e7681] font-semibold uppercase">Etapa</th>
                      <th className="px-3 py-2 text-right text-[#6e7681] font-semibold uppercase">Materiais</th>
                      <th className="px-3 py-2 text-right text-[#6e7681] font-semibold uppercase">Mão de Obra</th>
                      <th className="px-3 py-2 text-right text-[#6e7681] font-semibold uppercase">Total Etapa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.budgetBreakdown?.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-[#21282f] hover:bg-[rgba(255,255,255,0.01)] transition-colors"
                      >
                        <td className="px-3 py-2 text-[#e6edf3] font-semibold">{item.category}</td>
                        <td className="px-3 py-2 text-right text-[#8b949e]">{formatCurrency(item.materialCostEstimate)}</td>
                        <td className="px-3 py-2 text-right text-[#8b949e]">{formatCurrency(item.laborCostEstimate)}</td>
                        <td className="px-3 py-2 text-right text-[#00d4aa] font-semibold">{formatCurrency(item.totalCostEstimate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
