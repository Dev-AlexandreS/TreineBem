# Documento de Requisitos — ui-improvements

## Introdução

Este documento descreve as melhorias de design, usabilidade e novas funcionalidades para o aplicativo **Treine Bem**, um rastreador de fitness com modo escuro. O objetivo é modernizar a interface existente, tornar o uso no celular mais fluido (especialmente durante treinos na academia) e adicionar recursos úteis como check-in diário, indicadores de consistência, cálculo de IMC e tela de configurações — **sem reescrever o app do zero** e sem quebrar as funcionalidades já existentes.

O app já possui: Dashboard (`/`), Treino (`/workout`), Plano Semanal (`/plan`), Histórico (`/history`), Metas (`/goals`), componentes `MetricCard`, gráficos, navegação inferior/lateral, hooks `useDashboard`, `useWeeklyPlan`, `useDailyLog`, `useWorkout`, `useGoals`, autenticação Supabase e backend Prisma.

---

## Glossário

- **App**: O aplicativo Treine Bem como um todo.
- **Dashboard**: Tela principal (`/`), exibe métricas e resumo do dia.
- **Tela_de_Treino**: Tela de execução do treino diário (`/workout`).
- **Plano_Semanal**: Tela de configuração do plano semanal (`/plan`).
- **Histórico**: Tela de registros diários passados (`/history`).
- **Metas**: Tela de definição e acompanhamento de metas (`/goals`).
- **Configurações**: Nova tela (`/settings`) para edição de dados do usuário.
- **MetricCard**: Componente de cartão de métrica individual.
- **BottomNav**: Barra de navegação inferior, visível em dispositivos móveis.
- **SideNav**: Barra de navegação lateral, visível em telas maiores (desktop).
- **Toast**: Componente de notificação temporária de sucesso ou erro.
- **DailyLog**: Registro diário contendo peso, água, status de treino e notas.
- **ExerciseExecution**: Registro de execução de um exercício (séries, reps, carga).
- **CardioLog**: Registro de atividade cardiovascular (duração em minutos).
- **Goals**: Metas do usuário (peso inicial, peso alvo, água diária, treinos semanais, cardio semanal).
- **WeeklyPlan**: Plano semanal com tipo de dia e lista de exercícios por dia.
- **DayType**: Tipo do dia — `workout` (Musculação), `fight` (Luta) ou `rest` (Descanso).
- **Streak**: Sequência de dias consecutivos com registro de atividade.
- **IMC**: Índice de Massa Corporal, calculado como peso (kg) / altura (m)².
- **Check-in_Diário**: Ação rápida de registrar peso e água do dia sem abrir formulário completo.
- **Semana_Perfeita**: Conquista concedida quando o usuário completa todos os treinos planejados na semana.
- **Estado_Vazio**: Estado visual exibido quando não há dados para mostrar em uma seção.
- **Loading_Skeleton**: Placeholder animado exibido enquanto dados estão sendo carregados.
- **Progresso_Foto**: Foto opcional de progresso corporal registrada pelo usuário.

---

## Requisitos

---

### Requisito 1: Design e Hierarquia Visual Modernos

**User Story:** Como usuário, quero uma interface mais limpa e moderna com melhor hierarquia visual, para que eu consiga encontrar informações importantes rapidamente e o app pareça um aplicativo de fitness profissional.

#### Critérios de Aceitação

1. THE App SHALL manter o modo escuro como tema padrão e único, preservando o esquema de cores atual baseado em `gray-800`/`gray-900`.
2. WHEN uma página é renderizada, THE App SHALL exibir cartões com bordas arredondadas (`rounded-2xl`), espaçamento interno consistente (`p-4` ou `p-6`) e separação visual clara entre seções.
3. THE App SHALL aplicar hierarquia tipográfica consistente: títulos de página em `text-2xl font-bold`, subtítulos de seção em `text-base font-semibold`, rótulos em `text-sm font-medium text-gray-400`, valores em `text-white`.
4. WHEN um botão de ação primária é exibido, THE App SHALL renderizá-lo com altura mínima de 48px, largura adequada ao contexto e cor de destaque (`bg-blue-600` ou `bg-green-600`).
5. WHEN um botão de ação secundária é exibido, THE App SHALL renderizá-lo com borda visível (`border border-gray-600`) e cor de texto `text-gray-300`.
6. THE App SHALL garantir que todos os elementos interativos tenham área de toque mínima de 44×44px em dispositivos móveis.
7. WHEN a viewport é menor que 768px, THE App SHALL exibir layout de coluna única com padding lateral de `px-4`.
8. WHEN a viewport é maior ou igual a 768px, THE App SHALL exibir layout com margem automática centralizada (`max-w-2xl mx-auto`) e a `SideNav` lateral.

---

### Requisito 2: Estados de Carregamento, Erro e Vazio

**User Story:** Como usuário, quero feedback visual claro enquanto o app carrega dados, quando ocorre um erro e quando não há dados para exibir, para que eu nunca fique olhando para uma tela em branco sem entender o que está acontecendo.

#### Critérios de Aceitação

1. WHEN dados estão sendo carregados, THE App SHALL exibir `Loading_Skeleton` — placeholders animados com `animate-pulse` no formato dos cartões que serão exibidos — em vez de um spinner centralizado genérico.
2. WHEN o carregamento de dados falha, THE App SHALL exibir uma mensagem de erro descritiva com botão "Tentar novamente" dentro da seção afetada.
3. WHEN uma seção não possui dados para exibir, THE App SHALL renderizar um `Estado_Vazio` com ícone ilustrativo, mensagem explicativa em `text-gray-400` e, quando aplicável, um botão de ação para criar o primeiro registro.
4. THE Estado_Vazio DO Dashboard SHALL exibir a mensagem "Nenhum dado registrado ainda. Comece registrando seu treino de hoje!" com botão "Ir para Treino".
5. THE Estado_Vazio DO Histórico SHALL exibir a mensagem "Nenhum registro encontrado para o período selecionado." sem botão de ação.
6. THE Estado_Vazio DO Plano_Semanal SHALL exibir a mensagem "Nenhum exercício cadastrado para este dia." com botão "Adicionar exercício".

---

### Requisito 3: Toasts de Sucesso e Erro

**User Story:** Como usuário, quero notificações claras e não intrusivas quando uma ação é concluída com sucesso ou falha, para que eu saiba imediatamente o resultado sem precisar procurar na tela.

#### Critérios de Aceitação

1. WHEN uma operação de salvamento é concluída com sucesso, THE App SHALL exibir um Toast verde com ícone de check e mensagem descritiva por 3 segundos.
2. WHEN uma operação de salvamento falha, THE App SHALL exibir um Toast vermelho com ícone de erro e mensagem descritiva por 5 segundos.
3. WHEN um Toast é exibido, THE App SHALL posicioná-lo no canto superior direito da tela em desktop e na parte inferior centralizada em mobile, com z-index acima de todos os outros elementos.
4. THE Toast SHALL ser acessível via `role="alert"` e `aria-live="assertive"` para leitores de tela.
5. WHEN múltiplos Toasts são disparados em sequência, THE App SHALL empilhá-los verticalmente sem sobreposição.

---

### Requisito 4: Navegação Inferior Melhorada (Mobile)

**User Story:** Como usuário mobile, quero uma barra de navegação inferior mais clara e fácil de usar, para que eu consiga navegar entre as telas com um toque preciso mesmo durante o treino.

#### Critérios de Aceitação

1. THE BottomNav SHALL exibir exatamente 5 itens: Dashboard, Treino, Histórico, Plano e Metas.
2. WHEN um item da BottomNav está ativo, THE BottomNav SHALL destacá-lo com cor `text-blue-400` e um indicador visual (ponto ou sublinhado) abaixo do ícone.
3. THE BottomNav SHALL ter altura mínima de 64px e respeitar a `safe-area-inset-bottom` em dispositivos iOS (usando `pb-safe` ou `padding-bottom: env(safe-area-inset-bottom)`).
4. WHEN a viewport é maior ou igual a 768px, THE BottomNav SHALL ser ocultada (`hidden md:hidden`) e a `SideNav` SHALL ser exibida.
5. THE BottomNav SHALL incluir o botão de logout acessível via `SideNav` em desktop e via menu ou ícone dedicado em mobile, sem ocupar um dos 5 slots de navegação principal.

---

### Requisito 5: Dashboard Aprimorado

**User Story:** Como usuário, quero um dashboard com métricas relevantes, cartão do treino de hoje e gráficos de evolução, para que eu tenha uma visão completa do meu progresso ao abrir o app.

#### Critérios de Aceitação

1. WHEN o Dashboard é carregado, THE Dashboard SHALL exibir os seguintes cartões de métricas na ordem: peso atual (kg), meta de peso (kg), peso perdido (kg), streak (dias), média de água (L), percentual de conclusão semanal (%).
2. WHEN o Dashboard é carregado, THE Dashboard SHALL exibir um cartão "Treino de Hoje" com o tipo do dia (`DayType`), lista de exercícios planejados (nome, séries × reps) e botão "Ir para Treino" que navega para `/workout`.
3. WHEN o dia atual é do tipo `rest`, THE Dashboard SHALL exibir no cartão "Treino de Hoje" a mensagem "Dia de descanso 🛌" sem lista de exercícios.
4. WHEN o dia atual é do tipo `fight`, THE Dashboard SHALL exibir no cartão "Treino de Hoje" o ícone 🥊 e o texto "Dia de Luta".
5. THE Dashboard SHALL exibir uma seção "Resumo Semanal" contendo: treinos realizados / treinos planejados, média de água da semana (L), peso inicial da semana / peso atual, diferença de peso na semana (com sinal + ou −).
6. THE Dashboard SHALL exibir o gráfico de evolução de peso (`WeightChart`) com os últimos 30 dias de dados.
7. THE Dashboard SHALL exibir o gráfico de consumo de água (`WaterChart`) com os últimos 7 dias de dados.
8. THE Dashboard SHALL exibir o gráfico de frequência de treinos (`WorkoutFrequencyChart`) com os últimos 30 dias de dados.
9. WHEN nenhum dado de peso está disponível, THE Dashboard SHALL exibir "—" nos cartões de peso e omitir o gráfico de evolução de peso, exibindo o `Estado_Vazio` correspondente.
10. WHEN o usuário ainda não definiu metas, THE Dashboard SHALL exibir um cartão de chamada para ação "Defina suas metas" com botão que navega para `/goals`.

---

### Requisito 6: Tela de Treino Aprimorada

**User Story:** Como usuário na academia, quero uma tela de treino com cartões grandes, botões de ação rápida e campos fáceis de preencher, para que eu consiga registrar meu treino rapidamente sem precisar digitar muito.

#### Critérios de Aceitação

1. WHEN a Tela_de_Treino é carregada para um dia do tipo `workout`, THE Tela_de_Treino SHALL exibir cada exercício em um cartão grande com: nome do exercício em `text-lg font-bold`, séries planejadas × reps planejadas, campos numéricos para séries realizadas, reps realizadas e carga utilizada (kg).
2. WHEN a Tela_de_Treino é carregada para um dia do tipo `workout`, THE Tela_de_Treino SHALL exibir em cada cartão de exercício um botão "Concluído" de largura total que marca o exercício como `completed = true` e aplica estilo visual de destaque verde ao cartão.
3. WHEN um exercício é marcado como concluído, THE Tela_de_Treino SHALL exibir um indicador visual (ícone de check verde e borda verde) no cartão do exercício sem recarregar a página.
4. THE Tela_de_Treino SHALL exibir para cada exercício a comparação planejado vs. realizado: séries planejadas / séries realizadas e reps planejadas / reps realizadas.
5. WHEN o usuário toca no botão "+ Adicionar exercício extra", THE Tela_de_Treino SHALL exibir um formulário inline com campos para nome, séries e reps do exercício extra.
6. WHEN o usuário toca no botão "+ Registrar cardio", THE Tela_de_Treino SHALL exibir um campo para duração em minutos e um campo opcional para tipo de cardio (corrida, bicicleta, elíptico, outro).
7. THE Tela_de_Treino SHALL exibir o botão "Finalizar Treino" fixo na parte inferior da tela (`fixed bottom-0`), acima da `BottomNav`, com altura mínima de 56px e cor `bg-green-600`.
8. WHEN o usuário toca em "Finalizar Treino", THE Tela_de_Treino SHALL exibir um modal ou tela de resumo com: total de exercícios concluídos, total de séries, carga total levantada (kg) e duração estimada do treino.
9. WHEN o resumo do treino é exibido, THE Tela_de_Treino SHALL oferecer botão "Confirmar e Salvar" que persiste todas as execuções e navega de volta ao Dashboard.
10. WHEN a Tela_de_Treino é carregada para um dia do tipo `rest`, THE Tela_de_Treino SHALL exibir o formulário `DailyLogForm` para registro de peso, água e notas do dia de descanso.
11. WHEN a Tela_de_Treino é carregada para um dia do tipo `fight`, THE Tela_de_Treino SHALL exibir campos para duração da aula (minutos) e observações, com botão "Finalizar Aula".

---

### Requisito 7: Plano Semanal Aprimorado

**User Story:** Como usuário, quero uma tela de plano semanal com visualização por abas/cartões e edição fácil de exercícios, para que eu consiga configurar minha semana de treinos de forma rápida e intuitiva.

#### Critérios de Aceitação

1. THE Plano_Semanal SHALL exibir os 7 dias da semana como abas horizontais roláveis, com o dia atual destacado visualmente.
2. WHEN uma aba de dia é selecionada, THE Plano_Semanal SHALL exibir o conteúdo daquele dia (tipo do dia e lista de exercícios) sem recarregar a página.
3. THE Plano_Semanal SHALL exibir para cada dia na aba um indicador do tipo: ícone de haltere para `workout`, ícone de luva para `fight` e ícone de lua para `rest`.
4. WHEN o usuário seleciona o tipo do dia, THE Plano_Semanal SHALL exibir três botões de seleção claramente rotulados: "Musculação", "Luta" e "Descanso", com o tipo atual destacado.
5. WHEN o tipo do dia é alterado para `rest`, THE Plano_Semanal SHALL ocultar a lista de exercícios e o botão "Adicionar exercício" para aquele dia.
6. WHEN o usuário toca em "Editar" em um exercício, THE Plano_Semanal SHALL exibir o formulário de edição inline (sem navegação para outra página) com os dados do exercício pré-preenchidos.
7. WHEN o usuário salva a edição de um exercício, THE Plano_Semanal SHALL atualizar o exercício na lista imediatamente e exibir um Toast de sucesso.
8. WHEN o usuário toca em "Remover" em um exercício, THE Plano_Semanal SHALL exibir um diálogo de confirmação antes de remover o exercício.
9. THE Plano_Semanal SHALL permitir reordenar exercícios dentro de um dia usando botões de mover para cima e mover para baixo.

---

### Requisito 8: Histórico Aprimorado

**User Story:** Como usuário, quero ver meu histórico de treinos com cartões bem desenhados, filtros de período e detalhes completos de cada dia, para que eu consiga acompanhar minha evolução ao longo do tempo.

#### Critérios de Aceitação

1. THE Histórico SHALL exibir registros diários em ordem cronológica decrescente (mais recente primeiro).
2. THE Histórico SHALL oferecer filtros de período: "Semana atual", "Mês atual" e "Todos", exibidos como botões de seleção.
3. WHEN um filtro de período é selecionado, THE Histórico SHALL recarregar a lista de registros para o período correspondente sem recarregar a página.
4. WHEN um registro diário é exibido na lista, THE Histórico SHALL mostrar: data formatada (ex.: "seg, 12 jan 2025"), badge de status ("✓ Treinou" em verde ou "— Descanso" em cinza), peso registrado (kg) e água consumida (L) quando disponíveis.
5. WHEN um dia seguiu o plano semanal (`followedPlan = true`), THE Histórico SHALL destacar o cartão daquele dia com uma borda ou badge especial em azul ou verde.
6. WHEN o usuário toca em um cartão de registro, THE Histórico SHALL exibir os detalhes completos do dia: peso, água, status de treino, se seguiu o plano, exercícios executados (nome, séries, reps, carga), cardio registrado e notas.
7. WHEN os detalhes de um dia são exibidos, THE Histórico SHALL listar cada `ExerciseExecution` com: nome do exercício, séries realizadas × reps realizadas, carga utilizada (kg) quando disponível, e indicador de conclusão.
8. IF nenhum registro é encontrado para o período selecionado, THEN THE Histórico SHALL exibir o `Estado_Vazio` correspondente.

---

### Requisito 9: Metas Aprimoradas

**User Story:** Como usuário, quero ver minhas metas com barras de progresso visuais e informações detalhadas sobre peso atual, meta e IMC, para que eu tenha motivação e clareza sobre o quanto falta para atingir meus objetivos.

#### Critérios de Aceitação

1. THE Metas SHALL exibir barras de progresso visuais (`ProgressBar`) para: progresso de peso (peso inicial → peso atual → peso alvo), meta de água diária (média 7 dias vs. meta), meta de treinos semanais (realizados vs. planejados) e meta de cardio semanal (minutos realizados vs. meta).
2. THE Metas SHALL exibir um cartão de peso com: peso inicial, peso atual, peso alvo, diferença em kg (com sinal + ou −) e percentual de progresso em direção à meta.
3. WHEN o peso atual é menor ou igual ao peso alvo, THE Metas SHALL exibir um banner de parabéns com emoji 🎉 e mensagem "Você atingiu seu peso alvo!".
4. WHEN o peso atual e a altura do usuário estão disponíveis, THE Metas SHALL calcular e exibir o IMC com classificação textual (Abaixo do peso, Normal, Sobrepeso, Obesidade grau I/II/III) conforme tabela da OMS.
5. THE Metas SHALL exibir a quantidade restante para atingir a meta de peso (ex.: "Faltam 3,5 kg para sua meta").
6. WHEN o usuário ainda não definiu metas, THE Metas SHALL exibir o formulário `GoalsForm` diretamente, sem seção de progresso.
7. WHEN o usuário toca em "Editar", THE Metas SHALL exibir o formulário `GoalsForm` com os valores atuais pré-preenchidos.
8. WHEN o usuário salva as metas, THE Metas SHALL exibir um Toast de sucesso e retornar à visualização de progresso.

---

### Requisito 10: Check-in Diário Rápido

**User Story:** Como usuário, quero fazer um check-in rápido de peso e água diretamente do Dashboard, para que eu consiga registrar esses dados sem precisar navegar para outra tela.

#### Critérios de Aceitação

1. THE Dashboard SHALL exibir um cartão de "Check-in Diário" com campos inline para peso (kg) e água (L) do dia atual.
2. WHEN o usuário preenche o campo de peso e toca em "Salvar", THE Dashboard SHALL persistir o valor no `DailyLog` do dia atual e atualizar os cartões de métricas sem recarregar a página.
3. WHEN o usuário preenche o campo de água e toca em "Salvar", THE Dashboard SHALL persistir o valor no `DailyLog` do dia atual e atualizar os cartões de métricas sem recarregar a página.
4. WHEN um check-in já foi registrado para o dia atual, THE Dashboard SHALL exibir os valores já registrados nos campos do cartão de check-in, permitindo edição.
5. WHEN o check-in é salvo com sucesso, THE Dashboard SHALL exibir um Toast de sucesso.
6. IF o valor de peso informado está fora do intervalo 30–300 kg, THEN THE Dashboard SHALL exibir uma mensagem de erro inline no campo de peso sem salvar o dado.
7. IF o valor de água informado está fora do intervalo 0–10 L, THEN THE Dashboard SHALL exibir uma mensagem de erro inline no campo de água sem salvar o dado.

---

### Requisito 11: Mensagem Motivacional Diária

**User Story:** Como usuário, quero ver uma mensagem motivacional diferente a cada dia no Dashboard, para que eu me sinta encorajado a manter minha rotina de treinos.

#### Critérios de Aceitação

1. THE Dashboard SHALL exibir uma mensagem motivacional diária em um cartão destacado, selecionada de uma lista de pelo menos 30 mensagens em português.
2. WHEN a data do dia muda, THE Dashboard SHALL exibir uma mensagem diferente da do dia anterior.
3. THE App SHALL selecionar a mensagem do dia de forma determinística baseada na data atual (mesma mensagem para todos os usuários no mesmo dia).
4. THE mensagem motivacional SHALL ser exibida em `text-sm italic text-gray-300` dentro de um cartão com borda sutil.

---

### Requisito 12: Indicador de Consistência Semanal e Conquista "Semana Perfeita"

**User Story:** Como usuário, quero ver um indicador visual da minha consistência semanal e receber uma conquista quando completo todos os treinos planejados, para que eu me sinta motivado a não quebrar a sequência.

#### Critérios de Aceitação

1. THE Dashboard SHALL exibir um indicador de consistência semanal com 7 círculos representando os dias da semana (segunda a domingo), cada um colorido de verde (treinou/seguiu plano), cinza (descanso planejado) ou vermelho (treino planejado mas não realizado).
2. WHEN todos os dias de treino planejados da semana atual foram realizados, THE Dashboard SHALL exibir o badge "Semana Perfeita 🏆" em destaque dourado.
3. WHEN o badge "Semana Perfeita" é exibido, THE Dashboard SHALL mantê-lo visível até o final da semana (domingo).
4. THE indicador de consistência SHALL ser calculado com base nos dados de `DailyLog` e `WeeklyPlan` da semana atual.

---

### Requisito 13: Cálculo de IMC

**User Story:** Como usuário, quero que o app calcule meu IMC automaticamente com base no meu peso atual e altura cadastrada, para que eu tenha uma referência de saúde além do peso absoluto.

#### Critérios de Aceitação

1. THE App SHALL incluir um campo de altura (cm) na tela de Configurações e/ou no formulário de Metas.
2. WHEN o peso atual e a altura estão disponíveis, THE App SHALL calcular o IMC como `peso (kg) / (altura (m))²` com duas casas decimais.
3. THE App SHALL exibir o IMC calculado na tela de Metas com a classificação correspondente conforme tabela da OMS: Abaixo do peso (< 18,5), Normal (18,5–24,9), Sobrepeso (25–29,9), Obesidade grau I (30–34,9), Obesidade grau II (35–39,9), Obesidade grau III (≥ 40).
4. WHEN a altura não está cadastrada, THE App SHALL exibir na seção de IMC a mensagem "Cadastre sua altura nas Configurações para calcular o IMC" com link para `/settings`.

---

### Requisito 14: Tela de Configurações

**User Story:** Como usuário, quero uma tela de configurações onde eu possa editar meus dados pessoais (nome, altura, data de nascimento), para que o app possa personalizar cálculos como IMC e exibir meu nome corretamente.

#### Critérios de Aceitação

1. THE App SHALL disponibilizar uma tela de Configurações acessível via `/settings`, com link na `SideNav` (desktop) e em um ícone de engrenagem ou menu na `BottomNav` (mobile).
2. THE Configurações SHALL exibir e permitir editar os seguintes campos: nome de exibição, altura (cm, inteiro entre 100 e 250), data de nascimento (opcional).
3. WHEN o usuário salva as configurações, THE Configurações SHALL persistir os dados e exibir um Toast de sucesso.
4. WHEN o usuário salva as configurações com altura inválida (fora de 100–250 cm), THE Configurações SHALL exibir uma mensagem de erro inline no campo de altura sem salvar.
5. THE Configurações SHALL exibir o e-mail do usuário autenticado (somente leitura, sem possibilidade de edição direta).
6. THE Configurações SHALL incluir um botão "Sair" (logout) com confirmação antes de encerrar a sessão.

---

### Requisito 15: Foto de Progresso (Opcional)

**User Story:** Como usuário, quero poder registrar fotos de progresso corporal opcionalmente, para que eu possa comparar visualmente minha evolução ao longo do tempo.

#### Critérios de Aceitação

1. WHERE a funcionalidade de foto de progresso está habilitada, THE App SHALL exibir na tela de Configurações ou em uma seção dedicada um botão "Adicionar foto de progresso".
2. WHEN o usuário toca em "Adicionar foto de progresso", THE App SHALL abrir o seletor de arquivos nativo do dispositivo, aceitando apenas arquivos de imagem (JPEG, PNG, WebP) com tamanho máximo de 5 MB.
3. WHEN uma foto é selecionada e confirmada, THE App SHALL armazená-la associada à data atual e exibi-la em uma galeria cronológica na tela de Configurações ou seção dedicada.
4. IF o arquivo selecionado excede 5 MB ou não é uma imagem válida, THEN THE App SHALL exibir um Toast de erro com a mensagem "Arquivo inválido. Use uma imagem JPEG, PNG ou WebP de até 5 MB."
5. WHEN o usuário toca em uma foto na galeria, THE App SHALL exibi-la em tela cheia com a data de registro e opção de excluir.

---

### Requisito 16: Qualidade Técnica e Compatibilidade

**User Story:** Como desenvolvedor, quero que todas as melhorias sejam implementadas sem quebrar funcionalidades existentes, com TypeScript sem erros, build passando e testes mantidos, para que o app continue funcionando em produção no Vercel com Supabase e Prisma.

#### Critérios de Aceitação

1. WHEN `npm run build` é executado após as alterações, THE App SHALL compilar sem erros de TypeScript e sem falhas de build do Next.js.
2. WHEN `npm test` é executado após as alterações, THE App SHALL passar em todos os testes existentes sem regressões.
3. THE App SHALL manter compatibilidade com Supabase Auth, Prisma e Vercel sem alterações nas variáveis de ambiente existentes.
4. THE App SHALL utilizar apenas componentes e hooks já existentes como base, estendendo-os em vez de substituí-los quando possível.
5. THE App SHALL extrair componentes reutilizáveis (ex.: `ProgressBar`, `EmptyState`, `SkeletonCard`, `Toast`) para `src/components/ui/` quando usados em mais de uma tela.
6. WHEN um novo componente é criado, THE App SHALL incluir tipagem TypeScript completa sem uso de `any`.
7. THE App SHALL manter layout responsivo funcional em viewports de 320px a 1440px de largura.
8. THE App SHALL preservar todos os atributos de acessibilidade existentes (`aria-label`, `role`, `aria-current`, `aria-pressed`) e adicionar os equivalentes em novos componentes.
