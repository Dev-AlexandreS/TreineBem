# Plano de Implementação: ui-improvements

## Visão Geral

Implementação incremental das melhorias de UI/UX do Treine Bem em 5 etapas: Dashboard aprimorado, Tela de Treino, Histórico, Configurações e Fotos de Progresso. Cada etapa constrói sobre a anterior, preservando Supabase Auth, Prisma, Vercel e todos os testes existentes.

## Tarefas

- [x] 1. Fundação: componentes UI reutilizáveis e utilitários
  - [x] 1.1 Extrair e criar `ProgressBar` em `src/components/ui/ProgressBar.tsx`
    - Extrair a implementação inline de `src/app/goals/page.tsx` para o componente reutilizável
    - Implementar props: `value` (0–1, clamped), `variant` (blue/green/yellow/red), `height`, `label`
    - Adicionar `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
    - _Requisitos: 9.1, 16.5, 16.6_

  - [ ]* 1.2 Escrever testes unitários para `ProgressBar`
    - Testar value=0, value=1, value>1 (clamp para 1), value<0 (clamp para 0)
    - Testar variantes de cor e atributos aria
    - _Requisitos: 9.1, 16.2_

  - [x] 1.3 Criar `EmptyState` em `src/components/ui/EmptyState.tsx`
    - Implementar props: `icon`, `message`, `action` (label + href/onClick opcional)
    - Aplicar estilo: ícone centralizado, mensagem em `text-gray-400`, botão de ação opcional
    - _Requisitos: 2.3, 2.4, 2.5, 2.6, 16.5_

  - [x] 1.4 Criar `SkeletonCard` em `src/components/ui/SkeletonCard.tsx`
    - Implementar props: `lines` (padrão 2), `height` (padrão 80), `className`
    - Usar `animate-pulse` e `bg-gray-700` para simular cartões reais
    - _Requisitos: 2.1, 16.5_

  - [x] 1.5 Criar `ConfirmDialog` em `src/components/ui/ConfirmDialog.tsx`
    - Extrair lógica de confirmação inline do `plan/page.tsx`
    - Implementar props: `isOpen`, `title`, `description`, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`, `variant`
    - Adicionar `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
    - _Requisitos: 7.8, 16.6, 16.8_

  - [x] 1.6 Criar hook `useToast` em `src/hooks/useToast.ts`
    - Implementar `showSuccess`, `showError`, `dismiss` com IDs via `crypto.randomUUID()`
    - Duração padrão: 3000 ms (sucesso), 5000 ms (erro)
    - Empilhamento: máximo 3 toasts simultâneos (remover o mais antigo ao adicionar o 4º)
    - _Requisitos: 3.1, 3.2, 3.5, 16.6_

  - [ ]* 1.7 Escrever testes unitários para `useToast`
    - Testar showSuccess, showError, dismiss, empilhamento (máx 3), duração
    - _Requisitos: 3.1, 3.2, 3.5, 16.2_

  - [x] 1.8 Estender `Toast.tsx` para suportar empilhamento e posicionamento responsivo
    - Consumir array de `ToastItem` do `useToast`
    - Posicionamento: `md:top-4 md:right-4` (desktop), parte inferior centralizada (mobile)
    - Adicionar `role="alert"` e `aria-live="assertive"` em cada toast
    - _Requisitos: 3.3, 3.4, 3.5_

  - [x] 1.9 Criar calculadora de IMC em `src/lib/calculators/bmi.calculator.ts`
    - Implementar `calculateBMI(weightKg, heightCm): BMIResult`
    - Implementar `classifyBMI(bmi): BMIClassification` com limiares OMS
    - Exportar tipos `BMIResult` e `BMIClassification`
    - _Requisitos: 13.2, 13.3_

  - [ ]* 1.10 Escrever teste de propriedade para cálculo de IMC
    - **Propriedade 1: Cálculo e Classificação de IMC**
    - **Valida: Requisitos 9.4, 13.2, 13.3**
    - Usar fast-check: `fc.float({ min: 30, max: 300 })` × `fc.integer({ min: 100, max: 250 })`
    - Verificar `result.value === Math.round((w / (h/100)²) * 100) / 100` e classificação correta
    - Testar também exemplos concretos para cada faixa OMS (< 18.5, 18.5–24.9, 25–29.9, 30–34.9, 35–39.9, ≥ 40)

  - [x] 1.11 Criar módulo de mensagens motivacionais em `src/lib/calculators/motivational.ts`
    - Criar array `MOTIVATIONAL_MESSAGES` com pelo menos 30 mensagens em português
    - Implementar `getMotivationalMessage(date: ISODateString): string` com seleção determinística
    - Fórmula: `index = (year * 366 + dayOfYear) % MOTIVATIONAL_MESSAGES.length`
    - _Requisitos: 11.1, 11.2, 11.3_

  - [ ]* 1.12 Escrever teste de propriedade para determinismo motivacional
    - **Propriedade 2: Determinismo da Mensagem Motivacional**
    - **Valida: Requisitos 11.2, 11.3**
    - Usar fast-check: `fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })`
    - Verificar que chamadas múltiplas retornam a mesma mensagem e que está no array

  - [x] 1.13 Criar validador de configurações em `src/lib/validators/settings.validator.ts`
    - Implementar `validateHeight(value): { valid: boolean; error?: string }` — intervalo [100, 250] cm
    - Implementar `validateCheckinWeight(value): { valid: boolean; error?: string }` — intervalo [30, 300] kg
    - Implementar `validateCheckinWater(value): { valid: boolean; error?: string }` — intervalo [0, 10] L
    - Exportar do `src/lib/validators/index.ts`
    - _Requisitos: 10.6, 10.7, 14.4_

  - [ ]* 1.14 Escrever testes de propriedade para validação de check-in e altura
    - **Propriedade 4: Validação de Campos do Check-in Diário**
    - **Valida: Requisitos 10.6, 10.7**
    - Testar valores inválidos de peso (< 30 e > 300) e água (< 0 e > 10) com fast-check
    - **Propriedade 5: Validação de Altura nas Configurações**
    - **Valida: Requisito 14.4**
    - Testar valores inválidos de altura (< 100 e > 250) com fast-check

  - [x] 1.15 Checkpoint — garantir que todos os testes passam
    - Executar `npm test` e verificar que todos os testes existentes continuam passando
    - Executar `npm run build` e verificar ausência de erros TypeScript
    - Garantir que os novos testes passam, ask the user if questions arise.

- [x] 2. Etapa 1 — Dashboard aprimorado
  - [x] 2.1 Criar componente `MotivationalCard` em `src/components/dashboard/MotivationalCard.tsx`
    - Implementar props: `message: string`
    - Estilo: cartão com `border border-gray-700`, texto em `text-sm italic text-gray-300`
    - _Requisitos: 11.1, 11.4_

  - [x] 2.2 Criar componente `DailyCheckin` em `src/components/dashboard/DailyCheckin.tsx`
    - Implementar props: `todayLog: DailyLog | null`, `onSave: (weight?, water?) => Promise<void>`
    - Campos inline para peso (kg) e água (L) com validação imediata usando `settings.validator.ts`
    - Exibir erros inline abaixo do campo com `role="alert"` e `aria-invalid`
    - Pré-preencher campos quando `todayLog` já existe
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 2.3 Escrever testes unitários para `DailyCheckin`
    - Testar pré-preenchimento com log existente, validação inline, save success/error
    - _Requisitos: 10.1–10.7, 16.2_

  - [x] 2.4 Criar componente `WeeklyConsistencyIndicator` em `src/components/dashboard/WeeklyConsistencyIndicator.tsx`
    - Implementar props: `days` (array de 7 com `dayLabel` e `status`), `isPerfectWeek`
    - Renderizar 7 círculos: verde (`trained`), cinza (`rest`), vermelho (`missed`), cinza claro (`future`)
    - Exibir badge dourado "Semana Perfeita 🏆" quando `isPerfectWeek = true`
    - _Requisitos: 12.1, 12.2, 12.3_

  - [ ]* 2.5 Escrever testes unitários para `WeeklyConsistencyIndicator`
    - Testar 7 círculos presentes, cores corretas por status, badge semana perfeita visível/oculto
    - _Requisitos: 12.1, 12.2, 12.3, 16.2_

  - [x] 2.6 Criar função de detecção de semana perfeita em `src/lib/calculators/streak.calculator.ts` (extensão)
    - Adicionar `isPerfectWeek(weeklyPlan: WeeklyPlan, logs: DailyLog[], weekStart: Date): boolean`
    - Retorna `true` somente se todos os dias com `dayType !== 'rest'` têm `DailyLog` com `trained = true`
    - _Requisitos: 12.2, 12.3, 12.4_

  - [ ]* 2.7 Escrever teste de propriedade para detecção de semana perfeita
    - **Propriedade 3: Detecção de Semana Perfeita**
    - **Valida: Requisitos 12.2, 12.3, 12.4**
    - Gerar plano semanal aleatório e logs correspondentes com fast-check
    - Verificar que `isPerfectWeek` retorna `true` se e somente se todos os dias de treino têm log com `trained = true`

  - [x] 2.8 Adicionar tipo `UserSettings` em `src/types/index.ts` (ou criar o arquivo se não existir)
    - Definir interface `UserSettings` com `displayName?`, `heightCm?`, `birthDate?`
    - _Requisitos: 13.1, 14.2_

  - [x] 2.9 Estender `StorageService` com métodos de configurações
    - Adicionar `getUserSettings(): UserSettings | null` e `saveUserSettings(settings: UserSettings): void` à interface
    - Implementar nos adapters `localStorage.adapter.ts` e `supabase.adapter.ts`
    - Adicionar chaves `USER_SETTINGS` e `PROGRESS_PHOTOS` ao objeto `KEYS`
    - _Requisitos: 14.2, 14.3, 16.4_

  - [x] 2.10 Criar hook `useSettings` em `src/hooks/useSettings.ts`
    - Implementar `settings`, `saveSettings`, `loading`, `error`
    - Usar `validateHeight` do `settings.validator.ts` antes de persistir
    - _Requisitos: 14.2, 14.3, 14.4_

  - [ ]* 2.11 Escrever testes unitários para `useSettings`
    - Testar load, save com altura válida/inválida, erro de persistência
    - _Requisitos: 14.2–14.4, 16.2_

  - [x] 2.12 Criar componente `BMICard` em `src/components/goals/BMICard.tsx`
    - Implementar props: `bmi: number | null`, `classification: BMIClassification | null`, `heightCm: number | null`
    - Quando `heightCm` é null: exibir mensagem "Cadastre sua altura nas Configurações para calcular o IMC" com link para `/settings`
    - Quando IMC disponível: exibir valor com 2 casas decimais e classificação textual em português
    - _Requisitos: 9.4, 13.3, 13.4_

  - [ ]* 2.13 Escrever testes unitários para `BMICard`
    - Testar sem altura (mensagem de cadastro), com cada classificação OMS
    - _Requisitos: 9.4, 13.3, 13.4, 16.2_

  - [x] 2.14 Estender hook `useDashboard` com dados de semana e check-in
    - Adicionar `weekSummary` (treinos realizados/planejados, média de água, peso inicial/atual da semana)
    - Adicionar `todayLog: DailyLog | null` para pré-preencher o `DailyCheckin`
    - Adicionar `weekConsistencyDays` e `isPerfectWeek` usando a função criada em 2.6
    - Adicionar `saveDailyCheckin(weight?, water?): Promise<void>`
    - _Requisitos: 5.1, 5.5, 10.2, 10.3, 12.4_

  - [x] 2.15 Atualizar `src/app/page.tsx` (Dashboard) com todos os novos componentes
    - Integrar `DailyCheckin`, `MotivationalCard`, `WeeklyConsistencyIndicator`
    - Exibir cartões de métricas na ordem: peso atual, meta de peso, peso perdido, streak, média de água, % conclusão semanal
    - Exibir cartão "Treino de Hoje" com tipo do dia, lista de exercícios e botão "Ir para Treino"
    - Exibir seção "Resumo Semanal" com dados do `weekSummary`
    - Exibir `EmptyState` quando não há dados de peso; exibir CTA "Defina suas metas" quando metas não definidas
    - Usar `SkeletonCard` durante carregamento
    - Usar `useToast` para feedback de check-in
    - _Requisitos: 5.1–5.10, 10.1–10.7, 11.1–11.4, 12.1–12.4_

  - [x] 2.16 Checkpoint — Dashboard funcional
    - Executar `npm test` e `npm run build` sem erros
    - Verificar layout responsivo em 320 px e 768 px+, ask the user if questions arise.

- [x] 3. Etapa 2 — Tela de Treino aprimorada
  - [x] 3.1 Criar componente `WorkoutSummaryModal` em `src/components/goals/WorkoutSummaryModal.tsx`
    - Implementar props: `isOpen`, `summary` (totalExercises, completedExercises, totalSets, totalWeightKg, estimatedDurationMin), `onConfirm`, `onClose`
    - Adicionar `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
    - _Requisitos: 6.8, 6.9, 16.6, 16.8_

  - [ ]* 3.2 Escrever testes unitários para `WorkoutSummaryModal`
    - Testar aberto/fechado, exibição dos dados do resumo, botão confirmar chama `onConfirm`
    - _Requisitos: 6.8, 6.9, 16.2_

  - [x] 3.3 Atualizar `src/app/workout/page.tsx` — cartões de exercício maiores
    - Refatorar cada exercício para cartão grande com: nome em `text-lg font-bold`, séries × reps planejadas, campos numéricos para séries realizadas, reps realizadas e carga (kg)
    - Botão "Concluído" de largura total por exercício; ao marcar: borda verde + ícone de check sem reload
    - Exibir comparação planejado vs. realizado por exercício
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_

  - [x] 3.4 Adicionar formulário inline de exercício extra e registro de cardio
    - Botão "+ Adicionar exercício extra" com formulário inline (nome, séries, reps)
    - Botão "+ Registrar cardio" com campo de duração (min) e tipo opcional (corrida, bicicleta, elíptico, outro)
    - _Requisitos: 6.5, 6.6_

  - [x] 3.5 Adicionar botão fixo "Finalizar Treino" e integrar `WorkoutSummaryModal`
    - Botão `fixed bottom-0` acima da `BottomNav`, altura mínima 56 px, `bg-green-600`
    - Ao tocar: calcular resumo (total exercícios, séries, carga total, duração estimada) e abrir modal
    - Botão "Confirmar e Salvar" no modal: persistir todas as execuções e navegar para Dashboard
    - _Requisitos: 6.7, 6.8, 6.9_

  - [x] 3.6 Tratar dias de descanso e luta na Tela de Treino
    - Dia `rest`: exibir `DailyLogForm` para peso, água e notas
    - Dia `fight`: exibir campos para duração da aula (min) e observações, botão "Finalizar Aula"
    - _Requisitos: 6.10, 6.11_

  - [x] 3.7 Checkpoint — Tela de Treino funcional
    - Executar `npm test` e `npm run build` sem erros
    - Verificar botão fixo não sobrepõe `BottomNav` em mobile, ask the user if questions arise.

- [x] 4. Etapa 3 — Histórico aprimorado
  - [x] 4.1 Atualizar `src/app/history/page.tsx` — filtros de período
    - Adicionar botões de filtro: "Semana atual", "Mês atual", "Todos"
    - Filtrar registros no cliente sem recarregar a página
    - Exibir `EmptyState` com mensagem "Nenhum registro encontrado para o período selecionado." quando vazio
    - _Requisitos: 8.2, 8.3, 8.8_

  - [x] 4.2 Atualizar cards de registro diário no Histórico
    - Exibir: data formatada (ex.: "seg, 12 jan 2025"), badge "✓ Treinou" (verde) ou "— Descanso" (cinza), peso (kg) e água (L)
    - Destacar com borda/badge azul quando `followedPlan = true`
    - Ordenar em ordem cronológica decrescente
    - _Requisitos: 8.1, 8.4, 8.5_

  - [x] 4.3 Implementar painel de detalhes do registro diário
    - Ao tocar em um cartão: exibir detalhes completos (peso, água, status, followedPlan, exercícios, cardio, notas)
    - Listar cada `ExerciseExecution` com nome, séries × reps, carga (kg) e indicador de conclusão
    - _Requisitos: 8.6, 8.7_

  - [x] 4.4 Checkpoint — Histórico funcional
    - Executar `npm test` e `npm run build` sem erros, ask the user if questions arise.

- [x] 5. Etapa 4 — Metas e Configurações
  - [x] 5.1 Atualizar `src/app/goals/page.tsx` — barras de progresso e IMC
    - Substituir `ProgressBar` inline pelo componente extraído em 1.1
    - Integrar `BMICard` usando `useSettings` para obter `heightCm`
    - Exibir barras de progresso para: peso, água diária, treinos semanais, cardio semanal
    - Exibir cartão de peso com: peso inicial, atual, alvo, diferença e percentual
    - Exibir banner "Você atingiu seu peso alvo! 🎉" quando peso atual ≤ peso alvo
    - Exibir quantidade restante para meta de peso
    - _Requisitos: 9.1–9.8, 13.3, 13.4_

  - [x] 5.2 Criar página `src/app/settings/page.tsx`
    - Campos editáveis: nome de exibição, altura (cm), data de nascimento (opcional)
    - E-mail do usuário autenticado (somente leitura)
    - Validação de altura com `validateHeight` e erro inline
    - Botão "Salvar" com Toast de sucesso via `useToast`
    - Botão "Sair" com `ConfirmDialog` antes de encerrar sessão
    - _Requisitos: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x] 5.3 Adicionar link de Configurações na navegação
    - `SideNav`: adicionar link "Configurações" com ícone de engrenagem
    - `BottomNav`: adicionar ícone de engrenagem fora dos 5 slots principais (ex.: canto superior do nav)
    - _Requisitos: 4.1, 4.5, 14.1_

  - [x] 5.4 Checkpoint — Metas e Configurações funcionais
    - Executar `npm test` e `npm run build` sem erros
    - Verificar que IMC é calculado corretamente quando altura está cadastrada, ask the user if questions arise.

- [x] 6. Etapa 5 — Fotos de Progresso com Supabase Storage
  - [x] 6.1 Criar bucket seguro no Supabase Storage via migration SQL
    - Criar arquivo de migration em `prisma/migrations/` para configurar bucket `progress-photos`
    - Configurar RLS: cada usuário só acessa seus próprios objetos (`auth.uid() = owner`)
    - Não expor `service_role` no frontend — usar apenas `anon` key com RLS
    - _Requisitos: 15.1, 15.3_

  - [x] 6.2 Estender `StorageService` com métodos de fotos de progresso
    - Adicionar `getProgressPhotos(): ProgressPhoto[]`, `saveProgressPhoto(photo)`, `deleteProgressPhoto(id)` à interface
    - Implementar no `supabase.adapter.ts`: upload para bucket `progress-photos`, salvar metadados (id, userId, date, storagePath) no banco via Prisma
    - Implementar no `localStorage.adapter.ts`: armazenar como blob URL (fallback para desenvolvimento)
    - _Requisitos: 15.3_

  - [x] 6.3 Adicionar modelo `ProgressPhoto` ao schema Prisma
    - Adicionar tabela `ProgressPhoto` com campos: `id`, `userId`, `date`, `storagePath`, `createdAt`
    - Criar migration com `prisma migrate dev`
    - _Requisitos: 15.3_

  - [x] 6.4 Criar hook `useProgressPhotos` em `src/hooks/useProgressPhotos.ts`
    - Implementar `photos`, `addPhoto(file: File)`, `deletePhoto(id)`, `loading`, `error`
    - Validar arquivo antes do upload: tipo (JPEG/PNG/WebP) e tamanho (≤ 5 MB)
    - Exibir Toast de erro imediato para arquivo inválido (sem tentar upload)
    - _Requisitos: 15.2, 15.4_

  - [ ]* 6.5 Escrever testes unitários para `useProgressPhotos`
    - Testar validação de tipo e tamanho, addPhoto success/error, deletePhoto
    - _Requisitos: 15.2, 15.4, 16.2_

  - [x] 6.6 Criar componente `ProgressPhotoGallery` em `src/components/settings/ProgressPhotoGallery.tsx`
    - Implementar props: `photos: ProgressPhoto[]`, `onAdd: (file: File) => Promise<void>`, `onDelete: (id: string) => void`
    - Botão "Adicionar foto de progresso" que abre seletor de arquivos nativo (accept="image/jpeg,image/png,image/webp")
    - Galeria cronológica com data de registro em cada foto
    - Ao tocar em foto: exibir em tela cheia com data e opção de excluir
    - _Requisitos: 15.1, 15.2, 15.3, 15.5_

  - [x] 6.7 Integrar `ProgressPhotoGallery` na página de Configurações
    - Adicionar seção "Fotos de Progresso" em `src/app/settings/page.tsx`
    - Usar `useProgressPhotos` para gerenciar estado
    - _Requisitos: 15.1, 15.3_

  - [x] 6.8 Checkpoint final — build e testes completos
    - Executar `npm test` — todos os testes existentes e novos devem passar
    - Executar `npm run build` — sem erros TypeScript e sem falhas de build
    - Verificar responsividade em 320 px e 1440 px
    - Verificar que autenticação Supabase e deploy Vercel não foram afetados, ask the user if questions arise.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental a cada etapa
- Testes de propriedade (fast-check) validam invariantes universais; testes unitários validam exemplos e casos de borda
- Nunca armazenar fotos em localStorage em produção — usar Supabase Storage com RLS
- Preservar todos os testes existentes: nenhum teste existente deve ser modificado
