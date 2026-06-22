import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";

// ─── JSON Schema for LLM structured output ───────────────────────────────────
const PROJECT_ANALYSIS_SCHEMA = {
  name: "project_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      projectName: { type: "string", description: "Nome do projeto" },
      projectType: { type: "string", description: "Tipo do projeto (ex: Residencial, Comercial, Industrial, Infraestrutura)" },
      totalArea: { type: "string", description: "Área total do projeto com unidade (ex: 450 m²)" },
      estimatedDeadline: { type: "string", description: "Prazo estimado para conclusão (ex: 18 meses)" },
      complexity: { type: "string", description: "Nível de complexidade: Alta, Média ou Baixa" },
      summary: { type: "string", description: "Resumo executivo detalhado do projeto em 3-5 parágrafos" },
      estimatedMaterialCost: { type: "number", description: "Estimativa de custo total de materiais em Reais (R$)" },
      estimatedLaborCost: { type: "number", description: "Estimativa de custo total de mão de obra/serviços em Reais (R$)" },
      estimatedOtherCosts: { type: "number", description: "Outros custos estimados (licenças, taxas, locação de equipamentos, contingência) em Reais (R$)" },
      estimatedTotalCost: { type: "number", description: "Custo total geral estimado do projeto (soma de materiais, mão de obra e outros) em Reais (R$)" },
      budgetBreakdown: {
        type: "array",
        description: "Detalhamento resumido dos custos por grandes etapas do orçamento",
        items: {
          type: "object",
          properties: {
            category: { type: "string", description: "Nome da etapa do orçamento (ex: Serviços Preliminares, Fundação, Estruturas, Alvenarias, Acabamentos, Telhados, Instalações)" },
            materialCostEstimate: { type: "number", description: "Estimativa de custo de materiais de tal etapa em R$" },
            laborCostEstimate: { type: "number", description: "Estimativa de custo de mão de obra de tal etapa em R$" },
            totalCostEstimate: { type: "number", description: "Soma estimada de materiais e mão de obra de tal etapa em R$" },
          },
          required: ["category", "materialCostEstimate", "laborCostEstimate", "totalCostEstimate"],
          additionalProperties: false,
        },
      },
      materials: {
        type: "array",
        description: "Lista completa de materiais necessários",
        items: {
          type: "object",
          properties: {
            description: { type: "string", description: "Descrição do material" },
            category: { type: "string", description: "Categoria (ex: Estrutural, Elétrico, Hidráulico, Civil, Acabamento)" },
            quantity: { type: "string", description: "Quantidade numérica" },
            unit: { type: "string", description: "Unidade de medida (ex: m², kg, un, m³)" },
            phase: { type: "string", description: "Fase do projeto em que será utilizado" },
          },
          required: ["description", "category", "quantity", "unit", "phase"],
          additionalProperties: false,
        },
      },
      phases: {
        type: "array",
        description: "Fases do projeto em ordem cronológica",
        items: {
          type: "object",
          properties: {
            phaseNumber: { type: "integer", description: "Número sequencial da fase" },
            phaseName: { type: "string", description: "Nome da fase" },
            description: { type: "string", description: "Descrição detalhada das atividades da fase" },
            estimatedDuration: { type: "string", description: "Duração estimada (ex: 3 semanas, 2 meses)" },
          },
          required: ["phaseNumber", "phaseName", "description", "estimatedDuration"],
          additionalProperties: false,
        },
      },
      risks: {
        type: "array",
        description: "Riscos identificados no projeto",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título conciso do risco" },
            level: { type: "string", enum: ["Alto", "Médio", "Baixo"], description: "Nível de risco" },
            guidance: { type: "string", description: "Orientação para mitigação ou gestão do risco" },
          },
          required: ["title", "level", "guidance"],
          additionalProperties: false,
        },
      },
    },
    required: ["projectName", "projectType", "totalArea", "estimatedDeadline", "complexity", "summary", "estimatedMaterialCost", "estimatedLaborCost", "estimatedOtherCosts", "estimatedTotalCost", "budgetBreakdown", "materials", "phases", "risks"],
    additionalProperties: false,
  },
};

// ─── Zod types mirroring the schema ──────────────────────────────────────────
export const AnalysisResultSchema = z.object({
  projectName: z.string(),
  projectType: z.string(),
  totalArea: z.string(),
  estimatedDeadline: z.string(),
  complexity: z.string(),
  summary: z.string(),
  estimatedMaterialCost: z.number(),
  estimatedLaborCost: z.number(),
  estimatedOtherCosts: z.number(),
  estimatedTotalCost: z.number(),
  budgetBreakdown: z.array(z.object({
    category: z.string(),
    materialCostEstimate: z.number(),
    laborCostEstimate: z.number(),
    totalCostEstimate: z.number(),
  })),
  materials: z.array(z.object({
    description: z.string(),
    category: z.string(),
    quantity: z.string(),
    unit: z.string(),
    phase: z.string(),
  })),
  phases: z.array(z.object({
    phaseNumber: z.number(),
    phaseName: z.string(),
    description: z.string(),
    estimatedDuration: z.string(),
  })),
  risks: z.array(z.object({
    title: z.string(),
    level: z.enum(["Alto", "Médio", "Baixo"]),
    guidance: z.string(),
  })),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// ─── Router ───────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  analyzer: router({
    analyze: publicProcedure
      .input(z.object({
        content: z.string().min(1).max(200_000),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `Você é um engenheiro de planejamento e orçamento, especialista sênior em análise de projetos de construção civil, propostas comerciais, escopos de engenharia e memoriais descritivos.
Analise o conteúdo do arquivo de projeto ou ebook de proposta comercial fornecido e extraia todas as informações relevantes de forma estruturada.

Diretrizes Críticas de Orçamento e Planejamento:
0. Caso o documento seja um Ebook de Proposta ou Proposta Comercial, mapeie os escopos propostos, marcas recomendadas, prazos e os valores indicados. Se os valores ou quantitativos de materiais não estiverem explicitamente detalhados detalhadamente item por item, calcule de forma analítica e faça estimativas de engenharia realistas (em Reais R$) compatíveis com o escopo do ebook.
1. Calcule de forma realista e estime detalhadamente o orçamento do projeto (em Reais R$), considerando:
   - Custo total de Materiais (com base em preços típicos de mercado/SINAPI/PINI).
   - Custo total de Mão de Obra e Encargos de Serviços de Instalação/Construção.
   - Outros custos (taxas, projetos, licenças, locação de equipamentos, caçambas, administração de canteiro, contingências).
   - Custo Total Geral (soma de materiais, mão de obra e outros).
2. Forneça uma tabela de custo resumida por etapas (como Serviços Preliminares, Alvenaria, Elétrica, Hidráulica, Acabamento, Pintura, etc.), especificando custos de materiais e mão de obra para cada etapa. Garanta que a soma das etapas seja coerente com os custos totais declarados.
3. Identifique o tipo de projeto (Residencial, Comercial, Industrial, Infraestrutura, etc.).
4. Extraia ou estime a área total com base nas informações disponíveis (se não houver área explícita, estime tecnicamente).
5. Estime o prazo de execução técnica com base na complexidade e escopo (cronograma preliminar coerente com as fases).
6. Classifique a complexidade como Alta, Média ou Baixa.
7. Liste materiais com quantidades, categorias coerentes e as respectivas fases de instalação.
8. Identifique riscos específicos com propostas claras de mitigação.
9. Responda sempre em português brasileiro de forma técnica e altamente profissional.`;

        const userMessage = `Analise o seguinte projeto de construção/engenharia${input.fileName ? ` (arquivo: ${input.fileName})` : ""}:

---
${input.content}
---

Retorne a análise completa e estruturada conforme o schema definido.`;

        const response = await invokeLLM({
          messages: [
            { role: "system" as const, content: systemPrompt },
            { role: "user" as const, content: userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: PROJECT_ANALYSIS_SCHEMA,
          },
        });

                const rawContentRaw = response.choices?.[0]?.message?.content;
        if (!rawContentRaw) {
          throw new Error("LLM não retornou conteúdo");
        }
        const rawContent = typeof rawContentRaw === "string"
          ? rawContentRaw
          : Array.isArray(rawContentRaw)
            ? (rawContentRaw.find((c: { type: string; text?: string }) => c.type === "text") as { type: string; text: string } | undefined)?.text ?? ""
            : "";
        if (!rawContent) {
          throw new Error("LLM não retornou conteúdo de texto");
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          throw new Error("Falha ao interpretar resposta do LLM como JSON");
        }

        const result = AnalysisResultSchema.safeParse(parsed);
        if (!result.success) {
          throw new Error("Resposta do LLM não corresponde ao schema esperado");
        }

        return result.data;
      }),
  }),
});

export type AppRouter = typeof appRouter;
