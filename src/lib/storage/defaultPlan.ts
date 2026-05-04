import type { WeeklyPlan } from '@/types';

/**
 * Default weekly plan (Requirement 11.1).
 * Exercise IDs are stable hardcoded strings so they remain consistent across app restarts.
 */
export const defaultWeeklyPlan: WeeklyPlan = {
  // ── Segunda-feira: Peito + Tríceps + Cardio ──────────────────────────────
  monday: {
    dayType: 'workout',
    exercises: [
      {
        id: 'default-mon-001',
        name: 'Supino reto',
        muscleGroup: 'chest',
        plannedSets: 3,
        plannedReps: '10–12',
      },
      {
        id: 'default-mon-002',
        name: 'Supino inclinado',
        muscleGroup: 'chest',
        plannedSets: 3,
        plannedReps: '10–12',
      },
      {
        id: 'default-mon-003',
        name: 'Crucifixo',
        muscleGroup: 'chest',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-mon-004',
        name: 'Crossover',
        muscleGroup: 'chest',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-mon-005',
        name: 'Tríceps corda',
        muscleGroup: 'triceps',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-mon-006',
        name: 'Tríceps banco',
        muscleGroup: 'triceps',
        plannedSets: 3,
        plannedReps: '10–12',
      },
      {
        id: 'default-mon-007',
        name: 'Cardio 20–30min',
        muscleGroup: 'cardio',
        plannedSets: 1,
        plannedReps: '20–30min',
      },
    ],
  },

  // ── Terça-feira: Costas + Bíceps + Cardio ────────────────────────────────
  tuesday: {
    dayType: 'workout',
    exercises: [
      {
        id: 'default-tue-001',
        name: 'Puxada na frente',
        muscleGroup: 'back',
        plannedSets: 3,
        plannedReps: '10–12',
      },
      {
        id: 'default-tue-002',
        name: 'Remada máquina',
        muscleGroup: 'back',
        plannedSets: 3,
        plannedReps: '10–12',
      },
      {
        id: 'default-tue-003',
        name: 'Remada baixa',
        muscleGroup: 'back',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-tue-004',
        name: 'Pull-over/Pulldown',
        muscleGroup: 'back',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-tue-005',
        name: 'Rosca direta',
        muscleGroup: 'biceps',
        plannedSets: 3,
        plannedReps: '10–12',
      },
      {
        id: 'default-tue-006',
        name: 'Rosca alternada',
        muscleGroup: 'biceps',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-tue-007',
        name: 'Cardio 20–30min',
        muscleGroup: 'cardio',
        plannedSets: 1,
        plannedReps: '20–30min',
      },
    ],
  },

  // ── Quarta-feira: Luta ───────────────────────────────────────────────────
  wednesday: {
    dayType: 'fight',
    exercises: [],
    notes: 'Aula de luta',
  },

  // ── Quinta-feira: Perna + Cardio ─────────────────────────────────────────
  thursday: {
    dayType: 'workout',
    exercises: [
      {
        id: 'default-thu-001',
        name: 'Agachamento',
        muscleGroup: 'legs',
        plannedSets: 3,
        plannedReps: '10–12',
      },
      {
        id: 'default-thu-002',
        name: 'Leg press',
        muscleGroup: 'legs',
        plannedSets: 3,
        plannedReps: '10–12',
      },
      {
        id: 'default-thu-003',
        name: 'Cadeira extensora',
        muscleGroup: 'legs',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-thu-004',
        name: 'Cadeira flexora',
        muscleGroup: 'legs',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-thu-005',
        name: 'Panturrilha',
        muscleGroup: 'legs',
        plannedSets: 3,
        plannedReps: '15–20',
      },
      {
        id: 'default-thu-006',
        name: 'Cardio 20–25min',
        muscleGroup: 'cardio',
        plannedSets: 1,
        plannedReps: '20–25min',
      },
    ],
  },

  // ── Sexta-feira: Ombro + Abdômen + Cardio ────────────────────────────────
  friday: {
    dayType: 'workout',
    exercises: [
      {
        id: 'default-fri-001',
        name: 'Elevação lateral',
        muscleGroup: 'shoulder',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-fri-002',
        name: 'Desenvolvimento',
        muscleGroup: 'shoulder',
        plannedSets: 3,
        plannedReps: '10–12',
      },
      {
        id: 'default-fri-003',
        name: 'Elevação frontal',
        muscleGroup: 'shoulder',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-fri-004',
        name: 'Encolhimento',
        muscleGroup: 'shoulder',
        plannedSets: 3,
        plannedReps: '12–15',
      },
      {
        id: 'default-fri-005',
        name: 'Abdominal',
        muscleGroup: 'abs',
        plannedSets: 3,
        plannedReps: '15–20',
      },
      {
        id: 'default-fri-006',
        name: 'Prancha',
        muscleGroup: 'abs',
        plannedSets: 3,
        plannedReps: '30–40s',
      },
      {
        id: 'default-fri-007',
        name: 'Cardio 20–30min',
        muscleGroup: 'cardio',
        plannedSets: 1,
        plannedReps: '20–30min',
      },
    ],
  },

  // ── Sábado: Luta ─────────────────────────────────────────────────────────
  saturday: {
    dayType: 'fight',
    exercises: [],
    notes: 'Aula de luta',
  },

  // ── Domingo: Descanso ────────────────────────────────────────────────────
  sunday: {
    dayType: 'rest',
    exercises: [],
  },
};
