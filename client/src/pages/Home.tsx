import { useState, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from '@/components/analyzer/OverviewTab';
import PhasesTab from '@/components/analyzer/PhasesTab';
import RisksTab from '@/components/analyzer/RisksTab';
import MaterialsTab from '@/components/analyzer/MaterialsTab';
import AnalysisSkeleton from '@/components/analyzer/AnalysisSkeleton';
import type { AnalysisResult } from '../../../server/routers';

const ACCEPTED_TYPES = [
  'text/html',
  'text/plain',
  'application/pdf',
  'text/xml',
  'application/xml',
  'text/csv',
  'text/markdown',
];

const MAX_FILE_SIZE_MB = 20;

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
}

function loadPdfJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error('Falha ao inicializar o leitor de PDF (PDF.js)'));
    document.head.appendChild(script);
  });
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  const maxPages = Math.min(pdf.numPages, 100); // safety cap
  
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    text += `--- [PÁGINA ${i}] ---\n${pageText}\n\n`;
  }
  return text;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Home() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.analyzer.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast.success('Análise concluída com sucesso!');
    },
    onError: (err) => {
      toast.error(`Erro na análise: ${err.message}`);
    },
  });

  const handleFile = useCallback((file: File) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE_MB} MB`);
      return;
    }
    // Validate file type by extension and MIME type
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const validExts = ['html', 'htm', 'txt', 'xml', 'csv', 'md', 'markdown', 'json', 'pdf'];
    const validMimes = [
      'text/html', 'text/plain', 'text/xml', 'application/xml',
      'text/csv', 'text/markdown', 'application/json', 'application/pdf'
    ];
    const isValidExt = validExts.includes(ext);
    const isValidMime = validMimes.some((m) => file.type.startsWith(m)) || file.type === '';
    if (!isValidExt && !isValidMime) {
      toast.error('Formato não suportado. Use PDF, HTML, TXT, XML, CSV ou Markdown.');
      return;
    }
    setSelectedFile(file);
    setAnalysisResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    try {
      let content = '';
      if (selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')) {
        toast.info('Extraindo textos do documento PDF, por favor aguarde...');
        content = await extractTextFromPdf(selectedFile);
      } else {
        content = await readFileAsText(selectedFile);
      }
      if (!content.trim()) {
        toast.error('O arquivo está vazio ou não possui textos extraíveis.');
        return;
      }
      analyzeMutation.mutate({ content, fileName: selectedFile.name });
    } catch (err: any) {
      toast.error(`Não foi possível ler o arquivo: ${err.message || err}`);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    analyzeMutation.reset();
  };

  const isLoading = analyzeMutation.isPending;

  return (
    <div className="min-h-screen" style={{ background: '#0d1117' }}>
      {/* Header */}
      <header className="border-b border-[#21282f] bg-[#161b22]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(0,212,170,0.15)] border border-[rgba(0,212,170,0.3)] flex items-center justify-center text-sm animate-pulse-glow">
              ⚙️
            </div>
            <div>
              <h1 className="text-base font-bold text-[#e6edf3] font-mono leading-none">
                Analisador de Projetos
              </h1>
              <p className="text-xs text-[#6e7681] mt-0.5">Construção & Engenharia · IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
            <span className="text-xs text-[#6e7681] font-mono">LLM Online</span>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Upload section */}
        {!analysisResult && (
          <section className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#e6edf3] mb-3">
                Análise Inteligente de{' '}
                <span className="text-[#00d4aa]">Projetos & Propostas</span>
              </h2>
              <p className="text-[#8b949e] text-sm leading-relaxed max-w-lg mx-auto">
                Faça upload do arquivo PDF, Ebook de Proposta, Memorial ou Planilha do seu projeto de construção civil. A IA irá
                analisar tudo e extrair o orçamento realista, fases cronológicas, riscos e lista de materiais.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer
                ${dragOver
                  ? 'border-[#00d4aa] bg-[rgba(0,212,170,0.06)]'
                  : selectedFile
                    ? 'border-[rgba(0,212,170,0.4)] bg-[rgba(0,212,170,0.04)] cursor-default'
                    : 'border-[#21282f] bg-[#161b22] hover:border-[#30363d] hover:bg-[#1c2230]'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.html,.htm,.txt,.xml,.csv,.md,.markdown,.json"
                onChange={handleFileInput}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-[rgba(0,212,170,0.1)] border border-[rgba(0,212,170,0.3)] flex items-center justify-center text-2xl mx-auto">
                    📄
                  </div>
                  <div>
                    <p className="font-semibold text-[#e6edf3] text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-[#6e7681] mt-1">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="text-xs text-[#6e7681] hover:text-[#ff6b35] transition-colors"
                  >
                    Remover arquivo ×
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-[#1c2230] border border-[#21282f] flex items-center justify-center text-2xl mx-auto">
                    📁
                  </div>
                  <div>
                    <p className="text-[#e6edf3] font-medium text-sm">
                      Arraste o arquivo aqui ou{' '}
                      <span className="text-[#00d4aa] underline underline-offset-2">clique para selecionar</span>
                    </p>
                    <p className="text-xs text-[#6e7681] mt-2">
                      Suporta PDF/Ebooks, HTML, TXT, XML, CSV, JSON, Markdown · Máx. {MAX_FILE_SIZE_MB} MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Analyze button */}
            {selectedFile && !isLoading && (
              <button
                onClick={handleAnalyze}
                className="w-full mt-4 py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #00d4aa, #0099ff)',
                  color: '#0d1117',
                  boxShadow: '0 0 20px rgba(0, 212, 170, 0.25)',
                }}
              >
                ⚡ Analisar Projeto com IA
              </button>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="mt-4 w-full py-3 px-6 rounded-lg font-semibold text-sm text-center bg-[#1c2230] border border-[rgba(0,212,170,0.2)] text-[#00d4aa]">
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analisando com IA...
                </span>
              </div>
            )}

            {/* Feature hints */}
            {!selectedFile && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: '📊', label: 'Visão Geral' },
                  { icon: '🔄', label: 'Fases' },
                  { icon: '⚠️', label: 'Riscos' },
                  { icon: '📦', label: 'Materiais CSV' },
                ].map((item) => (
                  <div key={item.label} className="bg-[#161b22] border border-[#21282f] rounded-lg p-3 text-center">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="text-xs text-[#6e7681]">{item.label}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <section className="max-w-5xl mx-auto">
            <AnalysisSkeleton />
          </section>
        )}

        {/* Results */}
        {analysisResult && !isLoading && (
          <section className="max-w-5xl mx-auto animate-fade-in-up">
            {/* Result header */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#00d4aa]" />
                  <span className="text-xs text-[#6e7681] font-mono uppercase tracking-wider">Análise Concluída</span>
                </div>
                <h2 className="text-xl font-bold text-[#e6edf3]">{analysisResult.projectName}</h2>
                <p className="text-sm text-[#6e7681] mt-0.5">
                  {analysisResult.projectType} · {analysisResult.totalArea} · {analysisResult.estimatedDeadline}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-[#6e7681] hover:text-[#ff6b35] transition-colors border border-[#21282f] rounded-lg px-3 py-2 hover:border-[rgba(255,107,53,0.3)] bg-[#161b22]"
              >
                ← Nova análise
              </button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview">
              <TabsList className="bg-[#161b22] border border-[#21282f] p-1 rounded-lg mb-6 w-full sm:w-auto">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-[#1c2230] data-[state=active]:text-[#00d4aa] text-[#6e7681] text-sm px-4"
                >
                  📊 Visão Geral
                </TabsTrigger>
                <TabsTrigger
                  value="phases"
                  className="data-[state=active]:bg-[#1c2230] data-[state=active]:text-[#00d4aa] text-[#6e7681] text-sm px-4"
                >
                  🔄 Fases
                  <span className="ml-1.5 text-xs bg-[rgba(0,212,170,0.1)] text-[#00d4aa] px-1.5 py-0.5 rounded font-mono">
                    {analysisResult.phases.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="risks"
                  className="data-[state=active]:bg-[#1c2230] data-[state=active]:text-[#00d4aa] text-[#6e7681] text-sm px-4"
                >
                  ⚠️ Riscos
                  <span className="ml-1.5 text-xs bg-[rgba(255,107,53,0.1)] text-[#ff6b35] px-1.5 py-0.5 rounded font-mono">
                    {analysisResult.risks.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="materials"
                  className="data-[state=active]:bg-[#1c2230] data-[state=active]:text-[#00d4aa] text-[#6e7681] text-sm px-4"
                >
                  📦 Materiais
                  <span className="ml-1.5 text-xs bg-[rgba(0,153,255,0.1)] text-[#0099ff] px-1.5 py-0.5 rounded font-mono">
                    {analysisResult.materials.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <OverviewTab data={analysisResult} />
              </TabsContent>
              <TabsContent value="phases">
                <PhasesTab phases={analysisResult.phases} />
              </TabsContent>
              <TabsContent value="risks">
                <RisksTab risks={analysisResult.risks} />
              </TabsContent>
              <TabsContent value="materials">
                <MaterialsTab materials={analysisResult.materials} />
              </TabsContent>
            </Tabs>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#21282f] mt-16 py-6">
        <div className="container text-center text-xs text-[#6e7681] font-mono">
          Analisador de Projetos · Construção & Engenharia · Powered by AI
        </div>
      </footer>
    </div>
  );
}
