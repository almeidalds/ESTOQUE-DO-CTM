import { GoogleGenAI } from "@google/genai";
import { InventoryItem, Warehouse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeStock = async (items: InventoryItem[], warehouses: Warehouse[]) => {
  // Summarize data to send to model to save tokens
  const summary = warehouses.map(wh => {
    const whItems = items.filter(i => i.warehouseId === wh.id);
    const totalValue = whItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    const lowStockItems = whItems.filter(i => i.quantity <= i.minLevel).map(i => `${i.name} (Qtd: ${i.quantity}, Min: ${i.minLevel})`);
    
    return {
      warehouse: wh.name,
      totalItems: whItems.length,
      totalValue: totalValue,
      lowStock: lowStockItems
    };
  });

  const prompt = `
    Você é um gerente de logística especialista em análise de estoque.
    Analise os seguintes dados de 7 estoques e forneça um relatório executivo curto e direto.
    Use formatação Markdown.
    
    Dados:
    ${JSON.stringify(summary, null, 2)}

    Seu relatório deve conter:
    1. **Visão Geral**: Saúde geral do estoque.
    2. **Pontos de Atenção**: Quais estoques precisam de reabastecimento urgente ou têm itens parados.
    3. **Sugestão de Distribuição**: Se houver desequilíbrio (um estoque cheio, outro vazio), sugira transferências.
    4. **Ação Recomendada**: Uma lista de 3 ações prioritárias para o gerente.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing stock:", error);
    throw new Error("Falha ao conectar com a IA. Verifique sua chave de API ou tente novamente mais tarde.");
  }
};