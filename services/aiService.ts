import { GoogleGenAI, Chat } from "@google/genai";
import { UserProfile, DailyReport } from "../types";
import { getUser } from "./storageService";

// Helper to resolve key (User Setting > Env Var)
const resolveApiKey = (user?: UserProfile | null): string => {
    if (user && user.apiKey && user.apiKey.trim().length > 10) return user.apiKey.trim();
    
    const storedUser = getUser();
    if (storedUser && storedUser.apiKey && storedUser.apiKey.trim().length > 10) return storedUser.apiKey.trim();
    
    try {
        // @ts-ignore
        const envKey = process.env.API_KEY || '';
        if (envKey.length > 10) return envKey;
    } catch {
        // Ignore env access
    }
    return '';
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'ping',
            config: { maxOutputTokens: 1 }
        });
        return true;
    } catch (e) {
        console.error("API Key Validation Failed:", e);
        return false;
    }
};

export const createSalesCoachChat = (user: UserProfile, sales: DailyReport[]): Chat | null => {
    const key = resolveApiKey(user);
    if (!key) return null;

    try {
        const ai = new GoogleGenAI({ apiKey: key });
        
        const recentSales = sales
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

        const systemInstruction = `
            You are an expert Bajaj Electricals Sales Coach. 
            User: ${user.name} (${user.storeName}).
            
            Task:
            1. Analyze sales performance.
            2. Answer questions about Bajaj products (Mixers, Geysers, Irons).
            3. Provide closing tips.

            Rules:
            - Plain text only.
            - Use Emojis.
            - Be very concise.
        `;

        return ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
                maxOutputTokens: 300
            }
        });
    } catch (e) {
        return null;
    }
};

export const getMotivationalQuote = async (): Promise<string> => {
    try {
        const key = resolveApiKey();
        if (!key) throw new Error("No Key");
        
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'Short powerful retail sales motivation quote. Max 10 words. Plain text.',
            config: { maxOutputTokens: 30 }
        });
        return response.text || "Success belongs to those who work for it. 🚀";
    } catch (error) {
        return "Your hard work today is your success tomorrow. 💪";
    }
};

export const getOfflineResponse = (query: string, user: UserProfile): string => {
    const lower = query.toLowerCase();
    if (lower.includes('hello')) return `Hello ${user.name}! Offline mode is active. ⚡`;
    if (lower.includes('mixer')) return "🔹 Bajaj GX Series: 500-750W. Duracut blades.";
    if (lower.includes('geyser')) return "🔹 Bajaj storage geysers: Glassline tanks, 20% more hot water.";
    return "I am in Offline Mode. Ask about Mixers, Geysers, or Irons! 🌐";
};