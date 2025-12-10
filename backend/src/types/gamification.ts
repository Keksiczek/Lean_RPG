export type GameCompletionResponse<T extends Record<string, any> = Record<string, any>> = T & {
  xpEarned: number;
  achievementsProgressed: number;
  badgesUnlocked: number;
  badges: {
    id: number;
    code: string;
    name: string;
    icon?: string | null;
    xpReward: number;
  }[];
};
