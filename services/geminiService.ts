
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Generate 4 distinct variations for selection + Campaign Insights
export const generateMarketingTemplate = async (
  angle: string, 
  productName: string, 
  description: string, 
  targetAudience: string,
  price: number,
  language: string = "Moroccan Darija"
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `
    You are an Expert WhatsApp Growth Consultant.
    Language: ${language}. Product: ${productName}. Price: ${price} MAD.
    Audience Segment: ${targetAudience}.
    
    Task 1: Generate 4 distinct message variations:
    1. Angle: ${angle} (The primary request)
    2. Angle: FOMO/Urgency (Limited stock/Time)
    3. Angle: Storytelling (Customer journey/Result)
    4. Angle: Ultra-Short (Direct value proposition)

    Task 2: Provide a Strategic Insight Summary.
    - Estimate Conversion Probability (0-100%).
    - Estimate Revenue Uplift based on 100 sent messages.
    - Explain the "Why" behind the logic.

    Rules:
    - Use localized ${language} nuances.
    - Include emojis.
    - Create highly specific prompts for Image (1:1) and Video (16:9).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 4 professional variations and insights for ${productName}. Context: ${description}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  messageText: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  videoPrompt: { type: Type.STRING },
                  audioScript: { type: Type.STRING }
                },
                required: ["title", "messageText", "imagePrompt", "videoPrompt", "audioScript"]
              }
            },
            insights: {
              type: Type.OBJECT,
              properties: {
                conversionProb: { type: Type.NUMBER },
                revenueUplift: { type: Type.STRING },
                strategicAdvice: { type: Type.STRING }
              },
              required: ["conversionProb", "revenueUplift", "strategicAdvice"]
            }
          },
          required: ["variations", "insights"]
        }
      }
    });
    return JSON.parse(response.text || '{"variations":[], "insights": {}}');
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateAIImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ text: prompt }],
    config: { imageConfig: { aspectRatio: "1:1" } },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image generated");
};

export const generateAIVideo = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });
  
  // Smart Polling Strategy: Long initial wait for high-compute tasks
  let attempts = 0;
  while (!operation.done) {
    attempts++;
    const waitTime = attempts < 3 ? 15000 : 10000; // Poll less frequently at first
    await new Promise(resolve => setTimeout(resolve, waitTime));
    operation = await ai.operations.getVideosOperation({ operation: operation });
    if (attempts > 30) throw new Error("Neural synthesis timed out.");
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

export const generateAIAudio = async (text: string, voice: string = 'Kore') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generateSmartReply = async (
  userMessage: string,
  productContext: string,
  language: string = "Moroccan Darija"
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `
    You are a high-performance "Neural Sales Interceptor" for WhatsApp.
    Role: Sales Closer.
    Language: ${language}.
    
    Product Context for knowledge base:
    ${productContext}

    Instructions:
    - Analyze the customer's message.
    - Handle objections professionally.
    - Propose a closing action (e.g., checkout link, confirmation).
    - Be concise, persuasive, and friendly.
    - Use localized slang and emojis where appropriate.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Customer said: "${userMessage}"`,
      config: { 
        systemInstruction, 
        temperature: 0.2,
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    return response.text || "I'm sorry, I couldn't process a smart reply at this moment.";
  } catch (error) {
    console.error("Agent Error:", error);
    return "The Neural Agent is temporarily offline. Please reply manually.";
  }
};
