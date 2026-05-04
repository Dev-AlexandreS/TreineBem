import { PrismaClient } from '@prisma/client';
import { defaultWeeklyPlan } from '../src/lib/storage/defaultPlan';

const prisma = new PrismaClient();

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

async function main() {
  const userId = process.argv[2] || process.env.SEED_USER_ID;

  if (!userId) {
    throw new Error(
      'No userId provided. Pass it as a CLI argument or set the SEED_USER_ID environment variable.\n' +
        'Usage: ts-node prisma/seed.ts <userId>'
    );
  }

  console.log(`Seeding default weekly plan for user: ${userId}`);

  for (const day of DAYS_OF_WEEK) {
    const dayPlan = defaultWeeklyPlan[day];

    // Upsert the weekly_plan row for this day
    const weeklyPlan = await prisma.weeklyPlan.upsert({
      where: {
        user_id_day_of_week: {
          user_id: userId,
          day_of_week: day,
        },
      },
      update: {
        day_type: dayPlan.dayType,
        ...(dayPlan.notes !== undefined ? { title: dayPlan.notes } : {}),
      },
      create: {
        user_id: userId,
        day_of_week: day,
        day_type: dayPlan.dayType,
        ...(dayPlan.notes !== undefined ? { title: dayPlan.notes } : {}),
      },
    });

    console.log(`  Upserted weekly_plan for ${day} (id: ${weeklyPlan.id})`);

    // Delete existing exercises for this day before re-creating them
    await prisma.exercise.deleteMany({
      where: { weekly_plan_id: weeklyPlan.id },
    });

    // Create all exercises for this day
    if (dayPlan.exercises.length > 0) {
      await prisma.exercise.createMany({
        data: dayPlan.exercises.map((exercise, index) => ({
          id: exercise.id,
          user_id: userId,
          weekly_plan_id: weeklyPlan.id,
          name: exercise.name,
          muscle_group: exercise.muscleGroup,
          planned_sets: exercise.plannedSets,
          planned_reps: exercise.plannedReps,
          planned_weight: exercise.plannedWeight ?? null,
          rest_seconds: exercise.restSeconds ?? null,
          notes: exercise.notes ?? null,
          order_index: index,
        })),
      });

      console.log(`    Created ${dayPlan.exercises.length} exercise(s) for ${day}`);
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
