import { Project, UserTier } from '../types';

const KEYS = {
  API_KEY: 'redesign_ai_api_key',
  PROJECTS: 'redesign_ai_projects',
  USER_TIER: 'redesign_ai_user_tier'
};

export const getApiKey = (uid?: string | null): string | null => {
  if (uid) {
    return localStorage.getItem(`${KEYS.API_KEY}_${uid}`);
  }
  return localStorage.getItem(KEYS.API_KEY);
};

export const setApiKey = (key: string, uid?: string | null) => {
  if (uid) {
    localStorage.setItem(`${KEYS.API_KEY}_${uid}`, key);
  } else {
    localStorage.setItem(KEYS.API_KEY, key);
  }
};

export const removeApiKey = (uid?: string | null) => {
  if (uid) {
    localStorage.removeItem(`${KEYS.API_KEY}_${uid}`);
  } else {
    localStorage.removeItem(KEYS.API_KEY);
  }
};

export const saveProject = (project: Project) => {
  const projects = getProjects();
  projects.unshift(project);
  
  try {
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
  } catch (e) {
    // Basic fallback: if storage is actually full (Browser limit ~5MB-10MB), remove oldest to save new
    if (projects.length > 1) {
       projects.shift(); // Remove the new one first to reset
       const projectsRetry = getProjects();
       projectsRetry.pop(); // Remove oldest
       projectsRetry.unshift(project);
       localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projectsRetry));
    }
  }
};

export const getProjects = (): Project[] => {
  const str = localStorage.getItem(KEYS.PROJECTS);
  return str ? JSON.parse(str) : [];
};

export const deleteProject = (id: string) => {
  const projects = getProjects().filter(p => p.id !== id);
  localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
};

export const getUserTier = (): UserTier => {
  return (localStorage.getItem(KEYS.USER_TIER) as UserTier) || UserTier.FREE;
};

export const setUserTier = (tier: UserTier) => {
  localStorage.setItem(KEYS.USER_TIER, tier);
};

export const getStorageUsage = (): number => {
  // Approximate bytes
  let total = 0;
  for (const x in localStorage) {
    total += (localStorage[x as keyof Storage].length * 2);
  }
  return total / 1024 / 1024; // MB
};