import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";

const mockAnalysisResponse = {
  projectName: "Residencial Parque Verde",
  projectType: "Residencial",
  totalArea: "320 m²",
  estimatedDeadline: "12 meses",
  complexity: "Média",
  summary: "Projeto residencial de médio porte com estrutura convencional.",
  materials: [
    {
      description: "Cimento CP-II",
      category: "Civil",
      quantity: "200",
      unit: "sacos",
      phase: "Fundação",
    },
    {
      description: "Vergalhão CA-50 10mm",
      category: "Estrutural",
      quantity: "1500",
      unit: "kg",
      phase: "Estrutura",
    },
  ],
  phases: [
    {
      phaseNumber: 1,
      phaseName: "Fundação",
      description: "Escavação e execução das fundações.",
      estimatedDuration: "4 semanas",
    },
    {
      phaseNumber: 2,
      phaseName: "Estrutura",
      description: "Execução da estrutura de concreto armado.",
      estimatedDuration: "8 semanas",
    },
  ],
  risks: [
    {
      title: "Atraso no fornecimento de materiais",
      level: "Médio" as const,
      guidance: "Realizar pedidos com antecedência mínima de 30 dias.",
    },
    {
      title: "Chuvas intensas na fase de fundação",
      level: "Alto" as const,
      guidance: "Monitorar previsão do tempo e planejar drenagem temporária.",
    },
  ],
};

function createTestContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("analyzer.analyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns structured analysis from LLM response", async () => {
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(mockAnalysisResponse),
            role: "assistant",
          },
        },
      ],
    } as ReturnType<typeof invokeLLM> extends Promise<infer T> ? T : never);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analyzer.analyze({
      content: "Projeto residencial com 320m² de área construída...",
      fileName: "projeto.html",
    });

    expect(result.projectName).toBe("Residencial Parque Verde");
    expect(result.projectType).toBe("Residencial");
    expect(result.complexity).toBe("Média");
    expect(result.materials).toHaveLength(2);
    expect(result.phases).toHaveLength(2);
    expect(result.risks).toHaveLength(2);
    expect(result.risks[0].level).toBe("Médio");
    expect(result.risks[1].level).toBe("Alto");
  });

  it("throws error when LLM returns empty content", async () => {
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "", role: "assistant" } }],
    } as ReturnType<typeof invokeLLM> extends Promise<infer T> ? T : never);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.analyzer.analyze({ content: "some content" })
    ).rejects.toThrow();
  });

  it("throws error when LLM returns invalid JSON", async () => {
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "not valid json", role: "assistant" } }],
    } as ReturnType<typeof invokeLLM> extends Promise<infer T> ? T : never);

    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.analyzer.analyze({ content: "some content" })
    ).rejects.toThrow();
  });

  it("rejects empty content input", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.analyzer.analyze({ content: "" })
    ).rejects.toThrow();
  });
});
