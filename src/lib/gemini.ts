import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DiagnosisResult {
  possibleDiagnoses: string[];
  confidence: number;
  recommendedActions: string[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  explanation: string;
}

export async function getDiagnosis(symptoms: string[], patientInfo: { age: number; gender: string; location: string }): Promise<DiagnosisResult> {
  const prompt = `As a healthcare assistant for rural communities, analyze these symptoms for a ${patientInfo.age}-year-old ${patientInfo.gender} in ${patientInfo.location}.
  Symptoms: ${symptoms.join(', ')}.
  Provide a structured diagnosis including possible illnesses (like malaria, pneumonia, etc.), recommended immediate actions, and urgency level.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          possibleDiagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence: { type: Type.NUMBER },
          recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          urgency: { type: Type.STRING, enum: ['low', 'medium', 'high', 'emergency'] },
          explanation: { type: Type.STRING }
        },
        required: ["possibleDiagnoses", "confidence", "recommendedActions", "urgency", "explanation"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function analyzeImage(base64Image: string, mimeType: string): Promise<string> {
  const prompt = "Analyze this medical image for signs of malnutrition, visible symptoms of common rural illnesses (like skin rashes, eye discoloration), or other health concerns. Provide a concise summary for a community health volunteer.";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    }
  });

  return response.text;
}
