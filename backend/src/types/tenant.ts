export interface TenantConfig {
  tenant: {
    id: string;
    slug: string;
    name: string;
    language: string;
    locale: string;
    defaultTheme: 'light' | 'dark';
    leanMethodologies: string[];
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    timezone: string;
  };
  factories: FactoryConfigDetail[];
  auditTemplates: AuditTemplate[];
  lpaTemplates: LPATemplate[];
  skillTree?: SkillConfig[];
  achievements?: AchievementConfig[];
}

export interface FactoryConfigDetail {
  id: string;
  name: string;
  description?: string;
  type: 'production' | 'logistics' | 'quality' | 'office';
  zones: {
    id: string;
    name: string;
    coordinates: { x: number; y: number };
  }[];
  workshops: {
    id: string;
    name: string;
    description?: string;
  }[];
  defaultChecklist: string[];
  fiveS_SortItems?: string[];
  fiveS_SetLocations?: string[];
  fiveS_ShineAreas?: string[];
}

export interface AuditTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: '5S' | 'LPA' | 'Ishikawa';
  items: {
    id: string;
    name: string;
    status: 'clean' | 'dirty' | 'misplaced' | 'broken';
    correctAction: 'keep' | 'remove' | 'clean' | 'organize';
  }[];
  xpReward: number;
}

export interface LPATemplate {
  id: string;
  title: string;
  description: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  questions: {
    id: string;
    question: string;
    category: 'Safety' | 'Quality' | 'Process' | 'Material';
    correctAnswer: 'Yes' | 'No';
  }[];
  xpReward: number;
}

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  xpRequired: number;
}

export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  criteria: string;
}
