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

    return `You are a friendly and casual Bajaj Electricals Sales Assistant.
Executive: ${user.name} at ${user.storeName}.
Latest Sales History:
${salesSummary || 'No recent sales recorded.'}

Guidelines:
1. Be casual, friendly, and approachable. Use natural language.
2. Focus on helping with sales techniques, product features (Mixers, Geysers, Irons), and handling customer objections.
3. If asked about non-work topics, gently steer back to sales or products, or keep it brief and friendly.
4. Highlight Bajaj's strengths (durability, service, trust) naturally.

Response Rules:
- Keep it short and conversational (max 100 words).
- Use emojis to keep the mood light. 🌟
- No complex formatting. Just plain text.`;
};

export const sendCoachMessage = async (
    user: UserProfile, 
    sales: DailyReport[], 
    history: ChatMessage[], 
    newMessage: string
): Promise<string> => {
    // Use user key if available, else env (though env is usually not exposed to client unless VITE_)
    // Assuming process.env.API_KEY is available or handled by proxy/server if this was full stack.
    // Since this is client-side, we rely on user.apiKey or a hardcoded one (not recommended) or the one injected by the platform.
    const apiKey = user.apiKey || process.env.GEMINI_API_KEY; 
    
    if (!apiKey) {
        console.warn("No API Key found");
        return getOfflineResponse(newMessage, user);
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const contents: any[] = [];
        
        // Filter history to ensure it's valid and starts with user
        const validHistory = [...history];
        
        let filteredHistory = validHistory.filter((msg, idx) => {
            if (idx === 0 && msg.role === 'model') return false;
            return true;
        });

        let lastRole = '';
        for (const msg of filteredHistory) {
            if (msg.role !== lastRole) {
                contents.push({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                });
                lastRole = msg.role;
            }
        }

        contents.push({
            role: 'user',
            parts: [{ text: newMessage }]
        });

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: {
                systemInstruction: getSystemInstruction(user, sales),
                maxOutputTokens: 150,
                temperature: 0.7,
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
        return getOfflineResponse(newMessage, user);
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