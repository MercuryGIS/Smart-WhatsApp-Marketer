
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
    
    CRITICAL INSTRUCTION: You MUST write the 'messageText' using ARABIC SCRIPT (حروف عربية). 
    DO NOT use Latin characters or Arabezi (e.g., don't write "salam", write "سلام"). 
    The dialect should be authentic and persuasive.

    Task 1: Generate 4 distinct marketing variations:
    1. Angle: ${angle} (Primary strategy)
    2. Angle: High Urgency (Stock depletion/Flash offer)
    3. Angle: Social Proof (Customer testimonial/Result)
    4. Angle: Core Value (Ultra-short/Impactful)

    For each variation, you MUST provide:
    - title: A short descriptive name in English.
    - messageText: The localized text for WhatsApp in ARABIC CHARACTERS.
    - imagePrompt: A VISUAL description in English for an image generator.
    - videoPrompt: A DYNAMIC description in English for a video generator.
    - audioScript: A short spoken ad script (10-15s) in English for translation/voiceover.

    Task 2: Strategic Summary.
    - conversionProb: Estimate (0-100).
    - revenueUplift: Short string estimate.
    - strategicAdvice: 1 sentence on why this works.

    Rules:
    - Use authentic ${language} idioms and professional emojis.
    - messageText MUST BE Arabic script.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Synthesize 4 distinct Arabic script variations for ${productName}.`,
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
  
  let attempts = 0;
  while (!operation.done) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 10000));
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
    You are a high-performance "Neural Sales Interceptor".
    Language: ${language}. Use ARABIC CHARACTERS (حروف عربية).
    
    Product Context:
    ${productContext}

    Instructions:
    - Respond in the customer's dialect using Arabic script.
    - Handle objections with empathy and professional logic.
    - Always aim for a "Confirm Order" action.
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
    return response.text || "I'm sorry, I couldn't process a smart reply.";
  } catch (error) {
    console.error("Agent Error:", error);
    return "The Neural Agent is temporarily offline.";
  }
};
