
import { GoogleGenAI } from "@google/genai";
import { FullAnalysis, NewsItem } from "../types";

const parseGeminiJSON = (text: string): any => {
    const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
         throw new Error("Invalid JSON format received: No JSON object found.");
    }
    
    return JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
}

export const generateInsightImage = async (imagePrompt: string): Promise<string | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `High-end institutional financial visualization, Bloomberg-style aesthetic: ${imagePrompt}. Professional, sleek, data-driven, cinematic lighting, futuristic UI elements, dark mode.` }],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (e) {
    console.error("Image generation failed", e);
    return null;
  }
}

export const getBreakingNews = async (ticker: string): Promise<NewsItem[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Access real-time terminal wire for ${ticker}. 
    Identify high-signal M&A chatter, regulatory pivots, and earnings surprises.
    Return 5 items in this JSON format:
    [
      {
        "id": "unique_id",
        "headline": "Headline text",
        "source": "Source (Bloomberg, Reuters, FT)",
        "timestamp": "2h ago",
        "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
        "type": "M&A" | "EARNINGS" | "MACRO" | "RUMOR"
      }
    ]
    Strict JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    
    const text = response.text || '';
    const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const start = cleanText.indexOf('[');
    const end = cleanText.lastIndexOf(']');
    
    if (start === -1 || end === -1) return [];
    
    return JSON.parse(cleanText.substring(start, end + 1));
  } catch (e) {
    console.error("News fetch failed", e);
    return [];
  }
}

export const askAlphaAgent = async (query: string, context: FullAnalysis): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "System Error: API Key missing.";

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    You are "Alpha", the sovereign intelligence agent of the Apex Capital Terminal.
    User Query: "${query}"
    
    Context: ${context.profile.name} (${context.profile.ticker})
    Rating: ${context.thesis.rating} | Target: $${context.dcf.sharePriceTarget}
    Current P&L View: ${context.incomeStatement.rows[0].historical[2]} revenue vs ${context.incomeStatement.rows[0].projected[2]} projected.
    
    Operational protocol: Answer with the clinical precision of a MD at Goldman Sachs. Focus on the Delta—what has changed? 
    Max 2 sentences.
  `;

  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "No response generated.";
  } catch (e) {
    return "Terminal Error: Unable to process query.";
  }
}

export const analyzeCompany = async (tickerOrUrl: string): Promise<FullAnalysis> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    TERMINAL ROLE: Sovereign Intelligence Unit (Apex Capital AI).
    MODE: Institutional Deep-Dive.
    TARGET: ${tickerOrUrl}

    PROTOCOL: You are to function as a world-class AI-native Bloomberg Terminal replacement. 
    You must coordinate the following sub-agents to generate the output:

    1. **ANALYST (Financial Reconstruction)**: 
       - DO NOT SUMMARIZE. RECONSTRUCT THE FULL MODEL.
       - **Income Statement**: Must include Revenue, COGS, Gross Profit, R&D, S&M, G&A, Total OpEx, Operating Income (EBIT), Interest Expense, Pretax Income, Income Tax, Net Income, EBITDA, EPS. (Min 12 rows).
       - **Balance Sheet**: Cash & Eq, Accounts Receivable, Inventory, Total Current Assets, PP&E, Goodwill/Intangibles, Total Assets, Accounts Payable, Accrued Liabilities, Short-Term Debt, Total Current Liab, Long-Term Debt, Total Liabilities, Retained Earnings, Total Equity. (Min 12 rows).
       - **Cash Flow**: Net Income, D&A, SBC (Stock Based Comp), Change in Working Capital, CFO, CapEx, FCF, Acquisitions, CFF (Debt/Equity issuance/repayment). (Min 10 rows).
       - **Ratios**: ROIC, ROE, Gross Margin, EBITDA Margin, Net Margin, Current Ratio, Quick Ratio, Debt/EBITDA, Asset Turnover.

    2. **VP (Valuation & LBO)**:
       - Perform a 5-Year DCF. WACC must be sector-appropriate.
       - Perform an LBO feasibility check. Can this company support leverage?
       - **Comps Table**: Must include EV/Sales, EV/EBITDA, P/E, Net Debt/EBITDA, Rule of 40 (Growth% + Margin%), Gross Margin, and Market Cap (in Billions) for 5-7 peers.

    3. **PM (Variant Perception)**:
       - What is the consensus missing?
       - **AI Sovereignty**: Calculate "Vibecode Sensitivity". If the company OWNS the rails (GOOGL, MSFT, NVDA), sensitivity is LOW. If they are a legacy service bureau, sensitivity is HIGH.

    4. **SCOUT (Intelligence)**:
       - **Supply Chain Graph**: Do not just list names. Identify key suppliers and customers and their "Criticality Score" (1-10) to the target.
       - Insider Activity: Recent Form 4 filings.

    Output: Strictly return a valid JSON object matching this structure. 
    Ensure all arrays are populated with realistic institutional-grade data.

    JSON Template:
    {
      "profile": { "name": "", "ticker": "", "sector": "", "price": 0, "marketCap": "", "summary": "", "risks": [], "strengths": [] },
      "thesis": { "rating": "BUY", "conviction": 0, "targetPriceBase": 0, "targetPriceBull": 0, "targetPriceBear": 0, "theBet": "The variant perception...", "moatScore": 0, "moatSource": "", "managementScore": 0, "managementNotes": "", "bullCase": [], "bearCase": [], "catalysts": [{ "event": "", "impact": "HIGH", "timing": "", "description": "" }] },
      "researchMemo": { "headline": "", "executiveSummary": "", "keyDrivers": [], "valuationThesis": "", "macroOutlook": "", "imagePrompt": "Visual metaphor for the stock" },
      "hedgeFundAlpha": { 
          "earningsSentiment": [{ "quarter": "Q3 23", "sentimentScore": 0, "hesitationWords": 0, "confidenceWords": 0, "keyPhraseShift": "" }], 
          "alternativeData": { "webTrafficTrend": 0, "appDownloadTrend": 0, "searchVolumeTrend": 0, "verdict": "BULLISH", "insight": "" }, 
          "institutionalOwnership": { "totalOwnership": 0, "crowdednessScore": 0, "smartMoneyFlow": "INFLOW", "topHolders": [{ "name": "", "shares": "", "change": 0, "date": "" }] } 
      },
      "supplyChain": { 
          "network": [
            { "name": "Key Supplier Inc", "type": "Supplier", "sector": "Semiconductors", "criticalityScore": 9, "description": "Sole source of GPU dies" },
            { "name": "Big Customer Corp", "type": "Customer", "sector": "Cloud", "criticalityScore": 7, "description": "15% of Revenue" }
          ], 
          "risks": ["Geopolitical risk in Taiwan", "Concentration risk"], 
          "geographicExposure": "High dependence on APAC manufacturing"
      },
      "earningsQuality": { "score": 0, "redFlags": [], "accountingNotes": "" },
      "insiderActivity": [{ "name": "", "role": "", "type": "BUY", "amount": "", "date": "" }],
      "aiRisk": { "riskScore": 0, "riskLevel": "LOW", "replacementProbability": 0, "innovationLag": "LEADER", "vibecodeSensitivity": 0, "summary": "", "threats": [], "mitigants": [] },
      "news": [{ "id": "1", "headline": "", "source": "", "timestamp": "", "sentiment": "NEUTRAL", "type": "MACRO" }],
      "incomeStatement": { "title": "Income Statement", "rows": [{ "metric": "Revenue", "historical": [0,0,0], "projected": [0,0,0], "unit": "USD M" }] },
      "balanceSheet": { "title": "Balance Sheet", "rows": [{ "metric": "Total Assets", "historical": [0,0,0], "projected": [0,0,0], "unit": "USD M" }] },
      "cashFlowStatement": { "title": "Cash Flow Statement", "rows": [{ "metric": "Free Cash Flow", "historical": [0,0,0], "projected": [0,0,0], "unit": "USD M" }] },
      "financialRatios": { "profitability": [{ "name": "ROIC", "value": "0%" }], "liquidity": [{ "name": "Current Ratio", "value": "0x" }], "solvency": [{ "name": "Debt/Equity", "value": "0x" }], "efficiency": [{ "name": "Asset Turnover", "value": "0x" }] },
      "dcf": { "wacc": 0.1, "terminalGrowthRate": 0.03, "enterpriseValue": 0, "equityValue": 0, "sharePriceTarget": 0, "upsideDownside": 0, "fcfProjections": [0,0,0,0,0] },
      "lbo": { "entryMultiple": 0, "exitMultiple": 0, "debtAmount": 0, "irr": 0, "moc": 0 },
      "valuationComps": [{ "ticker": "COMP", "evEbitda": 0, "evSales": 0, "pe": 0, "revenueGrowth": 0, "ebitdaMargin": 0, "grossMargin": 0, "netDebtEbitda": 0, "ruleOf40": 0, "marketCap": 0 }],
      "precedentTransactions": [{ "date": "2023-01-01", "target": "Target", "acquirer": "Buyer", "dealSize": 0, "evEbitda": 0, "premium": 0 }]
    }
  `;

  let text = '';

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      },
    });

    text = response.text || '';
    
    if (!text) {
      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason;
      if (finishReason) {
         throw new Error(`Analysis generation failed. Finish Reason: ${finishReason}.`);
      }
      throw new Error("No analysis generated. Received empty response from Gemini.");
    }
    
    const data = parseGeminiJSON(text) as FullAnalysis;
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = (chunks as any[])
      .map((c: any) => c.web?.uri)
      .filter((uri: any) => typeof uri === 'string') as string[];

    data.sources = [...new Set(sources)];
    
    return data;

  } catch (error: any) {
    console.error("Gemini Analysis Failed", error);
    console.error("Raw Response Text:", text);
    throw new Error(`Gemini Error: ${error.message}`);
  }
};
