# Requirements Document

## Introduction

O Fitness Tracker é uma aplicação web responsiva (mobile-first e desktop) para controle de treino, evolução física, emagrecimento e definição corporal. O sistema permite ao usuário organizar sua rotina semanal de treinos, registrar a execução diária, acompanhar métricas de saúde (peso, água, cardio) e visualizar sua evolução ao longo do tempo. A aplicação é construída com React/Next.js, TypeScript e Tailwind CSS, com persistência inicial via LocalStorage e arquitetura preparada para migração futura a Firebase ou PostgreSQL.

---

## Glossary

- **App**: A aplicação Fitness Tracker como um todo.
- **Dashboard**: Tela inicial com resumo das métricas e atalhos principais.
- **Plano Semanal**: Conjunto de treinos configurados para cada dia da semana.
- **Treino**: Conjunto de exercícios planejados para um dia específico da semana.
- **Exercício**: Unidade de atividade física com nome, grupo muscular, séries, repetições, carga e descanso.
- **Registro Diário**: Entrada de dados do usuário para um dia específico, contendo peso, hidratação, presença no treino e observações.
- **Execução de Exercício**: Registro dos dados reais de um exercício realizado (séries, repetições, carga).
- **Streak**: Contagem consecutiva de dias com Registro Diário preenchido.
- **Meta**: Objetivo numérico definido pelo usuário (peso alvo, água diária, treinos por semana, cardio semanal).
- **Cardio**: Atividade cardiovascular registrada em minutos, podendo ser parte do treino planejado ou extra.
- **Histórico**: Lista cronológica de Registros Diários e Execuções de Exercício.
- **LocalStorage**: Mecanismo de persistência de dados no navegador do usuário.
- **Storage_Service**: Módulo responsável por abstrair operações de leitura e escrita de dados, permitindo troca futura de backend.
- **UI_Component**: Componente React reutilizável de interface.
- **Validator**: Módulo responsável por validar entradas de formulários.
- **Chart**: Componente de visualização gráfica de dados.

---

## Requirements

### Requirement 1: Dashboard Inicial

**User Story:** Como usuário, quero ver um resumo da minha evolução e do meu dia na tela inicial, para que eu possa acompanhar meu progresso rapidamente sem navegar por múltiplas telas.

#### Acceptance Criteria

1. THE App SHALL exibir o Dashboard como tela inicial ao ser carregado.
2. WHEN o Dashboard é carregado, THE Dashboard SHALL exibir um card com o peso atual do usuário, obtido do Registro Diário mais recente.
3. WHEN o Dashboard é carregado, THE Dashboard SHALL exibir um card com a meta de peso definida pelo usuário.
4. WHEN o Dashboard é carregado, THE Dashboard SHALL calcular e exibir o peso perdido como a diferença entre o peso inicial registrado nas Metas e o peso atual.
5. WHEN o Dashboard é carregado, THE Dashboard SHALL calcular e exibir o Streak atual de dias consecutivos com Registro Diário preenchido.
6. WHEN o Dashboard é carregado, THE Dashboard SHALL calcular e exibir o percentual de execução da semana corrente como a razão entre dias com treino realizado e dias com treino planejado na semana.
7. WHEN o Dashboard é carregado, THE Dashboard SHALL exibir o consumo médio de água dos últimos 7 dias com Registro Diário preenchido.
8. WHEN o Dashboard é carregado, THE Dashboard SHALL identificar e exibir o Treino planejado para o dia atual com base no Plano Semanal.
9. IF nenhum Treino estiver planejado para o dia atual, THEN THE Dashboard SHALL exibir a mensagem "Dia de descanso" no card de próximo treino.
10. WHEN o Dashboard é carregado, THE Dashboard SHALL exibir um Chart de evolução do peso com os últimos 30 Registros Diários que contenham peso.
11. WHEN o Dashboard é carregado, THE Dashboard SHALL exibir um Chart de frequência de treinos com os últimos 30 dias, indicando dias treinados e dias de descanso.
12. WHEN o Dashboard é carregado, THE Dashboard SHALL exibir um Chart de consumo de água por dia dos últimos 7 dias.
13. IF não houver dados suficientes para um Chart, THEN THE Dashboard SHALL exibir uma mensagem indicando ausência de dados no lugar do Chart.

---

### Requirement 2: Plano Semanal de Treinos

**User Story:** Como usuário, quero configurar os treinos de cada dia da semana, para que o App saiba automaticamente o que devo treinar em cada dia.

#### Acceptance Criteria

1. THE App SHALL disponibilizar uma tela de Plano Semanal com os sete dias da semana listados.
2. WHEN o Plano Semanal é carregado pela primeira vez, THE App SHALL pré-popular o Plano Semanal com os dados iniciais definidos na especificação do projeto.
3. WHEN o usuário seleciona um dia da semana, THE App SHALL exibir a lista de Exercícios planejados para aquele dia.
4. WHEN o usuário aciona a opção de adicionar exercício em um dia, THE App SHALL exibir um formulário de cadastro de Exercício vinculado àquele dia.
5. WHEN o usuário aciona a opção de editar um Exercício existente, THE App SHALL exibir o formulário de cadastro preenchido com os dados do Exercício selecionado.
6. WHEN o usuário aciona a opção de remover um Exercício, THE App SHALL exibir uma confirmação antes de excluir o Exercício do Plano Semanal.
7. WHEN o usuário confirma a remoção, THE Storage_Service SHALL remover o Exercício do Plano Semanal e THE App SHALL atualizar a lista exibida.
8. THE App SHALL permitir reordenar os Exercícios dentro de um dia do Plano Semanal.
9. WHEN o usuário define um dia como "Descanso", THE App SHALL remover todos os Exercícios daquele dia e marcar o dia como sem treino planejado.
10. WHEN o usuário define um dia como "Luta", THE App SHALL marcar o dia com tipo "Luta" e exibir campo de observações livres, sem exigir cadastro de Exercícios estruturados.

---

### Requirement 3: Cadastro de Exercícios

**User Story:** Como usuário, quero cadastrar exercícios com detalhes de séries, repetições e carga, para que eu tenha um plano preciso a seguir durante o treino.

#### Acceptance Criteria

1. THE Validator SHALL exigir que o campo "Nome do exercício" seja preenchido com no mínimo 2 caracteres antes de salvar.
2. THE Validator SHALL exigir que o campo "Grupo muscular" seja selecionado antes de salvar.
3. THE Validator SHALL exigir que o campo "Séries previstas" seja um número inteiro entre 1 e 20 antes de salvar.
4. THE Validator SHALL exigir que o campo "Repetições previstas" seja um número inteiro entre 1 e 100 ou um intervalo no formato "N–M" antes de salvar.
5. THE App SHALL disponibilizar o campo "Carga prevista" em quilogramas como campo opcional.
6. THE App SHALL disponibilizar o campo "Descanso entre séries" em segundos como campo opcional.
7. THE App SHALL disponibilizar o campo "Observações" como campo de texto livre opcional.
8. WHEN o usuário salva um Exercício válido, THE Storage_Service SHALL persistir o Exercício no Plano Semanal do dia correspondente.
9. IF o Validator identificar campos inválidos, THEN THE App SHALL exibir mensagens de erro específicas por campo sem fechar o formulário.
10. THE App SHALL disponibilizar os seguintes grupos musculares como opções: Peito, Costas, Ombro, Bíceps, Tríceps, Perna, Abdômen, Glúteo, Cardio, Outro.

---

### Requirement 4: Registro Diário

**User Story:** Como usuário, quero registrar diariamente meu peso, hidratação e presença no treino, para que o App possa calcular minha evolução e manter meu Streak.

#### Acceptance Criteria

1. THE App SHALL disponibilizar uma tela de Registro Diário acessível a partir do Dashboard e do menu de navegação.
2. WHEN o usuário acessa o Registro Diário, THE App SHALL pré-selecionar a data atual no campo de data.
3. THE App SHALL permitir que o usuário selecione qualquer data passada para editar ou criar um Registro Diário.
4. THE Validator SHALL exigir que o campo "Peso do dia" seja um número decimal entre 30,0 e 300,0 kg antes de salvar.
5. THE Validator SHALL exigir que o campo "Água consumida" seja um número decimal entre 0,0 e 10,0 litros antes de salvar.
6. THE App SHALL disponibilizar o campo "Treinou hoje" como seleção binária (Sim/Não).
7. THE App SHALL disponibilizar o campo "Executou treino previsto" como seleção binária (Sim/Não).
8. THE App SHALL disponibilizar o campo "Fez algo diferente" como seleção binária (Sim/Não) com campo de texto para descrição quando selecionado "Sim".
9. THE App SHALL disponibilizar o campo "Observações" como campo de texto livre opcional.
10. WHEN o usuário salva um Registro Diário válido, THE Storage_Service SHALL persistir o registro associado à data selecionada.
11. IF já existir um Registro Diário para a data selecionada, THEN THE App SHALL carregar os dados existentes no formulário para edição.
12. WHEN o usuário salva um Registro Diário, THE Dashboard SHALL recalcular e atualizar o Streak, o peso atual e o consumo médio de água.

---

### Requirement 5: Tela do Treino do Dia

**User Story:** Como usuário, quero ver e executar o treino planejado para o dia atual, para que eu possa registrar meu desempenho em tempo real durante o treino.

#### Acceptance Criteria

1. THE App SHALL disponibilizar uma tela de Treino do Dia acessível a partir do Dashboard e do menu de navegação.
2. WHEN a tela do Treino do Dia é carregada, THE App SHALL exibir automaticamente os Exercícios planejados para o dia atual com base no Plano Semanal.
3. WHEN o usuário marca um Exercício como concluído, THE App SHALL registrar a conclusão e aplicar destaque visual ao Exercício na lista.
4. THE App SHALL disponibilizar campos para registrar séries realizadas, repetições realizadas e carga usada por Exercício durante a execução.
5. THE App SHALL disponibilizar a opção de adicionar um Exercício extra não previsto no Plano Semanal para o dia atual.
6. THE App SHALL disponibilizar a opção de registrar cardio com campo de duração em minutos.
7. WHEN o usuário aciona "Finalizar Treino", THE Storage_Service SHALL persistir todas as Execuções de Exercício registradas associadas à data atual.
8. WHEN o treino é finalizado, THE App SHALL atualizar automaticamente o Registro Diário do dia com "Treinou hoje: Sim" e "Executou treino previsto: Sim".
9. IF o dia atual for do tipo "Luta" no Plano Semanal, THEN THE App SHALL exibir a tela do Treino do Dia com campo de observações livres e opção de registrar duração da aula.
10. IF o dia atual for "Descanso" no Plano Semanal, THEN THE App SHALL exibir mensagem de descanso e permitir apenas o registro de peso, água e observações.

---

### Requirement 6: Registro de Execução por Exercício

**User Story:** Como usuário, quero registrar os dados reais de cada exercício executado, para que eu possa comparar meu desempenho com o planejado e acompanhar minha evolução de carga.

#### Acceptance Criteria

1. THE App SHALL exibir, para cada Exercício na tela do Treino do Dia, os valores planejados de séries, repetições e carga como referência.
2. THE App SHALL disponibilizar campos editáveis para séries realizadas, repetições realizadas e carga usada por Exercício.
3. THE Validator SHALL exigir que séries realizadas seja um número inteiro entre 0 e 20 antes de salvar.
4. THE Validator SHALL exigir que repetições realizadas seja um número inteiro entre 0 e 100 antes de salvar.
5. THE App SHALL disponibilizar o campo "Carga usada" em quilogramas como campo opcional na Execução de Exercício.
6. THE App SHALL disponibilizar o campo "Concluiu" como seleção binária (Sim/Não) por Exercício.
7. THE App SHALL disponibilizar o campo "Observação" como campo de texto livre opcional por Exercício.
8. WHEN o usuário salva uma Execução de Exercício válida, THE Storage_Service SHALL persistir a execução associada ao Exercício e à data atual.
9. IF o Validator identificar campos inválidos na Execução de Exercício, THEN THE App SHALL exibir mensagens de erro específicas por campo sem fechar o formulário.

---

### Requirement 7: Histórico

**User Story:** Como usuário, quero visualizar meu histórico de treinos e registros diários, para que eu possa revisar minha evolução e identificar padrões ao longo do tempo.

#### Acceptance Criteria

1. THE App SHALL disponibilizar uma tela de Histórico acessível pelo menu de navegação.
2. WHEN a tela de Histórico é carregada, THE App SHALL exibir a lista de Registros Diários em ordem cronológica decrescente.
3. THE App SHALL disponibilizar filtros de período: semana atual, mês atual e todos os registros.
4. WHEN o usuário seleciona um filtro de período, THE App SHALL atualizar a lista exibindo apenas os Registros Diários dentro do período selecionado.
5. WHEN o usuário seleciona um Registro Diário na lista, THE App SHALL exibir os detalhes do registro incluindo peso, água, presença no treino e observações.
6. WHEN o usuário seleciona um Registro Diário que possui Execuções de Exercício associadas, THE App SHALL exibir a lista de Exercícios executados com séries, repetições e carga realizadas.
7. THE App SHALL exibir, para cada entrada do Histórico, a data, o peso registrado, o volume de água e um indicador visual de presença no treino.
8. IF não houver Registros Diários para o período selecionado, THEN THE App SHALL exibir uma mensagem indicando ausência de dados para o período.

---

### Requirement 8: Metas

**User Story:** Como usuário, quero definir minhas metas de peso, hidratação e frequência de treino, para que o App possa calcular meu progresso e me motivar a atingir meus objetivos.

#### Acceptance Criteria

1. THE App SHALL disponibilizar uma tela de Metas acessível pelo menu de navegação.
2. THE Validator SHALL exigir que o campo "Peso inicial" seja um número decimal entre 30,0 e 300,0 kg antes de salvar.
3. THE Validator SHALL exigir que o campo "Peso alvo" seja um número decimal entre 30,0 e 300,0 kg antes de salvar.
4. THE Validator SHALL exigir que o campo "Meta de água diária" seja um número decimal entre 0,5 e 10,0 litros antes de salvar.
5. THE Validator SHALL exigir que o campo "Meta de treinos por semana" seja um número inteiro entre 1 e 7 antes de salvar.
6. THE Validator SHALL exigir que o campo "Meta de cardio semanal" seja um número inteiro entre 0 e 600 minutos antes de salvar.
7. WHEN o usuário salva as Metas válidas, THE Storage_Service SHALL persistir as Metas no LocalStorage.
8. WHEN as Metas são salvas, THE Dashboard SHALL recalcular e atualizar os cards de meta de peso e peso perdido.
9. THE App SHALL exibir na tela de Metas o progresso atual em relação a cada meta definida, calculado com base nos Registros Diários existentes.
10. IF o peso atual for menor ou igual ao peso alvo, THEN THE App SHALL exibir uma mensagem de parabéns na tela de Metas.

---

### Requirement 9: Persistência e Arquitetura de Dados

**User Story:** Como desenvolvedor, quero que os dados sejam persistidos localmente e que a arquitetura permita migração futura para um backend remoto, para que o App funcione offline e possa escalar no futuro.

#### Acceptance Criteria

1. THE Storage_Service SHALL abstrair todas as operações de leitura e escrita de dados, de modo que nenhum componente de UI acesse o LocalStorage diretamente.
2. THE Storage_Service SHALL persistir todos os dados no LocalStorage usando chaves prefixadas com "fitness-tracker:".
3. WHEN o App é carregado pela primeira vez sem dados existentes, THE Storage_Service SHALL inicializar o LocalStorage com os dados mockados do Plano Semanal padrão.
4. THE Storage_Service SHALL expor métodos separados para cada entidade: Plano Semanal, Exercício, Registro Diário, Execução de Exercício e Metas.
5. THE Storage_Service SHALL serializar e desserializar dados em formato JSON ao ler e escrever no LocalStorage.
6. FOR ALL dados serializados e desserializados pelo Storage_Service, a desserialização do dado serializado SHALL produzir um objeto equivalente ao original (propriedade de round-trip).
7. THE App SHALL separar o código em camadas distintas: dados (Storage_Service, tipos TypeScript), componentes (UI_Components reutilizáveis) e páginas (telas do App).
8. THE Storage_Service SHALL ser implementado com uma interface que permita substituição por um adaptador Firebase ou PostgreSQL sem alteração nos componentes de UI.

---

### Requirement 10: Interface e Experiência do Usuário

**User Story:** Como usuário, quero uma interface rápida, visualmente agradável e fácil de usar no celular e no desktop, para que eu possa registrar meus treinos sem fricção antes, durante e depois do exercício.

#### Acceptance Criteria

1. THE App SHALL aplicar dark mode como tema padrão em toda a interface.
2. THE App SHALL utilizar layout mobile-first com breakpoints responsivos para desktop.
3. THE App SHALL utilizar cards com bordas arredondadas para exibição de informações agrupadas.
4. THE App SHALL utilizar botões com área de toque mínima de 44x44 pixels para garantir usabilidade em dispositivos móveis.
5. THE App SHALL utilizar cores de destaque para indicar progresso, conclusão e alertas, distintas das cores de fundo.
6. THE App SHALL disponibilizar um menu de navegação inferior fixo em dispositivos móveis com acesso às telas principais: Dashboard, Treino do Dia, Histórico, Plano Semanal e Metas.
7. THE App SHALL disponibilizar um menu de navegação lateral ou superior em dispositivos desktop com acesso às mesmas telas principais.
8. WHEN uma operação de leitura ou escrita no Storage_Service está em andamento, THE App SHALL exibir um indicador visual de carregamento.
9. WHEN o usuário realiza uma ação de salvar com sucesso, THE App SHALL exibir uma notificação de confirmação visível por no mínimo 2 segundos.
10. IF uma operação de escrita no Storage_Service falhar, THEN THE App SHALL exibir uma mensagem de erro descritiva ao usuário.
11. THE App SHALL ser renderizado corretamente nos navegadores Chrome, Firefox e Safari nas versões estáveis mais recentes.

---

### Requirement 11: Dados Iniciais do Plano Semanal

**User Story:** Como usuário novo, quero que o App já venha com meu plano de treino pré-configurado, para que eu possa começar a registrar meus treinos imediatamente sem precisar cadastrar todos os exercícios manualmente.

#### Acceptance Criteria

1. WHEN o App é inicializado sem dados existentes no LocalStorage, THE Storage_Service SHALL carregar o Plano Semanal padrão com os seguintes dias e exercícios:
   - Segunda-feira: Peito + Tríceps + Cardio (Supino reto 3x10–12, Supino inclinado 3x10–12, Crucifixo 3x12–15, Crossover 3x12–15, Tríceps corda 3x12–15, Tríceps banco 3x10–12, Cardio 20–30min)
   - Terça-feira: Costas + Bíceps + Cardio (Puxada na frente 3x10–12, Remada máquina 3x10–12, Remada baixa 3x12–15, Pull-over/Pulldown 3x12–15, Rosca direta 3x10–12, Rosca alternada 3x12–15, Cardio 20–30min)
   - Quarta-feira: Luta (Aula de luta, observações livres)
   - Quinta-feira: Perna + Cardio (Agachamento 3x10–12, Leg press 3x10–12, Cadeira extensora 3x12–15, Cadeira flexora 3x12–15, Panturrilha 3x15–20, Cardio 20–25min)
   - Sexta-feira: Ombro + Abdômen + Cardio (Elevação lateral 3x12–15, Desenvolvimento 3x10–12, Elevação frontal 3x12–15, Encolhimento 3x12–15, Abdominal 3x15–20, Prancha 3x30–40s, Cardio 20–30min)
   - Sábado: Luta (Aula de luta, observações livres)
   - Domingo: Descanso (Sem treino previsto, permitir registrar peso, água e observações)
2. WHEN o App é inicializado com dados existentes no LocalStorage, THE Storage_Service SHALL carregar os dados existentes sem sobrescrever o Plano Semanal do usuário.
