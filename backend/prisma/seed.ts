import { PrismaClient } from '@prisma/client';
import { problemSolvingChallenges } from './problemSolvingChallenges.js';

const prisma = new PrismaClient();

type SeedSkillNode = {
  name: string;
  description: string;
  category: string;
  tier: number;
  requiresXp: number;
  icon?: string;
  color?: string;
  shortTip?: string;
  unlockType?: string;
  requiresSkillNames?: string[];
};

async function seedSkills() {
  const skills = [
    { code: '5S', name: '5S', category: 'methodology', icon: '🧹' },
    { code: 'PS', name: 'Problem Solving', category: 'methodology', icon: '🧠' },
    { code: 'GEMBA', name: 'Gemba Walk', category: 'methodology', icon: '👟' },
    { code: 'KAIZEN', name: 'Kaizen', category: 'methodology', icon: '♻️' },
    { code: 'COMM', name: 'Communication', category: 'soft_skill', icon: '💬' },
  ];

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { code: skill.code },
      update: skill,
      create: skill,
    });
  }
}

async function seedSkillTree() {
  const tierColors: Record<number, string> = {
    1: '#22c55e',
    2: '#3b82f6',
    3: '#a855f7',
  };

  const skills: SeedSkillNode[] = [
    // Tier 1
    { name: 'SORT', description: 'Identify clutter and remove what is unnecessary.', category: '5S_MASTER', tier: 1, requiresXp: 50, icon: '🧹', shortTip: 'Eliminate what you do not need.', unlockType: 'xp' },
    { name: 'SET IN ORDER', description: 'Organize the workspace for flow.', category: '5S_MASTER', tier: 1, requiresXp: 75, icon: '🧭', shortTip: 'Everything has a clear place.', unlockType: 'xp', requiresSkillNames: ['SORT'] },
    { name: 'SHINE', description: 'Clean and maintain for quality.', category: '5S_MASTER', tier: 1, requiresXp: 75, icon: '✨', shortTip: 'Daily cleaning routines.', unlockType: 'xp', requiresSkillNames: ['SET IN ORDER'] },
    { name: 'STANDARDIZE', description: 'Create standards to sustain 5S.', category: '5S_MASTER', tier: 1, requiresXp: 100, icon: '📏', shortTip: 'Document the best way.', unlockType: 'xp', requiresSkillNames: ['SHINE'] },
    { name: 'SUSTAIN', description: 'Build culture to sustain improvements.', category: '5S_MASTER', tier: 1, requiresXp: 150, icon: '🔄', shortTip: 'Make 5S a habit.', unlockType: 'xp', requiresSkillNames: ['STANDARDIZE'] },
    { name: 'Visual Management', description: 'Understand how to use visuals to manage work.', category: 'GEMBA_MASTER', tier: 1, requiresXp: 50, icon: '👀', shortTip: 'Show status at a glance.', unlockType: 'xp' },
    { name: 'Respect for People', description: 'Practice respect during Gemba walks.', category: 'GEMBA_MASTER', tier: 1, requiresXp: 75, icon: '🤝', shortTip: 'Coach, do not blame.', unlockType: 'xp', requiresSkillNames: ['Visual Management'] },
    { name: 'Go See, Go Observe', description: 'Visit the floor and observe processes.', category: 'GEMBA_MASTER', tier: 1, requiresXp: 100, icon: '🚶', shortTip: 'See issues firsthand.', unlockType: 'xp', requiresSkillNames: ['Respect for People'] },
    { name: '5 Why Analysis', description: 'Dig into problems using the 5 Why technique.', category: 'PROBLEM_SOLVING', tier: 1, requiresXp: 75, icon: '❓', shortTip: 'Ask why until you find the root.', unlockType: 'xp' },
    { name: 'Root Cause Thinking', description: 'Develop root cause hypotheses.', category: 'PROBLEM_SOLVING', tier: 1, requiresXp: 100, icon: '🧠', shortTip: 'Separate symptoms from causes.', unlockType: 'xp', requiresSkillNames: ['5 Why Analysis'] },
    { name: 'PDCA Cycle', description: 'Plan-Do-Check-Act for continuous improvement.', category: 'PROBLEM_SOLVING', tier: 1, requiresXp: 150, icon: '♻️', shortTip: 'Iterate quickly.', unlockType: 'xp', requiresSkillNames: ['Root Cause Thinking'] },

    // Tier 2
    { name: 'Kaizen', description: 'Run small, focused improvement events.', category: 'PROCESS_IMPROVEMENT', tier: 2, requiresXp: 75, icon: '🛠️', shortTip: 'Small steps daily.', unlockType: 'xp', requiresSkillNames: ['PDCA Cycle'] },
    { name: 'Standard Work', description: 'Design stable processes with standard work.', category: 'PROCESS_IMPROVEMENT', tier: 2, requiresXp: 100, icon: '📘', shortTip: 'Consistency drives quality.', unlockType: 'xp', requiresSkillNames: ['STANDARDIZE'] },
    { name: 'Waste Identification', description: 'Spot the 8 wastes in processes.', category: 'PROCESS_IMPROVEMENT', tier: 2, requiresXp: 100, icon: '🗑️', shortTip: 'See and remove waste.', unlockType: 'xp', requiresSkillNames: ['Kaizen'] },
    { name: 'Value Stream Mapping', description: 'Map value streams to find flow issues.', category: 'PROCESS_IMPROVEMENT', tier: 2, requiresXp: 150, icon: '🗺️', shortTip: 'Visualize end-to-end flow.', unlockType: 'xp', requiresSkillNames: ['Waste Identification'] },
    { name: 'Ishikawa Mastery', description: 'Use fishbone diagrams to analyze causes.', category: 'ADVANCED_PROBLEM_SOLVING', tier: 2, requiresXp: 75, icon: '🐟', shortTip: 'Break down causes by category.', unlockType: 'xp', requiresSkillNames: ['Root Cause Thinking'] },
    { name: 'Statistical Analysis', description: 'Apply statistics to validate problems.', category: 'ADVANCED_PROBLEM_SOLVING', tier: 2, requiresXp: 100, icon: '📊', shortTip: 'Use data to confirm trends.', unlockType: 'xp', requiresSkillNames: ['Ishikawa Mastery'] },
    { name: 'FMEA', description: 'Failure Mode and Effects Analysis for risk.', category: 'ADVANCED_PROBLEM_SOLVING', tier: 2, requiresXp: 150, icon: '⚠️', shortTip: 'Prioritize risks early.', unlockType: 'xp', requiresSkillNames: ['Statistical Analysis'] },
    { name: 'Systemic Thinking', description: 'Recognize systems and dependencies.', category: 'ADVANCED_PROBLEM_SOLVING', tier: 2, requiresXp: 200, icon: '🛰️', shortTip: 'See the bigger picture.', unlockType: 'xp', requiresSkillNames: ['FMEA'] },
    { name: 'Active Listening', description: 'Listen deeply to teams.', category: 'LEADERSHIP', tier: 2, requiresXp: 75, icon: '👂', shortTip: 'Understand before reacting.', unlockType: 'xp' },
    { name: 'Feedback Culture', description: 'Create a culture of actionable feedback.', category: 'LEADERSHIP', tier: 2, requiresXp: 100, icon: '💬', shortTip: 'Share feedback with care.', unlockType: 'xp', requiresSkillNames: ['Active Listening'] },
    { name: 'Team Engagement', description: 'Engage teams in improvement.', category: 'LEADERSHIP', tier: 2, requiresXp: 150, icon: '🤝', shortTip: 'Co-create solutions.', unlockType: 'xp', requiresSkillNames: ['Feedback Culture'] },

    // Tier 3
    { name: 'DMAIC', description: 'Apply the DMAIC methodology.', category: 'LEAN_SIX_SIGMA', tier: 3, requiresXp: 200, icon: '📐', shortTip: 'Define, Measure, Analyze, Improve, Control.', unlockType: 'xp', requiresSkillNames: ['Systemic Thinking'] },
    { name: 'Statistical Thinking', description: 'Lead with statistical thinking.', category: 'LEAN_SIX_SIGMA', tier: 3, requiresXp: 200, icon: '📈', shortTip: 'Variation matters.', unlockType: 'xp', requiresSkillNames: ['Statistical Analysis'] },
    { name: 'Belt Certification Path', description: 'Unlock Lean Six Sigma belt path.', category: 'LEAN_SIX_SIGMA', tier: 3, requiresXp: 200, icon: '🥋', shortTip: 'Progress toward belt levels.', unlockType: 'xp', requiresSkillNames: ['DMAIC'] },
    { name: 'Hoshin Kanri', description: 'Deploy strategy with Hoshin.', category: 'LEADERSHIP_MASTERY', tier: 3, requiresXp: 200, icon: '🎯', shortTip: 'Align goals to execution.', unlockType: 'xp', requiresSkillNames: ['Team Engagement'] },
    { name: 'Daily Gemba', description: 'Run daily gemba routines.', category: 'LEADERSHIP_MASTERY', tier: 3, requiresXp: 200, icon: '📅', shortTip: 'Be present on the floor.', unlockType: 'xp', requiresSkillNames: ['Go See, Go Observe'] },
    { name: 'Coaching & Mentoring', description: 'Coach others to mastery.', category: 'LEADERSHIP_MASTERY', tier: 3, requiresXp: 250, icon: '🧭', shortTip: 'Grow your team.', unlockType: 'xp', requiresSkillNames: ['Hoshin Kanri'] },
    { name: 'TPM', description: 'Implement Total Productive Maintenance.', category: 'CI_EXPERT', tier: 3, requiresXp: 200, icon: '⚙️', shortTip: 'Empower operators to maintain.', unlockType: 'xp', requiresSkillNames: ['Value Stream Mapping'] },
    { name: 'Kanban Mastery', description: 'Optimize flow with Kanban.', category: 'CI_EXPERT', tier: 3, requiresXp: 200, icon: '🪧', shortTip: 'Pull beats push.', unlockType: 'xp', requiresSkillNames: ['Kaizen'] },
    { name: 'Supply Chain Optimization', description: 'Extend lean to the supply chain.', category: 'CI_EXPERT', tier: 3, requiresXp: 250, icon: '🚚', shortTip: 'Balance network flow.', unlockType: 'xp', requiresSkillNames: ['TPM'] },
  ];

  for (const skill of skills) {
    const baseData = {
      description: skill.description,
      category: skill.category,
      tier: skill.tier,
      requiresXp: skill.requiresXp,
      icon: skill.icon,
      color: skill.color ?? tierColors[skill.tier],
      shortTip: skill.shortTip,
      unlockType: skill.unlockType ?? 'xp',
      requiresSkills: [],
      learningResources: [],
      active: true,
    };

    await prisma.skillTreeNode.upsert({
      where: { name: skill.name },
      update: baseData,
      create: { ...baseData, name: skill.name },
    });
  }

  const createdSkills = await prisma.skillTreeNode.findMany({
    where: { name: { in: skills.map((skill) => skill.name) } },
  });

  const idByName = createdSkills.reduce<Record<string, number>>((acc, skill) => {
    acc[skill.name] = skill.id;
    return acc;
  }, {});

  for (const skill of skills) {
    const requiredSkillIds = (skill.requiresSkillNames || [])
      .map((name) => idByName[name])
      .filter((value): value is number => Boolean(value));

    await prisma.skillTreeNode.update({
      where: { name: skill.name },
      data: { requiresSkills: requiredSkillIds },
    });
  }
}

async function seedAreas() {
  const areas = [
    { name: 'Injection Molding', description: 'Core molding operations with focus on quality and takt time.' },
    { name: 'Assembly Line', description: 'Product assembly with standard work and visual management.' },
    { name: 'Paint Shop', description: 'Surface treatment and painting zone with safety emphasis.' },
  ];

  const records = [] as { id: number; name: string }[];

  for (const area of areas) {
    const existing = await prisma.area.findFirst({ where: { name: area.name } });

    if (existing) {
      const updated = await prisma.area.update({
        where: { id: existing.id },
        data: area,
      });
      records.push(updated);
    } else {
      const created = await prisma.area.create({ data: area });
      records.push(created);
    }
  }

  return records.reduce<Record<string, number>>((map, area) => {
    map[area.name] = area.id;
    return map;
  }, {});
}

async function seedProblemSolvingChallenges(areasByName: Record<string, number>) {
  for (const challenge of problemSolvingChallenges) {
    const areaId = areasByName[challenge.areaName];

    if (!areaId) {
      console.warn(`Skipping challenge ${challenge.title}: area ${challenge.areaName} not found`);
      continue;
    }

    await prisma.problemSolvingChallenge.upsert({
      where: { id: challenge.id },
      update: {
        title: challenge.title,
        description: challenge.description,
        context: challenge.context,
        areaId,
        difficulty: challenge.difficulty,
        baseXp: challenge.baseXp,
        correctRootCauseId: challenge.correctRootCauseId,
        correctCategories: challenge.correctCategories,
        possibleCauses: challenge.possibleCauses,
        correctSolution: challenge.correctSolution,
        status: 'active',
      },
      create: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        context: challenge.context,
        areaId,
        difficulty: challenge.difficulty,
        baseXp: challenge.baseXp,
        correctRootCauseId: challenge.correctRootCauseId,
        correctCategories: challenge.correctCategories,
        possibleCauses: challenge.possibleCauses,
        correctSolution: challenge.correctSolution,
        status: 'active',
      },
    });
  }
}

async function seedAuditTemplates(areasByName: Record<string, number>) {
  const templates = [
    {
      name: '5S Daily Audit',
      type: '5s',
      areaName: 'Assembly Line',
      items: ['Seiri', 'Seiton', 'Seiso', 'Seiketsu', 'Shitsuke'],
    },
    {
      name: 'LPA (Lean Process Audit)',
      type: 'lpa',
      areaName: 'Injection Molding',
      items: ['Safety', 'Quality', 'Delivery'],
    },
  ];

  for (const template of templates) {
    const areaId = template.areaName ? areasByName[template.areaName] : undefined;
    const existing = await prisma.auditTemplate.findFirst({ where: { name: template.name } });

    if (existing) {
      await prisma.auditItem.deleteMany({ where: { templateId: existing.id } });

      await prisma.auditTemplate.update({
        where: { id: existing.id },
        data: {
          type: template.type,
          areaId,
          items: {
            create: template.items.map((question) => ({ question })),
          },
        },
      });
    } else {
      await prisma.auditTemplate.create({
        data: {
          name: template.name,
          type: template.type,
          areaId,
          items: {
            create: template.items.map((question) => ({ question })),
          },
        },
      });
    }
  }
}

async function seedFiveSSettings(areasByName: Record<string, number>) {
  const injectionId = areasByName["Injection Molding"];

  if (!injectionId) return;

  const checklist = {
    name: "Injection Department 5S Checklist",
    areaId: injectionId,
    timeLimit: 300,
    sortCriteria: [
      {
        id: 1,
        question: "Vidíš zbytečné věci na stanicích?",
        hint: "Staré nářadí, obaly, papír, věci z jiných oddělení",
        points: 4,
      },
      {
        id: 2,
        question: "Nejsou nástroje z jiných stanic?",
        hint: "Může to vytvořit zmatek a zpomalení",
        points: 4,
      },
      {
        id: 3,
        question: "Je všechno na správném místě?",
        hint: "Vči standardu pracovního místa",
        points: 4,
      },
      {
        id: 4,
        question: "Vidíš praskliny nebo poškozená zařízení?",
        hint: "Bezpečnostní riziko",
        points: 4,
      },
      {
        id: 5,
        question: "Jsou kontrolní body jasně viditelné?",
        hint: "Čtverečky na podlaze, značky na nářadí",
        points: 4,
      },
    ],
    orderCriteria: [
      {
        id: 6,
        question: "Je vše na svém místě (location markers)?",
        hint: "Nářadí má svou polohu",
        points: 4,
      },
      {
        id: 7,
        question: "Jsou nářadí a materiály označeny?",
        hint: "Barevné štítky, shadow boards",
        points: 4,
      },
      {
        id: 8,
        question: "Jsou cesty a průchody volné?",
        hint: "Bez překážek a nepořádku",
        points: 4,
      },
      {
        id: 9,
        question: "Je jasné, kam patří odpady?",
        hint: "Označené koše a boxy",
        points: 4,
      },
    ],
    shineCriteria: [
      {
        id: 10,
        question: "Je podlaha čistá?",
        hint: "Bez oleje, úniků a prachu",
        points: 4,
      },
      {
        id: 11,
        question: "Jsou stroje bez nečistot?",
        hint: "Čisté povrchy a senzory",
        points: 4,
      },
      {
        id: 12,
        question: "Je pracovní plocha uklizená?",
        hint: "Bez zbytků materiálu",
        points: 4,
      },
      {
        id: 13,
        question: "Jsou úklidové nástroje dostupné?",
        hint: "Koště, utěrky, čistící prostředky",
        points: 4,
      },
    ],
    standardizeCriteria: [
      {
        id: 14,
        question: "Jsou vidět 5S pravidla (plakáty)?",
        hint: "Instrukce a checklisty",
        points: 4,
      },
      {
        id: 15,
        question: "Je odpovědnost jasně přiřazena?",
        hint: "Tabulky směn, ownership",
        points: 4,
      },
      {
        id: 16,
        question: "Jsou standardy aktuální?",
        hint: "Poslední revize a podpis",
        points: 4,
      },
      {
        id: 17,
        question: "Je kontrolní kolo pravidelné?",
        hint: "Denní 5S checklist",
        points: 4,
      },
    ],
    sustainCriteria: [
      {
        id: 18,
        question: "Drží se lidi pravidel?",
        hint: "Pozorování disciplíny",
        points: 4,
      },
      {
        id: 19,
        question: "Jsou akční plány uzavřené?",
        hint: "Splněné úkoly z posledního auditu",
        points: 4,
      },
      {
        id: 20,
        question: "Probíhá trénink nováčků?",
        hint: "Onboarding 5S",
        points: 4,
      },
      {
        id: 21,
        question: "Je trend skóre pozitivní?",
        hint: "Poslední výsledky",
        points: 4,
      },
    ],
    maxScore: 100,
    passingScore: 70,
    maxProblems: 5,
  };

  const existing = await prisma.fiveSSetting.findFirst({
    where: { areaId: checklist.areaId, name: checklist.name },
  });

  if (existing) {
    await prisma.fiveSSetting.update({ where: { id: existing.id }, data: checklist });
  } else {
    await prisma.fiveSSetting.create({ data: checklist });
  }
}

async function seedProgressions() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    const existing = await prisma.skillProgression.findUnique({ where: { userId: user.id } });
    if (!existing) {
      await prisma.skillProgression.create({
        data: {
          userId: user.id,
          totalXp: user.totalXp ?? 0,
          currentTier: user.totalXp >= 1500 ? 3 : user.totalXp >= 500 ? 2 : 1,
          tierUnlockedAt: { 1: new Date().toISOString() },
        },
      });
    }
  }
}

async function seedQuests() {
  const quests = [
    {
      title: "Welcome to Lean RPG",
      description: "Nauč se základy Lean methodologie a 5S.",
      briefText: "Tvá první mise. Poznáš světem Lean a začneš budovat své dovednosti.",
      baseXp: 50,
      difficulty: "easy",
      leanConcept: "5S",
      type: "story",
    },
    {
      title: "First 5S Audit",
      description: "Proveď svou první audit podle 5S - Sort, Set in order, Shine, Standardize, Sustain.",
      briefText: "Zkontroluj pracoviště a aplikuj principy 5S.",
      baseXp: 100,
      difficulty: "medium",
      leanConcept: "5S",
      type: "mission",
    },
    {
      title: "Identify Waste (Muda)",
      description: "Najdi druhy muda ve virtuálním procesu a navrhni zlepšení.",
      briefText: "Procvič si identifikaci plýtvání v procesu.",
      baseXp: 75,
      difficulty: "medium",
      leanConcept: "Muda",
      type: "challenge",
    },
    {
      title: "Problem Solving with 5 Why",
      description: "Řeš problém pomocí techniky 5 Why.",
      briefText: "Když se na lince objeví chyba, zjisti skutečnou příčinu.",
      baseXp: 80,
      difficulty: "medium",
      leanConcept: "Problem Solving",
      type: "challenge",
    },
    {
      title: "Master Kaizen Ideas",
      description: "Sbír a implementuj návrhy na zlepšení od týmu.",
      briefText: "Vede tým k nepřetržitému zlepšování skrz Kaizen.",
      baseXp: 120,
      difficulty: "hard",
      leanConcept: "Kaizen",
      type: "mission",
    },
  ];

  await prisma.quest.deleteMany({ where: { title: { in: quests.map((quest) => quest.title) } } });
  await prisma.quest.createMany({ data: quests });
}

async function main() {
  await seedSkills();
  const areasByName = await seedAreas();
  await seedAuditTemplates(areasByName);
  await seedFiveSSettings(areasByName);
  await seedQuests();
  await seedProblemSolvingChallenges(areasByName);
  await seedSkillTree();
  await seedProgressions();
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
