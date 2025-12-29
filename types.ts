
export enum UserTier {
  FREE = 'Free',
  PRO = 'Pro'
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
  tier: UserTier;
}

export enum DesignMode {
  INTERIOR = 'Interior Design',
  OUTDOOR = 'Outdoor Design',
  FURNITURE_EDIT = 'Furniture & Objects',
  SKETCH_TO_RENDER = 'Sketch-to-Render',
  BLUEPRINT = 'Blueprint',
  UNDER_CONSTRUCTION = 'Under Construction',
  ARCHITECTURAL = 'Architectural',
  ELECTRICAL = 'Electrical Planning',
  CITY = 'City Planning',
  RENOVATION = 'Renovation',
  AERIAL = 'Aerial View',
}

export interface Project {
  id: string;
  timestamp: number;
  mode: DesignMode;
  originalImage: string | null;
  generatedImages: string[];
  prompt: string;
  style: string;
  analysis?: RealEstateAnalysis;
  isPanorama?: boolean;
  isStereo?: boolean;
  is3DModel?: boolean;
}

export interface CostItem {
  category: string;
  cost: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface RealEstateAnalysis {
  description: string;
  renovationTips: string[];
  estimatedValueIncrease: string;
  costEstimate: string;
  costBreakdown: CostItem[];
  marketContext: 'Ethiopian' | 'International';
  sources: GroundingSource[];
}

export interface BlueprintParams {
  area: number;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  kitchens: number;
  diningRooms: number;
  offices: number;
  garages: number;
}

export type AreaGenerationMode = 'style' | 'prompt' | 'both';

export interface MaskedArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  prompt: string;
  style: string;
  generationMode: AreaGenerationMode;
}

export type RenderFormat = 'Landscape' | 'Panoramic' | 'A0 Poster' | 'A1 Poster' | 'A2 Poster' | 'A3 Poster' | 'Standard';

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

export interface DesignConfig {
  mode: DesignMode;
  style: string;
  subStyle?: string;
  roomType?: string;
  prompt: string;
  isStereo3D: boolean;
  isPanorama: boolean;
  is3DModel: boolean;
  isGenerateNew?: boolean;
  blueprintParams?: BlueprintParams;
  maskedAreas?: MaskedArea[];
  boundarySketch?: string;
  renderFormat?: RenderFormat;
  location?: LocationData;
  cityPlanningStrategy?: 'USER_INPUT' | 'AI_RECOMMENDED';
}

export interface VideoSettings {
  mode: 'SINGLE' | 'SHOWCASE';
  duration: number;
}
