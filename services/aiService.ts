import { GoogleGenAI } from "@google/genai";
import { UserProfile, DailyReport } from "../types";

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const getSystemInstruction = (user: UserProfile, sales: DailyReport[]) => {
    const recentSales = [...sales]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    const salesSummary = recentSales.map(s => 
        `Date: ${s.date}, Total: ₹${s.totalValue}, Qty: ${s.totalQty}`
    ).join('\n');

    return `You are an expert Bajaj Electricals Sales Coach. 
Executive: ${user.name} at ${user.storeName}.
Latest Sales History:
${salesSummary || 'No recent sales recorded.'}

Guidelines:
1. Provide retail sales techniques for Mixers, Geysers, and Irons.
2. Highlight Bajaj technical features vs competitors.
3. Be professional, motivating, and concise.

Response Rules:
- Output PLAIN TEXT ONLY. No bolding (**), no markdown.
- Use emojis sparingly for personality.
- Maximum 150 words per response.`;
};

export const sendCoachMessage = async (
    user: UserProfile, 
    sales: DailyReport[], 
    history: ChatMessage[], 
    newMessage: string
): Promise<string> => {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        throw new Error("API_KEY_MISSING");
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Gemini API contents strictly requires alternating roles: user, model, user, model...
        // AND it usually MUST start with 'user'.
        const contents: any[] = [];
        
        // Filter history to ensure it's valid and starts with user
        const validHistory = [...history];
        
        // If history starts with model (greeting), we might need to skip it or handle it carefully
        // because the SDK .generateContent(contents) expects the first turn to be 'user'.
        let filteredHistory = validHistory.filter((msg, idx) => {
            // If it's the first message and it's from model, skip it in history sent to API
            if (idx === 0 && msg.role === 'model') return false;
            return true;
        });

        let lastRole = '';
        for (const msg of filteredHistory) {
            // Skip duplicates of the same role to prevent API errors
            if (msg.role !== lastRole) {
                contents.push({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                });
                lastRole = msg.role;
            }
        }

        // Add the current user message
        contents.push({
            role: 'user',
            parts: [{ text: newMessage }]
        });

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: {
                systemInstruction: getSystemInstruction(user, sales),
                maxOutputTokens: 1000,
                temperature: 0.8,
            }
        });

        const text = response.text;
        if (!text) {
            return "I am currently processing your request. Could you rephrase your question? ⚡";
        }

        return text;
    } catch (e: any) {
        console.error("AI Coach Error:", e);
        if (e.message?.includes('429')) throw new Error("RATE_LIMIT");
        if (e.message?.includes('400')) throw new Error("INVALID_REQUEST");
        throw e;
    }
};

export const getMotivationalQuote = async (): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'Provide one powerful short sales motivation quote (max 10 words) with emoji.',
            config: { maxOutputTokens: 50 }
        });
        return response.text?.trim() || "The secret of getting ahead is getting started. 🚀";
    } catch (error) {
        return "Success is a series of small wins every day. 💪";
    }
};

export const getOfflineResponse = (query: string, user: UserProfile): string => {
    const lower = query.toLowerCase();
    if (lower.includes('mixer')) return "The Bajaj GX-1 Mixer (500W) offers 18000 RPM for professional-grade grinding at home. 🌪️";
    if (lower.includes('geyser')) return "Bajaj Pentacle storage geysers use Glassline-coated tanks to ensure long life in hard water. 💧";
    if (lower.includes('iron')) return "Bajaj DX11 (1000W) is the heavy-duty leader for perfect ironing results. 👕";
    return `Hello ${user.name.split(' ')[0]}! I'm in offline mode. I can still help you with features for Mixers, Geysers, and Irons.`;
};