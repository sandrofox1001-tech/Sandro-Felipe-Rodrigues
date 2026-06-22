import React from "react";
import { CostSummary } from "../types";
import { ShoppingBag, Users, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";

interface BudgetSummaryProps {
  summary: CostSummary;
  category: string;
}

export default function BudgetSummary({ summary, category }: BudgetSummaryProps) {
  // Brazilian currency formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" id="budget-summary-grid">
      {/* Materials Total Card */}
      <div 
        className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4 shadow-xs"
        id="card-materials-total"
      >
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Subtotal Materiais
          </span>
          <span className="text-2xl font-bold text-gray-800 tracking-tight block mt-1">
            {formatCurrency(summary.materialsTotal)}
          </span>
          <p className="text-xs text-gray-500 mt-1">Estimativa de insumos e ferramentas</p>
        </div>
      </div>

      {/* Labor Total Card */}
      <div 
        className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4 shadow-xs"
        id="card-labor-total"
      >
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Mão de Obra
          </span>
          <span className="text-2xl font-bold text-gray-800 tracking-tight block mt-1">
            {formatCurrency(summary.laborTotal)}
          </span>
          <p className="text-xs text-gray-500 mt-1">Prestadores e tempo necessário</p>
        </div>
      </div>

      {/* Contingency Buffer Card */}
      <div 
        className="bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4 shadow-xs"
        id="card-contingency-total"
      >
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Contingência Secundária
            </span>
            <span className="group relative cursor-help">
              <AlertCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-gray-900 text-white text-[10px] p-2 rounded shadow-md leading-normal z-20">
                Margem recomendada de 10% a 15% para previr flutuações de mercado ou desperdícios.
              </span>
            </span>
          </div>
          <span className="text-2xl font-bold text-gray-800 tracking-tight block mt-1">
            {formatCurrency(summary.contingencyAmount)}
          </span>
          <p className="text-xs text-gray-500 mt-1">Reserva para perdas e flutuações</p>
        </div>
      </div>

      {/* Grand Total Highlight Card */}
      <div 
        className="bg-linear-to-br from-indigo-600 to-violet-700 text-white rounded-2xl p-6 flex items-start gap-4 shadow-lg shadow-indigo-100"
        id="card-grand-total"
      >
        <div className="p-3 bg-white/15 text-white rounded-xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider block">
            Orçamento Geral Estimado
          </span>
          <span className="text-3xl font-extrabold tracking-tight block mt-1">
            {formatCurrency(summary.grandTotal)}
          </span>
          <div className="mt-2 text-xs text-indigo-100 font-medium">
            Prazo total: <span className="underline decoration-indigo-300 decoration-2">{summary.estimatedExecutionTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
