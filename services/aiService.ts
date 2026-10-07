import { UserProfile, DailyReport } from "../types";

export type ChatRole = 'general' | 'fast' | 'complex';

export interface ChatMessage {
    id?: string;
    role: 'user' | 'model';
    text: string;
    timestamp?: string;
    modelUsed?: string;
}

export interface ExtractedBillData {
    date?: string;
    customerName?: string;
    customerPhone?: string;
    billId?: string;
    txnNumber?: string;
    items: {
        productName: string;
        quantity: number;
        price: number;
    }[];
    isGeyserFound: boolean;
    rawText?: string;
}

export const extractDataFromBill = async (base64Image: string, user: UserProfile): Promise<ExtractedBillData> => {
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await fetch('/api/extract-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, userApiKey: user.apiKey })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to extract data from bill. Please try again or enter manually.");
    }

    return await response.json();
};

export const getMotivationalQuote = async (apiKey?: string): Promise<string> => {
    if (apiKey) console.log("Using custom API key for quote");
    const quotes = [
        "Believe you can and you're halfway there.",
        "Quality means doing it right when no one is looking.",
        "The only way to do great work is to love what you do.",
        "Success is not final, failure is not fatal.",
        "Your limitation—it's only your imagination.",
        "Every demonstration brings you one step closer to closing the deal.",
        "Customers don't buy products, they buy solutions and trust."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
};

export const sendCoachMessage = async (
    user: UserProfile,
    sales: DailyReport[],
    history: ChatMessage[],
    message: string,
    role: ChatRole = 'general'
): Promise<{ text: string; modelUsed?: string }> => {
    const response = await fetch('/api/coach-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message, 
            user, 
            sales, 
            history, 
            role, 
            userApiKey: user.apiKey 
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.message || errorData.error || "Failed to reach AI Coach.");
        (err as any).code = errorData.error;
        throw err;
    }

    const data = await response.json();
    return {
        text: data.text || "Here to assist you with your sales goals!",
        modelUsed: data.modelUsed
    };
};

export const getOfflineResponse = (message: string, user: UserProfile): string => {
    const name = (user.name || 'Executive').split(' ')[0];
    const lower = (message || '').toLowerCase();

    if (lower.includes('otg') || lower.includes('morphy')) {
        return `Hey ${name}! For Morphy Richards OTGs (20L to 60L), highlight the Motorized Rotisserie, Convection technology, and Digichef digital precision. Remind baking enthusiasts that Morphy Richards is the trusted choice for consistent crust and even heating!`;
    }
    if (lower.includes('geyser') || lower.includes('heater')) {
        return `Hi ${name}! When selling Bajaj Geysers (Aerono 3L Instant or New Shakti Pro 10L-25L Storage), emphasize the Glasslined Inner Tank, Swirlflow 20% extra hot water feature, and free installation assistance!`;
    }
    if (lower.includes('mixer') || lower.includes('grinder')) {
        return `For Bajaj & MR Mixers (like GX15 500W up to 1000W Evoque), pitch the 100% Copper Motor, Titan Motor protection, and DuraCut blades. Offer a demo of dry vs wet grinding power!`;
    }
    if (lower.includes('target') || lower.includes('achievement')) {
        return `Stay focused, ${name}! Break down your monthly target into bite-sized daily milestones. Aim for at least 1 high-value appliance (Geyser, OTG, or Cooktop) plus 2 small appliances (Iron, Kettle, Sandwich Maker) every single shift!`;
    }

    return `Keep pushing forward, ${name}! Every customer walking through your doors is an opportunity. Show enthusiasm, listen to their needs, and remember: confidence closes sales!`;
};
