'use server';
import { prisma } from '@/lib/prisma';

export async function createUserRecord(id: string, email: string, name: string) {
  await prisma.user.upsert({
    where: { id },
    update: { email, name },
    create: { id, email, name },
  });
}
