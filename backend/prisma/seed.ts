import { PrismaClient } from '@prisma/client';
import { problemSolvingChallenges } from './problemSolvingChallenges.js';

const prisma = new PrismaClient();

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
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
