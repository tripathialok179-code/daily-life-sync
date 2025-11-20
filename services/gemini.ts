import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini client
// Note: In a production app, ensure process.env.API_KEY is set.
// The system prompt guarantees this is available in this environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateDescription = async (taskTitle: string): Promise<string> => {
  try {
    if (!process.env.API_KEY) return "API Key missing.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, concise, and motivating description (max 2 sentences) for a task titled: "${taskTitle}". Do not use markdown formatting.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "";
  }
};

export const enhanceJournalEntry = async (content: string): Promise<string> => {
  try {
    if (!process.env.API_KEY) return content;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Refine the following journal entry to be more expressive and eloquent, while keeping the original meaning and tone. keep it concise:\n\n"${content}"`,
    });
    return response.text || content;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return content;
  }
};

export const generateSubtasks = async (listTitle: string): Promise<string[]> => {
  try {
    if (!process.env.API_KEY) return [];
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a list of 3-5 checklist items for a list titled "${listTitle}". Return only the items, one per line. No bullets, no numbering.`,
    });
    
    const text = response.text || "";
    return text.split('\n').filter(line => line.trim().length > 0);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
}