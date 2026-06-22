import React, { useState } from "react";
import { LaborItem } from "../types";
import { Edit2, ShieldAlert, BadgeInfo, Users, Plus, Trash2 } from "lucide-react";

interface LaborListTabProps {
  labor: LaborItem[];
  onLaborChanged: (updatedLabor: LaborItem[]) => void;
}

export default function LaborListTab({ labor, onLaborChanged }: LaborListTabProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRate, setEditRate] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);

  const [newLabor, setNewLabor] = useState({
    role: "",
    quantity: 1,
    duration: "1 dia",
    rate: 0,
    rateType: "diária",
    description: ""
  });

  const startEditing = (index: number, item: LaborItem) => {
    setEditingIndex(index);
    setEditRate(item.rate.toString());
    setEditQuantity(item.quantity.toString());
  };

  const saveEdit = (index: number) => {
    const qty = parseInt(editQuantity);
    const rateVal = parseFloat(editRate);

    if (isNaN(qty) || qty <= 0 || isNaN(rateVal) || rateVal < 0) {
      alert("Por favor, insira valores válidos.");
      return;
    }

    const updated = [...labor];
    updated[index] = {
      ...updated[index],
      quantity: qty,
      rate: rateVal,
      totalCost: Number((qty * rateVal).toFixed(2)) // We assume simple total is qty * rate
    };

    onLaborChanged(updated);
    setEditingIndex(null);
  };

  const handleAddLabor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabor.role) return;

    const item: LaborItem = {
      role: newLabor.role,
      quantity: newLabor.quantity,
      duration: newLabor.duration,
      rate: newLabor.rate,
      rateType: newLabor.rateType,
      totalCost: Number((newLabor.quantity * newLabor.rate).toFixed(2)),
      description: newLabor.description || "Atividades complementares de execução."
    };

    onLaborChanged([...labor, item]);
    setNewLabor({
      role: "",
      quantity: 1,
      duration: "1 dia",
      rate: 0,
      rateType: "diária",
      description: ""
    });
    setShowAddForm(false);
  };

  const handleDeleteLabor = (index: number) => {
    const updated = labor.filter((_, i) => i !== index);
    onLaborChanged(updated);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs" id="labor-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Equipe Executora e Mão de Obra
          </h3>
          <p className="text-sm text-gray-500">
            Profissionais recomendados, tempo de dedicação, taxas locais do mercado e suas responsabilidades.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg transition-colors cursor-pointer w-full md:w-auto justify-center"
          id="toggle-add-labor-btn"
        >
          <Plus className="w-4 h-4" />
          Adicionar Mão de Obra
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddLabor} className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cargo / Profissional *</label>
            <input 
              type="text" 
              placeholder="Ex: Ajudante Geral, Eletricista Instalador" 
              value={newLabor.role}
              onChange={e => setNewLabor({...newLabor, role: e.target.value})}
              required
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tempo Previsto</label>
            <input 
              type="text" 
              placeholder="Ex: 3 dias, 12 horas" 
              value={newLabor.duration}
              onChange={e => setNewLabor({...newLabor, duration: e.target.value})}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-emerald-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Qual Qtd?</label>
              <input 
                type="number" 
                value={newLabor.quantity}
                onChange={e => setNewLabor({...newLabor, quantity: parseInt(e.target.value) || 1})}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Valor Unitário</label>
              <input 
                type="number" 
                value={newLabor.rate}
                onChange={e => setNewLabor({...newLabor, rate: parseFloat(e.target.value) || 0})}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Unidade Valor</label>
              <input 
                type="text" 
                placeholder="Ex: diária, hora" 
                value={newLabor.rateType}
                onChange={e => setNewLabor({...newLabor, rateType: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-emerald-500"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição de Funções</label>
            <input 
              type="text" 
              placeholder="Resumo das tarefas principais..." 
              value={newLabor.description}
              onChange={e => setNewLabor({...newLabor, description: e.target.value})}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-emerald-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
            >
              Adicionar Mão de Obra
            </button>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {labor.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-250">
          <p className="text-gray-500 text-sm">Nenhuma mão de obra registrada. Clique em "Adicionar Mão de Obra" para incluir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {labor.map((worker, index) => {
            const isEditing = editingIndex === index;
            const isDiy = worker.role.toLowerCase().includes("diy") || 
                          worker.role.toLowerCase().includes("proprietário") || 
                          worker.role.toLowerCase().includes("você mesmo") ||
                          worker.rate === 0;

            return (
              <div 
                key={index}
                className={`rounded-2xl border p-5 transition-shadow relative flex flex-col justify-between ${
                  isDiy 
                    ? "bg-indigo-50/20 border-indigo-100 shadow-xs" 
                    : "bg-white border-gray-100 hover:shadow-xs shadow-none"
                }`}
              >
                {/* Delete button absolutely positioned top-right for cleanliness */}
                <button
                  onClick={() => handleDeleteLabor(index)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  title="Remover profissional"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block p-1.5 rounded-lg ${isDiy ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      <Users className="w-4 h-4" />
                    </span>
                    <h4 className="font-bold text-gray-800 text-md leading-tight max-w-[80%] pr-6">
                      {worker.role}
                    </h4>
                  </div>

                  {isDiy && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-100 text-indigo-750 px-2 py-0.5 rounded-full mb-3 uppercase">
                      💡 Mão de Obra Própria (DIY)
                    </span>
                  )}

                  <p className="text-xs text-gray-500 mt-2 leading-relaxed mb-4">
                    {worker.description}
                  </p>
                </div>

                <div className="border-t border-gray-100/80 pt-4 mt-auto">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block pb-0.5">Duração</span>
                      <strong className="text-gray-800 text-xs md:text-sm block">{worker.duration}</strong>
                    </div>

                    <div>
                      {isEditing ? (
                        <>
                          <span className="text-gray-400 block pb-0.5">Taxa (R$)</span>
                          <input 
                            type="number"
                            step="any"
                            value={editRate}
                            onChange={(e) => setEditRate(e.target.value)}
                            className="w-16 border rounded bg-white px-1.5 py-0.5 text-xs text-right font-mono"
                          />
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400 block pb-0.5">Taxa de Mercado</span>
                          <strong className="text-gray-800 text-xs md:text-sm block capitalize-first">
                            {formatCurrency(worker.rate)} <span className="text-[10px] text-gray-450 font-normal">/{worker.rateType}</span>
                          </strong>
                        </>
                      )}
                    </div>

                    <div className="text-right">
                      {isEditing ? (
                        <>
                          <span className="text-gray-400 block pb-0.5">Equipe (Qtd)</span>
                          <input 
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-12 border rounded bg-white px-1.5 py-0.5 text-xs text-center font-mono"
                          />
                        </>
                      ) : (
                        <>
                          <span className="text-gray-400 block pb-0.5">Subtotal ({worker.quantity}x)</span>
                          <strong className="text-emerald-600 font-mono text-sm block">
                            {formatCurrency(worker.totalCost)}
                          </strong>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-end gap-2 mt-3.5 border-t border-gray-50 pt-2 text-xs">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => saveEdit(index)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2 py-1 rounded cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button 
                          onClick={() => setEditingIndex(null)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing(index, worker)}
                        className="flex items-center gap-1 text-gray-500 hover:text-emerald-700 font-semibold px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar Valores
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
