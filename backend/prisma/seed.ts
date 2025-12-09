import { PrismaClient } from '@prisma/client';

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

async function main() {
  await seedSkills();
  const areasByName = await seedAreas();
  await seedAuditTemplates(areasByName);
}

main()
  .catch((error) => {
    console.error('Seeding error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
