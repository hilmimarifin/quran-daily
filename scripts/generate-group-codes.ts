// Script to generate group codes for existing groups that don't have one
// Run with: npx ts-node --skip-project scripts/generate-group-codes.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateUniqueGroupCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const existing = await prisma.group.findUnique({
      where: { group_code: code },
    });

    if (!existing) {
      return code;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique group code');
}

async function main() {
  console.log('Finding groups without codes...');

  const groupsWithoutCodes = await prisma.group.findMany({
    where: {
      group_code: null,
      deleted_at: null,
    },
  });

  console.log(`Found ${groupsWithoutCodes.length} groups without codes`);

  for (const group of groupsWithoutCodes) {
    const code = await generateUniqueGroupCode();
    await prisma.group.update({
      where: { id: group.id },
      data: { group_code: code },
    });
    console.log(`Generated code ${code} for group "${group.name}" (${group.id})`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
