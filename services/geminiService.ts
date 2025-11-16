
import { GoogleGenAI, Modality } from "@google/genai";

export const generateSpeech = async (prompt: string, voiceName: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API key not found. Please set the API_KEY environment variable.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      throw new Error("Não foram recebidos dados de áudio da API.");
    }

    return audioData;
  } catch (error) {
    console.error("Erro ao gerar áudio:", error);
    throw new Error("Falha ao se comunicar com a API Gemini. Verifique o console para mais detalhes.");
  }
};
