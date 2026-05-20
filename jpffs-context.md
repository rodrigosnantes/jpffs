# JPFFS — Contexto Completo do Projeto

> **JPFFS Manager** — Sistema de gerenciamento de peladas de futebol (society/futsal) para grupos amadores.
> Controla jogadores, sorteio de times balanceados, partidas ao vivo com placar em tempo real, estatísticas, temporadas, presença e mais.

---

## 1. Tech Stack

| Camada | Tecnologia | Detalhes |
|---|---|---|
| **Framework** | React 19 + TypeScript 5.9 | SPA com Vite 7 |
| **Build** | Vite | `yarn dev` / `yarn build` |
| **Estilização** | Tailwind CSS 3 + PostCSS | Classes utilitárias + variáveis CSS customizadas para temas |
| **Estado Global** | Zustand 5 | `useStore` (app) + `useAuthStore` (auth) |
| **Backend/DB** | Supabase (Postgres + Auth + Realtime) | Client em `src/lib/supabase.ts` |
| **Roteamento** | React Router DOM 7 | Rotas protegidas via `ProtectedRoute` |
| **Animações** | Framer Motion 12 | Animações de UI |
| **Gráficos** | Recharts 3 | Radar chart de atributos, gráficos de stats |
| **Ícones** | Lucide React | Toda iconografia |
| **Utilitários** | clsx + tailwind-merge (`cn`) | Merge condicional de classes |
| **Captura de Tela** | html2canvas | Exportação de cards de jogador |
| **Package Manager** | Yarn 1 | `yarn.lock` presente |

---

## 2. Estrutura de Diretórios

```
jpffs/
├── src/
│   ├── App.tsx                  # Root: ThemeProvider > ToastProvider > AppInner (rotas)
│   ├── main.tsx                 # Entry point React
│   ├── index.css                # Estilos globais + variáveis CSS
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx       # Wrapper com Sidebar + conteúdo
│   │   │   ├── Sidebar.tsx      # Navegação principal (colapsável, mobile, temas)
│   │   │   └── ProtectedRoute.tsx # Redireciona para /login se não autenticado
│   │   ├── match/
│   │   │   ├── MatchControlPanel.tsx # Painel de controle da partida ao vivo
│   │   │   └── EventModal.tsx   # Modal para registrar gols, cartões etc.
│   │   ├── player/
│   │   │   └── PlayerCard.tsx   # Card do jogador estilo FIFA
│   │   ├── season/
│   │   │   └── SeasonStats.tsx  # Estatísticas filtradas por temporada
│   │   └── ui/
│   │       ├── Button.tsx       # Botão reutilizável
│   │       ├── Card.tsx         # Container card
│   │       ├── Input.tsx        # Input reutilizável
│   │       ├── Modal.tsx        # Modal genérico
│   │       ├── PlayerProfile.tsx # Componente de perfil visual do jogador
│   │       └── ToastContainer.tsx # Container de toasts (notificações em tempo real)
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx        # Página inicial com resumo geral
│   │   ├── Players.tsx          # Lista de jogadores + CRUD (admin)
│   │   ├── PlayerEdit.tsx       # Edição detalhada de jogador (atributos, radar)
│   │   ├── PlayerProfile.tsx    # Perfil público do jogador (/jogadores/:id)
│   │   ├── Teams.tsx            # Sorteio de times (admin)
│   │   ├── Matches.tsx          # Histórico de partidas
│   │   ├── MatchDetail.tsx      # Detalhes de uma partida específica
│   │   ├── Attendance.tsx       # Controle de presença (admin)
│   │   ├── Leaderboard.tsx      # Classificação / rankings
│   │   ├── Seasons.tsx          # Gestão de temporadas (admin)
│   │   ├── AdminPanel.tsx       # Painel administrativo
│   │   ├── Profile.tsx          # Perfil do usuário logado
│   │   ├── Login.tsx            # Tela de login
│   │   └── SignUp.tsx           # Tela de cadastro
│   │
│   ├── store/
│   │   ├── useStore.ts          # Estado principal (players, matches, live match, teams)
│   │   └── useAuthStore.ts      # Autenticação (user, role, isAdmin)
│   │
│   ├── hooks/
│   │   └── useRealtime.ts       # Supabase Realtime: toasts de eventos de partida
│   │
│   ├── contexts/
│   │   ├── ThemeContext.tsx      # Sistema de temas (6 temas com variáveis CSS)
│   │   └── ToastContext.tsx      # Sistema de toasts (notificações)
│   │
│   ├── types/
│   │   └── index.ts             # Tipos TypeScript (Player, Match, MatchEvent, etc.)
│   │
│   ├── utils/
│   │   ├── teamSorter.ts        # Algoritmo de sorteio de times (snake draft)
│   │   └── cn.ts                # Utilitário clsx + tailwind-merge
│   │
│   ├── lib/
│   │   └── supabase.ts          # Client Supabase (env vars)
│   │
│   └── assets/
│       └── Logo.png             # Logo do JPFFS
│
├── supabase/
│   └── migrations/              # Scripts de migração SQL (múltiplos, executados manualmente no Supabase)
├── roadmap                      # Roadmap de funcionalidades futuras
├── .env                         # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── generate-mock-users.js       # Script utilitário para gerar usuários de teste
```

---

## 3. Banco de Dados (Supabase / Postgres)

### 3.1 Tabelas Principais

| Tabela | Descrição | Colunas-Chave |
|---|---|---|
| **profiles** | Dados do usuário logado | `id` (ref auth.users), `email`, `name`, `role` (`admin`/`user`), `avatar_url`, `nickname`, `birth_date`, `phone`, `age`, `favorite_team`, `status` (`active`/`inactive`) |
| **players** | Jogadores cadastrados | `id`, `name`, `position` (`Goalkeeper`/`Line`), `level` (1-5), `plan` (`Legendary`/`Pro`/`Amateur`), `profile_id` (ref profiles), `attributes` (JSONB: attack, defense, pace, shooting, physical, passing), `stats` (JSONB: goals, assists, wins, draws, losses, matches_played, yellow_cards, red_cards) |
| **matches** | Partidas registradas | `id`, `date`, `status` (`scheduled`/`live`/`finished`), `team_a_score`, `team_b_score`, `team_a_players` (JSONB array de IDs), `team_b_players` (JSONB), `duration` (seg), `season_id` (ref seasons) |
| **match_events** | Eventos de partida | `id`, `match_id`, `player_id`, `type` (`Goal`/`OwnGoal`/`YellowCard`/`RedCard`), `timestamp`, `assist_id`, `team` (`A`/`B`) |
| **seasons** | Temporadas | `id`, `name`, `start_date`, `end_date`, `is_active` (apenas 1 ativa por vez via trigger) |
| **attendance** | Presença dos jogadores | `id`, `player_id`, `date`, `confirmed`, unique(player_id, date) |

### 3.2 Relações
- `profiles.id` → `auth.users.id` (1:1)
- `players.profile_id` → `profiles.id` (1:1, opcional)
- `match_events.match_id` → `matches.id` (N:1, cascade delete)
- `match_events.player_id` → `players.id` (N:1)
- `match_events.assist_id` → `players.id` (N:1, opcional)
- `matches.season_id` → `seasons.id` (N:1)
- `attendance.player_id` → `players.id` (N:1, cascade delete)

### 3.3 Triggers
- **`handle_new_user()`** — Ao criar usuário no `auth.users`, cria automaticamente um registro em `profiles` e em `players` (position padrão 'Line', level 3).
- **`enforce_single_active_season()`** — Garante que apenas uma temporada esteja ativa por vez.

### 3.4 Row Level Security (RLS)
- Todas as tabelas têm RLS habilitado.
- **SELECT**: público para todos (autenticados).
- **INSERT/UPDATE/DELETE**: restrito a admins via função `is_admin()` (verifica `profiles.role = 'admin'`).
- **Profiles**: cada usuário pode ver/editar seu próprio perfil; admins podem ver todos.

---

## 4. Autenticação e Autorização

### 4.1 Auth Flow
- Supabase Auth com email/senha (`signInWithPassword`).
- `useAuthStore.initialize()` usa `onAuthStateChange` como fonte única de verdade.
- Ao detectar sessão, busca o role do usuário na tabela `profiles`.
- `isAdmin` é derivado de `role === 'admin'`.

### 4.2 Rotas
| Rota | Acesso | Página |
|---|---|---|
| `/login` | Público | Login |
| `/signup` | Público | Cadastro |
| `/` | Autenticado | Dashboard |
| `/profile` | Autenticado | Perfil do usuário |
| `/players` | Autenticado | Lista de jogadores |
| `/players/:id` | Autenticado | Edição de jogador |
| `/jogadores/:id` | Autenticado | Perfil público do jogador |
| `/leaderboard` | Autenticado | Classificação |
| `/matches` | Autenticado | Histórico de partidas |
| `/matches/:id` | Autenticado | Detalhes de uma partida |
| `/teams` | **Admin** | Sorteio de times |
| `/attendance` | **Admin** | Controle de presença |
| `/seasons` | **Admin** | Gestão de temporadas |
| `/admin` | Autenticado* | Painel Admin |

---

## 5. Estado Global (Zustand)

### 5.1 `useStore` — Estado Principal
```typescript
interface AppState {
    players: Player[];
    matches: Match[];
    generatedTeams: { teams: Team[], bench: Player[] } | null;
    lastMVP: { id, name, goals, assists, team } | null;
    currentMatch: LiveMatchState & { teamAPlayers?, teamBPlayers? };
    isSidebarOpen: boolean;

    // Actions
    fetchPlayers(): Promise<void>;    // SELECT players + LEFT JOIN profiles
    fetchMatches(): Promise<void>;    // SELECT matches ORDER BY date DESC
    addPlayer(data): Promise<void>;   // INSERT into players
    updatePlayer(id, updates): Promise<void>;
    deletePlayer(id): Promise<void>;  // DELETE player + profile associado
    setGeneratedTeams(data): void;

    // Match Actions
    startMatch(teamA, teamB): Promise<{ error? }>;  // INSERT match (status: 'live')
    pauseMatch(): void;              // Pausa cronômetro local
    resumeMatch(): void;             // Retoma cronômetro local
    endMatch(): void;                // UPDATE match status 'finished' + calcula stats + MVP
    addEvent(event): void;           // INSERT match_event + atualiza placar
    resetMatch(): void;
    clearMVP(): void;
}
```

### 5.2 `useAuthStore` — Autenticação
```typescript
interface AuthState {
    user: User | null;
    role: 'admin' | 'user' | null;
    name: string | null;
    isLoading: boolean;
    isAdmin: boolean;

    initialize(): void;
    signIn(email, password): Promise<{ error }>;
    signOut(): Promise<{ error }>;
    fetchRole(userId): Promise<void>;
}
```

---

## 6. Funcionalidades Implementadas

### 6.1 Jogadores
- **CRUD completo**: criar, editar, excluir jogadores.
- **Atributos estilo FIFA**: attack, defense, pace, shooting, physical, passing (radar chart via Recharts).
- **Nível**: 1 a 5 (usado no sorteio balanceado).
- **Posição**: Goalkeeper ou Line.
- **Plano de sócio**: Legendary, Pro, Amateur.
- **Stats acumuladas**: partidas jogadas, vitórias, empates, derrotas, gols, assistências, cartões.
- **Foto**: via `photo_url` (Supabase Storage).
- **Perfil público**: `/jogadores/:id`.
- **Apelido**: vem da tabela `profiles.nickname`.
- **Status**: ativo/inativo (da tabela `profiles.status`).

### 6.2 Sorteio de Times (`teamSorter.ts`)
- **Modo Balanceado (padrão)**: Snake Draft por nível (melhor → pior → pior → melhor).
  - Goleiros distribuídos aleatoriamente (máx 1 por time).
  - Se faltam goleiros, cria "Goleiro Genérico" (level 3) para completar.
- **Modo Aleatório**: shuffle completo, ignora nível e posição.
- **Configurável**: jogadores por time, fill de GKs genéricos.
- **Banco**: jogadores excedentes ficam no banco.

### 6.3 Partidas ao Vivo
- **Início**: requer temporada ativa; cria match com status 'live' no Supabase.
- **Cronômetro**: pausar/resumir com acumulação de tempo decorrido.
- **Eventos**: Goal, OwnGoal, YellowCard, RedCard (com assistência opcional).
- **Placar**: atualizado no Supabase em tempo real a cada gol/gol-contra.
- **Encerramento**: calcula stats de todos os jogadores (gols, assists, W/D/L, cartões), calcula MVP automático (fórmula: goals×2 + assists), atualiza no DB.
- **Realtime**: via `useRealtime` hook — escuta INSERTs na tabela `match_events` via Supabase Realtime e exibe toasts com tipo do evento (⚽ GOL, 🟡 Amarelo, etc.).

### 6.4 Temporadas
- Nome, data início/fim, flag `is_active`.
- Trigger garante apenas 1 temporada ativa.
- Partidas vinculadas à temporada ativa no momento do início.
- Página de gestão (admin): criar, ativar/desativar, visualizar.

### 6.5 Presença (Attendance)
- Controle de presença por data.
- Cada jogador pode confirmar/desconfirmar presença.
- Constraint unique (player_id, date).

### 6.6 Dashboard
- Visão geral com estatísticas agregadas.

### 6.7 Leaderboard / Classificação
- Rankings de jogadores (artilheiros, estatísticas gerais).

### 6.8 Perfil do Usuário
- Edição de dados pessoais (nome, apelido, data nascimento, telefone, time favorito).
- Troca de foto.

### 6.9 Painel Admin
- Gerenciamento de jogadores, partidas, temporadas.
- Funcionalidades restritas por role.

### 6.10 Sistema de Temas
- 6 temas: Dark ⚫, Light ⚪, Midnight 🟣, Forest 🟢, Sunset 🟠, Ocean 🔵.
- Variáveis CSS: `--color-background`, `--color-surface`, `--color-primary`, `--color-secondary`, `--color-text`, `--color-muted`.
- Persistido em `localStorage` (key: `jpffs-theme`).
- Seletor no footer da Sidebar.

### 6.11 Toasts / Notificações
- Sistema de toasts para notificações em tempo real.
- Tipos: goal, owngoal, yellow, red, assist, info.
- Auto-dismiss após 5s, máx 5 simultâneos.

---

## 7. Padrões e Convenções do Código

### 7.1 Linguagem
- **UI e labels**: Português brasileiro (ex: "Jogadores", "Partidas", "Classificação").
- **Código e tipos**: Inglês (ex: `Player`, `Match`, `fetchPlayers`).
- **Enums no DB**: Inglês (ex: `Goalkeeper`, `Line`, `Goal`, `scheduled`, `live`, `finished`).

### 7.2 Estrutura de Componentes
- Componentes funcionais com hooks.
- Cada página é um arquivo em `src/pages/`.
- Componentes reutilizáveis em `src/components/ui/`.
- Componentes de domínio em pastas específicas (`match/`, `player/`, `season/`).

### 7.3 Estilização
- Tailwind CSS com classes utilitárias.
- Variáveis CSS customizadas para sistema de temas.
- Utilitário `cn()` (clsx + tailwind-merge) para composição de classes.

### 7.4 Data Fetching
- Supabase Client direto (sem camada de API separada).
- Fetch no init do App (`fetchPlayers`, `fetchMatches`).
- CRUD no store Zustand com atualização otimista.

### 7.5 Variáveis de Ambiente
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

---

## 8. SQL Migrations (Arquivos na Raiz)

| Arquivo | Propósito |
|---|---|
| `supabase_schema.sql` | Schema inicial: profiles, players, matches, match_events + RLS |
| `admin_roles_schema.sql` | Sistema de roles admin + função `is_admin()` + RLS restritivo |
| `seasons_schema.sql` | Tabela seasons + trigger de temporada única ativa |
| `attendance_schema.sql` | Tabela attendance (presença) |
| `add_player_plans_schema.sql` | Coluna `plan` na tabela players (Legendary/Pro/Amateur) |
| `add_profile_fields.sql` | Colunas extras em profiles (nickname, birth_date, phone, etc.) |
| `update_schema.sql` | `profile_id` em players + trigger `handle_new_user()` auto-criação |
| `add_user_id_to_players.sql` | Vinculação de players ↔ users |
| `update_trigger_plan.sql` | Atualização do trigger para incluir campo plan |
| `security_rls_policies.sql` | Políticas RLS adicionais |
| `fix_rls.sql` / `force_access.sql` / `disable_rls.sql` | Scripts de ajuste ad-hoc de RLS |

> **Nota**: As migrações são executadas manualmente no SQL Editor do Supabase. Não há sistema de migration automático.

---

## 9. Roadmap de Funcionalidades Futuras

### 🔴 Alta Prioridade
1. Histórico de Partidas (✅ implementado em `/matches`)
2. Detalhe da Partida (✅ implementado em `/matches/:id`)
3. Presença por Partida (✅ implementado em `/attendance`)
4. Foto do Jogador (✅ parcialmente — campo `photo_url` existe)

### 🟡 Média Prioridade
5. Rankings Alternativos (tabs no Leaderboard)
6. Radar no PlayerEdit (visualizar gráfico ao editar)
7. MVP automático (✅ implementado no `endMatch`)
8. Notificações em tempo real (✅ implementado via `useRealtime`)
9. Perfil Público do Jogador (✅ implementado em `/jogadores/:id`)

### 🟢 Baixa Prioridade / Extras
10. Temporadas (✅ implementado em `/seasons`)
11. Modo Admin (✅ implementado com roles)
12. Exportar PDF/Imagem (parcial — html2canvas disponível)
13. Dark/Light mode (✅ implementado — 6 temas)
14. PWA (pendente)

### Ideias Adicionais (do roadmap)
- **Gestão Financeira**: mensalidade, rateio, inadimplência.
- **Sistema de Punições**: suspensão automática por cartões, multas ($).
- **Gamificação**: troféus/badges automáticos (Artilheiro, Garçom, etc.).
- **Modo Draft com Capitães**: seleção interativa alternada.
- **Evolução de Atributos**: ajuste automático baseado em performance.
- **Votação**: MVP e "Bagre" do jogo por votação anônima.

---

## 10. Resumo para Desenvolvimento

- **Para adicionar nova página**: criar em `src/pages/`, adicionar rota em `App.tsx`, link no `Sidebar.tsx`.
- **Para nova tabela no DB**: criar `.sql` na raiz, executar no Supabase SQL Editor, adicionar tipos em `src/types/index.ts`.
- **Para nova feature com dados**: criar/atualizar actions no `useStore.ts`, usar Supabase client diretamente.
- **Para componentes visuais**: usar Tailwind + variáveis de tema `var(--color-*)`, utilitário `cn()`.
- **Admins-only**: checar `isAdmin` do `useAuthStore` para UI condicional + RLS no backend.
