import { DesignMode } from './types';
import { LayoutDashboard, Trees, PencilRuler, FileText, Box, HardHat, Building, Zap, Map, PaintBucket, Plane, Sofa } from 'lucide-react';

export const APP_NAME = "Redesign Ai";

export const ROOM_TYPES = [
  'Living Room', 'Bedroom', 'Kitchen', 'Office', 'Bathroom', 'Dining Room', 
  'Study', 'Home Gym', 'Kids Room', 'Walk-in Closet', 'Gaming Room'
];

export const MODE_CONFIG = {
  [DesignMode.INTERIOR]: { 
    icon: LayoutDashboard, 
    isPro: false, 
    styles: [
      'Modern', 
      'Contemporary', 
      'Minimalist', 
      'Luxury', 
      'Scandinavian', 
      'Industrial', 
      'Boho', 
      'Rustic', 
      'Mid-Century Modern', 
      'Farmhouse', 
      'Traditional', 
      'Historic', 
      'Art Deco', 
      'Coastal', 
      'Eco-Friendly', 
      'Futuristic', 
      'Japandi', 
      'Transitional',
      'Room Decorator'
    ] 
  },
  [DesignMode.FURNITURE_EDIT]: { 
    icon: Sofa, 
    isPro: false, 
    styles: ['Declutter (Room Cleaner)', 'Remove Furniture', 'Replace Furniture', 'Add Furniture', 'Furniture Design', 'Furniture Edit'] 
  },
  [DesignMode.OUTDOOR]: { 
    icon: Trees, 
    isPro: false, 
    styles: ['Modern Outdoor', 'Tropical', 'Zen Garden', 'Mediterranean', 'Cottage Garden'] 
  },
  [DesignMode.SKETCH_TO_RENDER]: { 
    icon: PencilRuler, 
    isPro: false, 
    styles: ['Sketch to Render', 'Photorealistic', 'Watercolor', 'Oil Painting', '3D Render'] 
  },
  [DesignMode.BLUEPRINT]: { 
    icon: FileText, 
    isPro: false, 
    styles: ['Room Planner', 'Optimized Layout', 'Open Concept', 'Functional Zones', 'Space Efficient'] 
  },
  [DesignMode.FLOOR_PLAN_3D]: { 
    icon: Box, 
    isPro: false, 
    styles: ['Isometric', 'Top-Down Perspective'] 
  },
  [DesignMode.UNDER_CONSTRUCTION]: { 
    icon: HardHat, 
    isPro: false, 
    styles: ['Modern Finish', 'Minimalist Finish', 'Luxury Finish', 'Industrial Finish', 'Traditional Finish'] 
  },
  [DesignMode.ARCHITECTURAL]: { 
    icon: Building, 
    isPro: false, 
    styles: ['Optimize Flow', 'Maximize Space', 'Modern Layout', 'Functional Zones'] 
  },
  [DesignMode.ELECTRICAL]: { 
    icon: Zap, 
    isPro: false, 
    styles: ['Residential', 'Commercial', 'Smart Home', 'Energy Efficient'] 
  },
  [DesignMode.CITY]: { 
    icon: Map, 
    isPro: false, 
    styles: ['Modern Urban', 'Sustainable Eco-City', 'Smart City', 'Futuristic', 'European Classic', 'Middle Eastern', 'American Suburban', 'Minimalist Public', 'High-Density Urban'] 
  },
  [DesignMode.RENOVATION]: { 
    icon: PaintBucket, 
    isPro: false, 
    styles: ['Modern Renovation', 'Historic Restoration', 'Facade Improvement', 'Eco Renovation', 'Luxury Upgrade', 'Minimalist Reno', 'Colorful Makeover', 'Glass & Steel'] 
  },
  [DesignMode.AERIAL]: { 
    icon: Plane, 
    isPro: false, 
    styles: ['Urban Modernization', 'Smart City', 'Green City', 'Density & Zoning', 'More Buildings', 'Future Vision', 'Transport Optimization', 'City Beautification', '3D Massing'] 
  },
};

export const DEFAULT_PROMPTS = {
  [DesignMode.INTERIOR]: "Redesign this room to be a masterpeice of interior design. ",
  [DesignMode.OUTDOOR]: "Transform this outdoor space into a beautiful landscape. ",
  [DesignMode.CITY]: "Urban planning visualization, futuristic and green. ",
  [DesignMode.FURNITURE_EDIT]: "Edit the furniture in this room: ",
};

export const MOCK_ANALYSIS_DATA = {
  description: "A stunning transformation that maximizes space utilization while introducing modern aesthetics.",
  renovationTips: ["Install recessed lighting", "Replace flooring with hardwood", "Update fixtures to brushed nickel"],
  estimatedValueIncrease: "12-15%",
  costEstimate: "$15,000 - $22,000",
  marketContext: 'International'
};