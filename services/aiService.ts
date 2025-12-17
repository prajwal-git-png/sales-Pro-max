import { GoogleGenAI, Chat } from "@google/genai";
import { UserProfile, DailyReport } from "../types";

// Robustly retrieve API key to prevent "process is not defined" crashes
let apiKey = '';
try {
  // @ts-ignore
  apiKey = process.env.API_KEY || '';
} catch (e) {
  console.warn("Environment variables not accessible");
}

// Lazy initialization of AI client
let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
    if (aiInstance) return aiInstance;
    if (apiKey) {
        try {
            aiInstance = new GoogleGenAI({ apiKey });
        } catch (error) {
            console.error("Failed to initialize GoogleGenAI", error);
        }
    }
    return aiInstance;
};

export const createSalesCoachChat = (user: UserProfile, sales: DailyReport[]): Chat | null => {
    const ai = getAiClient();
    if (!ai) {
        console.warn("AI Client not initialized (Missing Key)");
        return null;
    }

    // Prepare context
    const recentSales = sales
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    const systemInstruction = `
        You are an expert Bajaj Electricals Sales Coach. 
        User: ${user.name} (${user.storeName}). Target: ${user.monthlyTarget}.
        
        Task:
        1. Analyze sales performance.
        2. Answer technical questions about Bajaj products (Mixers, Geysers, Irons).
        3. Provide sales closing tips.

        Rules:
        - Plain text only. No Markdown (*, #, \`).
        - Use Emojis for structure.
        - Be concise.
        
        Context: ${JSON.stringify(recentSales)}
    `;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
            maxOutputTokens: 300, 
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
};

export const getMotivationalQuote = async (): Promise<string> => {
    try {
        const ai = getAiClient();
        if (!ai) throw new Error("No API Key");
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Generate a short, powerful retail sales motivation quote. Max 15 words. Plain text.',
            config: { 
                maxOutputTokens: 50,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return response.text || "Success is a journey, not a destination. 🚀";
    } catch (error) {
        // Silent fail for quote
        return "Your hard work today is your success tomorrow. 💪";
    }
};

// Fallback logic for when API is unavailable or quota is exceeded
export const getOfflineResponse = (query: string, user: UserProfile): string => {
    const lower = query.toLowerCase();
    
    if (lower.includes('hello') || lower.includes('hi')) {
        return `Hello ${user.name}! I am your Offline Sales Assistant. I can help with product details while you are offline. ⚡`;
    }
    
    if (lower.includes('mixer') || lower.includes('grinder')) {
        return "🔹 Bajaj Mixers (GX Series): 500W-750W motors. \n🔹 USP: DuraCut Blades & 100% Copper Motors. \n🔹 Warranty: 2 Years on Product, 5 Years on Motor.";
    }
    
    if (lower.includes('geyser') || lower.includes('heater') || lower.includes('water')) {
        return "🔹 Instant Geysers (3L): 3KW/4.5KW for quick heating. \n🔹 Storage (10L-25L): Glassline inner tank preventing corrosion. \n🔹 USP: Swirl Flow Technology for 20% more hot water.";
    }

    if (lower.includes('iron') || lower.includes('steam')) {
        return "🔹 Dry Irons (DX): Heavy weight for crisp ironing. \n🔹 Steam Irons (MX): Non-stick coated soleplate. \n🔹 USP: 360-degree swivel cord for easy movement.";
    }
    
    if (lower.includes('target') || lower.includes('sales')) {
        return `Your monthly target is ₹${user.monthlyTarget.toLocaleString()}. Focus on high-value items like OTGs and Storage Geysers to reach it faster! 🎯`;
    }

    if (lower.includes('tip') || lower.includes('sell')) {
        return "💡 Sales Tip: Always demonstrate the product. Let the customer hold it or feel the build quality. This increases trust by 40%.";
    }

    return "I am currently in Offline Mode. 🌐 \n\nI can tell you about: \n1. Mixers 🌪️ \n2. Geysers 🚿 \n3. Irons 👕 \n4. Sales Tips 💡";
};