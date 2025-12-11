import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function seedQuests() {
  const questsPath = path.join(__dirname, "../src/data/quests.json");
  const questsData = JSON.parse(fs.readFileSync(questsPath, "utf-8"));

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
      },
    });

    console.log(`  ✅ ${created.code}`);
  }

  console.log(`✅ All ${questsData.length} quests seeded successfully`);
}

async function main() {
  try {
    console.log("🌱 Starting seed...");

    await seedQuests();

    console.log("🎉 Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
