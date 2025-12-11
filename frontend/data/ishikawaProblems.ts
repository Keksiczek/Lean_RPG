import type { IshikawaProblem } from "@/types/ishikawa";

export const ISHIKAWA_PROBLEMS: IshikawaProblem[] = [
  {
    id: "defect-rate",
    title: "High Defect Rate in Assembly Line",
    description:
      "The assembly line is producing parts with 15% defect rate, up from 5% last year",
    category: "manufacturing",
    difficulty: "medium",
  },
  {
    id: "production-delay",
    title: "Production Timeline Delays",
    description:
      "Manufacturing projects consistently miss deadlines by 10-20 days",
    category: "manufacturing",
    difficulty: "hard",
  },
  {
    id: "equipment-breakdown",
    title: "Frequent Equipment Breakdowns",
    description:
      "Key machinery fails 2-3 times per month, causing production stoppages",
    category: "manufacturing",
    difficulty: "medium",
  },
  {
    id: "service-wait",
    title: "Long Customer Wait Times",
    description:
      "Service desk customers wait 30+ minutes on average before being served",
    category: "service",
    difficulty: "easy",
  },
  {
    id: "quality-inconsistent",
    title: "Inconsistent Product Quality",
    description:
      "Different production batches have significantly different quality levels",
    category: "manufacturing",
    difficulty: "hard",
  },
];
