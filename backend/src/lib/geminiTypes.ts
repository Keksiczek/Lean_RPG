export interface Gemini5SScore {
  Seiri: number;
  Seiton: number;
  Seiso: number;
  Seiketsu: number;
  Shitsuke: number;
}

export interface GeminiSubmissionAnalysis {
  feedback: string;
  score5s: Gemini5SScore;
  riskLevel: "low" | "medium" | "high";
}
