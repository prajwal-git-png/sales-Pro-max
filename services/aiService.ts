import { GoogleGenAI, Chat } from "@google/genai";
import { UserProfile, DailyReport } from "../types";

// @ts-ignore - process.env provided by build environment
const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey });

export const createSalesCoachChat = (user: UserProfile, sales: DailyReport[]): Chat => {
    // Prepare context
    const recentSales = sales
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    const systemInstruction = `
        You are an expert Bajaj Electricals Sales Coach and Product Knowledge Specialist. 
        Your User is ${user.name} from the store "${user.storeName}". 
        Their monthly target is ${user.monthlyTarget}.
        
        Your Capabilities:
        1. Analyze their sales performance based on provided data.
        2. Answer technical questions about Bajaj products (Mixers, Geysers, Irons, etc.) including Features, Warranty, and USPs.
        3. Provide tips to close sales.

        STRICT FORMATTING RULES:
        - Do NOT use Markdown symbols like asterisks (** or *), hashes (#), backticks (\`), or underscores (_).
        - Output CLEAN plain text only.
        - Use Emojis (🔹, ✅, ⚡, etc.) to create lists or structure instead of markdown bullets.
        - Keep responses concise, chatty, and encouraging.
        
        Recent Sales Context: ${JSON.stringify(recentSales)}
    `;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        }
    });
};

export const getMotivationalQuote = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Generate a short, powerful, unique motivational quote specifically for a retail sales executive to boost their morale. Max 15 words. End with one relevant emoji. Plain text only.',
        });
        return response.text || "Success is a journey, not a destination. 🚀";
    } catch (error) {
        console.error("AI Quote Error:", error);
        return "Your hard work today is your success tomorrow. 💪";
    }
};