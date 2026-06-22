import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const PORT = 3000;

// Lazy client instantiation for safety as instructed by framework rules
let aiClient: GoogleGenAI | null = null;
function getGenAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("A chave de API GEMINI_API_KEY não foi encontrada configurada nos Segredos do seu ambiente. Por favor, adicione-a nas Configurações > Secrets do AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Design JSON response schema for Gemini model
const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    projectName: { 
      type: Type.STRING, 
      description: "O nome correspondente e representativo do projeto." 
    },
    summary: { 
      type: Type.STRING, 
      description: "Resumo explicativo curto do projeto analisado explicando as premissas adotas, desafios e soluções sugeridas (2 a 3 parágrafos)." 
    },
    category: { 
      type: Type.STRING, 
      description: "Categoria geral do projeto (ex: Construção Civil, TI & Software, Elétrica, Marcenaria, Pintura, Reparo Residencial)." 
    },
    materials: {
      type: Type.ARRAY,
      description: "Lista de materiais sugeridos com especificações técnicas e estimativas de preço médio vigentes (R$).",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nome detalhado do material, insumo ou ferramenta." },
          quantity: { type: Type.NUMBER, description: "Quantidade estimada recomendada." },
          unit: { type: Type.STRING, description: "Unidade de medida técnica (un, metros, kg, saco de 20kg, lata 18l, etc)." },
          category: { type: Type.STRING, description: "Categoria do material (ex: Estrutura, Instalação, Acabamento, Ferramenta, Proteção/EPI)." },
          unitPrice: { type: Type.NUMBER, description: "Preço unitário médio estimado em Real (R$)." },
          totalPrice: { type: Type.NUMBER, description: "Preço total estimado para a quantidade indicada em Real (R$). (Multiplicação exata da quantidade pelo preço unitário)" },
          notes: { type: Type.STRING, description: "Comentários sobre marcas sugeridas, qualidade ou alternativa de substituição." }
        },
        required: ["name", "quantity", "unit", "category", "unitPrice", "totalPrice"]
      }
    },
    labor: {
      type: Type.ARRAY,
      description: "Estimativa de mão de obra e prestadores necessários com estimativa de taxas médias de mercado (R$). Caso o usuário selecione DIY (Faça Você Mesmo), inclua o próprio usuário como executor com custo R$ 0, e liste se há necessidade de supervisor, ajudante ou terceirizados específicos complementares.",
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING, description: "Profissional ou equipe recomendada (ex: Pedreiro, Eletricista Instalador, Pintor Profissional, Técnico CFTV, Próprio Proprietário (DIY))." },
          quantity: { type: Type.NUMBER, description: "Quantidade de profissionais desse tipo." },
          duration: { type: Type.STRING, description: "Tempo estimado do serviço (ex: 3 dias, 12 horas, 1 semana)." },
          rate: { type: Type.NUMBER, description: "Taxa cobrada média estimada em Real (R$) pelo profissional." },
          rateType: { type: Type.STRING, description: "Modo de cobrança (ex: por hora, diária, valor global do serviço)." },
          totalCost: { type: Type.NUMBER, description: "Custo total correspondente para a quantidade e tempo estimado em Real (R$)." },
          description: { type: Type.STRING, description: "Principais atribuições e atividades fundamentais a desempenhar." }
        },
        required: ["role", "quantity", "duration", "rate", "rateType", "totalCost", "description"]
      }
    },
    phases: {
      type: Type.ARRAY,
      description: "Cronograma e cronosequência de execução detalhada dividida em etapas lógicas sequenciais.",
      items: {
        type: Type.OBJECT,
        properties: {
          phaseName: { type: Type.STRING, description: "Nome direto da etapa (ex: Preparação e Limpeza, Passagem de Cabos, Instalação de Equipamentos, Testes e Acabamento)." },
          duration: { type: Type.STRING, description: "Prazo sugerido de duração da etapa (ex: 2 dias, 4 horas, 1 semana)." },
          description: { type: Type.STRING, description: "O que deve ser realizado em detalhes e critérios de conclusão da etapa." },
          responsibles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista dos nomes de profissionais/papéis que participam desta fase específica." },
          order: { type: Type.INTEGER, description: "Ordem sequencial numérica estrita da fase (começando em 1)." }
        },
        required: ["phaseName", "duration", "description", "order"]
      }
    },
    costSummary: {
      type: Type.OBJECT,
      properties: {
        materialsTotal: { type: Type.NUMBER, description: "Soma matemática perfeita de todas as colunas totalPrice calculadas em Real (R$)." },
        laborTotal: { type: Type.NUMBER, description: "Soma matemática perfeita de todos os totalCost da lista de labor em Real (R$)." },
        contingencyAmount: { type: Type.NUMBER, description: "Margem de segurança para perdas e imprevistos recomendada (estimada entre 10% e 15% da soma dos materiais e mão de obra) em Real (R$)." },
        grandTotal: { type: Type.NUMBER, description: "Total geral estimado: materialsTotal + laborTotal + contingencyAmount em Real (R$)." },
        estimatedExecutionTime: { type: Type.STRING, description: "Prazo total estimado de ponta a ponta considerando fases concomitantes ou sequenciais (ex: 15 dias úteis, 3 semanas)." }
      },
      required: ["materialsTotal", "laborTotal", "contingencyAmount", "grandTotal", "estimatedExecutionTime"]
    },
    tipsAndRisks: {
      type: Type.ARRAY,
      description: "Conselhos de segurança importantes, dicas para economizar na compra, normas técnicas brasileiras aplicáveis (ex: ABNT, NR10), riscos comuns de execução e como mitigá-los.",
      items: { type: Type.STRING }
    }
  },
  required: ["projectName", "summary", "category", "materials", "labor", "phases", "costSummary", "tipsAndRisks"]
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "30mb", extended: true }));

  // API endpoint for analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { scope, title, qualityPreference, laborChoice, location, pdfBase64, pdfName } = req.body;

      if ((!scope || scope.trim().length < 5) && !pdfBase64) {
        return res.status(400).json({ 
          error: "Por favor, descreva o escopo do projeto ou anexe um arquivo memorial descritivo do projeto em PDF para obtermos uma estimativa coerente." 
        });
      }

      const ai = getGenAI();

      // Assemble contextual description variables
      const qualityText = {
        economic: "Econômico (foco em marcas mais baratas, ferramentas essenciais, materiais de custo-benefício competitivo)",
        standard: "Padrão de mercado (marcas tradicionais bem avaliadas, qualidade intermediária equilibrada)",
        premium: "Premium de alto padrão (marcas líderes de mercado, acabamento impecável, excelente durabilidade e design superior)"
      }[qualityPreference as 'economic' | 'standard' | 'premium'] || "Padrão de mercado";

      const laborText = {
        diy: "Faça Você Mesmo (DIY - o próprio usuário irá executar. O custo principal dele é R$ 0, recomende ferramentas básicas necessárias no material, e etapas detalhadas explicativas. Pode incluir ajudantes ou profissional de apoio se a tarefa for crítica/perigosa)",
        hired: "Contratar Profissionais Especializados (estime equipes profissionais padrão, encargos médios e diárias técnicas brasileiras)"
      }[laborChoice as 'diy' | 'hired'] || "Contratar Profissionais";

      const locationText = location ? `Localidade do projeto para regionalização de preços: ${location}` : "Mercado médio geral brasileiro";

      const systemInstruction = 
        "Você é um Engenheiro de Custos, Especialista em Orçamentos e Gerente de Obras/Projetos altamente experiente no mercado brasileiro. " +
        "Seu papel é analisar a descrição de um projeto/reforma informada pelo usuário (e opcionalmente o documento PDF fornecido como memorial descritivo, planta de material ou especificações de escopo) e estruturar uma estimativa realística e profissional de materiais necessários, " +
        "equipe técnica (mão de obra), cronograma de etapas e custos totais estimativos em Reais (R$).\n\n" +
        "Siga rigorosamente as diretrizes:\n" +
        "1. Estime quantidades e preços condizentes com a realidade atual de mercado no Brasil.\n" +
        "2. Se o usuário escolheu 'Faça Você Mesmo (DIY)', coloque o próprio usuário como executor com taxa de R$ 0, recomendando kits de ferramentas básicas nos materiais e EPIs adicionais de proteção pessoal para compensar a falta de experiência especialista.\n" +
        "3. Faça cálculos matemáticos corretos:TotalPrice dos materiais deve ser Quantity * UnitPrice. TotalCost da mão de obra deve ser proporcional à Duração/Quantidade.\n" +
        "4. Mantenha os textos de resumo, notas de materiais e descrições detalhadas e úteis, em idioma Português do Brasil.\n" +
        "5. O retorno DEVE obrigatoriamente preencher todos os campos requeridos conforme a estrutura JSON solicitada.";

      const prompt = `Analise detalhadamente o seguinte escopo de projeto fornecido pelo usuário e preencha o JSON estruturado correspondente.
      
DETALHES DO PROJETO:
- Nome/Título Sugerido: ${title || "Projeto do Usuário"}
- Descrição do Escopo e Desejo do Usuário: "${scope || "Análise detalhada do arquivo memorial descritivo PDF anexado."}"
- Preferência de Padrão/Qualidade de Materiais: ${qualityText}
- Tipo de Execução da Mão de Obra: ${laborText}
- ${locationText}
${pdfBase64 ? `\nADICIONAL: Há um arquivo PDF anexado com nome "${pdfName || "memorial.pdf"}". Analise este documento PDF na íntegra, extraia os materiais informados, metragens, detalhes técnicos, quantidades e exigências para compor e fundamentar este orçamento com a maior precisão possível.` : ""}

Por favor, gere uma lista precisa, calculada com rigor lógico e econômico brasileiro.`;

      // Structure contents for Gemini model (supporting multimodal text + PDF inline file part)
      const contents: any[] = [];
      
      if (pdfBase64) {
        let cleanBase64 = pdfBase64;
        if (pdfBase64.includes(";base64,")) {
          cleanBase64 = pdfBase64.split(";base64,").pop() || "";
        }
        contents.push({
          inlineData: {
            data: cleanBase64,
            mimeType: "application/pdf"
          }
        });
      }

      contents.push({
        text: prompt
      });

      // Request text generation with JSON output constraint matching schema
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: analysisResponseSchema,
          temperature: 0.1, // low temperature to ensure reliable calculated values
        },
      });

      const textOutput = response.text;
      if (!textOutput) {
        throw new Error("O modelo Gemini retornou uma resposta vazia.");
      }

      // Parse JSON to enforce validation
      const parsedData = JSON.parse(textOutput);
      res.json(parsedData);

    } catch (error: any) {
      console.error("Erro na análise do projeto:", error);
      res.status(500).json({ 
        error: error.message || "Ocorreu um erro interno ao realizar a análise do projeto com Inteligência Artificial."
      });
    }
  });

  // Provide initial preset suggestions to the client
  app.get("/api/presets", (req, res) => {
    res.json([
      {
        id: "pintura_sala",
        title: "Pintura de Sala Comercial (20m²)",
        scope: "Pintar uma sala retangular de 20m² (paredes e teto). Atualmente a parede está de cor cinza escuro e queremos mudar para branco neve. Há algumas rachaduras pequenas perto da janela que precisam ser calafetadas com massa corrida.",
        qualityPreference: "standard",
        laborChoice: "hired",
        location: "Rio de Janeiro - RJ"
      },
      {
        id: "instalacao_cftv",
        title: "Kit Segurança Residencial CFTV",
        scope: "Instalação de 4 câmeras de segurança IP com infravermelho de alta definição em volta da casa residencial, central NVR, fiação com tubulação externa, infraestrutura para visualização por aplicativo de smartphone e backup de 1TB.",
        qualityPreference: "standard",
        laborChoice: "hired",
        location: "São Paulo - SP"
      },
      {
        id: "diy_bancada_madeira",
        title: "Bancada para Oficina em Pinus (DIY)",
        scope: "Construir uma bancada de madeira rústica bem reforçada de 1.80m de comprimento por 80cm de profundidade para meu quartinho de ferramentas. Quero fazer eu mesmo utilizando madeira de Pinus aparelhada e parafusos pesados, aplicando seladora ou verniz no final.",
        qualityPreference: "economic",
        laborChoice: "diy",
        location: "Belo Horizonte - MG"
      },
      {
        id: "jardim_iluminado",
        title: "Iluminação de Jardim Conectada",
        scope: "Instalação subterrânea de fiação elétrica trifásica com mangueiras de proteção para ligar 6 refletores de espeto de LED RGB (7W) em torno do jardim de inverno. O acionamento deve ser programado via relé inteligente integrado com aplicativo Alexa.",
        qualityPreference: "premium",
        laborChoice: "hired",
        location: "Curitiba - PR"
      }
    ]);
  });

  // Health route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Setup Vite Dev Server / Static Production Server
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development mode with Vite hot-reload middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting production mode. Serving static assets inside /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Project Analyzer server booting on port ${PORT}`);
  });
}

startServer();
