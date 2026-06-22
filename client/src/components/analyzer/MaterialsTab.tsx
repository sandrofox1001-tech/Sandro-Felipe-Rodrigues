import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Material {
  description: string;
  category: string;
  quantity: string;
  unit: string;
  phase: string;
}

interface MaterialsTabProps {
  materials: Material[];
}

const getCategoryStyle = (category: string) => {
  const c = category?.toLowerCase() || '';
  if (c.includes('elétric')) return 'bg-[rgba(0,153,255,0.12)] text-[#0099ff] border-[rgba(0,153,255,0.25)]';
  if (c.includes('hidráulic')) return 'bg-[rgba(0,212,170,0.1)] text-[#00d4aa] border-[rgba(0,212,170,0.25)]';
  if (c.includes('estrutural')) return 'bg-[rgba(255,107,53,0.12)] text-[#ff6b35] border-[rgba(255,107,53,0.25)]';
  if (c.includes('civil')) return 'bg-[rgba(210,153,34,0.12)] text-[#d29922] border-[rgba(210,153,34,0.25)]';
  if (c.includes('acabamento')) return 'bg-[rgba(63,185,80,0.1)] text-[#3fb950] border-[rgba(63,185,80,0.25)]';
  if (c.includes('mecânic')) return 'bg-[rgba(139,92,246,0.12)] text-[#a78bfa] border-[rgba(139,92,246,0.25)]';
  return 'bg-[rgba(255,255,255,0.06)] text-[#8b949e] border-[#21282f]';
};

export default function MaterialsTab({ materials }: MaterialsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPhase, setFilterPhase] = useState('');

  const categories = Array.from(new Set(materials?.map((m) => m.category) || [])).sort();
  const phases = Array.from(new Set(materials?.map((m) => m.phase) || [])).sort();

  const filteredMaterials = materials?.filter((m) => {
    const matchesSearch =
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || m.category === filterCategory;
    const matchesPhase = !filterPhase || m.phase === filterPhase;
    return matchesSearch && matchesCategory && matchesPhase;
  }) || [];

  const exportToCSV = () => {
    const headers = ['Descrição', 'Categoria', 'Quantidade', 'Unidade', 'Fase'];
    const rows = filteredMaterials.map((m) => [
      m.description,
      m.category,
      m.quantity,
      m.unit,
      m.phase,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for Excel
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'materiais.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${filteredMaterials.length} materiais exportados para CSV`);
  };

  if (!materials || materials.length === 0) {
    return (
      <div className="bg-[#1c2230] border border-[#21282f] rounded-lg p-8 text-center text-[#8b949e]">
        Nenhum material disponível
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex-1 min-w-[180px]">
          <Input
            placeholder="🔍 Buscar material ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1c2230] border-[#21282f] text-[#e6edf3] placeholder:text-[#6e7681] focus:border-[#00d4aa] focus:ring-[#00d4aa]/20 h-9"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#1c2230] border border-[#21282f] text-[#e6edf3] rounded-md px-3 py-2 text-sm focus:border-[#00d4aa] outline-none cursor-pointer h-9"
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
          className="bg-[#1c2230] border border-[#21282f] text-[#e6edf3] rounded-md px-3 py-2 text-sm focus:border-[#00d4aa] outline-none cursor-pointer h-9"
        >
          <option value="">Todas as fases</option>
          {phases.map((phase) => (
            <option key={phase} value={phase}>{phase}</option>
          ))}
        </select>
        <Button
          onClick={exportToCSV}
          variant="outline"
          size="sm"
          className="text-[#00d4aa] border-[rgba(0,212,170,0.3)] hover:bg-[rgba(0,212,170,0.1)] hover:border-[#00d4aa] bg-transparent h-9 gap-1.5"
        >
          <span>↓</span>
          Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <div className="bg-[#1c2230] border border-[#21282f] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#21282f] bg-[#161b22]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6e7681] uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6e7681] uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#6e7681] uppercase tracking-wider">Qtd.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6e7681] uppercase tracking-wider">Un.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#6e7681] uppercase tracking-wider">Fase</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#6e7681]">
                    Nenhum material encontrado com os filtros aplicados
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-[#21282f] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#e6edf3] max-w-[280px]">
                      <span className="line-clamp-2">{material.description}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${getCategoryStyle(material.category)}`}>
                        {material.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#e6edf3] font-mono text-right">{material.quantity}</td>
                    <td className="px-4 py-3 text-[#8b949e] font-mono">{material.unit}</td>
                    <td className="px-4 py-3 text-[#8b949e] text-xs">{material.phase}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-[#6e7681]">
        <span>
          Mostrando <span className="text-[#00d4aa] font-semibold">{filteredMaterials.length}</span> de{' '}
          <span className="text-[#e6edf3] font-semibold">{materials.length}</span> materiais
        </span>
        {(searchTerm || filterCategory || filterPhase) && (
          <button
            onClick={() => { setSearchTerm(''); setFilterCategory(''); setFilterPhase(''); }}
            className="text-[#6e7681] hover:text-[#00d4aa] transition-colors"
          >
            Limpar filtros ×
          </button>
        )}
      </div>
    </div>
  );
}
