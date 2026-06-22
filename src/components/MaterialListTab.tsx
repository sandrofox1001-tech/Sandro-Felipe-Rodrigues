import React, { useState } from "react";
import { MaterialItem } from "../types";
import { Check, Square, CheckSquare, Search, Edit2, CheckCircle2, RotateCcw, AlertTriangle, Plus, Trash2 } from "lucide-react";

interface MaterialListTabProps {
  materials: MaterialItem[];
  onMaterialsChanged: (updatedMaterials: MaterialItem[]) => void;
}

export default function MaterialListTab({ materials, onMaterialsChanged }: MaterialListTabProps) {
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Filter materials based on search & category
  const categories = ["All", ...Array.from(new Set(materials.map(m => m.category)))];

  const filteredMaterials = materials.map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

  const toggleCheck = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const startEditing = (index: number, item: MaterialItem) => {
    setEditingIndex(index);
    setEditPrice(item.unitPrice.toString());
    setEditQuantity(item.quantity.toString());
  };

  const saveEdit = (index: number) => {
    const qty = parseFloat(editQuantity);
    const price = parseFloat(editPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      alert("Por favor, insira valores válidos e maiores que zero.");
      return;
    }

    const updated = [...materials];
    updated[index] = {
      ...updated[index],
      quantity: qty,
      unitPrice: price,
      totalPrice: Number((qty * price).toFixed(2))
    };

    onMaterialsChanged(updated);
    setEditingIndex(null);
  };

  // Add a convenient way to add custom materials live
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    quantity: 1,
    unit: "un",
    category: "Geral",
    unitPrice: 0,
    notes: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.name) return;

    const item: MaterialItem = {
      name: newMaterial.name,
      quantity: newMaterial.quantity,
      unit: newMaterial.unit,
      category: newMaterial.category || "Geral",
      unitPrice: newMaterial.unitPrice,
      totalPrice: Number((newMaterial.quantity * newMaterial.unitPrice).toFixed(2)),
      notes: newMaterial.notes || undefined
    };

    onMaterialsChanged([...materials, item]);
    setNewMaterial({
      name: "",
      quantity: 1,
      unit: "un",
      category: "Geral",
      unitPrice: 0,
      notes: ""
    });
    setShowAddForm(false);
  };

  const handleDeleteMaterial = (index: number) => {
    const updated = materials.filter((_, i) => i !== index);
    onMaterialsChanged(updated);
    // clean checked status
    const newChecked = { ...checkedItems };
    delete newChecked[index];
    setCheckedItems(newChecked);
  };

  // Checked stats
  const totalItems = materials.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs" id="materials-container">
      {/* Tracker Checklist Tool and Options */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Lista de Materiais e Insumos
          </h3>
          <p className="text-sm text-gray-500">
            Gerencie compras, use o checklist interativo para conferência ou ajuste quantidades e preços.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg transition-colors cursor-pointer w-full md:w-auto justify-center"
            id="toggle-add-material-btn"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item Manual
          </button>
        </div>
      </div>

      {/* Checklist Progress Ring Tracker Bar */}
      {totalItems > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center gap-4 justify-between" id="checklist-progress-bar">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700 block">Progresso da Compra / Provimento</span>
              <span className="text-xs text-gray-500 block">
                {checkedCount} de {totalItems} itens providenciados ({progressPercent}%)
              </span>
            </div>
          </div>
          <div className="w-full md:w-64 bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Inline Adding Form */}
      {showAddForm && (
        <form onSubmit={handleAddMaterial} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Material/Ferramenta *</label>
            <input 
              type="text" 
              placeholder="Ex: Parafuso Sextavado 3/8" 
              value={newMaterial.name}
              onChange={e => setNewMaterial({...newMaterial, name: e.target.value})}
              required
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria</label>
            <input 
              type="text" 
              placeholder="Ex: Estrutura, Ferramentas" 
              value={newMaterial.category}
              onChange={e => setNewMaterial({...newMaterial, category: e.target.value})}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-indigo-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Qtd</label>
              <input 
                type="number" 
                step="any"
                value={newMaterial.quantity}
                onChange={e => setNewMaterial({...newMaterial, quantity: parseFloat(e.target.value) || 1})}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Und</label>
              <input 
                type="text" 
                value={newMaterial.unit}
                onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">R$ Unit</label>
              <input 
                type="number" 
                step="any"
                value={newMaterial.unitPrice}
                onChange={e => setNewMaterial({...newMaterial, unitPrice: parseFloat(e.target.value) || 0})}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-indigo-500"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Comentários / Observações</label>
            <input 
              type="text" 
              placeholder="Marca sugerida ou especificações de qualidade" 
              value={newMaterial.notes}
              onChange={e => setNewMaterial({...newMaterial, notes: e.target.value})}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-indigo-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
            >
              Adicionar
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

      {/* Filters & Search inputs */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Pesquisar material, ferramentas ou marcas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filtro:</span>
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat === "All" ? "Todos" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">Nenhum material encontrado com os critérios de busca.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Desktop Table View */}
          <table className="w-full text-left border-collapse min-w-[700px] hidden md:table" id="materials-table">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12">Provido</th>
                <th className="py-3 px-4">Nome do Material</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-center">Quant.</th>
                <th className="py-3 px-4 text-right">R$ Unitário</th>
                <th className="py-3 px-4 text-right">R$ Total</th>
                <th className="py-3 px-4 text-right w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {filteredMaterials.map((item) => {
                const isChecked = !!checkedItems[item.originalIndex];
                const isEditing = editingIndex === item.originalIndex;

                return (
                  <tr 
                    key={item.originalIndex}
                    className={`group transition-colors hover:bg-gray-50/50 ${isChecked ? "bg-emerald-50/10 text-gray-400" : "text-gray-700"}`}
                  >
                    {/* Tick Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <button 
                        onClick={() => toggleCheck(item.originalIndex)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>
                    </td>

                    {/* Name & Notes */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-800 leading-tight">
                        <span className={isChecked ? "line-through text-gray-400 font-normal" : ""}>
                          {item.name}
                        </span>
                      </div>
                      {item.notes && (
                        <span className={`text-xs block mt-1 ${isChecked ? "text-gray-350" : "text-gray-400"}`}>
                          📌 {item.notes}
                        </span>
                      )}
                    </td>

                    {/* Category Label */}
                    <td className="py-3.5 px-4 vertical-align-middle">
                      <span className="inline-block text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                        {item.category}
                      </span>
                    </td>

                    {/* Quantity Edit / Display */}
                    <td className="py-3.5 px-4 text-center">
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input 
                            type="number"
                            step="any"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-16 border rounded bg-white px-1 py-0.5 text-center text-sm"
                          />
                          <span className="text-xs text-gray-400">{item.unit}</span>
                        </div>
                      ) : (
                        <span className="font-medium">
                          {item.quantity} <span className="text-xs text-gray-400">{item.unit}</span>
                        </span>
                      )}
                    </td>

                    {/* Unit Price Edit / Display */}
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1 justify-end">
                          <span className="text-xs text-gray-400">R$</span>
                          <input 
                            type="number"
                            step="any"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-20 border rounded bg-white px-1 py-0.5 text-right text-sm"
                          />
                        </div>
                      ) : (
                        <span className="font-mono">{formatCurrency(item.unitPrice)}</span>
                      )}
                    </td>

                    {/* Total Price Display */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-gray-800">
                      {isEditing ? (
                        <span className="text-xs text-gray-400 italic">Auto</span>
                      ) : (
                        <span className={isChecked ? "text-gray-400 font-normal" : ""}>
                          {formatCurrency(item.totalPrice)}
                        </span>
                      )}
                    </td>

                    {/* Edit Toggles */}
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <button 
                            onClick={() => saveEdit(item.originalIndex)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2 py-1 rounded cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button 
                            onClick={() => setEditingIndex(null)}
                            className="bg-gray-150 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(item.originalIndex, item)}
                            title="Editar Preço ou Quantidade"
                            className="text-gray-500 hover:text-indigo-600 p-1 rounded-sm cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(item.originalIndex)}
                            title="Deletar Material"
                            className="text-gray-500 hover:text-red-600 p-1 rounded-sm cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Responsive Mobile / Card List View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredMaterials.map((item) => {
              const isChecked = !!checkedItems[item.originalIndex];
              const isEditing = editingIndex === item.originalIndex;

              return (
                <div 
                  key={item.originalIndex}
                  className={`border rounded-xl p-4 flex flex-col gap-3 transition-colors ${
                    isChecked ? "bg-emerald-50/10 border-emerald-100 text-gray-400" : "bg-gray-50/30 border-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2.5">
                      <button 
                        onClick={() => toggleCheck(item.originalIndex)}
                        className="text-gray-400 mt-0.5 cursor-pointer flex-shrink-0"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                      <div>
                        <h4 className={`font-semibold text-gray-800 text-sm ${isChecked ? "line-through text-gray-400 font-normal" : ""}`}>
                          {item.name}
                        </h4>
                        <span className="inline-block text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMaterial(item.originalIndex)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.notes && (
                    <div className="text-xs bg-gray-100/30 p-2 rounded-md text-gray-500">
                      📌 {item.notes}
                    </div>
                  )}

                  {/* Quantity and unit price grids */}
                  <div className="grid grid-cols-3 gap-2 text-xs border-t border-gray-100 pt-3">
                    <div>
                      <span className="text-gray-450 block mb-0.5">Qtd / Medida</span>
                      {isEditing ? (
                        <input 
                          type="number"
                          step="any"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-16 border rounded bg-white px-1 py-0.5 text-center"
                        />
                      ) : (
                        <strong className="text-gray-800 text-sm">{item.quantity} {item.unit}</strong>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-450 block mb-0.5">R$ Unitário</span>
                      {isEditing ? (
                        <input 
                          type="number"
                          step="any"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-18 border rounded bg-white px-1 py-0.5"
                        />
                      ) : (
                        <strong className="text-gray-800 font-mono text-sm">{formatCurrency(item.unitPrice)}</strong>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-gray-450 block mb-0.5">Custo Total</span>
                      {isEditing ? (
                        <span className="italic text-gray-400">Auto</span>
                      ) : (
                        <strong className="text-indigo-600 font-mono text-sm block">
                          {formatCurrency(item.totalPrice)}
                        </strong>
                      )}
                    </div>
                  </div>

                  {/* Edit Controls Bottom */}
                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-2.5">
                    {isEditing ? (
                      <>
                        <button 
                          onClick={() => saveEdit(item.originalIndex)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer"
                        >
                          Salvar
                        </button>
                        <button 
                          onClick={() => setEditingIndex(null)}
                          className="bg-gray-150 text-gray-700 text-xs px-2.5 py-1 rounded-md cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing(item.originalIndex, item)}
                        className="flex items-center gap-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar Valores
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
