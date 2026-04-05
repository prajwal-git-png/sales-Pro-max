import { GoogleGenAI } from "@google/genai";
import { UserProfile, DailyReport } from "../types";

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const getSystemInstruction = (user: UserProfile, sales: DailyReport[]) => {
    // Calculate total sales by product
    const productSales: Record<string, number> = {};
    let totalSalesValue = 0;
    let totalSalesQty = 0;

    sales.forEach(report => {
        totalSalesValue += report.totalValue;
        totalSalesQty += report.totalQty;
        report.items.forEach(item => {
            if (!productSales[item.productName]) {
                productSales[item.productName] = 0;
            }
            productSales[item.productName] += item.quantity;
        });
    });

    const productBreakdown = Object.entries(productSales)
        .map(([name, qty]) => `- ${name}: ${qty} units`)
        .join('\n');

    const recentSales = [...sales]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7); // Last 7 days

    const salesSummary = recentSales.map(s => {
        const itemDetails = s.items.map(i => `${i.productName} (${i.quantity})`).join(', ');
        return `Date: ${s.date}, Total: ₹${s.totalValue}, Qty: ${s.totalQty}. Items: ${itemDetails}`;
    }).join('\n');

    return `You are an intelligent, friendly, and analytical Bajaj Electricals Sales Assistant.
Executive: ${user.name} at ${user.storeName}.

### Sales Data Context
You have access to the user's sales data. Use this to answer their questions accurately.
Total Sales Value: ₹${totalSalesValue}
Total Units Sold: ${totalSalesQty}

**Overall Product Breakdown (All Time):**
${productBreakdown || 'No products sold yet.'}

**Recent Sales History (Last 7 Days):**
${salesSummary || 'No recent sales recorded.'}

### Guidelines:
1. Be casual, friendly, and approachable. Use natural language.
2. When asked about sales data (e.g., "how many coolers did I sell?"), look at the "Overall Product Breakdown" and "Recent Sales History" above.
3. **CRITICAL**: If asked about a category, you MUST use these definitions:
   - **Kitchen Care**: Mixers, Grinders, Juicers, Induction, Toasters, Sandwich Makers, Kettles.
   - **Home Care**: Irons, Fans, Coolers, Geysers, Heaters, Air Purifiers, Vacuums.
   - **Integrated Kitchen**: Built-in Hobs, Chimneys, Ovens, Microwaves, Dishwashers.
   - **Others**: Any other products.
   - When reporting:
     - Identify all models that belong to the requested category.
     - Provide a breakdown of each model's sales.
     - Provide the TOTAL sales for that category.
     - Example: "You've sold 7 items in Kitchen Care this week! Breakdown: 2 units of GX-1 Mixer, 5 units of Induction Cooktop."
4. Provide clear, concise reports using bullet points for readability.
5. Focus on helping with sales techniques, product features, and handling customer objections.
6. Highlight Bajaj's strengths (durability, service, trust) naturally.

### Response Rules:
- Keep it conversational and easy to read.
- Use emojis to keep the mood light. 🌟
- Use markdown (bolding, lists) for clarity.
- If data is missing for a specific query, say so politely and offer what you DO have.`;
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