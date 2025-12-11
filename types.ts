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
  FLOOR_PLAN_3D = 'Floor Plan to 3D',
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
  originalImage: string | null; // Null if generated from blank
  generatedImages: string[]; // Array of Base64
  prompt: string;
  style: string;
  analysis?: RealEstateAnalysis;
  isPanorama?: boolean;
  isStereo?: boolean;
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

export interface DesignConfig {
  mode: DesignMode;
  style: string;
  subStyle?: string;
  roomType?: string;
  prompt: string;
  isStereo3D: boolean;
  isPanorama: boolean;
  isGenerateNew?: boolean;
  blueprintParams?: BlueprintParams;
}

export interface VideoSettings {
  mode: 'SINGLE' | 'SHOWCASE';
  duration: number; // Seconds
}