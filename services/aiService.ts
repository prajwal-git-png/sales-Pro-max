import { GoogleGenAI } from "@google/genai";
import { UserProfile, DailyReport } from "../types";
import { BAJAJ_PRODUCTS, MR_PRODUCTS } from "./excelExportService";

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const ALL_PRODUCTS = [...BAJAJ_PRODUCTS, ...MR_PRODUCTS];

const getSpecificCategory = (name: string) => {
    const product = ALL_PRODUCTS.find(p => p.description.toLowerCase() === name.toLowerCase());
    if (product) return product.category;
    
    const n = name.toLowerCase();
    if (n.includes('cooler')) return 'Coolers';
    if (n.includes('mixer') || n.includes('mg ')) return 'Mixer';
    if (n.includes('geyser') || n.includes('heater')) return 'Geyser';
    if (n.includes('iron')) return 'Irons';
    if (n.includes('induction')) return 'Induction';
    if (n.includes('microwave') || n.includes('mws')) return 'MWO';
    if (n.includes('otg')) return 'OTG';
    if (n.includes('air fryer')) return 'Air Fryer';
    if (n.includes('processor') || n.includes('fp')) return 'FP';
    if (n.includes('blender') || n.includes('hb')) return 'HB';
    if (n.includes('toaster') || n.includes('sandwich')) return 'Toaster, SWM, HB';
    if (n.includes('stove') || n.includes('cooktop') || n.includes('hob')) return 'Gas Stove';
    
    return 'Uncategorized';
};

const getBroadCategory = (specificCategory: string, name: string) => {
    const s = specificCategory.toLowerCase();
    if (s.includes('mixer') || s.includes('fp') || s.includes('hb') || s.includes('toaster') || s.includes('induction') || s.includes('gas stove') || s.includes('mwo') || s.includes('otg') || s.includes('air fryer')) return 'Kitchen Care';
    if (s.includes('iron') || s.includes('cooler') || s.includes('geyser') || s.includes('room heater')) return 'Home Care';
    
    const n = name.toLowerCase();
    if (n.includes('hob') || n.includes('chimney') || n.includes('oven') || n.includes('dishwasher')) return 'Integrated Kitchen';
    
    return 'Others';
};

const getSystemInstruction = (user: UserProfile, sales: DailyReport[]) => {
    let dataText = "Date | Broad Category | Specific Category | Product | Qty | Price\n";
    sales.forEach(s => {
        s.items.forEach(i => {
            const specific = getSpecificCategory(i.productName);
            const broad = getBroadCategory(specific, i.productName);
            dataText += `${s.date} | ${broad} | ${specific} | ${i.productName} | ${i.quantity} | ${i.price}\n`;
        });
    });

    const today = new Date().toISOString().split('T')[0];

    return `You are a direct, concise Sales Data Assistant for ${user.name} at ${user.storeName}.
    
### Raw Sales Data (CSV Format):
${dataText || 'No sales data available yet.'}

### Rules:
1. Answer directly based ONLY on the data above.
2. If asked for a number (e.g., "how many coolers sold last week"), calculate the exact number from the data and give the answer immediately.
3. No fluff, no long greetings, no generic advice unless explicitly asked.
4. Use the 'Date' column to filter for "this week", "last week", etc. Note that weeks are calculated from Monday to Sunday. Today is ${today}.
5. Use the 'Broad Category' column to group items (Kitchen Care, Home Care, Integrated Kitchen, Others).
6. Use the 'Specific Category' column to answer questions about specific types of products like Coolers, Mixers, Geysers, etc.
7. Example: "You sold 5 Coolers last week (3 Model A, 2 Model B)."`;
};

export const sendCoachMessage = async (
    user: UserProfile, 
    sales: DailyReport[], 
    history: ChatMessage[], 
    newMessage: string
): Promise<string> => {
    // Try to get API key from user profile or environment
    const apiKey = user.apiKey || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined); 
    
    if (!apiKey) {
        console.warn("AI Coach: No API Key found in profile or environment.");
        return getOfflineResponse(newMessage, user);
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const contents: any[] = [];
        
        // Filter history to ensure it starts with a user message if present
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
            } else {
                contents[contents.length - 1].parts[0].text += '\n' + msg.text;
            }
        }

        if (lastRole === 'user') {
            contents[contents.length - 1].parts[0].text += '\n' + newMessage;
        } else {
            contents.push({
                role: 'user',
                parts: [{ text: newMessage }]
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: {
                systemInstruction: getSystemInstruction(user, sales),
                maxOutputTokens: 500, // Increased for fuller responses
                temperature: 0.2, // Lowered for more factual accuracy
            }
        });

        const text = response.text;
        if (!text) {
            return "I'm here to help, but I couldn't generate a response. Try asking about your sales or product features! 🚀";
        }

        return text;
    } catch (e: any) {
        console.error("AI Coach Error Details:", e);
        if (e.message?.includes('429')) throw new Error("RATE_LIMIT");
        if (e.message?.includes('API_KEY_INVALID')) return "Your AI API key seems invalid. Please check your settings. 🔑";
        return getOfflineResponse(newMessage, user);
    }
};

export const getMotivationalQuote = async (apiKey?: string): Promise<string> => {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) return "Success is a series of small wins every day. 💪";
    try {
        const ai = new GoogleGenAI({ apiKey: key });
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