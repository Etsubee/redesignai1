
import { DesignMode } from './types';
import { LayoutDashboard, Trees, PencilRuler, FileText, Box, HardHat, Building, Zap, Map, PaintBucket, Plane, Sofa } from 'lucide-react';

export const APP_NAME = "Redesign Ai";

// --- SECURITY CONFIGURATION ---
export const ALLOWED_EMAILS: string[] = [];

export const ROOM_TYPES = [
  'Living Room', 'Bedroom', 'Kitchen', 'Office', 'Bathroom', 'Dining Room', 
  'Study', 'Home Gym', 'Kids Room', 'Walk-in Closet', 'Gaming Room'
];

export const MODE_CONFIG = {
  [DesignMode.INTERIOR]: { 
    icon: LayoutDashboard, 
    isPro: false, 
    styles: ['Modern', 'Contemporary', 'Minimalist', 'Luxury', 'Scandinavian', 'Industrial', 'Boho', 'Rustic', 'Mid-Century Modern', 'Farmhouse', 'Traditional', 'Historic', 'Art Deco', 'Coastal', 'Eco-Friendly', 'Futuristic', 'Japandi', 'Transitional', 'Room Decorator', 'Biophilic Design', 'Cyberpunk', 'Gothic Revival', 'Zen Minimalist', 'Steampunk', 'Maximalist', 'Southwestern', 'Shabby Chic', 'Hollywood Regency', 'Wabi-Sabi'] 
  },
  [DesignMode.FURNITURE_EDIT]: { 
    icon: Sofa, 
    isPro: false, 
    styles: ['Declutter (Room Cleaner)', 'Remove Furniture', 'Replace Furniture', 'Add Furniture', 'Furniture Design', 'Furniture Edit', 'Vintage Restoration', 'Smart Furniture Integration', 'Ergonomic Office Setup', 'Pet-Friendly Furniture', 'Space-Saving Multifunctional', 'Luxury Velvet Set', 'Rattan & Wicker', 'Glass & Acrylic', 'Antique Woodwork', 'Futuristic Pods'] 
  },
  [DesignMode.OUTDOOR]: { 
    icon: Trees, 
    isPro: false, 
    styles: ['Modern Outdoor', 'Tropical', 'Zen Garden', 'Mediterranean', 'Cottage Garden', 'Xeriscape', 'English Formal Garden', 'Japanese Stone Garden', 'Rooftop Terrace Oasis', 'Vertical Garden', 'Luxury Poolside Resort', 'Outdoor Kitchen', 'Desert Landscape', 'Modern Facade Upgrade', 'Curb Appeal Makeover'] 
  },
  [DesignMode.SKETCH_TO_RENDER]: { 
    icon: PencilRuler, 
    isPro: false, 
    styles: [
      'Photorealistic Render', 
      '3D Isometric Model', 
      '3D Dollhouse View', 
      'Sectional 3D Cutaway', 
      'Technical Blueprint Render', 
      'Sketch to Render', 
      'Watercolor Illustration', 
      'Oil Painting Style', 
      'Charcoal Technical Sketch', 
      'Vaporwave Aesthetic', 
      'Conceptual Architecture'
    ] 
  },
  [DesignMode.BLUEPRINT]: { 
    icon: FileText, 
    isPro: false, 
    styles: ['Room Planner', 'Optimized Layout', 'Open Concept', 'Functional Zones', 'Space Efficient', 'Electrical Schematic', 'Plumbing Layout', 'HVAC Plan', 'Structural Grid'] 
  },
  [DesignMode.UNDER_CONSTRUCTION]: { 
    icon: HardHat, 
    isPro: false, 
    styles: ['Modern Finished Look', 'Luxury Finished Look', 'Industrial Finished Look', 'Completed Brick Facade', 'Fully Painted & Furnished'] 
  },
  [DesignMode.ARCHITECTURAL]: { 
    icon: Building, 
    isPro: false, 
    styles: ['Optimize Flow', 'Maximize Space', 'Brutalism', 'Parametric Design', 'Bauhaus', 'Sustainable Green Architecture', 'Organic Architecture'] 
  },
  [DesignMode.ELECTRICAL]: { 
    icon: Zap, 
    isPro: false, 
    styles: ['Residential', 'Commercial', 'Smart Home', 'Energy Efficient', 'Solar Integration', 'IoT Automation Grid'] 
  },
  [DesignMode.CITY]: { 
    icon: Map, 
    isPro: false, 
    styles: ['Corridor Development Ethiopian', 'Modern Urban', 'Sustainable Eco-City', 'Smart City', 'Futuristic', 'European Classic', 'Middle Eastern', 'American Suburban', 'Cyberpunk Metropolis', 'More Green Parks and Fountains'] 
  },
  [DesignMode.RENOVATION]: { 
    icon: PaintBucket, 
    isPro: false, 
    styles: ['Modern Renovation', 'Historic Restoration', 'Facade Improvement', 'Eco Renovation', 'Luxury Upgrade', 'Open Concept Conversion'] 
  },
  [DesignMode.AERIAL]: { 
    icon: Plane, 
    isPro: false, 
    styles: ['Corridor Development Ethiopian', 'Urban Modernization', 'Smart City', 'Green City', 'Density & Zoning', 'Future Vision', '3D Massing', 'Drone Photography Style'] 
  },
};

export const DEFAULT_PROMPTS = {
  [DesignMode.INTERIOR]: "Redesign this room to be a masterpeice of interior design. ",
  [DesignMode.OUTDOOR]: "Transform this outdoor space into a beautiful landscape. ",
  [DesignMode.CITY]: "Urban planning visualization, futuristic and green. ",
  [DesignMode.FURNITURE_EDIT]: "Edit the furniture in this room: ",
  [DesignMode.SKETCH_TO_RENDER]: "Convert this 2D input into a high-fidelity 3D visualization. ",
};

export const MOCK_ANALYSIS_DATA = {
  description: "A stunning transformation that maximizes space utilization while introducing modern aesthetics.",
  renovationTips: ["Install recessed lighting", "Replace flooring with hardwood", "Update fixtures to brushed nickel"],
  estimatedValueIncrease: "12-15%",
  costEstimate: "$15,000 - $22,000",
  marketContext: 'International'
};
