
export enum WorkflowStep {
  SCENARIO_INPUT = 'SCENARIO_INPUT',
  CONCEPT_REVIEW = 'CONCEPT_REVIEW',
  FINAL_GENERATION = 'FINAL_GENERATION',
  LIBRARY = 'LIBRARY'
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";

// 扩展分类，涵盖品牌视角和个人视角
export type ContentCategory = 
  | 'PRO' | 'TESTIMONIAL' | 'PROMO' // 品牌视角
  | 'LIFE_AESTHETIC' | 'LIFE_THOUGHT' | 'LIFE_DAILY'; // 个人视角

export interface UserPersona {
  id?: string;
  name?: string; // 人设模板名称
  identity: string;
  traits: string[];
  background: string;
  isSystem?: boolean; // 是否为系统内置
}

export interface PersonaCategory {
  id: ContentCategory;
  name: string;
  description: string;
  icon: string;
  group: 'BRAND' | 'PERSONAL';
}

export interface LibraryItem {
  id: string;
  type: 'manual' | 'generated';
  copy: string;
  imageUrl?: string;
  category?: string;
  createdAt: number;
}

export interface Draft {
  label: string;
  copy: string;
  visualSuggestion: string;
  commentScript: string;
}

export interface GeneratedConcept {
  drafts: Draft[];
  referenceImage?: string | null;
  selectedCategory?: string;
  userPersona?: UserPersona;
}

export interface GenerationResult {
  imageUrl: string;
  copy: string;
}
