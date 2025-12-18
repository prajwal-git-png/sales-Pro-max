import { GoogleGenAI } from "@google/genai";
import { UserProfile, DailyReport } from "../types";

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const getSystemInstruction = (user: UserProfile, sales: DailyReport[]) => {
    const recentSales = [...sales]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const salesSummary = recentSales.map(s => 
        `Date: ${s.date}, Total: ₹${s.totalValue}, Qty: ${s.totalQty}`
    ).join('\n');

    return `
        You are an expert Bajaj Electricals Sales Coach. 
        User: ${user.name} (${user.storeName}).
        
        Context:
        - Company: Bajaj Electricals Ltd.
        - Products: Mixers (GX/MG), Geysers (Storage/Instant), Irons (Dry/Steam), Induction Cooktops.
        
        Recent Performance:
        ${salesSummary || 'No recent sales recorded yet.'}

        Goal:
        - Provide sales tactics.
        - Answer technical questions about Bajaj products vs competitors.
        - Stay positive and professional.

        Constraint:
        - Response MUST be plain text.
        - Use Emojis.
        - Be concise (max 150 words).
    `;
};

export const sendCoachMessage = async (
    user: UserProfile, 
    sales: DailyReport[], 
    history: ChatMessage[], 
    newMessage: string
): Promise<string> => {
    try {
        // ALWAYS create a new instance right before the call to ensure the API key context is fresh
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Convert history to the format expected by the SDK
        const formattedHistory = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            history: formattedHistory,
            config: {
                systemInstruction: getSystemInstruction(user, sales),
                maxOutputTokens: 1000,
            }
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text || "I'm here to help, but I didn't get a clear response. Try again!";
    } catch (e) {
        console.error("AI Service Error:", e);
        throw e; // Let the UI handle the offline fallback
    }
};

export const getMotivationalQuote = async (): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'One powerful, short retail sales motivation quote (max 10 words) with an emoji.',
            config: { maxOutputTokens: 50 }
        });
        return response.text?.trim() || "Small steps lead to big achievements. 🚀";
    } catch (error) {
        return "Success is the sum of small efforts repeated daily. 💪";
    }
};

export const getOfflineResponse = (query: string, user: UserProfile): string => {
    const lower = query.toLowerCase();
    if (lower.includes('mixer')) return "The Bajaj GX-1 Mixer (500W) is built for heavy grinding with 18000 RPM. 🌪️";
    if (lower.includes('geyser')) return "Bajaj Pentacle Geysers feature Glassline-coated tanks for hard water protection. 💧";
    if (lower.includes('iron')) return "Bajaj DX11 is our top dry iron, featuring a 1000W element for quick heating. 👕";
    return `Hello ${user.name}! I'm in offline mode, but I can still answer basic questions about Mixers, Geysers, or Irons!`;
};
