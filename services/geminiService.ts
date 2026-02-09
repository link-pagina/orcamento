
import { GoogleGenAI } from "@google/genai";
import { BudgetEntry, BudgetSummary } from "../types.ts";

// Função para obter o cliente AI de forma segura
const getAIClient = () => {
  const apiKey = process.env.API_KEY || '';
  return new GoogleGenAI({ apiKey });
};

export const getFinancialAdvice = async (entries: BudgetEntry[], summary: BudgetSummary) => {
  try {
    const ai = getAIClient();
    
    // Se não houver chave, avisar o usuário discretamente ou retornar erro amigável
    if (!process.env.API_KEY) {
      return "⚠️ **Nota:** A análise por IA requer uma API Key configurada. No entanto, você pode continuar usando todas as outras funções de orçamento normalmente!";
    }

    const prompt = `
      Atue como um consultor financeiro sênior. Analise o seguinte orçamento mensal de um usuário:
      
      Resumo:
      - Renda Total: R$ ${summary.totalIncome.toFixed(2)}
      - Gastos Totais: R$ ${summary.totalExpenses.toFixed(2)}
      - Saldo: R$ ${summary.balance.toFixed(2)}
      - % da Renda Consumida: ${summary.percentageUsed.toFixed(1)}%

      Lista de Transações:
      ${entries.map(e => `- [${e.type === 'INCOME' ? 'ENTRADA' : 'SAÍDA'}] ${e.description}: R$ ${e.amount.toFixed(2)} (${e.category})`).join('\n')}

      Por favor, forneça:
      1. Uma análise rápida da saúde financeira.
      2. Três dicas práticas para economizar ou investir melhor com base nestes dados.
      3. Um alerta se houver algum risco de endividamento.
      
      Responda em Português de forma amigável e profissional, usando markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Erro ao consultar Gemini:", error);
    return "Desculpe, não consegui analisar seu orçamento agora. Verifique sua conexão ou se a chave de API está correta.";
  }
};
