import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

type QuestSeed = {
  code: string;
  title: string;
  description: string;
  leanConcept: string;
  story: string;
  objectives: unknown[];
  difficulty: string;
  xpReward: number;
  timeEstimate: string;
  skillUnlock?: string;
  area?: string;
};

const DEFAULT_QUESTS: QuestSeed[] = [
  {
    code: "QUEST_5S_INTRO",
    title: "Kickstart 5S",
    description: "Organize a workstation using 5S principles",
    leanConcept: "5S",
    story: "A cluttered bench is slowing output. Lead the team through Sort, Set in Order, Shine, Standardize, and Sustain.",
    objectives: [
      { description: "Identify red-tag items", points: 10 },
      { description: "Create a shadow board layout", points: 15 },
    ],
    difficulty: "easy",
    xpReward: 50,
    timeEstimate: "2h",
    skillUnlock: "5S-BASICS",
    area: "Assembly",
  },
  {
    code: "QUEST_PS_FISHBONE",
    title: "Fishbone Investigation",
    description: "Lead an Ishikawa analysis for recurring defects",
    leanConcept: "Problem Solving",
    story: "Defects keep appearing in the painting booth. Facilitate a root-cause workshop using the 6M categories.",
    objectives: [
      { description: "Collect evidence on the last 3 defects", points: 10 },
      { description: "Map potential causes on a fishbone diagram", points: 15 },
    ],
    difficulty: "medium",
    xpReward: 90,
    timeEstimate: "3h",
    skillUnlock: "PROBLEM-SOLVING",
    area: "Painting",
  },
  {
    code: "QUEST_KAIZEN_BLITZ",
    title: "Kaizen Blitz",
    description: "Rapid improvement sprint on the injection molding cell",
    leanConcept: "Kaizen",
    story: "Cycle time is drifting upward. Run a two-day blitz to stabilize the cell and document standard work.",
    objectives: [
      { description: "Capture current-state process steps", points: 10 },
      { description: "Implement one poka-yoke idea", points: 20 },
      { description: "Publish updated standard work", points: 20 },
    ],
    difficulty: "hard",
    xpReward: 140,
    timeEstimate: "1d",
    skillUnlock: "KAIZEN",
    area: "Injection Molding",
  },
];

async function seedUsers() {
  const users = [
    { email: "admin@example.com", name: "Admin", role: "admin" },
    { email: "player1@example.com", name: "Player One", role: "operator" },
    { email: "player2@example.com", name: "Player Two", role: "operator" },
  ];

  const passwordHash = await bcrypt.hash("Password123!", 10);

  console.log(`👥 Seeding ${users.length} users...`);
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        password: passwordHash,
      },
    });
  }
}

async function seedAreas() {
  const areas = [
    {
      name: "Injection Molding",
      description: "Plastic component fabrication line",
    },
    {
      name: "Assembly",
      description: "Mechanical assembly and torque operations",
    },
    {
      name: "Painting",
      description: "Powder coating and finishing area",
    },
  ];

  console.log(`📍 Seeding ${areas.length} areas...`);
  for (const area of areas) {
    await prisma.area.upsert({
      where: { name: area.name },
      update: { description: area.description },
      create: area,
    });
  }
}

async function seedQuests() {
  const questsPath = path.join(__dirname, "../src/data/quests.json");

  let questsData: QuestSeed[] = DEFAULT_QUESTS;

  if (fs.existsSync(questsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(questsPath, "utf-8"));
      questsData = Array.isArray(parsed) ? parsed : DEFAULT_QUESTS;
    } catch (error) {
      console.warn("⚠️  Failed to parse quests.json, using defaults...", error);
    }
  } else {
    console.warn("⚠️  quests.json not found, using default quest seeds...");
  }

  const areas = await prisma.area.findMany();
  const areaMap = new Map(areas.map((area) => [area.name, area.id]));

  console.log(`📚 Seeding ${questsData.length} quests...`);

  for (const quest of questsData) {
    const created = await prisma.quest.upsert({
      where: { code: quest.code },
      update: {
        title: quest.title,
        description: quest.description,
        leanConcept: quest.leanConcept,
        story: quest.story,
        objectives: JSON.stringify(quest.objectives),
        difficulty: quest.difficulty,
        xpReward: quest.xpReward,
        timeEstimate: quest.timeEstimate,
        skillUnlock: quest.skillUnlock || null,
        areaId: areaMap.get(quest.area || "") || null,
      },
      create: {
        code: quest.code,
        title: quest.title,
        description: quest.description,
        leanConcept: quest.leanConcept,
        story: quest.story,
        objectives: JSON.stringify(quest.objectives),
        difficulty: quest.difficulty,
        xpReward: quest.xpReward,
        timeEstimate: quest.timeEstimate,
        skillUnlock: quest.skillUnlock || null,
        areaId: areaMap.get(quest.area || "") || null,
      },
    });

    console.log(`  ✅ ${created.code}`);
  }
}

async function seedSkills() {
  const skills = [
    { code: "5S-BASICS", name: "5S Basics", category: "Lean Foundations", icon: "🧹" },
    { code: "PROBLEM-SOLVING", name: "Problem Solving", category: "Lean Foundations", icon: "🧠" },
    { code: "KAIZEN", name: "Kaizen", category: "Continuous Improvement", icon: "✨" },
    { code: "SMED", name: "SMED", category: "Flow", icon: "⏱️" },
    { code: "KANBAN", name: "Kanban", category: "Flow", icon: "🪧" },
    { code: "POKA-YOKE", name: "Poka-Yoke", category: "Quality", icon: "✅" },
    { code: "ROOT-CAUSE", name: "Root Cause Analysis", category: "Quality", icon: "🌱" },
    { code: "GEMBA", name: "Gemba Walk", category: "Leadership", icon: "🚶" },
    { code: "ANDON", name: "Andon Response", category: "Flow", icon: "🚨" },
    { code: "STANDARD-WORK", name: "Standard Work", category: "Stability", icon: "📘" },
    { code: "TPM", name: "TPM Basics", category: "Maintenance", icon: "🛠️" },
  ];

  console.log(`🛠️  Seeding ${skills.length} skills...`);
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { code: skill.code },
      update: skill,
      create: skill,
    });
  }
}

async function seedSkillTree() {
  const nodes = [
    {
      name: "Lean Explorer",
      description: "Understand basic lean terminology",
      category: "Foundation",
      tier: 1,
      requiresXp: 0,
      unlockType: "xp",
      shortTip: "Start with fundamentals",
      xpBonus: 10,
    },
    {
      name: "5S Champion",
      description: "Implement 5S in a pilot area",
      category: "5S",
      tier: 1,
      requiresXp: 50,
      unlockType: "quest",
      shortTip: "Win the audit",
      xpBonus: 25,
      badgeUnlock: "BADGE_5S_INITIATOR",
    },
    {
      name: "Problem Solver",
      description: "Lead an Ishikawa analysis",
      category: "Quality",
      tier: 2,
      requiresXp: 120,
      unlockType: "quest",
      shortTip: "Map your causes",
      xpBonus: 30,
    },
    {
      name: "Kaizen Facilitator",
      description: "Plan a Kaizen blitz",
      category: "Improvement",
      tier: 2,
      requiresXp: 200,
      unlockType: "quest",
      shortTip: "Small steps matter",
      xpBonus: 45,
    },
    {
      name: "Flow Architect",
      description: "Design a Kanban flow",
      category: "Flow",
      tier: 3,
      requiresXp: 320,
      unlockType: "quest",
      shortTip: "Balance demand",
      xpBonus: 60,
    },
    {
      name: "Zero Defect Mindset",
      description: "Deploy poka-yoke",
      category: "Quality",
      tier: 3,
      requiresXp: 420,
      unlockType: "quest",
      shortTip: "Prevent errors",
      xpBonus: 70,
      badgeUnlock: "BADGE_POKA_YOKE",
    },
    {
      name: "Gemba Coach",
      description: "Lead gemba coaching rounds",
      category: "Leadership",
      tier: 3,
      requiresXp: 500,
      unlockType: "quest",
      shortTip: "Observe the work",
      xpBonus: 80,
    },
  ];

  console.log(`🌳 Seeding ${nodes.length} skill tree nodes...`);
  const created = [] as { id: number; name: string }[];
  for (const node of nodes) {
    const result = await prisma.skillTreeNode.upsert({
      where: { name: node.name },
      update: node,
      create: { ...node, requiresSkills: [] },
    });
    created.push({ id: result.id, name: result.name });
  }

  const dependencyMap: Record<string, string[]> = {
    "Problem Solver": ["Lean Explorer"],
    "Kaizen Facilitator": ["Problem Solver"],
    "Flow Architect": ["Kaizen Facilitator", "5S Champion"],
    "Zero Defect Mindset": ["Problem Solver"],
    "Gemba Coach": ["Flow Architect"],
  };

  for (const node of created) {
    const requires = dependencyMap[node.name];
    if (!requires) continue;

    const requiredIds = requires
      .map((name) => created.find((entry) => entry.name === name)?.id)
      .filter((id): id is number => typeof id === "number");

    await prisma.skillTreeNode.update({
      where: { id: node.id },
      data: { requiresSkills: requiredIds },
    });
  }
}

async function seedAuditTemplates() {
  const area = await prisma.area.findFirst({ where: { name: "Assembly" } });

  const templates = [
    {
      name: "5S Daily Walk",
      type: "5S",
      areaId: area?.id,
      items: [
        { question: "Sort: only needed items present", weight: 2 },
        { question: "Shine: area clean", weight: 1 },
        { question: "Sustain: standards visible", weight: 2 },
      ],
    },
    {
      name: "LPA - Safety",
      type: "LPA",
      areaId: area?.id,
      items: [
        { question: "PPE used correctly", weight: 2 },
        { question: "Safety devices operational", weight: 2 },
      ],
    },
    {
      name: "LPA - Quality",
      type: "LPA",
      areaId: area?.id,
      items: [
        { question: "Critical to quality checks completed", weight: 3 },
        { question: "Defect tagging in place", weight: 1 },
      ],
    },
    {
      name: "TPM Autonomous",
      type: "TPM",
      areaId: area?.id,
      items: [
        { question: "Lubrication done", weight: 1 },
        { question: "Clean to inspect", weight: 1 },
      ],
    },
    {
      name: "5S Weekly",
      type: "5S",
      areaId: area?.id,
      items: [
        { question: "Shadow boards labeled", weight: 1 },
        { question: "Red tag area reviewed", weight: 1 },
      ],
    },
  ];

  console.log(`📝 Seeding ${templates.length} audit templates...`);
  for (const template of templates) {
    const createdTemplate = await prisma.auditTemplate.upsert({
      where: { name: template.name },
      update: { type: template.type, areaId: template.areaId },
      create: {
        name: template.name,
        type: template.type,
        areaId: template.areaId,
      },
    });

    for (const item of template.items) {
      const existingItem = await prisma.auditItem.findFirst({
        where: { templateId: createdTemplate.id, question: item.question },
      });

      if (existingItem) {
        await prisma.auditItem.update({
          where: { id: existingItem.id },
          data: { weight: item.weight },
        });
      } else {
        await prisma.auditItem.create({
          data: {
            templateId: createdTemplate.id,
            question: item.question,
            weight: item.weight,
          },
        });
      }
    }
  }
}

async function seedBadges() {
  const badges = Array.from({ length: 21 }).map((_, index) => ({
    code: `BADGE_${index + 1}`,
    name: `Badge ${index + 1}`,
    description: "Earned for demonstrating lean excellence",
    unlockType: "quest",
    unlockCondition: { type: "quest_complete", value: index + 1 },
    xpReward: 10 + index,
    rarity: index % 5 === 0 ? "legendary" : index % 3 === 0 ? "rare" : "common",
    tier: Math.min(5, Math.floor(index / 4) + 1),
  }));

  badges.push({
    code: "BADGE_5S_INITIATOR",
    name: "5S Initiator",
    description: "Completed first 5S audit",
    unlockType: "audit",
    unlockCondition: { type: "audit", template: "5S" },
    xpReward: 50,
    rarity: "rare",
    tier: 2,
  });

  badges.push({
    code: "BADGE_POKA_YOKE",
    name: "Poka-Yoke Champion",
    description: "Implemented an error-proofing device",
    unlockType: "project",
    unlockCondition: { type: "poka_yoke" },
    xpReward: 80,
    rarity: "epic",
    tier: 3,
  });

  console.log(`🏅 Seeding ${badges.length} badges...`);
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge,
    });
  }
}

async function seedAchievements() {
  const achievements = Array.from({ length: 15 }).map((_, index) => ({
    code: `ACH_${index + 1}`,
    name: `Achievement ${index + 1}`,
    description: "Milestone reached in learning journey",
    type: index % 2 === 0 ? "progress" : "skill",
    targetValue: 10 + index,
    trackingField: index % 2 === 0 ? "questsCompleted" : "skillsUnlocked",
    xpReward: 15 + index,
    difficulty: index > 10 ? "hard" : index > 5 ? "medium" : "easy",
    category: index % 2 === 0 ? "general" : "skills",
  }));

  console.log(`🎯 Seeding ${achievements.length} achievements...`);
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement,
    });
  }
}

async function seedLeaderboardStats() {
  const users = await prisma.user.findMany({ take: 3, orderBy: { id: "asc" } });

  console.log("📊 Seeding leaderboard stats...");
  for (const [index, user] of users.entries()) {
    await prisma.leaderboardStats.upsert({
      where: { userId: user.id },
      update: {
        globalRank: index + 1,
        globalRankChange: 0,
        bestSkillRank: index + 2,
        bestSkillCode: "5S-BASICS",
        totalAudits: 5 * (index + 1),
        totalProblems: 3 * (index + 1),
        questStreak: 2 + index,
        maxStreak: 4 + index,
        xpPerDay: 12.5 + index,
        xpTrend: "rising",
      },
      create: {
        userId: user.id,
        globalRank: index + 1,
        globalRankChange: 0,
        bestSkillRank: index + 2,
        bestSkillCode: "5S-BASICS",
        totalAudits: 5 * (index + 1),
        totalProblems: 3 * (index + 1),
        questStreak: 2 + index,
        maxStreak: 4 + index,
        xpPerDay: 12.5 + index,
        xpTrend: "rising",
      },
    });
  }
}

async function seedMultiTenantDemo() {
  console.log("🏭 Seeding multi-tenant demo tenants...");

  await prisma.tenant.upsert({
    where: { slug: "skoda-mlada-boleslav" },
    update: {},
    create: {
      id: "skoda-tenant",
      slug: "skoda-mlada-boleslav",
      name: "Škoda Mladá Boleslav",
      description: "Automotive manufacturing facility in Czech Republic",
      language: "cs",
      locale: "cs-CZ",
      defaultTheme: "light",
      leanMethodologies: ["5S", "LPA", "Ishikawa"],
      primaryColor: "#00AA44",
      secondaryColor: "#003366",
      timezone: "Europe/Prague",
      logoUrl: "https://example.com/skoda-logo.png",
      factories: {
        create: [
          {
            name: "Assembly Line A",
            type: "production",
            description: "Main assembly line for chassis welding",
            defaultChecklist: [
              "Safety equipment available",
              "Work area clean",
              "Tools in shadow boards",
              "No trip hazards",
              "First piece inspection done",
            ],
            fiveS_SortItems: ["Tools", "Raw material", "Fixtures"],
            fiveS_SetLocations: ["Shadow boards", "Material racks"],
            fiveS_ShineAreas: ["Work area", "Walkways"],
            zones: {
              create: [
                {
                  name: "Welding Zone",
                  coordinates: { x: 20, y: 30 },
                  status: "warning",
                },
                {
                  name: "Assembly Zone",
                  coordinates: { x: 50, y: 40 },
                  status: "optimal",
                },
              ],
            },
            workshops: {
              create: [
                { name: "Welding Station 1", description: "Robot welding" },
                { name: "Welding Station 2", description: "Manual welding" },
                { name: "Assembly Station", description: "Component assembly" },
              ],
            },
            auditTemplates: {
              create: [
                {
                  title: "Welding Station 5S Audit",
                  description: "Identify waste and organization issues in welding area",
                  difficulty: "medium",
                  category: "5S",
                  xpReward: 250,
                  items: [
                    { id: "item-1", name: "Broken welding rod", status: "broken", correctAction: "remove" },
                    { id: "item-2", name: "Oil spill on floor", status: "dirty", correctAction: "clean" },
                    { id: "item-3", name: "Welding curtain", status: "clean", correctAction: "keep" },
                    { id: "item-4", name: "Loose cables", status: "misplaced", correctAction: "organize" },
                  ],
                },
                {
                  title: "Paint Shop Organization Audit",
                  description: "Check cleanliness and proper material storage",
                  difficulty: "medium",
                  category: "5S",
                  xpReward: 200,
                  items: [
                    { id: "item-5", name: "Empty paint cans", status: "broken", correctAction: "remove" },
                    { id: "item-6", name: "Spilled paint on shelf", status: "dirty", correctAction: "clean" },
                  ],
                },
              ],
            },
          },
          {
            name: "Paint Shop",
            type: "production",
            description: "Paint and finishing",
            defaultChecklist: [
              "Ventilation filters checked",
              "Paints stored in fireproof cabinet",
              "PPE available at entrance",
              "Waste disposal proper",
            ],
            fiveS_SortItems: ["Solvents", "Paint cans"],
            fiveS_SetLocations: ["Storage cabinets"],
            fiveS_ShineAreas: ["Spray booth"],
            zones: {
              create: [
                { name: "Spray Booth", coordinates: { x: 70, y: 50 }, status: "optimal" },
              ],
            },
            workshops: {
              create: [
                { name: "Spray Booth 1" },
                { name: "Spray Booth 2" },
              ],
            },
            auditTemplates: {
              create: [
                {
                  title: "Paint Booth 5S Audit",
                  description: "Check ventilation, PPE and organization",
                  difficulty: "medium",
                  category: "5S",
                  xpReward: 200,
                  items: [
                    { id: "item-7", name: "Ventilation filters", status: "clean", correctAction: "keep" },
                    { id: "item-8", name: "Open solvent bottle", status: "misplaced", correctAction: "organize" },
                  ],
                },
              ],
            },
          },
        ],
      },
      lpaTemplates: {
        create: [
          {
            title: "Daily Welding Station Check",
            description: "Verify safety and process compliance",
            frequency: "Daily",
            xpReward: 150,
            questions: [
              { id: "q1", question: "Is welding curtain fully closed?", category: "Safety", correctAnswer: "Yes" },
              { id: "q2", question: "Are current and voltage settings correct?", category: "Process", correctAnswer: "Yes" },
              { id: "q3", question: "Is fume extraction system active?", category: "Safety", correctAnswer: "Yes" },
            ],
          },
          {
            title: "Weekly Paint Shop LPA",
            description: "Deep dive into paint application standards",
            frequency: "Weekly",
            xpReward: 300,
            questions: [
              { id: "q4", question: "Are paints stored in fireproof cabinet?", category: "Safety", correctAnswer: "Yes" },
              { id: "q5", question: "Is spray technique following standard work?", category: "Process", correctAnswer: "Yes" },
            ],
          },
        ],
      },
    },
  });

  await prisma.tenant.upsert({
    where: { slug: "novartis-pharma" },
    update: {},
    create: {
      id: "novartis-tenant",
      slug: "novartis-pharma",
      name: "Novartis Pharmaceutical",
      description: "Pharmaceutical manufacturing - GMP compliance required",
      language: "en",
      locale: "en-US",
      defaultTheme: "light",
      leanMethodologies: ["5S", "LPA"],
      primaryColor: "#0066CC",
      secondaryColor: "#FF6600",
      timezone: "Europe/Zurich",
      factories: {
        create: [
          {
            name: "Tablet Manufacturing",
            type: "production",
            description: "Tablet compression and packaging",
            defaultChecklist: [
              "Cleanroom airflow active",
              "Materials properly labeled",
              "Calibration stickers valid",
              "No unauthorized materials present",
            ],
            fiveS_SortItems: ["Ingredients", "Tools"],
            fiveS_SetLocations: ["Weighing room storage", "Cleanroom cabinets"],
            fiveS_ShineAreas: ["Compression area", "QC Lab"],
            zones: {
              create: [
                { name: "Compression Area", coordinates: { x: 30, y: 40 }, status: "optimal" },
                { name: "Quality Control", coordinates: { x: 70, y: 50 }, status: "optimal" },
              ],
            },
            workshops: {
              create: [
                { name: "Compression Machine 1" },
                { name: "Compression Machine 2" },
                { name: "QC Lab Station" },
              ],
            },
          },
        ],
      },
      lpaTemplates: {
        create: [
          {
            title: "GMP Compliance Check",
            description: "Daily verification of Good Manufacturing Practice",
            frequency: "Daily",
            xpReward: 200,
            questions: [
              { id: "gmp1", question: "Is cleanroom airflow active and verified?", category: "Safety", correctAnswer: "Yes" },
              { id: "gmp2", question: "Are all materials properly labeled with batch numbers?", category: "Quality", correctAnswer: "Yes" },
              { id: "gmp3", question: "Has first piece inspection been completed?", category: "Quality", correctAnswer: "Yes" },
            ],
          },
        ],
      },
    },
  });
}

async function main() {
  try {
    console.log("🌱 Starting seed...");

    await seedUsers();
    await seedAreas();
    await seedQuests();
    await seedSkills();
    await seedSkillTree();
    await seedAuditTemplates();
    await seedBadges();
    await seedAchievements();
    await seedMultiTenantDemo();
    await seedLeaderboardStats();

    console.log("🎉 Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
