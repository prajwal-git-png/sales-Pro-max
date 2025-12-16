import { GoogleGenAI, Type } from "@google/genai";
import { SaleItem, UserProfile, DailyReport } from "../types";

// @ts-ignore - process.env provided by build environment
const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey });

export const parseBillImage = async (base64Image: string): Promise<SaleItem[]> => {
  try {
    // Extract base64 data and mime type
    const [header, base64Data] = base64Image.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            },
            {
                text: "Extract product items, quantities, and unit prices from this bill image. Return a clean JSON array."
            }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING, description: "Name of the product" },
              quantity: { type: Type.NUMBER, description: "Quantity sold" },
              price: { type: Type.NUMBER, description: "Unit price of the product" }
            },
            required: ["productName", "quantity", "price"]
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.map((item: any) => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        productName: item.productName || "Unknown Item",
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0
      }));
    }
    return [];
  } catch (error) {
    console.error("AI Parse Error:", error);
    throw new Error("Failed to parse bill image");
  }
};

export const getSalesInsights = async (user: UserProfile, sales: DailyReport[]): Promise<string> => {
    try {
        const recentSales = sales
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10); // Last 10 entries to save tokens

        const prompt = `
            You are a helpful Sales Coach. 
            User: ${user.name}
            Monthly Target: ${user.monthlyTarget}
            Recent Performance (Last 10 Days): ${JSON.stringify(recentSales)}
            
            Analyze the performance. 
            1. Calculate MTD (Month to Date) rough estimate.
            2. Compare with target.
            3. Provide 3 specific, encouraging, and actionable tips to help achieve the target.
            Keep the tone professional yet motivating. Format with Markdown.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are an expert sales performance analyst and coach.",
            }
        });

        return response.text || "No insights available at the moment.";
    } catch (error) {
        console.error("AI Insight Error:", error);
        throw new Error("Failed to generate insights");
    }
};