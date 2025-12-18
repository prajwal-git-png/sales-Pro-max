import { GoogleGenAI } from "@google/genai";
import { UserProfile, DailyReport } from "../types";

export const createSalesCoachChat = (user: UserProfile, sales: DailyReport[]) => {
    try {
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
            
            Recent Performance:
            ${salesSummary || 'No recent sales recorded.'}

            Task:
            1. Analyze sales performance.
            2. Answer questions about Bajaj products (Mixers, Geysers, Irons).
            3. Provide closing tips for retail customers.

            Rules:
            - Response MUST be plain text only.
            - Use relevant Emojis.
            - Be concise and professional.
        `;

        return ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: systemInstruction,
                maxOutputTokens: 1000,
                thinkingConfig: { thinkingBudget: 500 }
            }
        });
    } catch (e) {
        console.error("Failed to create chat session:", e);
        return null;
    }
};

export const getMotivationalQuote = async (): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'Provide a short, powerful, one-sentence retail sales motivation quote (max 12 words) with an emoji.',
            config: { 
                maxOutputTokens: 100, 
                thinkingConfig: { thinkingBudget: 50 } 
            }
        });
        return response.text || "Success belongs to those who work for it. 🚀";
    } catch (error) {
        console.error("Failed to fetch quote:", error);
        return "Your hard work today is your success tomorrow. 💪";
    }
};

export const getOfflineResponse = (query: string, user: UserProfile): string => {
    const lower = query.toLowerCase();
    if (lower.includes('hello')) return `Hello ${user.name}! I'm currently in offline mode, but I can still share some basic product info. ⚡`;
    if (lower.includes('mixer')) return "🔹 Bajaj GX Series: Feature 500-750W motors and Duracut blades for fine grinding.";
    if (lower.includes('geyser')) return "🔹 Bajaj Storage Geysers: Feature Glassline-coated tanks and provide up to 20% more hot water.";
    if (lower.includes('iron')) return "🔹 Bajaj Irons: Available in Dry and Steam variants with non-stick coated soleplates.";
    return "I am currently operating in Offline Mode. Please check your internet connection for full AI coaching! 🌐";
};
