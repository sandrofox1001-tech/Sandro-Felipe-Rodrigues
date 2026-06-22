export interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface LaborItem {
  role: string;
  quantity: number;
  duration: string;
  rate: number;
  rateType: string;
  totalCost: number;
  description: string;
}

export interface ProjectPhase {
  phaseName: string;
  duration: string;
  description: string;
  responsibles?: string[];
  order: number;
}

export interface CostSummary {
  materialsTotal: number;
  laborTotal: number;
  contingencyAmount: number;
  grandTotal: number;
  estimatedExecutionTime: string;
}

export interface ProjectAnalysisResult {
  projectName: string;
  summary: string;
  category: string;
  materials: MaterialItem[];
  labor: LaborItem[];
  phases: ProjectPhase[];
  costSummary: CostSummary;
  tipsAndRisks: string[];
}

export interface AnalysisRequestOptions {
  scope: string;
  title?: string;
  qualityPreference: 'economic' | 'standard' | 'premium';
  laborChoice: 'diy' | 'hired';
  location?: string;
}
