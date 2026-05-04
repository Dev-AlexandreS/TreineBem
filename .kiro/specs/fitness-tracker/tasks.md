# Implementation Plan: Fitness Tracker

## Overview

Implementação incremental de uma aplicação web mobile-first para controle de treino e evolução física. A stack é Next.js 14 (App Router) com TypeScript, Tailwind CSS, Recharts e persistência via LocalStorage. A implementação segue a separação em camadas: tipos → Storage_Service → Validator → Calculators → Hooks → UI Components → Pages.

## Tasks

- [x] 1. Configurar projeto e estrutura base
  - Inicializar projeto Next.js 14 com App Router, TypeScript e Tailwind CSS
  - Instalar dependências: `recharts`, `fast-check` (dev), `@testing-library/react`, `vitest`
  - Criar estrutura de diretórios: `src/app`, `src/components`, `src/hooks`, `src/lib/storage`, `src/lib/validators`, `src/lib/calculators`, `src/types`
  - Configurar Vitest com suporte a React Testing Library
  - Configurar Tailwind com dark mode como padrão (`darkMode: 'class'` e classe `dark` no `html`)
  - _Requirements: 9.7, 10.1, 10.2_

- [x] 2. Definir tipos e interfaces TypeScript
  - [x] 2.1 Criar arquivo `src/types/index.ts` com todos os tipos base e interfaces
    - Definir `ISODateString`, `DayOfWeek`, `MuscleGroup`, `DayType`
    - Definir interfaces `Exercise`, `DayPlan`, `WeeklyPlan`, `DailyLog`, `ExerciseExecution`, `Goals`
    - Definir interface `StorageService` com todos os métodos
    - Definir interface `ValidationResult` e `Validator`
    - Definir tipo `StorageError` para erros tipados de persistência
    - _Requirements: 9.1, 9.4, 9.8_

- [x] 3. Implementar Storage_Service com LocalStorage
  - [x] 3.1 Criar `src/lib/storage/localStorage.adapter.ts` com o adaptador LocalStorage
    - Implementar leitura/escrita com prefixo `"fitness-tracker:"`
    - Envolver operações de escrita em `try/catch` lançando `StorageError`
    - Envolver desserialização em `try/catch` retornando valor padrão em caso de JSON inválido
    - _Requirements: 9.2, 9.5, 9.6_

  - [x] 3.2 Criar `src/lib/storage/storage.service.ts` implementando a interface `StorageService`
    - Implementar todos os métodos: `getWeeklyPlan`, `saveWeeklyPlan`, `addExercise`, `updateExercise`, `removeExercise`, `reorderExercises`, `getDailyLog`, `saveDailyLog`, `getDailyLogs`, `getExerciseExecutions`, `saveExerciseExecution`, `getGoals`, `saveGoals`
    - Implementar lógica de inicialização: carregar dados padrão apenas quando não há dados existentes
    - _Requirements: 9.1, 9.3, 9.4, 9.8, 11.2_

  - [x] 3.3 Criar `src/lib/storage/defaultPlan.ts` com o Plano Semanal padrão
    - Definir o `WeeklyPlan` inicial com todos os 7 dias conforme especificado
    - Segunda: Peito + Tríceps + Cardio; Terça: Costas + Bíceps + Cardio; Quarta: Luta; Quinta: Perna + Cardio; Sexta: Ombro + Abdômen + Cardio; Sábado: Luta; Domingo: Descanso
    - _Requirements: 11.1_

  - [x] 3.4 Escrever testes de propriedade para o Storage_Service (round-trip e idempotência)
    - **Property 1: Round-trip de persistência do Storage_Service**
    - **Validates: Requirements 9.5, 9.6**
    - **Property 2: Idempotência de inicialização do Storage_Service**
    - **Validates: Requirements 11.2**

  - [x] 3.5 Escrever testes unitários para o Storage_Service
    - Testar inicialização com e sem dados existentes
    - Testar tratamento de JSON inválido (retorno de valor padrão)
    - Testar lançamento de `StorageError` em falha de escrita
    - _Requirements: 9.3, 9.5_

- [x] 4. Checkpoint — Garantir que os testes do Storage_Service passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 5. Implementar módulo Validator
  - [x] 5.1 Criar `src/lib/validators/exercise.validator.ts`
    - Validar `name` (mínimo 2 caracteres)
    - Validar `muscleGroup` (valor obrigatório dentro do enum)
    - Validar `plannedSets` (inteiro entre 1 e 20)
    - Validar `plannedReps` (inteiro entre 1 e 100 ou formato "N–M")
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.2 Escrever testes de propriedade para validação de exercício
    - **Property 4: Validator rejeita nome de exercício com menos de 2 caracteres**
    - **Validates: Requirements 3.1**
    - **Property 5: Validator rejeita séries planejadas fora do intervalo [1, 20]**
    - **Validates: Requirements 3.3**

  - [x] 5.3 Criar `src/lib/validators/dailyLog.validator.ts`
    - Validar `weight` (decimal entre 30.0 e 300.0, opcional)
    - Validar `waterLiters` (decimal entre 0.0 e 10.0, opcional)
    - _Requirements: 4.4, 4.5_

  - [x] 5.4 Escrever testes de propriedade para validação de DailyLog
    - **Property 3: Validator rejeita campos de peso fora do intervalo [30.0, 300.0]**
    - **Validates: Requirements 4.4, 8.2, 8.3**
    - **Property 7: Validator rejeita consumo de água fora do intervalo [0.0, 10.0]**
    - **Validates: Requirements 4.5**

  - [x] 5.5 Criar `src/lib/validators/goals.validator.ts`
    - Validar `initialWeight` e `targetWeight` (decimal entre 30.0 e 300.0)
    - Validar `dailyWaterLiters` (decimal entre 0.5 e 10.0)
    - Validar `weeklyWorkouts` (inteiro entre 1 e 7)
    - Validar `weeklyCardioMinutes` (inteiro entre 0 e 600)
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 5.6 Escrever testes de propriedade para validação de Goals
    - **Property 8: Validator rejeita metas de água fora do intervalo [0.5, 10.0]**
    - **Validates: Requirements 8.4**
    - **Property 9: Validator rejeita metas de treinos semanais fora do intervalo [1, 7]**
    - **Validates: Requirements 8.5**
    - **Property 10: Validator rejeita meta de cardio semanal fora do intervalo [0, 600]**
    - **Validates: Requirements 8.6**

  - [x] 5.7 Criar `src/lib/validators/exerciseExecution.validator.ts`
    - Validar `setsCompleted` (inteiro entre 0 e 20)
    - Validar `repsCompleted` (inteiro entre 0 e 100)
    - _Requirements: 6.3, 6.4_

  - [x] 5.8 Escrever testes de propriedade para validação de ExerciseExecution
    - **Property 6: Validator rejeita séries e repetições realizadas fora dos intervalos válidos**
    - **Validates: Requirements 6.3, 6.4**

  - [x] 5.9 Criar `src/lib/validators/index.ts` exportando a implementação unificada do `Validator`
    - _Requirements: 3.9, 6.9_

- [x] 6. Checkpoint — Garantir que os testes do Validator passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 7. Implementar módulo Calculators
  - [x] 7.1 Criar `src/lib/calculators/streak.calculator.ts`
    - Implementar `calculateStreak(logs: DailyLog[]): number`
    - Retornar 0 para lista vazia; contar dias consecutivos com registro preenchido até hoje
    - _Requirements: 1.5_

  - [x] 7.2 Escrever testes de propriedade para streak
    - **Property 11: Streak nunca é negativo e é zero para lista vazia**
    - **Validates: Requirements 1.5**

  - [x] 7.3 Criar `src/lib/calculators/completion.calculator.ts`
    - Implementar `calculateWeeklyCompletionRate(logs: DailyLog[], plan: WeeklyPlan, weekStart: Date): number`
    - Retornar valor no intervalo [0.0, 1.0]
    - _Requirements: 1.6_

  - [x] 7.4 Escrever testes de propriedade para percentual de execução semanal
    - **Property 12: Percentual de execução semanal está sempre no intervalo [0.0, 1.0]**
    - **Validates: Requirements 1.6**

  - [x] 7.5 Criar `src/lib/calculators/water.calculator.ts`
    - Implementar `calculateAverageWater(logs: DailyLog[], lastNDays: number): number`
    - Retornar 0 para lista vazia; calcular média apenas sobre logs com `waterLiters` definido
    - _Requirements: 1.7_

  - [x] 7.6 Escrever testes de propriedade para média de água
    - **Property 13: Média de água é calculada corretamente para qualquer lista de logs**
    - **Validates: Requirements 1.7**

  - [x] 7.7 Criar `src/lib/calculators/weight.calculator.ts`
    - Implementar `calculateWeightLost(initialWeight: number, currentWeight: number): number`
    - _Requirements: 1.4_

  - [x] 7.8 Criar `src/lib/calculators/index.ts` exportando todas as funções de cálculo
    - _Requirements: 1.4, 1.5, 1.6, 1.7_

- [x] 8. Checkpoint — Garantir que os testes dos Calculators passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 9. Implementar Custom Hooks
  - [x] 9.1 Criar `src/hooks/useStorage.ts`
    - Hook base que instancia e expõe o `Storage_Service`
    - Gerenciar estado de loading e erro (`StorageError`)
    - _Requirements: 10.8, 10.10_

  - [x] 9.2 Criar `src/hooks/useWeeklyPlan.ts`
    - Expor `weeklyPlan`, `addExercise`, `updateExercise`, `removeExercise`, `reorderExercises`, `setDayType`
    - Usar `Validator` antes de persistir; expor erros de validação por campo
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 9.3 Criar `src/hooks/useDailyLog.ts`
    - Expor `dailyLog`, `saveDailyLog`, `getDailyLog` para uma data específica
    - Usar `Validator` antes de persistir; expor erros de validação por campo
    - _Requirements: 4.2, 4.3, 4.10, 4.11, 4.12_

  - [x] 9.4 Criar `src/hooks/useWorkout.ts`
    - Expor exercícios do dia atual, `saveExecution`, `finalizeWorkout`
    - Ao finalizar, atualizar `DailyLog` com `trained: true` e `followedPlan: true`
    - _Requirements: 5.2, 5.3, 5.7, 5.8_

  - [x] 9.5 Criar `src/hooks/useGoals.ts`
    - Expor `goals`, `saveGoals`
    - Usar `Validator` antes de persistir; expor erros de validação por campo
    - _Requirements: 8.7, 8.8_

  - [x] 9.6 Criar `src/hooks/useDashboard.ts`
    - Calcular e expor: peso atual, meta de peso, peso perdido, streak, percentual semanal, média de água, treino do dia
    - Usar `calculateStreak`, `calculateWeeklyCompletionRate`, `calculateAverageWater`, `calculateWeightLost`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 9.7 Escrever testes unitários para os hooks
    - Testar `useDashboard` com dados mockados do Storage_Service
    - Verificar que peso atual corresponde ao registro mais recente (Property 14)
    - Testar recálculo após salvar `DailyLog` (Requirement 4.12)
    - _Requirements: 1.2, 4.12_

- [x] 10. Implementar componentes de navegação e layout base
  - [x] 10.1 Criar `src/components/navigation/BottomNav.tsx`
    - Menu inferior fixo para mobile com links para Dashboard, Treino do Dia, Histórico, Plano Semanal e Metas
    - Área de toque mínima de 44x44px por item
    - _Requirements: 10.6, 10.4_

  - [x] 10.2 Criar `src/components/navigation/SideNav.tsx`
    - Menu lateral para desktop com os mesmos links
    - _Requirements: 10.7_

  - [x] 10.3 Criar `src/components/ui/Toast.tsx`
    - Notificação de confirmação/erro visível por no mínimo 2 segundos
    - _Requirements: 10.9, 10.10_

  - [x] 10.4 Criar `src/components/ui/LoadingSpinner.tsx`
    - Indicador visual de carregamento
    - _Requirements: 10.8_

  - [x] 10.5 Criar `src/app/layout.tsx` com layout raiz
    - Aplicar classe `dark` no `html`, incluir `BottomNav` e `SideNav` com breakpoints responsivos
    - _Requirements: 10.1, 10.2, 10.6, 10.7_

- [x] 11. Implementar componentes de cards e métricas
  - [x] 11.1 Criar `src/components/cards/MetricCard.tsx`
    - Exibir título, valor e unidade com estilo de card (bordas arredondadas, dark mode)
    - _Requirements: 10.3, 10.5_

  - [x] 11.2 Criar `src/components/charts/WeightChart.tsx`
    - Gráfico de linha com Recharts — últimos 30 registros com peso
    - Exibir mensagem de ausência de dados quando não há registros suficientes
    - _Requirements: 1.10, 1.13_

  - [x] 11.3 Criar `src/components/charts/WorkoutFrequencyChart.tsx`
    - Gráfico de barras com Recharts — últimos 30 dias (treinado/descanso)
    - Exibir mensagem de ausência de dados quando não há registros suficientes
    - _Requirements: 1.11, 1.13_

  - [x] 11.4 Criar `src/components/charts/WaterChart.tsx`
    - Gráfico de barras com Recharts — consumo de água dos últimos 7 dias
    - Exibir mensagem de ausência de dados quando não há registros suficientes
    - _Requirements: 1.12, 1.13_

  - [x] 11.5 Escrever testes unitários para os componentes de chart
    - Testar renderização com dados mockados (snapshot)
    - Testar exibição de mensagem de ausência de dados
    - _Requirements: 1.13_

- [x] 12. Implementar página Dashboard
  - [x] 12.1 Criar `src/app/page.tsx` (Dashboard)
    - Usar `useDashboard` para obter todas as métricas
    - Renderizar `MetricCard` para peso atual, meta de peso e peso perdido
    - Renderizar `MetricCard` para streak, percentual semanal e média de água
    - Renderizar card de treino do dia (ou "Dia de descanso")
    - Renderizar `WeightChart`, `WorkoutFrequencyChart` e `WaterChart`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13_

  - [x] 12.2 Escrever testes unitários para o Dashboard
    - Testar renderização com dados mockados
    - Testar exibição de "Dia de descanso" quando não há treino planejado
    - _Requirements: 1.1, 1.9_

- [x] 13. Implementar formulários de exercício e plano semanal
  - [x] 13.1 Criar `src/components/forms/ExerciseForm.tsx`
    - Campos: nome, grupo muscular (select), séries previstas, repetições previstas, carga (opcional), descanso (opcional), observações (opcional)
    - Exibir erros de validação inline por campo sem fechar o formulário
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10_

  - [x] 13.2 Criar `src/app/plan/page.tsx` (Plano Semanal)
    - Listar os 7 dias da semana; ao selecionar um dia, exibir exercícios planejados
    - Botões de adicionar, editar e remover exercício (com confirmação de remoção)
    - Suporte a reordenação de exercícios
    - Opções para definir dia como "Descanso" ou "Luta"
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [x] 13.3 Escrever testes unitários para ExerciseForm
    - Testar exibição de erros de validação por campo
    - Testar submissão com dados válidos
    - _Requirements: 3.1, 3.9_

- [x] 14. Implementar formulário de Registro Diário
  - [x] 14.1 Criar `src/components/forms/DailyLogForm.tsx`
    - Campos: data (pré-selecionada como hoje), peso, água, treinou hoje, executou treino previsto, fez algo diferente (com campo de descrição condicional), observações
    - Exibir erros de validação inline por campo
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [x] 14.2 Criar `src/app/workout/page.tsx` (Treino do Dia) — parte de registro diário
    - Integrar `DailyLogForm` para registro de peso, água e observações em dias de descanso
    - _Requirements: 4.1, 5.10_

  - [x] 14.3 Escrever testes unitários para DailyLogForm
    - Testar pré-seleção da data atual
    - Testar exibição condicional do campo de descrição de "fez algo diferente"
    - _Requirements: 4.2, 4.8_

- [x] 15. Implementar tela de Treino do Dia
  - [x] 15.1 Criar `src/components/cards/ExerciseExecutionCard.tsx`
    - Exibir valores planejados como referência
    - Campos editáveis: séries realizadas, repetições realizadas, carga usada (opcional), concluiu (sim/não), observação
    - Destaque visual ao marcar como concluído
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 15.2 Completar `src/app/workout/page.tsx` com a tela de Treino do Dia
    - Exibir exercícios do dia atual via `useWorkout`
    - Botão "Finalizar Treino" que persiste execuções e atualiza DailyLog
    - Opção de adicionar exercício extra e registrar cardio
    - Tratamento especial para dias tipo "Luta" e "Descanso"
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [x] 15.3 Escrever testes unitários para ExerciseExecutionCard
    - Testar destaque visual ao marcar como concluído
    - Testar exibição de erros de validação
    - _Requirements: 5.3, 6.9_

- [x] 16. Implementar tela de Histórico
  - [x] 16.1 Criar `src/app/history/page.tsx`
    - Listar Registros Diários em ordem cronológica decrescente
    - Filtros de período: semana atual, mês atual, todos
    - Ao selecionar um registro, exibir detalhes incluindo execuções de exercício associadas
    - Exibir mensagem de ausência de dados quando não há registros no período
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 17. Implementar tela de Metas
  - [x] 17.1 Criar `src/components/forms/GoalsForm.tsx`
    - Campos: peso inicial, peso alvo, meta de água diária, meta de treinos por semana, meta de cardio semanal
    - Exibir erros de validação inline por campo
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 17.2 Criar `src/app/goals/page.tsx`
    - Renderizar `GoalsForm` com dados existentes pré-preenchidos
    - Exibir progresso atual em relação a cada meta
    - Exibir mensagem de parabéns quando peso atual ≤ peso alvo
    - _Requirements: 8.1, 8.7, 8.8, 8.9, 8.10_

- [x] 18. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Os checkpoints garantem validação incremental a cada camada implementada
- Testes de propriedade usam `fast-check` com mínimo de 100 iterações por propriedade
- Testes unitários usam Vitest + React Testing Library
- O `Storage_Service` é a única interface de acesso a dados — nenhum componente de UI acessa o LocalStorage diretamente
- A ordem de implementação segue a dependência entre camadas: tipos → storage → validators → calculators → hooks → components → pages
