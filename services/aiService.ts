
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, DailyReport } from "../types";

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
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
    const apiKey = user.apiKey || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found. Please add your Gemini API Key in Settings.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
            {
                role: "user",
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: base64Data
                        }
                    },
                    {
                        text: `Extract information from this bill image in a structured JSON format. 
                        Fields to extract:
                        - date (YYYY-MM-DD)
                        - customerName
                        - customerPhone (10 digits)
                        - billId (Invoice number)
                        - txnNumber (Transaction reference if any)
                        - items (Array of objects with productName, quantity, price)
                        - isGeyserFound (Boolean, true if any item is a Geyser or Water Heater)
                        - rawText (A complete transcription of all text found on the bill)

                        Return ONLY the JSON object.`
                    }
                ]
            }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING },
                    customerName: { type: Type.STRING },
                    customerPhone: { type: Type.STRING },
                    billId: { type: Type.STRING },
                    txnNumber: { type: Type.STRING },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                productName: { type: Type.STRING },
                                quantity: { type: Type.NUMBER },
                                price: { type: Type.NUMBER }
                            },
                            required: ["productName", "quantity", "price"]
                        }
                    },
                    isGeyserFound: { type: Type.BOOLEAN },
                    rawText: { type: Type.STRING }
                },
                required: ["items", "isGeyserFound"]
            }
        }
    });

    try {
        const result = JSON.parse(response.text || "{}");
        return result as ExtractedBillData;
    } catch (e) {
        console.error("Failed to parse Gemini response", e);
        throw new Error("Failed to extract data from bill. Please try again or enter manually.");
    }
};

export const getMotivationalQuote = async (apiKey?: string): Promise<string> => {
    if (apiKey) console.log("Using custom API key for quote");
    const quotes = [
        "Believe you can and you're halfway there.",
        "Quality means doing it right when no one is looking.",
        "The only way to do great work is to love what you do.",
        "Success is not final, failure is not fatal.",
        "Your limitation—it's only your imagination."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
};

export const sendCoachMessage = async (user: UserProfile, sales: DailyReport[], history: ChatMessage[], message: string): Promise<string> => {
    const apiKey = user.apiKey || process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY_MISSING");

    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
            systemInstruction: `You are a Bajaj Sales Coach for ${user.name} at ${user.storeName}. 
            Your goal is to help them sell more Bajaj products. 
            Be encouraging, professional, and data-driven. 
            Current Sales Data: ${JSON.stringify(sales.slice(-5))}
            Today is ${new Date().toLocaleDateString()}.`
        },
        history: history.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }))
    });

    const response = await chat.sendMessage({ message });
    return response.text || "I'm not sure how to respond to that.";
};

export const getOfflineResponse = (message: string, user: UserProfile): string => {
    console.log("Offline processing for:", message);
    return `Keep pushing, ${user.name.split(' ')[0]}! Every sale counts.`;
};
