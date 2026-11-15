# Serviços

Camada de comunicação do frontend com a API backend.

## Arquivos importantes
- `api.ts`: funções de login/cadastro, usuários, pontos, abastecimentos e ocorrências; também define `SupplyData` e trata respostas HTTP.

## Orientações para agentes
- Centralize aqui novas chamadas HTTP em vez de duplicá-las nas telas.
- Mantenha caminhos, métodos, cabeçalhos, tipos de payload e respostas compatíveis com `backend-ppc/src/routes/`.
- Propague falhas de requisição de forma clara e atualize os tipos relacionados em `src/types.ts` quando o contrato mudar.
