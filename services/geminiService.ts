
import { GoogleGenAI, Type } from "@google/genai";
import { DesignConfig, RealEstateAnalysis, DesignMode, GroundingSource, MaskedArea, RenderFormat } from "../types";

const createInpaintingMask = async (areas: MaskedArea[], originalImage: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');
      
      // Background is black (unmasked - keep original)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Masked areas are white (target for generation)
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
    ${config.roomType ? `SPACE CONTEXT: This is a ${config.roomType}. Ensure all furniture and lighting are appropriate for this specific room type.` : ''}
  `;

  // Handle Multi-Area Transformation Logic with explicit artifact removal
  if (config.maskedAreas && config.maskedAreas.length > 0) {
    prompt += `
      CRITICAL INPAINTING PROTOCOL (ERASE SELECTION MARKS):
      - The input image contains white rectangular markers representing selection zones.
      - YOUR PRIMARY DIRECTIVE: COMPLETELY OBLITERATE and remove these white marker boxes.
      - DO NOT leave any white outlines, rectangular ghosting, or artifacts from the mask interface.
      - Replace these regions with seamless, high-fidelity architectural content that blends perfectly with the unmasked surroundings.
      - Smooth all edges between the generated content and the original photo.
    `;
    
    config.maskedAreas.forEach((area, index) => {
      prompt += `\nZONE ${index + 1} TRANSFORMATION:`;
      
      if (area.generationMode === 'prompt') {
        prompt += ` - Target Instruction: "${area.prompt}". Ignore the global style for this specific plot.`;
      } else if (area.generationMode === 'style') {
        prompt += ` - Target Style: "${area.style}". Ignore the main project style for this specific plot.`;
      } else {
        prompt += ` - Target Synthesis: Blend global "${config.style}" with specific intent: "${area.prompt}" and local sub-style: "${area.style}".`;
      }
    });
    
    prompt += `
      NEGATIVE CONSTRAINTS:
      - NO WHITE BOXES OR OUTLINES.
      - NO RECTANGULAR ARTIFACTS IN THE SKY OR TERRAIN.
      - NO SEAMS OR VISIBLE MASK EDGES.
    `;
  }

  if (config.mode === DesignMode.BLUEPRINT) {
    prompt += `
      BLUEPRINT GENERATION PROTOCOL:
      - Generate a high-fidelity 2D top-down architectural floor plan.
      - Style: Professional architectural drawing (CAD-style).
      - Include: Walls, doors, windows, room labels, area measurements, and furniture layout.
      - Visuals: Clean white background, black lines, architectural hatching.
      - CORE INTENT: ${config.prompt || 'Generate an optimized modern residential layout'}.
    `;
    
    if (config.blueprintParams) {
      prompt += `
      - SPECS: ${config.blueprintParams.area} sqm, ${config.blueprintParams.bedrooms} bedrooms, ${config.blueprintParams.bathrooms} bathrooms.
      - ADDITIONAL: ${config.blueprintParams.livingRooms} living, ${config.blueprintParams.kitchens} kitchens, ${config.blueprintParams.garages} garages.
      `;
    }

    if (config.boundarySketch) {
      prompt += `\n- CONSTRAINT: Precisely follow the boundary shape provided in the attached 'Boundary Sketch' image.`;
    }
  }

  if (config.mode === DesignMode.SKETCH_TO_RENDER) {
    const isTechnicalStyle = config.style.toLowerCase().includes('3d') || 
                            config.style.toLowerCase().includes('isometric') || 
                            config.style.toLowerCase().includes('dollhouse');

    prompt += `
      CONVERSION PROTOCOL:
      - Translate the provided sketch into a fully realized spatial visualization.
      ${isTechnicalStyle ? `- TECHNICAL DIRECTIVE: Use an isometric perspective or a dollhouse cutaway view.` : ''}
      - STYLE CHOICE: ${config.style}.
    `;
  }

  prompt += `\nUSER REQUEST: ${config.prompt}. GENERATE 4 DISTINCT VARIATIONS.`;

  let aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "4:3";
  if (config.renderFormat === 'Panoramic') aspectRatio = "16:9";
  if (config.renderFormat === 'Landscape') aspectRatio = "16:9";
  if (config.isPanorama) aspectRatio = "16:9";

  try {
    const generatedImages: string[] = [];

    if (isGenerateNew) {
      const parts: any[] = [{ text: prompt }];
      if (config.boundarySketch) {
        parts.push({ 
          inlineData: { 
            mimeType: 'image/png', 
            data: config.boundarySketch.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '') 
          } 
        });
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
        try {
          const parts: any[] = [
            { text: `${prompt} (Variation ${index + 1}). FINAL REMINDER: Seamlessly overpaint and remove every trace of the white selection boxes. Artifact-free output is mandatory.` },
            { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
          ];
          if (maskBase64) {
            parts.push({ inlineData: { mimeType: 'image/png', data: maskBase64 } });
          }

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
        } catch (e) { return null; }
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
