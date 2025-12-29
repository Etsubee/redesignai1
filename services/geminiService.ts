
import { GoogleGenAI, Type } from "@google/genai";
import { DesignConfig, RealEstateAnalysis, DesignMode, GroundingSource, MaskedArea, RenderFormat, LocationData } from "../types";

const createInpaintingMask = async (areas: MaskedArea[], originalImage: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');
      
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      areas.forEach(area => {
        const x = (area.x / 100) * canvas.width;
        const y = (area.y / 100) * canvas.height;
        const w = (area.width / 100) * canvas.width;
        const h = (area.height / 100) * canvas.height;
        ctx.fillRect(x, y, w, h);
      });
      resolve(canvas.toDataURL('image/png').split(',')[1]);
    };
    img.src = originalImage;
  });
};

export const getCityPlanningSuggestions = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  
  const prompt = `
    Analyze this urban perspective. As a master city planner, suggest specific infrastructure improvements based on the visual context.
    Consider:
    1. Density: Suggest G+10 or higher condominiums if the area allows.
    2. Transport: Identify potential for train stations, railways, or modern transit hubs.
    3. Utilities: Suggest modern road networks, pedestrian bridges, or green corridors.
    4. Transformation: Recommend specific building types (Modern Facade, Brutalism, Futuristic) that would benefit the local economy and aesthetic.
    
    Provide a professional, concise urban planning proposal (max 100 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          { text: prompt }, 
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
        ] 
      }
    });

    return response.text || "Focus on mixed-use high-rise development and integrated transit hubs.";
  } catch (e) {
    console.error("Image analysis failed", e);
    return "Develop a sustainable mixed-use corridor with high-density residential blocks (G+10) and green public spaces.";
  }
};

export const generateDesigns = async (
  base64Image: string | null,
  config: DesignConfig
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const isGenerateNew = config.isGenerateNew || (!base64Image && config.mode === DesignMode.BLUEPRINT);

  let prompt = `
    ROLE: Elite Architectural Draftsman & Master Urban Planner.
    PROJECT: ${config.mode}.
    GLOBAL STYLE: ${config.style}.
    ${config.roomType ? `SPACE CONTEXT: This is a ${config.roomType}.` : ''}
  `;

  if (config.mode === DesignMode.CITY) {
    prompt += `
      URBAN PLANNING PROTOCOL:
      - Analyze the spatial configuration of the provided perspective.
      - Strategy: ${config.cityPlanningStrategy === 'AI_RECOMMENDED' ? 'Optimize infrastructure with smart urban density (G+10, transit hubs, sustainable corridors) specifically as suggested in the AI analysis.' : 'Implement specific architectural infrastructure as requested.'}
      - Integrate new structures seamlessly into the urban fabric.
    `;
  }

  if (config.maskedAreas && config.maskedAreas.length > 0) {
    prompt += `
      CRITICAL INPAINTING PROTOCOL:
      - Remove all selection markers. Replace with seamless content.
    `;
    
    config.maskedAreas.forEach((area, index) => {
      prompt += `\nZONE ${index + 1}: ${area.prompt || area.style}`;
    });
  }

  if (config.mode === DesignMode.BLUEPRINT) {
    prompt += `\nBLUEPRINT PROTOCOL: Generate high-fidelity 2D CAD-style layout.`;
    if (config.blueprintParams) {
      prompt += `\nSpecs: ${config.blueprintParams.area}sqm, ${config.blueprintParams.bedrooms} beds, ${config.blueprintParams.bathrooms} baths.`;
    }
  }

  prompt += `\nUSER REQUEST: ${config.prompt}. GENERATE 4 DISTINCT VARIATIONS.`;

  let aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "4:3";
  if (config.isPanorama) aspectRatio = "16:9";

  try {
    const generatedImages: string[] = [];

    if (isGenerateNew) {
      const parts: any[] = [{ text: prompt }];
      if (config.boundarySketch) {
        parts.push({ inlineData: { mimeType: 'image/png', data: config.boundarySketch.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '') } });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { imageConfig: { aspectRatio } },
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImages.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          }
        }
      }
    } else {
      const cleanBase64 = base64Image!.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      const maskBase64 = config.maskedAreas && config.maskedAreas.length > 0 
        ? await createInpaintingMask(config.maskedAreas, base64Image!)
        : null;
      
      const generateVariation = async (index: number) => {
        const parts: any[] = [
          { text: `${prompt} (Variation ${index + 1})` },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
        ];
        if (maskBase64) parts.push({ inlineData: { mimeType: 'image/png', data: maskBase64 } });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
          config: { imageConfig: { aspectRatio } },
        });

        if (response.candidates && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
        return null;
      };

      const results = await Promise.all([0, 1, 2, 3].map(i => generateVariation(i)));
      results.forEach(res => { if (res) generatedImages.push(res); });
    }

    return generatedImages;
  } catch (error: any) {
    throw error;
  }
};

export const analyzeDesign = async (
  base64Image: string,
  marketContext: 'Ethiopian' | 'International'
): Promise<RealEstateAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const prompt = `Analyze this visualization for real estate valuation. Return JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }] }
    });
    let jsonStr = (response.text || "{}").replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (e: any) { throw e; }
};
