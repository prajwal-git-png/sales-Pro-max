import { GoogleGenAI } from "@google/genai";
import { UserProfile, DailyReport } from "../types";

export const createSalesCoachChat = (user: UserProfile, sales: DailyReport[]) => {
    try {
        // Platform provides process.env.API_KEY automatically
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const recentSales = [...sales]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        const salesSummary = recentSales.map(s => 
            `Date: ${s.date}, Total: ₹${s.totalValue}, Qty: ${s.totalQty}`
        ).join('\n');

        const systemInstruction = `
            You are an expert Bajaj Electricals Sales Coach. 
            User: ${user.name} (${user.storeName}).
            
            Context:
            - Company: Bajaj Electricals Ltd.
            - Products: Mixers (GX/MG), Geysers (Storage/Instant), Irons (Dry/Steam), Induction Cooktops.
            
            Recent Performance:
            ${salesSummary || 'No recent sales recorded.'}

            Goal:
            - Provide sales tactics.
            - Explain technical features of Bajaj vs competitors.
            - Stay positive and motivating.

            Constraint:
            - Plain text only (no Markdown bolding/headings if possible).
            - Use Emojis for personality.
            - Max 150 words per reply.
        `;

        return ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
                maxOutputTokens: 1000,
                thinkingConfig: { thinkingBudget: 0 } // Flash model, thinking disabled for speed
            }
        });
    } catch (e) {
        console.error("AI Initialization failed:", e);
        return null;
    }
};

export const getMotivationalQuote = async (): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'One short retail sales motivation quote for today (under 10 words).',
            config: { maxOutputTokens: 50 }
        });
        return response.text?.trim() || "The best way to predict the future is to create it. 🚀";
    } catch (error) {
        return "Every customer is an opportunity for greatness. 💪";
    }
};

export const getOfflineResponse = (query: string, user: UserProfile): string => {
    const lower = query.toLowerCase();
    if (lower.includes('mixer')) return "The Bajaj GX-1 Mixer (500W) is our bestseller with 3 jars and 18000 RPM. Perfect for fine grinding! 🌪️";
    if (lower.includes('geyser')) return "Our Pentacle Storage Geysers have Glassline-coated tanks for long life in hard water areas. 💧";
    if (lower.includes('iron')) return "Bajaj DX11 is the #1 dry iron in India. Non-stick coating and 1000W for quick results! 👕";
    return `Hello ${user.name}! I'm in offline mode right now, but I'm still here to help with Bajaj product info. Try asking about Mixers or Geysers!`;
};
