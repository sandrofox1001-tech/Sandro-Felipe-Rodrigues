import React, { useState, useEffect } from "react";
import { 
  ProjectAnalysisResult, 
  AnalysisRequestOptions, 
  MaterialItem, 
  LaborItem 
} from "./types";
import BudgetSummary from "./components/BudgetSummary";
import MaterialListTab from "./components/MaterialListTab";
import LaborListTab from "./components/LaborListTab";
import { 
  Hammer, 
  FileText, 
  Loader2, 
  DollarSign, 
  Calendar, 
  Sliders, 
  ShieldAlert, 
  Sparkles, 
  MapPin, 
  Wrench, 
  ChevronRight, 
  Briefcase, 
  CheckCircle, 
  Info, 
  Printer, 
  HelpCircle,
  Clock,
  ChevronDown,
  Upload,
  X,
  File,
  Trash2
} from "lucide-react";

export default function App() {
  // Input states
  const [scope, setScope] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [qualityPreference, setQualityPreference] = useState<'economic' | 'standard' | 'premium'>('standard');
  const [laborChoice, setLaborChoice] = useState<'diy' | 'hired'>('hired');
  const [location, setLocation] = useState<string>("São Paulo - SP");
  const [presets, setPresets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'labor' | 'timeline' | 'risks'>('overview');

  // PDF states
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const [pdfSizeError, setPdfSizeError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Loading and result states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ProjectAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load presets on startup
  useEffect(() => {
    fetch("/api/presets")
      .then(res => res.json())
      .then(data => {
        setPresets(data);
        // Load first preset by default to give user a comfortable starting point
        if (data && data.length > 0) {
          applyPreset(data[0]);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar templates pré-definidos:", err);
      });
  }, []);

  // Helper to load a preset template
  const applyPreset = (preset: any) => {
    setTitle(preset.title);
    setScope(preset.scope);
    setQualityPreference(preset.qualityPreference);
    setLaborChoice(preset.laborChoice);
    setLocation(preset.location);
    // Clear uploaded PDF if user falls back to a preset
    removePdf();
  };

  // PDF interaction and base64 helper functions
  const handlePdfChange = (file: File) => {
    setPdfSizeError(null);
    
    // Check file extension/type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setPdfSizeError("O arquivo do memorial/planta selecionado deve ser um formato PDF válido.");
      return;
    }
    
    // Limit size to 20MB
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setPdfSizeError(`O arquivo "${file.name}" excede o limite máximo permitido de 20MB.`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPdfBase64(result);
      setPdfName(file.name);
      // Auto-populate Title if currently empty based on PDF name
      if (!title || title.trim() === "") {
        const cleanName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
        setTitle(`Orçamento: ${cleanName}`);
      }
    };
    reader.onerror = () => {
      setPdfSizeError("Houve um erro indesejado de leitura ao decodificar o PDF.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removePdf = () => {
    setPdfBase64(null);
    setPdfName("");
    setPdfSizeError(null);
  };

  // Submit form for AI analysis
  const handleAnalyzeProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pdfBase64 && (!scope.trim() || scope.trim().length < 5)) {
      setErrorMessage("Por favor, descreva o escopo do projeto (mínimo de 5 caracteres) ou envie um memorial descritivo completo em PDF.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scope,
          title: title || "Meu Projeto Inteligente",
          qualityPreference,
          laborChoice,
          location,
          pdfBase64,
          pdfName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Houve uma falha na comunicação ou processamento do servidor.");
      }

      setAnalysisResult(data);
      setActiveTab('overview'); // go to overview tab directly
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Não foi possível carregar a estimativa do projeto. Verifique sua chave do Gemini nos Secrets e tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Real-time local adjustment of budget when materials are edited or added
  const handleMaterialsChanged = (updatedMaterials: MaterialItem[]) => {
    if (!analysisResult) return;

    const materialsTotal = updatedMaterials.reduce((sum, item) => sum + item.totalPrice, 0);
    const laborTotal = analysisResult.labor.reduce((sum, item) => sum + item.totalCost, 0);
    const contingencyAmount = Number(((materialsTotal + laborTotal) * 0.12).toFixed(2)); // standard 12% contingency buffer
    const grandTotal = Number((materialsTotal + laborTotal + contingencyAmount).toFixed(2));

    setAnalysisResult({
      ...analysisResult,
      materials: updatedMaterials,
      costSummary: {
        ...analysisResult.costSummary,
        materialsTotal,
        contingencyAmount,
        grandTotal
      }
    });
  };

  // Real-time local adjustment of budget when labor items are customized
  const handleLaborChanged = (updatedLabor: LaborItem[]) => {
    if (!analysisResult) return;

    const materialsTotal = analysisResult.materials.reduce((sum, item) => sum + item.totalPrice, 0);
    const laborTotal = updatedLabor.reduce((sum, item) => sum + item.totalCost, 0);
    const contingencyAmount = Number(((materialsTotal + laborTotal) * 0.12).toFixed(2));
    const grandTotal = Number((materialsTotal + laborTotal + contingencyAmount).toFixed(2));

    setAnalysisResult({
      ...analysisResult,
      labor: updatedLabor,
      costSummary: {
        ...analysisResult.costSummary,
        laborTotal,
        contingencyAmount,
        grandTotal
      }
    });
  };

  // Trigger print view
  const triggerPrint = () => {
    window.print();
  };

  // Price formatter helper
  const formatBrl = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased" id="root-app">
      {/* Upper Navigation Brand Hub */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 screen-only" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Hammer className="w-5 h-5" />
            </span>
            <div>
              <span className="font-extrabold text-lg text-gray-900 leading-none block">
                PlanoObra <span className="text-indigo-600 font-medium text-sm">AI</span>
              </span>
              <span className="text-[10px] text-gray-400 font-bold block tracking-wider uppercase">
                Análise de Projetos & Orçamento
              </span>
            </div>
          </div>
          <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-semibold hidden md:inline-flex items-center gap-1.5 animate-pulse">
            <Sparkles className="w-3 h-3" />
Motor Gemini 3.5-Flash Ativo
          </span>
        </div>
      </header>

      {/* Main App Content Layout */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Banner for screen display */}
        <section className="mb-8 text-center md:text-left screen-only" id="intro-section">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Analisador Inteligente de Projetos e Reformas
          </h1>
          <p className="text-gray-500 mt-2 max-w-3xl text-sm leading-relaxed">
            Escreva o escopo da sua reforma, construção civil, instalação elétrica, marcenaria ou projeto de tecnologia. 
            Nossa Inteligência Artificial calculará instantaneamente a lista detalhada de materiais recomendados, cronograma das etapas de execução, 
            necessidade de profissionais de mercado e a estimativa monetária completa ajustada ao cenário brasileiro.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE PANEL - INPUT FORM, PRESETS & CONTROLS (takes 4 cols) */}
          <div className="lg:col-span-4 space-y-6 screen-only" id="layout-input-panel">
            
            {/* Template Presets selection */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" />
                Templates Rápidos
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left p-2.5 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-slate-50 transition-all group flex items-start gap-2.5 cursor-pointer"
                  >
                    <div className="bg-orange-50 text-orange-600 rounded-lg p-1.5 mt-0.5 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <Wrench className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-800 block group-hover:text-indigo-900">
                        {preset.title}
                      </span>
                      <span className="text-[10px] text-gray-400 line-clamp-1 block mt-0.5">
                        {preset.scope}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Core input Configurator */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
              <h2 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                Definir Escopo do Projeto
              </h2>

              <form onSubmit={handleAnalyzeProject} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Nome / Título do Projeto (Opcional)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="Ex: Reforma Banheiro Suite, Pintura Fachada..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:outline-indigo-500 rounded-xl px-4 py-2 text-sm text-gray-800"
                  />
                </div>

                {/* Upload PDF Memorial */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Anexar Planta ou Memorial Técnico PDF (Máx. 20MB)
                  </label>
                  
                  {!pdfBase64 ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleFileDrop}
                      className={`relative border-2 border-dashed rounded-xl p-4.5 text-center cursor-pointer transition-all ${
                        isDragging 
                          ? "border-indigo-600 bg-indigo-50/50 scale-[0.99]" 
                          : "border-gray-200 hover:border-indigo-300 bg-slate-50/50"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handlePdfChange(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="pdf-file-uploader"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 animate-pulse" />
                        <p className="text-xs text-slate-700 font-medium">
                          <span className="text-indigo-600 font-bold">Arraste um PDF</span> ou clique para escolher
                        </p>
                        <p className="text-[10px] text-gray-400 leading-normal">
                          Lê materiais e escopos da planta diretamente (Até 20MB)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg flex-shrink-0 animate-bounce">
                          <File className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate leading-tight">
                            {pdfName}
                          </p>
                          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            Projeto carregado na IA! (Máx. 20MB)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removePdf}
                        className="bg-white hover:bg-red-50 hover:text-red-600 text-gray-400 border border-gray-150 p-1.5 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                        title="Remover arquivo"
                        id="remove-pdf-btn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {pdfSizeError && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">
                      ⚠️ {pdfSizeError}
                    </p>
                  )}
                </div>

                {/* Scope Text */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Instruções ou Detalhes do Escopo {pdfBase64 ? "(Opcional)" : "*"}
                    </label>
                    <span className="text-[10px] text-indigo-600 font-semibold cursor-help group relative">
                      Dicas para melhor resposta
                      <span className="absolute bottom-full right-0 mb-1 w-60 hidden group-hover:block bg-gray-950 text-white text-[10px] p-2.5 rounded shadow-lg z-50 leading-normal font-normal">
                        Mencione metragens quadradas aproximadas, alturas, se as paredes precisam de reboco técnico anterior, cores finais preferidas ou se já possui ferramentas.
                      </span>
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Escreva detalhes adicionais ou exigências do projeto (obrigatório se não anexar PDF)..."
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:outline-indigo-500 rounded-xl px-4 py-3 text-sm text-gray-800 leading-relaxed resize-y placeholder:text-gray-400"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Adicione observações complementares à planta em PDF para refinar o orçamento.
                  </span>
                </div>

                {/* Level / Quality selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Padrão de Acabamento & Materiais
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'economic', label: 'Econômico', desc: 'Menor Custo' },
                      { id: 'standard', label: 'Interm.', desc: 'Melhor Relação' },
                      { id: 'premium', label: 'Premium', desc: 'Alto Padrão' }
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setQualityPreference(opt.id as any)}
                        className={`px-2 py-2 rounded-xl text-center border transition-all cursor-pointer ${
                          qualityPreference === opt.id 
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold" 
                            : "border-gray-150 text-gray-600 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <span className="text-xs block">{opt.label}</span>
                        <span className="text-[9px] text-gray-400 font-normal block">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Execution model (DIY vs Hired) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Modelo de Execução da Mão de Obra
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'hired', label: 'Contratar Equipe', sub: 'Mão de obra contratada' },
                      { id: 'diy', label: 'DIY (Eu mesmo)', sub: 'Zero custo pessoal' }
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setLaborChoice(opt.id as any)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          laborChoice === opt.id 
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-700" 
                            : "border-gray-150 text-gray-600 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <span className="text-xs font-bold block">{opt.label}</span>
                        <span className="text-[9px] text-gray-400 block leading-tight mt-0.5">{opt.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location context */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Cidade / Estado (Para preços locais)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Ex: Porto Alegre - RS, Salvador - BA..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 focus:bg-white focus:outline-indigo-500 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-800"
                    />
                  </div>
                </div>

                {/* Submitting BTN */}
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                  id="submit-analysis-btn"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analisando Escopo com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Gerar Análise e Orçamento
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* General Advice box */}
            <div className="bg-slate-100/70 p-4 rounded-xl border border-gray-200 text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <Info className="w-4 h-4 text-indigo-600" />
                Como funciona a simulação?
              </div>
              <p className="leading-relaxed">
                Nossos dados são atualizados com base no histórico consolidado de materiais e tabela de encargos de obras de construção civil brasileiras, adaptando quantidades excedentes normatizadas para prevenir atrasos.
              </p>
            </div>
          </div>

          {/* RIGHT VIEW SECTION - TABULAR DASHBOARD AND ESTIMATIVE RESULTS (takes 8 cols) */}
          <div className="lg:col-span-8 space-y-6" id="layout-dashboard-view">
            
            {/* Show loader skeleton during calculation */}
            {isAnalyzing && (
              <div className="bg-white rounded-2xl border border-slate-150 p-8 space-y-6 animate-pulse" id="loading-skeleton">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
                    <div className="h-4 w-32 bg-slate-100 rounded-md"></div>
                  </div>
                  <div className="h-8 w-24 bg-slate-200 rounded-md"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-slate-100 rounded-xl p-4"></div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="h-4 w-full bg-slate-200 rounded-md"></div>
                  <div className="h-4 w-[90%] bg-slate-200 rounded-md"></div>
                  <div className="h-4 w-[75%] bg-slate-200 rounded-md"></div>
                </div>

                <div className="h-40 bg-slate-100 rounded-2xl"></div>
              </div>
            )}

            {/* Error prompt message if any occurs */}
            {errorMessage && (
              <div 
                className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl flex items-start gap-3.5"
                id="error-block"
              >
                <div className="p-2 bg-red-100 text-red-700 rounded-lg flex-shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Ops! Não foi possível gerar seu orçamento</h4>
                  <p className="text-xs text-red-600 mt-1 pb-3">{errorMessage}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    🔍 Dica: Certifique-se de configurar a sua chave do Gemini em <strong>Secrets</strong> no painel de configurações superior para liberar requisições inteligentes.
                  </p>
                </div>
              </div>
            )}

            {/* If there is no results analyzed and no load state */}
            {!isAnalyzing && !analysisResult && !errorMessage && (
              <div 
                className="bg-white rounded-2xl border border-gray-150 p-12 text-center text-slate-500 shadow-xs"
                id="empty-welcome"
              >
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Hammer className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Nenhum projeto foi analisado ainda
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Escolha um dos <strong>Templates Rápidos</strong> ao lado ou digite seu texto customizado no formulário para acionar a calculadora automatizada de orçamentos.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (presets.length > 0) {
                          applyPreset(presets[0]);
                        }
                      }}
                      className="inline-flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-xs cursor-pointer"
                    >
                      Preencher com Exemplo de Pintura comercial
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PRESENTING THE RICH AND PRINT-FRIENDLY PROJECT SHEET RESULT */}
            {analysisResult && (
              <div className="space-y-6" id="analysis-results">
                
                {/* Visual Header card showing generic metadata */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-indigo-150 text-indigo-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {analysisResult.category || "Orçamento"}
                      </span>
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        📌 {location}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-1.5">
                      {analysisResult.projectName}
                    </h2>
                    <span className="text-xs text-gray-400 block mt-1">
                      Orçamento interativo calculado com IA e editável em tempo real.
                    </span>
                  </div>

                  {/* Export Options and utilities */}
                  <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 screen-only">
                    <button
                      onClick={triggerPrint}
                      className="flex items-center gap-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl transition-colors cursor-pointer w-full md:w-auto justify-center"
                      id="print-budget-btn"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir / Salvar PDF
                    </button>
                  </div>
                </div>

                {/* Print Layout Header (Hidden on preview screen, visible only when printing) */}
                <div className="hidden print-only border-b pb-6 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">PlanoObra AI - Relatório de Planejamento</h1>
                      <p className="text-sm text-gray-500">Estimativas de Orçamento, Prazos e Materiais de Construção</p>
                      <p className="text-xs text-gray-400 mt-2">Local do Projeto: {location} | Padrão: {qualityPreference === 'economic' ? 'Econômico' : qualityPreference === 'premium' ? 'Premium / Alto Padrão' : 'Padrão Regular'}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-sm font-bold text-indigo-600">Relatório Oficial</h3>
                      <p className="text-xs text-gray-400">Data de emissão: {new Date().toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                </div>

                {/* Main responsive statistics container card */}
                <BudgetSummary 
                  summary={analysisResult.costSummary} 
                  category={analysisResult.category} 
                />

                {/* Navigation Tabs Bar */}
                <div 
                  className="flex border-b border-gray-200 gap-1 overflow-x-auto screen-only pb-px scrollbar-thin"
                  id="tab-navigator"
                >
                  {[
                    { id: 'overview', label: 'Resumo do Escopo', icon: FileText },
                    { id: 'materials', label: `Materiais (${analysisResult.materials.length})`, icon: Hammer },
                    { id: 'labor', label: `Mão de Obra (${analysisResult.labor.length})`, icon: Briefcase },
                    { id: 'timeline', label: `Fases & Prazos (${analysisResult.phases.length})`, icon: Calendar },
                    { id: 'risks', label: 'Dicas & Reduções de Riscos', icon: ShieldAlert }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                          isActive 
                            ? "border-indigo-600 text-indigo-600 font-bold" 
                            : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* TAB CHANGER INTERACTIVE RENDER */}
                
                {/* Print view render includes all tabs sequentially. 
                    We use simple screen CSS helpers so the print features render them all, 
                    while the app UI keeps traditional tabs active. */}

                {/* Tab: Overview (Summary of premises) */}
                <div className={`${activeTab === "overview" ? "block" : "hidden md:block print:block"} bg-white rounded-2xl border border-gray-100 p-6 shadow-xs`}>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <FileText className="text-indigo-600 w-5 h-5" />
                    Visão Geral do Planejamento
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mt-4">
                    {analysisResult.summary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                    <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1.5">
                      <span className="font-bold text-gray-700 block">Condições de Contratação</span>
                      <p className="text-gray-500">Mão de obra selecionada: {laborChoice === 'diy' ? 'Faça Você Mesmo (DIY - Proprietário)' : 'Prestação de Serviços Técnica'}</p>
                      <p className="text-gray-500">A estimativa prevê recolhimento básico de segurança no trabalho, ferramentas sugeridas na lista de compras e encargos simplificados locais.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-1.5">
                      <span className="font-bold text-gray-700 block">Estudo de Qualidade</span>
                      <p className="text-gray-500">Nível preferido dos produtos: {qualityPreference === 'economic' ? 'Econômico (marcas competitivas)' : qualityPreference === 'premium' ? 'Premium (alto padrão estético)' : 'Padrão comum de mercado'}</p>
                      <p className="text-gray-500">A variação nos acabamentos pode flutuar de acordo com a loja escolhida ou marca das ferragens secundárias.</p>
                    </div>
                  </div>
                </div>

                {/* Tab: Materials List */}
                <div className={`${activeTab === "materials" ? "block" : "hidden md:hidden print:block"} md:print:mt-8`}>
                  <div className="hidden print-only mb-3 font-bold text-gray-800 text-md">Lista de Materiais e Insumos</div>
                  <MaterialListTab 
                    materials={analysisResult.materials} 
                    onMaterialsChanged={handleMaterialsChanged} 
                  />
                </div>

                {/* Tab: Labor list */}
                <div className={`${activeTab === "labor" ? "block" : "hidden md:hidden print:block"} md:print:mt-8`}>
                  <div className="hidden print-only mb-3 font-bold text-gray-800 text-md">Equipe Recomendada e Mão de Obra</div>
                  <LaborListTab 
                    labor={analysisResult.labor} 
                    onLaborChanged={handleLaborChanged} 
                  />
                </div>

                {/* Tab: Timeline Execution Phases */}
                <div className={`${activeTab === "timeline" ? "block" : "hidden md:hidden print:block"} md:print:mt-8`}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs" id="timeline-container">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-indigo-600 w-5 h-5" />
                        Cronograma e Sequência de Sobras
                      </h3>
                      <p className="text-sm text-gray-500">
                        Prazos estimados sugeridos de acordo com a complexidade técnica informada de forma cronológica.
                      </p>
                    </div>

                    <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-8 py-2">
                      {analysisResult.phases
                        .sort((a, b) => a.order - b.order)
                        .map((phase) => (
                          <div key={phase.order} className="relative group" id={`timeline-phase-${phase.order}`}>
                            {/* Dot indicator */}
                            <span className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs ring-4 ring-white group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                              {phase.order}
                            </span>
                            
                            <div>
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <h4 className="font-bold text-gray-900 text-md">
                                  {phase.phaseName}
                                </h4>
                                <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-lg text-xs">
                                  <Clock className="w-3 h-3" />
                                  Prazo: {phase.duration}
                                </span>
                              </div>

                              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                {phase.description}
                              </p>

                              {phase.responsibles && phase.responsibles.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Executores:</span>
                                  {phase.responsibles.map((resp, i) => (
                                    <span key={i} className="inline-block text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                      👤 {resp}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tab: Tips and Security Risks */}
                <div className={`${activeTab === "risks" ? "block" : "hidden md:hidden print:block"} bg-white rounded-2xl border border-gray-100 p-6 shadow-xs`}>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <ShieldAlert className="text-red-600 w-5 h-5 animate-pulse" />
                    Dicas de Economia e Segurança (Normas ABNT)
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Recomendações técnicas elaboradas por engenheiros civis para evitar o desperdício comum, focar em segurança contra acidentes leves e assegurar um bom resultado.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.tipsAndRisks.map((tip, index) => (
                      <div 
                        key={index} 
                        className="p-4 rounded-xl border border-gray-50 bg-slate-50/50 flex gap-3 items-start"
                      >
                        <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-md text-nowrap">
                          Regra {index+1}
                        </span>
                        <p className="text-sm text-gray-700 leading-relaxed font-normal">
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-150 p-4 rounded-2xl mt-6 flex gap-3 text-xs leading-relaxed text-amber-800 font-medium">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold block mb-1">Aviso Técnico de Segurança</span>
                      Serviços que envolvam instalações elétricas internas (NR10), reformas estruturais que comprometam vigas/pilares ou conexões primárias de encanamento de gás predial <strong>não devem</strong> ser executados sem o acompanhamento profissional de um responsável habilitado com recolhimento de ART (Anotação de Responsabilidade Técnica) junto ao CREA/CAU local.
                    </div>
                  </div>
                </div>

                {/* Dynamic FAQ section to keep application complete and professional */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs screen-only" id="faq-section">
                  <h3 className="font-extrabold text-gray-800 text-md mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-500" />
                    Perguntas Frequentes (FAQ) & Dicas de Utilização
                  </h3>
                  <div className="space-y-4 text-xs divide-y divide-gray-100">
                    <div className="pt-2">
                      <strong className="text-gray-800 block">Posso re-calcular após excluir ou editar itens?</strong>
                      <span className="text-gray-500 block mt-1 leading-normal">Sim! Nossa planilha é totalmente reativa. Sempre que você editar as diárias da mão de obra na aba 'Mão de Obra', mudar o preço unitário de um material ou adicionar novos itens manualmente, nossa calculadora atualizará automaticamente o somatório e a margem de contingência no topo.</span>
                    </div>
                    <div className="pt-3">
                      <strong className="text-gray-800 block">Qual a fonte dos preços recomendados?</strong>
                      <span className="text-gray-500 block mt-1 leading-normal">Os valores unitários sugeridos correspondem à média amostral do comércio eletrônico e marketplaces brasileiros (como Leroy Merlin, Mercado Livre, Telhanorte) re-calculados com base no padrão econômico selecionado na aba esquerda.</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </main>

      {/* Styled simple footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-16 screen-only" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400">
          <p>© 2026 PlanoObra - Gerencial Orçamentário Assistido com Inteligência Artificial para Pequenos e Grandes Projetos.</p>
          <p className="mt-1">Desenvolvido com tecnologia de Modelagem Descritiva Avançada (Gemini 3.5 Framework).</p>
        </div>
      </footer>
    </div>
  );
}
