import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // Helper to initialize GoogleGenAI with proper headers
  const getAiClient = (userApiKey?: string) => {
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  };

  // API Route for Gemini bill extraction
  app.post("/api/extract-bill", async (req, res) => {
    try {
      const { base64Data, userApiKey } = req.body;
      const ai = getAiClient(userApiKey);
      
      if (!ai) {
        return res.status(400).json({ error: "Gemini API key is not configured on the server." });
      }

      // Fallback model sequence for extreme stability during Google model lifecycle updates
      const extractModels = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
      let lastError: any = null;
      let result: any = null;

      for (const model of extractModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { mimeType: "image/jpeg", data: base64Data } },
                  { text: `Extract information from this bill image in a structured JSON format. 
Fields to extract:
- date (YYYY-MM-DD)
- customerName
- customerPhone (10 digits)
- billId (Invoice number)
- txnNumber (Transaction reference if any)
- items (Array of objects with productName, quantity, price)
- isGeyserFound (Boolean, true if any item is a Geyser or Water Heater)
- rawText (A complete transcription of all text found on the bill)

Return ONLY the JSON object.` }
                ]
              }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  customerName: { type: Type.STRING },
                  customerPhone: { type: Type.STRING },
                  billId: { type: Type.STRING },
                  txnNumber: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        productName: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        price: { type: Type.NUMBER }
                      },
                      required: ["productName", "quantity", "price"]
                    }
                  },
                  isGeyserFound: { type: Type.BOOLEAN },
                  rawText: { type: Type.STRING }
                },
                required: ["items", "isGeyserFound"]
              }
            }
          });

          result = JSON.parse(response.text || "{}");
          if (result) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Extraction failed on ${model}, trying fallback:`, err?.message || err);
        }
      }

      if (!result && lastError) {
        throw lastError;
      }

      res.json(result || {});
    } catch (error: any) {
      console.error("Gemini Extraction Error:", error);
      res.status(500).json({ error: error.message || "Failed to extract bill details." });
    }
  });

  // API Route for Stable Multi-turn Gemini Chatbot with Role-Specific System Instructions
  app.post("/api/coach-message", async (req, res) => {
    try {
      const { message, user, sales, history, role = 'general', userApiKey } = req.body;
      const ai = getAiClient(userApiKey);

      if (!ai) {
        return res.status(400).json({ 
          error: "API_KEY_MISSING",
          message: "Gemini API key is not configured on the server."
        });
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: "Message is required." });
      }

      // Model selection policy as per instructions:
      // - gemini-3.1-pro-preview for particularly complex tasks
      // - gemini-3.5-flash for general tasks
      // - gemini-3.1-flash-lite for tasks that should happen fast
      // With seamless fallback cascade across stable models so it NEVER drops offline during updates!
      const modelsByRole: Record<string, string[]> = {
        general: ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"],
        fast: ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"],
        complex: ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-3.8-flash"]
      };

      const candidateModels = modelsByRole[role] || modelsByRole.general;

      // Define specific role-based system instructions
      let systemInstruction = "";
      const userName = user?.name || "Executive";
      const storeName = user?.storeNameAndLocation || user?.storeName || "Retail Store";
      const target = user?.monthlyTarget || 0;

      if (role === 'fast') {
        systemInstruction = `You are a lightning-fast Bajaj & Morphy Richards Product Assistant for ${userName} at ${storeName}.
Your role: Provide concise, high-speed product specifications, comparisons, wattages, and quick selling hooks for appliances (OTGs 20L-60L, Geysers 3L-25L, Mixers, Irons, Air Fryers, Food Processors).
Keep responses bulleted, crisp, and under 3-4 key points so sales executives can read them on the store floor in 5 seconds.`;
      } else if (role === 'complex') {
        systemInstruction = `You are a Senior Retail Sales Strategist & Target Analyst assisting ${userName} at ${storeName}.
Executive Monthly Target: ₹${target.toLocaleString('en-IN')}.
Recent Sales Context: ${JSON.stringify((sales || []).slice(-7))}.
Your role: Perform deep strategic analysis. Identify pacing against target, calculate required daily run-rate, break down high-margin upselling combos (e.g. Cooktop + OTG bundles), and give psychological closing strategies to overcome customer objections (e.g., brand comparison, price resistance, warranty doubts).`;
      } else {
        systemInstruction = `You are an expert Bajaj & Morphy Richards Sales Coach for ${userName} at ${storeName}.
Executive Monthly Target: ₹${target.toLocaleString('en-IN')}.
Recent Sales Context: ${JSON.stringify((sales || []).slice(-5))}.
Today is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
Your role: Be an encouraging, dynamic, practical mentor. Help the executive hit their daily targets, suggest high-conversion greeting & pitch scripts, recommend cross-sells, and boost confidence. Use clear formatting with emojis and bullet points.`;
      }

      // Format conversation history for multi-turn chat
      const formattedHistory = (history || [])
        .filter((m: any) => m && m.text && typeof m.text === 'string' && m.text.trim())
        .map((m: any) => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: String(m.text) }]
        }));

      let replyText = "";
      let modelUsed = "";
      let lastError: any = null;

      // Iterate through candidate models to guarantee stability during any Google updates
      for (const model of candidateModels) {
        try {
          const chat = ai.chats.create({
            model,
            config: {
              systemInstruction
            },
            history: formattedHistory
          });

          const response = await chat.sendMessage({ message: message.trim() });
          replyText = response.text || "";
          modelUsed = model;
          if (replyText) break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${model} unavailable or threw error, trying next fallback:`, err?.message || err);
        }
      }

      // Secondary fallback with direct generateContent if chats.create encounters any transient issue
      if (!replyText) {
        for (const fallbackModel of ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.1-flash-lite"]) {
          try {
            const fallbackResponse = await ai.models.generateContent({
              model: fallbackModel,
              contents: [
                ...formattedHistory,
                { role: "user", parts: [{ text: message.trim() }] }
              ],
              config: { systemInstruction }
            });
            replyText = fallbackResponse.text || "";
            modelUsed = fallbackModel;
            if (replyText) break;
          } catch (e2) {
            console.warn(`Direct generateContent on ${fallbackModel} also failed:`, e2);
          }
        }
      }

      if (!replyText) {
        throw lastError || new Error("Failed to receive a response from Gemini models.");
      }

      res.json({ 
        text: replyText, 
        modelUsed,
        role
      });
    } catch (error: any) {
      console.error("Coach Error:", error);
      res.status(500).json({ error: error.message || "Failed to process chat message." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await import("vite");
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteServer.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
