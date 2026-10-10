# Banco de dados (Supabase)

Projeto Supabase `cdwagfofjjhnykbzixut` (Postgres + login anônimo/conta). O jogo é estático: o navegador só chama **funções SQL (RPC)** pelo cliente `js/online/net.js`. As regras (salas, grupos, votos, limites) ficam no banco, nunca no navegador.

## Pastas

| Caminho | O que é |
|---|---|
| `migrations/` | Scripts SQL numerados, na ordem em que foram aplicados no Supabase real (10 a 20). Cada arquivo começa com um comentário dizendo o que muda. |
| `local/schema.sql` | Retrato do schema (tabelas, funções, políticas) usado pelo servidor local de teste. Já inclui o estado até a migração 11. |
| `local/bootstrap.sql` | Base mínima (papéis, `auth.*`, `extensions.*`) para o schema rodar num Postgres comum (PGlite). |

As migrações 01 a 09 (tabelas de salas, grupos, votos, Mercador, perfis e saves) foram aplicadas direto no painel antes de o repositório guardar SQL; elas estão refletidas em `local/schema.sql`, não em arquivos próprios.

## Como aplicar uma mudança
1. Criar `migrations/NN_nome.sql` (próximo número), com comentário no topo.
2. Testar local: `cd tools/localsrv && npm install && node test_sql.mjs` (aplica schema + migrações num Postgres em memória e roda os cenários, incluindo o teto de 28 por sala).
3. Aplicar no Supabase real (SQL Editor ou `apply_migration`) e conferir os avisos de segurança.
4. Se a mudança alterar tabelas ou funções, atualizar `local/schema.sql` junto.

## Tabelas

| Grupo | Tabela | Para que serve |
|---|---|---|
| Conta | `profiles` | nome de usuário e hash do código de recuperação (um perfil por login) |
| Conta | `recovery_attempts` | tentativas de recuperar senha (trava temporária) |
| Conta | `saves` | até 4 saves por conta: classe escolhida, progresso, moedas e itens (`data` em JSON) |
| Sala | `rooms` | sala: código, nome, pública/privada, status (`lobby`/`playing`), etapa (`gather`, `pick`, `map`), boss, tempo das perguntas |
| Sala | `room_players` | quem está na sala, em qual classe (`grp`) e o último sinal |
| Sala | `player_presence` | presença (ativo = sinal nos últimos 45 s) |
| Sala | `room_groups` | por classe: moedas, inventário e estado do herói |
| Sala | `join_fails` | falhas ao entrar por código (limite contra adivinhação) |
| Partida | `matches` | uma partida da sala: boss, status (`playing`/`won`/`lost`/`aborted`), snapshot |
| Partida | `rounds` | rodadas: pergunta, tempos, alternativa correta, semente |
| Partida | `round_groups` | resultado de cada classe na rodada (travou, escolheu, acertou, ação) |
| Partida | `round_votes`, `act_votes` | votos da pergunta e da ação, por jogador |
| Partida | `round_items`, `round_acks` | itens usados e confirmações de leitura da rodada |
| Partida | `match_stats` | estatísticas por jogador para o relatório |
| Mercador | `merchant_proposals`, `merchant_votes` | propostas de compra/venda e votos |
| Perguntas | `questions`, `question_keys` | enunciados/alternativas e, separado, a alternativa correta (nunca vai ao navegador antes da hora) |

## Funções (RPC) por assunto
- **Conta e saves:** `register_profile`, `verify_recovery`, `rotate_recovery`, `create_save`, `write_save`, `rename_save`, `delete_save`.
- **Salas:** `create_room`, `join_room`, `leave_room`, `list_public_rooms`, `room_counts`, `room_lobby`, `set_room_config`, `set_room_stage`, `pick_group`, `my_group`, `heartbeat`, `prune_rooms`.
- **Partida:** `start_match`, `match_state`, `match_room`, `start_round`, `advance_round`, `cast_vote`, `cast_action`, `use_item`, `round_use_item`, `ack_round`, `end_match`, `put_snapshot`, `report_stats`, `match_report`.
- **Mercador:** `propose_merchant`, `vote_merchant`, `proposal_info`, `close_proposal_if_due`.
- **Editor de perguntas (só a conta `fiuphis`):** `admin_get_questions`, `admin_put_questions`, `admin_questions`, `admin_save_questions`.
- Funções com `_` no começo são internas (sorteio de rank, fechar rodada, expirar partida, checar editor) e não são chamadas pelo navegador.

## Regras que o banco impõe
- Máximo de **3 salas por criador**, **7 jogadores por classe** e **28 por sala** (`20_room_cap.sql`); quem já está na sala sempre consegue voltar.
- Código de sala com 6 letras/números; limite de tentativas erradas (`join_fails`).
- Presença ativa: sinal nos últimos 45 s. Partida sem sinal por 3 horas é encerrada como abandonada (`14_expire_match.sql`).
- Modelo **lockstep**: o servidor decide as entradas de cada rodada (pergunta, acertos, ações, itens, semente); todos os aparelhos rodam o mesmo combate (`js/game/app.js`).
- Todas as tabelas têm RLS ligada; o acesso é pelas funções `security definer`.

## Backup
- Perguntas: o editor (`editor.html`) exporta JSON/CSV; `data/perguntas.json` é a cópia de referência.
- Contas, saves e salas não são versionados (dados pessoais). Cópia completa: painel do Supabase > Database > Backups, ou `pg_dump` com a string de conexão do projeto.
- Saves de jogadores: cada save pode ser exportado como código e importado em outro.
