# Rotas da API

Handlers Express agrupados por recurso; cada módulo cria um `Router` e exporta-o como padrão.

## Arquivos importantes
- `auth.routes.js`: cadastro, login e operações de usuários.
- `points.routes.js`: consulta, cadastro, atualização e remoção de pontos.
- `supplies.routes.js`: histórico e registro de abastecimentos.
- `incidents.routes.js`: consulta, criação, atualização de status e remoção de ocorrências.

## Orientações para agentes
- Use consultas parametrizadas (`$1`, `$2`, ...) para valores recebidos em requisições.
- Preserve métodos, caminhos, códigos HTTP e formatos usados pelo cliente em `src/services/api.ts`.
- Valide entradas, responda com erros HTTP apropriados e registre falhas no servidor; não retorne dados sensíveis.
