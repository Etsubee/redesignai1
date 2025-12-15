import { GoogleGenAI, Type } from "@google/genai";
import { DesignConfig, RealEstateAnalysis, DesignMode, GroundingSource } from "../types";

// Helper to validate key existence
const requireKey = (key: string | null) => {
  if (!key) throw new Error("API Key is missing. Please add your personal Gemini API Key in Settings.");
  return key;
};

// --- Image Generation Logic ---
export const generateDesigns = async (
  apiKey: string | null,
  base64Image: string | null,
  config: DesignConfig
): Promise<string[]> => {
  const key = requireKey(apiKey);
  const ai = new GoogleGenAI({ apiKey: key });

  const isGenerateNew = config.isGenerateNew && !base64Image;

  // Build the prompt
  let prompt = `
    Act as a professional architect and interior designer.
    Task: ${isGenerateNew ? 'Create a new design from scratch' : 'Transform the provided image'} based on mode: ${config.mode}.
    Style: ${config.style} ${config.subStyle ? `(${config.subStyle})` : ''}.
  `;

  if (config.roomType && config.mode === DesignMode.INTERIOR) {
    prompt += ` Specific Room Type: ${config.roomType}. Ensure the design is appropriate for a ${config.roomType}.`;
  }

  if (config.mode === DesignMode.FURNITURE_EDIT) {
    if (config.style.includes("Declutter") || config.style.includes("Cleaner")) {
      prompt += " Remove all clutter, loose items, and mess. Keep the main structural furniture if it is tidy, otherwise clear the room to show its potential.";
    } else if (config.style.includes("Remove")) {
      prompt += " Remove the furniture specified in instructions or all furniture if unspecified. Show an empty, clean space.";
    } else if (config.style.includes("Replace")) {
      prompt += " Replace the existing furniture with new furniture matching the description.";
    }
  }

  if (config.mode === DesignMode.UNDER_CONSTRUCTION) {
    prompt += `
      INPUT CONTEXT: High-rise construction site with exposed concrete grid.
      
      EXTREME PRIORITY INSTRUCTION: FORCE FULL FACADE COMPLETION.
      
      The AI often misses windows on random floors. YOU MUST NOT DO THIS.
      
      EXECUTION STEPS:
      1. IDENTIFY THE GRID: The building is a matrix of floors and columns.
      2. APPLY TEXTURE TO ALL CELLS: Apply the "Finished Window" texture to EVERY cell in this matrix.
      3. OVERWRITE VOIDS: Any dark, empty space within the building frame is strictly prohibited. You must paint over the dark voids with glass.
      4. PATTERN CONTINUITY: If floor 5 has windows, floor 6, 7, 8... up to the roof MUST have identical windows. Do not stop until the building is full.
      5. GLASS CURTAIN WALL: If individual windows are failing, apply a full glass curtain wall facade that covers the entire structural skeleton.
      
      RESULT: A sleek, 100% completed skyscraper with NO missing glazing.
    `;
  }

  // --- Panorama Handling ---
  if (config.isPanorama) {
    prompt += `
      INPUT IMAGE SPECIFICATION: The user has provided an Equirectangular Panorama (360° view).
      OUTPUT REQUIREMENT:
      1. Generate a SEAMLESS equirectangular projection (2:1 aspect ratio).
      2. Ensure the left and right edges of the image match perfectly to allow 360 navigation without a visible seam.
      3. Do not distort the horizon line.
      4. Treat the image as a continuous sphere, not a flat photo.
      5. Maintain the 360-degree perspective throughout the transformation.
    `;
  }

  prompt += ` User Instructions: ${config.prompt}.`;

  if (config.blueprintParams) {
    const bp = config.blueprintParams;
    prompt += `
      Blueprint Specifications:
      - Total Area: ${bp.area} sq meters
      - Bedrooms: ${bp.bedrooms}
      - Bathrooms: ${bp.bathrooms}
      - Living Rooms: ${bp.livingRooms}
      - Kitchens: ${bp.kitchens}
      - Dining Rooms: ${bp.diningRooms}
      - Office/Study: ${bp.offices}
      - Garage: ${bp.garages}
      - Layout Goal: ${config.style}
    `;
  }

  if (!isGenerateNew) {
      prompt += `
      Requirements:
      - Maintain structural integrity where applicable.
      - Photorealistic, high quality, 4k resolution.
      - If "Sketch-to-Render", turn the sketch into a real photo.
      ${config.isStereo3D ? '- Generate a Side-by-Side (SBS) stereoscopic 3D image.' : ''}
      ${config.isPanorama ? '- Generate an equirectangular projection for 360 view.' : ''}
    `;
  }

  try {
    const generatedImages: string[] = [];

    if (isGenerateNew) {
      // Use Imagen for Text-to-Image (Blueprint generation from scratch)
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 4, // Generate 4 variations
          outputMimeType: 'image/jpeg',
          aspectRatio: '4:3', // Standard aspect ratio for blueprints
        },
      });

      if (response.generatedImages) {
        for (const img of response.generatedImages) {
          if (img.image?.imageBytes) {
             generatedImages.push(`data:image/jpeg;base64,${img.image.imageBytes}`);
          }
        }
      }

    } else {
      // Use Gemini for Image-to-Image (Transformations)
      // Execute 4 parallel requests to ensure 4 distinct variations
      const cleanBase64 = base64Image!.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      
      const generateVariation = async (index: number) => {
        // Add slight prompt variation to ensure diversity
        const variationPrompt = `${prompt} (Variation ${index + 1}: Create a unique interpretation)`;
        
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { text: variationPrompt },
                { 
                  inlineData: { 
                    mimeType: 'image/jpeg', 
                    data: cleanBase64 
                  } 
                }
              ],
            },
            config: {},
          });

          if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              }
            }
          }
          return null;
        } catch (e) {
          console.warn(`Variation ${index} failed`, e);
          return null;
        }
      };

      const results = await Promise.all([
        generateVariation(0),
        generateVariation(1),
        generateVariation(2),
        generateVariation(3)
      ]);

      results.forEach(res => {
        if (res) generatedImages.push(res);
      });
    }

    // Fallback logic if no image returned
    if (generatedImages.length === 0) {
        throw new Error("The model did not generate an image. Please try adjusting your prompt.");
    }

    return generatedImages;

  } catch (error: any) {
    console.error("Gemini Image Gen Error:", error);
    throw error;
  }
};


// --- Real Estate Analysis Logic ---
export const analyzeDesign = async (
  apiKey: string | null,
  base64Image: string,
  marketContext: 'Ethiopian' | 'International'
): Promise<RealEstateAnalysis> => {
  const key = requireKey(apiKey);
  const ai = new GoogleGenAI({ apiKey: key });

  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  let contextPrompt = '';
  
  if (marketContext === 'Ethiopian') {
    contextPrompt = `
      MARKET CONTEXT: Ethiopian Real Estate (Addis Ababa).
      - Currency: ETB (Ethiopian Birr).
      - DATA SOURCE: You MUST search 'https://con.2merkato.com/am/prices' and other local Ethiopian real estate/construction sites to find real current prices for materials (cement, steel, finishing materials, labor).
      - Estimate value increase based on the booming construction market in Addis Ababa.
    `;
  } else {
    contextPrompt = `
      MARKET CONTEXT: International / Western Market (US/Europe).
      - Currency: USD ($).
      - DATA SOURCE: You MUST search 'HomeAdvisor', 'Houzz', and other reliable Western real estate databases for pricing.
    `;
  }

  // Strict JSON prompt without Schema config (as Search Tool is incompatible with responseSchema)
  const prompt = `
    Act as a senior Real Estate Appraiser and Contractor.
    Analyze the provided architectural/interior design image.
    
    ${contextPrompt}

    OUTPUT FORMAT:
    You must output strictly conformant JSON text. 
    Do NOT use Markdown code blocks (like \`\`\`json). 
    Just output the raw JSON string.

    JSON SCHEMA:
    {
      "description": "Professional marketing description (max 50 words)",
      "renovationTips": ["Tip 1", "Tip 2", "Tip 3"],
      "estimatedValueIncrease": "Percentage (e.g. +15%)",
      "costEstimate": "Range (e.g. $10,000 - $15,000 or ETB format)",
      "costBreakdown": [
        { "category": "Material/Labor Category", "cost": "Cost Estimate" },
        { "category": "Material/Labor Category", "cost": "Cost Estimate" },
        { "category": "Material/Labor Category", "cost": "Cost Estimate" }
      ]
    }
    
    Ensure 'costBreakdown' has at least 3 items.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
        ]
      },
      config: {
        // DO NOT set responseMimeType or responseSchema when using googleSearch
        tools: [{ googleSearch: {} }] // Enable Grounding
      }
    });

    // Extract Sources (Grounding)
    const sources: GroundingSource[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    let jsonStr = response.text || "{}";
    
    // Robust cleanup: Remove markdown code blocks if the model adds them despite instructions
    jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let data;
    try {
        data = JSON.parse(jsonStr);
    } catch (e) {
        // Attempt to extract JSON from text if parsing fails
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            data = JSON.parse(jsonMatch[0]);
        } else {
            throw e;
        }
    }

    return {
        ...data,
        marketContext,
        sources
    };

  } catch (e: any) {
    console.error("Gemini Analysis Error", e);
    throw new Error(`Analysis failed: ${e.message || "Unknown error"}`);
  }
};