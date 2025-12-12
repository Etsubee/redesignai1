import { DesignMode } from './types';
import { LayoutDashboard, Trees, PencilRuler, FileText, Box, HardHat, Building, Zap, Map, PaintBucket, Plane, Sofa } from 'lucide-react';

export const APP_NAME = "Redesign Ai";

// --- SECURITY CONFIGURATION ---
// Add specific Gmail addresses here to restrict access. 
// If this array is empty [], ANYONE with a Google account can log in.
// Example: ['myemail@gmail.com', 'admin@redesignai.com']
export const ALLOWED_EMAILS: string[] = [
  // "your-email@gmail.com", 
];

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
      'Room Decorator',
      // Added
      'Biophilic Design',
      'Cyberpunk',
      'Gothic Revival',
      'Zen Minimalist',
      'Steampunk',
      'Maximalist',
      'Southwestern',
      'Shabby Chic',
      'Hollywood Regency',
      'Wabi-Sabi'
    ] 
  },
  [DesignMode.FURNITURE_EDIT]: { 
    icon: Sofa, 
    isPro: false, 
    styles: [
      'Declutter (Room Cleaner)', 
      'Remove Furniture', 
      'Replace Furniture', 
      'Add Furniture', 
      'Furniture Design', 
      'Furniture Edit',
      // Added
      'Vintage Restoration',
      'Smart Furniture Integration',
      'Ergonomic Office Setup',
      'Pet-Friendly Furniture',
      'Space-Saving Multifunctional',
      'Luxury Velvet Set',
      'Rattan & Wicker',
      'Glass & Acrylic',
      'Antique Woodwork',
      'Futuristic Pods'
    ] 
  },
  [DesignMode.OUTDOOR]: { 
    icon: Trees, 
    isPro: false, 
    styles: [
      'Modern Outdoor', 
      'Tropical', 
      'Zen Garden', 
      'Mediterranean', 
      'Cottage Garden',
      // Added
      'Xeriscape (Drought Tolerant)',
      'English Formal Garden',
      'Japanese Stone Garden',
      'Rooftop Terrace Oasis',
      'Vertical Garden (Green Wall)',
      'Luxury Poolside Resort',
      'Outdoor Kitchen & Dining',
      'Desert Landscape',
      'French Palace Garden',
      'Wildflower Meadow',
      // New Renovation Styles
      'Modern Facade Upgrade',
      'Curb Appeal Makeover',
      'Patio & Deck Extension',
      'Exterior Cladding & Siding',
      'Driveway & Walkway Pavers',
      'Front Porch Renovation',
      'Pergola & Gazebo Structure',
      'Outdoor Lighting Architecture',
      'Pool Hardscaping & Coping',
      'Fence & Gate Modernization'
    ] 
  },
  [DesignMode.SKETCH_TO_RENDER]: { 
    icon: PencilRuler, 
    isPro: false, 
    styles: [
      'Sketch to Render', 
      'Photorealistic', 
      'Watercolor', 
      'Oil Painting', 
      '3D Render',
      // Added
      'Charcoal Sketch',
      'Blueprint Style',
      'Vaporwave Aesthetic',
      'Anime Background',
      'Claymation / Plasticine',
      'Unreal Engine 5 Render',
      'Line Art',
      'Concept Art',
      'Technical Drawing',
      'Pop Art'
    ] 
  },
  [DesignMode.BLUEPRINT]: { 
    icon: FileText, 
    isPro: false, 
    styles: [
      'Room Planner', 
      'Optimized Layout', 
      'Open Concept', 
      'Functional Zones', 
      'Space Efficient',
      // Added
      'Electrical Schematic',
      'Plumbing Layout',
      'HVAC Plan',
      'Structural Grid',
      'Landscape Blueprint',
      'Fire Safety Plan',
      'Lighting Plan',
      'Accessibility (ADA) Plan',
      'Security System Layout',
      'Network & Data Cabling'
    ] 
  },
  [DesignMode.FLOOR_PLAN_3D]: { 
    icon: Box, 
    isPro: false, 
    styles: [
      'Isometric', 
      'Top-Down Perspective',
      // Added
      'Dollhouse View',
      'First Person Walkthrough',
      'Sectional Cut',
      'Wireframe 3D',
      'Textured Realistic',
      'Low Poly Style',
      'Voxel Art',
      'Glass Walls Transparency',
      'Night Mode Lighting',
      'Exploded Axonometric'
    ] 
  },
  [DesignMode.UNDER_CONSTRUCTION]: { 
    icon: HardHat, 
    isPro: false, 
    styles: [
      'Modern Finished Look', 
      'Minimalist Finished Look', 
      'Luxury Finished Look', 
      'Industrial Finished Look', 
      'Traditional Finished Look',
      'Completed Brick Facade',
      'Completed Timber Frame',
      'Finished Concrete Structure',
      'Fully Painted & Furnished',
      'Completed Commercial Exterior',
      'Completed Residential Exterior',
      'Finished Roof & Siding',
      'Completed Landscaping & Driveway'
    ] 
  },
  [DesignMode.ARCHITECTURAL]: { 
    icon: Building, 
    isPro: false, 
    styles: [
      'Optimize Flow', 
      'Maximize Space', 
      'Modern Layout', 
      'Functional Zones',
      // Added
      'Brutalism',
      'Parametric Design',
      'Bauhaus',
      'Deconstructivism',
      'Neoclassical',
      'Sustainable Green Architecture',
      'Shipping Container Architecture',
      'Tiny House Movement',
      'Geodesic Domes',
      'Organic Architecture'
    ] 
  },
  [DesignMode.ELECTRICAL]: { 
    icon: Zap, 
    isPro: false, 
    styles: [
      'Residential', 
      'Commercial', 
      'Smart Home', 
      'Energy Efficient',
      // Added
      'Solar Power Integration',
      'Industrial Wiring',
      'IoT Automation Grid',
      'Mood Lighting Design',
      'Emergency Lighting',
      'Data Center Cooling',
      'Home Theater Wiring',
      'Outdoor Landscape Lighting',
      'EV Charging Station',
      'Off-Grid System'
    ] 
  },
  [DesignMode.CITY]: { 
    icon: Map, 
    isPro: false, 
    styles: [
      'Modern Urban', 
      'Sustainable Eco-City', 
      'Smart City', 
      'Futuristic', 
      'European Classic', 
      'Middle Eastern', 
      'American Suburban', 
      'Minimalist Public', 
      'High-Density Urban',
      // Added
      'Cyberpunk Metropolis',
      'Steampunk City',
      'Floating Water City',
      'Underground Bunker City',
      'Mars Colony',
      'Medieval Townscape',
      'Venetian Canals',
      'Garden City Concept',
      'Megastructure',
      'Post-Apocalyptic Overgrowth'
    ] 
  },
  [DesignMode.RENOVATION]: { 
    icon: PaintBucket, 
    isPro: false, 
    styles: [
      'Modern Renovation', 
      'Historic Restoration', 
      'Facade Improvement', 
      'Eco Renovation', 
      'Luxury Upgrade', 
      'Minimalist Reno', 
      'Colorful Makeover', 
      'Glass & Steel',
      // Added
      'Open Concept Conversion',
      'Attic Loft Conversion',
      'Basement Finishing',
      'Kitchen Island Addition',
      'Bathroom Spa Upgrade',
      'Smart Home Retrofit',
      'Energy Efficiency Upgrade',
      'Garage to ADU',
      'Exterior Cladding Update',
      'Period-Correct Restoration'
    ] 
  },
  [DesignMode.AERIAL]: { 
    icon: Plane, 
    isPro: false, 
    styles: [
      'Urban Modernization', 
      'Smart City', 
      'Green City', 
      'Density & Zoning', 
      'More Buildings', 
      'Future Vision', 
      'Transport Optimization', 
      'City Beautification', 
      '3D Massing',
      // Added
      'Satellite View Enhancement',
      'Drone Photography Style',
      'Night Skyline',
      'Thermal Imaging Map',
      'Topographic Map',
      'Traffic Flow Analysis',
      'Flood Risk Zone',
      'Vegetation Density Map',
      'Urban Heat Island',
      'Infrastructure Overlay'
    ] 
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