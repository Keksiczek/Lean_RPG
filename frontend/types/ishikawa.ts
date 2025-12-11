export type IshikawaCategoryType = "6M" | "8P";

export type IshikawaCategoryName =
  | "man"
  | "machine"
  | "material"
  | "method"
  | "measurement"
  | "environment"
  | "people"
  | "place";

export interface IshikawaProblem {
  id: string;
  title: string;
  description: string;
  category: "manufacturing" | "service";
  difficulty: "easy" | "medium" | "hard";
}

export interface IshikawaCause {
  id: string;
  category: IshikawaCategoryName;
  text: string;
  details?: string;
}

export interface IshikawaSolution {
  id: string;
  title: string;
  description: string;
  relatedCauses: string[]; // cause IDs
  implementationSteps: string[];
  expectedImpact: number; // 0-100
  difficulty: "easy" | "medium" | "hard";
  estimatedCost: "low" | "medium" | "high";
  priority: number; // 1-10
}

export interface IshikawaResult {
  problemId: string;
  causes: IshikawaCause[];
  solutions: IshikawaSolution[];
  score: number; // 0-1000
  xpEarned: number; // 0-500
  completedAt: Date;
}

export interface IshikawaState {
  currentProblem: IshikawaProblem | null;
  causes: IshikawaCause[];
  solutions: IshikawaSolution[];
  categoryType: IshikawaCategoryType;
  status: "idle" | "building" | "analyzing" | "completed";
  result: IshikawaResult | null;

  // Methods
  selectProblem: (problem: IshikawaProblem) => void;
  setCategoryType: (type: IshikawaCategoryType) => void;
  addCause: (category: IshikawaCategoryName, text: string) => void;
  removeCause: (causeId: string) => void;
  generateSolutions: () => Promise<IshikawaSolution[]>;
  submitAnalysis: () => Promise<IshikawaResult>;
  reset: () => void;
}
