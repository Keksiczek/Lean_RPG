export type FiveS = "seiri" | "seiton" | "seiso" | "seiketsu" | "shitsuke";

export interface AuditProblem {
  id: string;
  x: number;
  y: number;
  radius: number;
  category: FiveS;
  description: string;
}

export interface AuditScene {
  id: string;
  name: string;
  imageUrl: string;
  problems: AuditProblem[];
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
}

export interface AuditResult {
  sceneId: string;
  foundProblems: string[];
  categorization: Record<string, FiveS>;
  correctCategories: number;
  totalProblems: number;
  timeTaken: number;
  score: number;
  xpEarned: number;
}

export type AuditStatus = "idle" | "playing" | "finished" | "submitted";

export interface AuditState {
  currentScene: AuditScene | null;
  foundProblems: string[];
  categorization: Record<string, FiveS>;
  status: AuditStatus;
  timeRemaining: number;
  result: AuditResult | null;
  selectedProblem: string | null;

  startAudit: (scene: AuditScene) => void;
  toggleProblem: (problemId: string) => void;
  categorizeProblem: (problemId: string, category: FiveS) => void;
  finishAudit: () => Promise<AuditResult>;
  resetAudit: () => void;
  decrementTime: () => number;
}
