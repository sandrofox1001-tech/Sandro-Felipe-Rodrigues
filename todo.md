# Analisador de Projetos - TODO

## Backend
- [x] Rota tRPC `analyzer.analyze` que recebe conteúdo de arquivo e envia ao LLM
- [x] JSON Schema definido para resposta estruturada do LLM (visão geral, fases, riscos, materiais)
- [x] Integração com `invokeLLM` usando `response_format` com json_schema
- [x] Teste vitest para a rota de análise

## Frontend - Estrutura
- [x] Tema dark tech configurado em index.css com paleta #0d1117, #00d4aa, #0099ff, #ff6b35
- [x] Fonte Inter via Google Fonts no index.html
- [x] App.tsx com rota única para a página principal
- [x] Página Home.tsx com layout dark tech completo

## Frontend - Upload
- [x] Área de upload de arquivo HTML/texto com drag-and-drop
- [x] Leitura do conteúdo do arquivo no navegador (FileReader)
- [x] Botão "Analisar Projeto" que dispara a mutação tRPC
- [x] Estado de carregamento com spinner/skeleton durante análise

## Frontend - Abas de Resultado
- [x] Componente OverviewTab (Visão Geral): cards com tipo, área, prazo, complexidade, resumo
- [x] Componente PhasesTab (Fases): lista ordenada com número, nome, descrição e duração
- [x] Componente RisksTab (Riscos): agrupados por nível Alto/Médio/Baixo
- [x] Componente MaterialsTab (Materiais): tabela com busca, filtro por categoria e exportação CSV

## Integração
- [x] Copiar componentes do ZIP original (OverviewTab, PhasesTab, RisksTab, MaterialsTab)
- [x] Conectar frontend ao backend via trpc.analyzer.analyze.useMutation
- [x] Exibir resultado nas abas após análise concluída
