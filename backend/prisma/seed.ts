import { PrismaClient } from "@prisma/client";
import { randomInt } from "crypto";

const prisma = new PrismaClient();

export type AreaSeed = {
  name: string;
  workshopCount: number;
  description?: string;
};

export type FactorySeed = {
  name: string;
  description: string;
  type: string;
  areas: AreaSeed[];
};

const TENANT_SEED = {
  slug: "magna-nymburk",
  name: "Magna Exteriors (Bohemia) s.r.o.",
  description: "Automotive plastic injection molding, assembly, and painting facility",
  language: "cs",
  locale: "cs-CZ",
  timezone: "Europe/Prague",
  primaryColor: "#E31C23",
  secondaryColor: "#1F1F1F",
  leanMethodologies: ["5S", "LPA", "Safety"],
  logoUrl: "https://example.com/magna-logo.png",
};

const FACTORIES: FactorySeed[] = [
  {
    name: "Hala 1 - Vstřikovna a Montáž",
    type: "production",
    description: "Injection molding with assembly and packaging",
    areas: [
      { name: "Vstřikovna", workshopCount: 9, description: "Lisovna plastů" },
      { name: "Montáže", workshopCount: 12, description: "Finální montáže a balení" },
      { name: "Montáže Touran", workshopCount: 2, description: "Speciální linky Touran" },
      { name: "TU (Údržba)", workshopCount: 3, description: "Technická údržba" },
      { name: "Logistika", workshopCount: 2, description: "Interní logistika a zásobování" },
    ],
  },
  {
    name: "Hala 2+6 - Výroba a Lakovna",
    type: "production",
    description: "Injection molding, painting, and quality control",
    areas: [
      { name: "Vstřikovna", workshopCount: 6 },
      { name: "Lakovna (Pulír)", workshopCount: 3 },
      { name: "Kvalita", workshopCount: 2 },
      { name: "Logistika", workshopCount: 2 },
      { name: "Údržba", workshopCount: 2 },
    ],
  },
  {
    name: "Hala 3 - Výroba a Lakovna",
    type: "production",
    description: "Injection molding with painting and in-line quality gates",
    areas: [
      { name: "Vstřikovna", workshopCount: 6 },
      { name: "Lakovna (Pulír)", workshopCount: 3 },
      { name: "Kvalita", workshopCount: 2 },
      { name: "Montáž", workshopCount: 3 },
      { name: "Logistika", workshopCount: 2 },
    ],
  },
  {
    name: "Hala 4 - Vstřikovna",
    type: "production",
    description: "Focused injection molding hall",
    areas: [
      { name: "Vstřikovna", workshopCount: 6 },
      { name: "Kvalita", workshopCount: 1 },
    ],
  },
  {
    name: "Hala 5 - Výroba a Sklady",
    type: "production",
    description: "Final assembly, warehouse and outdoor staging tents",
    areas: [
      { name: "Výroba", workshopCount: 3 },
      { name: "Sklad a Expedice", workshopCount: 2 },
      { name: "Údržba", workshopCount: 1 },
    ],
  },
];

const FIVE_S_AUDITS = [
  {
    title: "5S Audit - Vstřikovna: Roztřídit",
    description: "Kontrola nepotřebného vybavení, nářadí a materiálu",
    difficulty: "medium",
    category: "5S",
    xpReward: 150,
    items: [
      {
        id: "5s-sort-1",
        name: "Na pracovišti není žádné nepotřebné/rozbité zařízení, nástroje, nářadí",
        status: "broken",
        correctAction: "remove",
      },
      {
        id: "5s-sort-2",
        name: "Na pracovišti nejsou nepotřebné zásoby nevýrobního materiálu - spreje, hadry, štítky",
        status: "dirty",
        correctAction: "remove",
      },
      {
        id: "5s-sort-3",
        name: "Na pracovišti nejsou osobní věci (klíče, telefon, bundy)",
        status: "misplaced",
        correctAction: "organize",
      },
      {
        id: "5s-sort-4",
        name: "Na pracovišti není nadbytečné množství obalů, dílů, komponentů",
        status: "clean",
        correctAction: "keep",
      },
      {
        id: "5s-sort-5",
        name: "Red-tag položky jsou jasně označeny a umístěny ve vyhrazené zóně",
        status: "misplaced",
        correctAction: "remove",
      },
    ],
  },
  {
    title: "5S Audit - Vstřikovna: Uspořádat",
    description: "Správné uspořádání nástrojů, šablon a materiálu",
    difficulty: "easy",
    category: "5S",
    xpReward: 140,
    items: [
      {
        id: "5s-order-1",
        name: "Shadowboard a přípravky jsou označené a doplněné",
        status: "misplaced",
        correctAction: "organize",
      },
      {
        id: "5s-order-2",
        name: "Podlahové značení (logistika, pěší trasy) je čitelné",
        status: "clean",
        correctAction: "keep",
      },
      {
        id: "5s-order-3",
        name: "Kanban/2-bin zásobníky jsou na správném místě a v požadovaném množství",
        status: "misplaced",
        correctAction: "organize",
      },
      {
        id: "5s-order-4",
        name: "Návody a standardy práce jsou u stroje dostupné a aktuální",
        status: "clean",
        correctAction: "keep",
      },
    ],
  },
  {
    title: "5S Audit - Vstřikovna: Uklidit",
    description: "Denní úklid, odstranění úniků a čisté povrchy",
    difficulty: "medium",
    category: "5S",
    xpReward: 150,
    items: [
      {
        id: "5s-shine-1",
        name: "Stroj a okolí bez olejových skvrn, zbytky granulátu odstraněny",
        status: "dirty",
        correctAction: "clean",
      },
      {
        id: "5s-shine-2",
        name: "Odsávání a filtry bez nánosů, pravidelná údržba zapsána",
        status: "clean",
        correctAction: "keep",
      },
      {
        id: "5s-shine-3",
        name: "Pracovní stoly a odkládací plochy jsou čisté a bez smetí",
        status: "dirty",
        correctAction: "clean",
      },
      {
        id: "5s-shine-4",
        name: "Čisticí prostředky a úklidové pomůcky jsou doplněny a označeny",
        status: "misplaced",
        correctAction: "organize",
      },
    ],
  },
  {
    title: "5S Audit - Vstřikovna: Standardizovat",
    description: "Dodržování standardů 5S a TPM na lisech",
    difficulty: "hard",
    category: "5S",
    xpReward: 170,
    items: [
      {
        id: "5s-std-1",
        name: "Denní 5S checklist vyplněn, odchylky jsou eskalované",
        status: "clean",
        correctAction: "keep",
      },
      {
        id: "5s-std-2",
        name: "TPM inspekční body (mazání, čištění) jsou splněny",
        status: "dirty",
        correctAction: "clean",
      },
      {
        id: "5s-std-3",
        name: "Značení nářadí, formy a přípravků odpovídá master listu",
        status: "misplaced",
        correctAction: "organize",
      },
      {
        id: "5s-std-4",
        name: "Andon/abnormity jsou viditelně označené s datem a zodpovědným",
        status: "broken",
        correctAction: "remove",
      },
    ],
  },
  {
    title: "5S Audit - Vstřikovna: Udržovat",
    description: "Kultura disciplíny, školení a pravidelné audity",
    difficulty: "medium",
    category: "5S",
    xpReward: 180,
    items: [
      {
        id: "5s-sustain-1",
        name: "Operátoři znají 5S standardy a podepsali školení",
        status: "clean",
        correctAction: "keep",
      },
      {
        id: "5s-sustain-2",
        name: "Poslední interní audit proběhl dle plánu, akce jsou uzavřené",
        status: "misplaced",
        correctAction: "organize",
      },
      {
        id: "5s-sustain-3",
        name: "Vizualizace KPI 5S/LPA na nástěnce je aktuální",
        status: "clean",
        correctAction: "keep",
      },
      {
        id: "5s-sustain-4",
        name: "Role a odpovědnosti (team leader, údržba, kvalita) jsou jasně dané",
        status: "clean",
        correctAction: "keep",
      },
      {
        id: "5s-sustain-5",
        name: "Odchylky se řeší pomocí A3/QRQC a jsou dohledatelné",
        status: "dirty",
        correctAction: "clean",
      },
    ],
  },
];

const LPA_TEMPLATES = [
  {
    title: "LPA - Vstřikovna: Bezpečnost",
    description: "Denní kontrola bezpečnosti a norem EMS",
    frequency: "Daily",
    xpReward: 100,
    questions: [
      {
        id: "lpa-safety-1",
        question: "Jsou všichni operátoři v OOPP (osobní ochranné pomůcky)?",
        category: "Safety",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-safety-2",
        question: "Jsou nouzové zastavovací tlačítka funkční a přístupná?",
        category: "Safety",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-safety-3",
        question: "Je záchytná vana pod hydraulickým systémem bez úniku?",
        category: "Safety",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-safety-4",
        question: "Jsou elektrické kabeláže nepoškozené a správně upevněné?",
        category: "Safety",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-safety-5",
        question: "Je přístup k hasicím přístrojům a únikovým cestám volný?",
        category: "Safety",
        correctAnswer: "Yes",
      },
    ],
  },
  {
    title: "LPA - Vstřikovna: Kvalita",
    description: "Rychlá kontrola kritických kvalitativních parametrů",
    frequency: "Daily",
    xpReward: 110,
    questions: [
      {
        id: "lpa-quality-1",
        question: "Procesní parametry (teplota, tlak, čas vstřiku) jsou v toleranci",
        category: "Quality",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-quality-2",
        question: "První kus a last-off jsou schváleny a uložené",
        category: "Quality",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-quality-3",
        question: "Poka-yoke senzory a kontrolní přípravky jsou funkční",
        category: "Quality",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-quality-4",
        question: "Reklamace/defekty z minulého směny jsou uzavřeny",
        category: "Quality",
        correctAnswer: "Yes",
      },
    ],
  },
  {
    title: "LPA - EMS a životní prostředí",
    description: "Kontrola environmentálních a odpadových požadavků",
    frequency: "Weekly",
    xpReward: 120,
    questions: [
      {
        id: "lpa-ems-1",
        question: "Třídění odpadu (plast, kov, směsný) probíhá podle označení",
        category: "EMS",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-ems-2",
        question: "Chemikálie a oleje jsou skladovány v záchytných vanách",
        category: "EMS",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-ems-3",
        question: "Nejsou viditelné úniky kapalin a všechny havarijní sady jsou doplněny",
        category: "EMS",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-ems-4",
        question: "Evidence odpadu a e-mailové hlášení je aktuální",
        category: "EMS",
        correctAnswer: "Yes",
      },
    ],
  },
  {
    title: "LPA - Týdenní hloubková kontrola",
    description: "Kombinovaná bezpečnostní a kvalitativní kontrola",
    frequency: "Weekly",
    xpReward: 150,
    questions: [
      {
        id: "lpa-weekly-1",
        question: "Standardní práce a vizualizace úloh jsou aktuální",
        category: "Quality",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-weekly-2",
        question: "PM plány na strojích jsou provedeny a zapsány",
        category: "Safety",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-weekly-3",
        question: "Zónování 5S (čistota, pořádek) splňuje cílový stav",
        category: "5S",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-weekly-4",
        question: "OOPP a ergonomie pracovních míst byly ověřeny",
        category: "Safety",
        correctAnswer: "Yes",
      },
      {
        id: "lpa-weekly-5",
        question: "Traceabilita materiálu a dílů odpovídá požadavkům OEM",
        category: "Quality",
        correctAnswer: "Yes",
      },
    ],
  },
];

function randomCoordinates() {
  return { x: randomInt(0, 101), y: randomInt(0, 101) };
}

async function createFactories(tenantId: string) {
  for (const factory of FACTORIES) {
    const createdFactory = await prisma.factoryConfiguration.create({
      data: {
        tenantId,
        name: factory.name,
        description: factory.description,
        type: factory.type,
        defaultChecklist: ["Bezpečnostní briefing", "5S vizuální kontrola"],
        fiveS_SortItems: ["Red-tag položky", "Nepoužívané přípravky"],
        fiveS_SetLocations: ["Shadowboard", "Kanban pozice"],
        fiveS_ShineAreas: ["Lisy", "Montážní stoly", "Logistické koridory"],
      },
    });

    const zones = await Promise.all(
      factory.areas.map((area) =>
        prisma.zone.create({
          data: {
            factoryId: createdFactory.id,
            name: area.name,
            coordinates: randomCoordinates(),
            status: "optimal",
          },
        })
      )
    );

    const zoneMap = new Map(zones.map((zone) => [zone.name, zone.id]));

    for (const area of factory.areas) {
      const targetZone = zoneMap.get(area.name);
      if (!targetZone) continue;

      const workshops = Array.from({ length: area.workshopCount }, (_, index) => ({
        factoryId: createdFactory.id,
        zoneId: targetZone,
        name: `${area.name} - Pracoviště ${index + 1}`,
        description: area.description ?? `${area.name} pracoviště ${index + 1}`,
        redTags: randomInt(0, 3),
        activeTraining: randomInt(0, 2),
      }));

      await prisma.workshop.createMany({ data: workshops });
    }
  }
}

async function createAudits(tenantId: string) {
  for (const template of FIVE_S_AUDITS) {
    await prisma.auditTemplate.create({
      data: {
        tenantId,
        title: template.title,
        description: template.description,
        difficulty: template.difficulty,
        category: template.category,
        items: template.items,
        xpReward: template.xpReward,
      },
    });
  }
}

async function createLpaTemplates(tenantId: string) {
  for (const template of LPA_TEMPLATES) {
    await prisma.lPATemplate.create({
      data: {
        tenantId,
        title: template.title,
        description: template.description,
        frequency: template.frequency,
        questions: template.questions,
        xpReward: template.xpReward,
      },
    });
  }
}

export async function seedMagnaTenant() {
  console.log("🧹 Clearing existing tenants...");
  await prisma.tenant.deleteMany();

  console.log("🏭 Creating Magna Exteriors Nymburk tenant...");
  const tenant = await prisma.tenant.create({ data: TENANT_SEED });

  console.log("🏗️  Creating factories, zones, and workshops...");
  await createFactories(tenant.id);

  console.log("🧾 Creating 5S audit templates...");
  await createAudits(tenant.id);

  console.log("✅ Creating LPA templates...");
  await createLpaTemplates(tenant.id);

  return tenant;
}

async function main() {
  try {
    await seedMagnaTenant();
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_SEED.slug },
      include: {
        factories: { include: { zones: true, workshops: true } },
        auditTemplates: true,
        lpaTemplates: true,
      },
    });

    console.log("\n✅ Seed data created:", tenant?.slug);
    console.log(`   - Factories: ${tenant?.factories.length ?? 0}`);
    console.log(`   - Total zones: ${tenant?.factories.reduce((s, f) => s + f.zones.length, 0) ?? 0}`);
    console.log(`   - Total workshops: ${tenant?.factories.reduce((s, f) => s + f.workshops.length, 0) ?? 0}`);
    console.log(`   - Audit templates: ${tenant?.auditTemplates.length ?? 0}`);
    console.log(`   - LPA templates: ${tenant?.lpaTemplates.length ?? 0}`);
  } catch (error) {
    console.error("❌ Failed to seed database", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes("seed.ts")) {
  main();
}
