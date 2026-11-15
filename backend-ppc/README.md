# Backend (`backend-ppc`)

API REST do PPC, implementada em Node.js, Express e PostgreSQL. O processo é iniciado por `src/server.js`; use `npm run dev` para desenvolvimento e `npm start` para execução normal.

## Arquivos importantes
- `package.json`: scripts e dependências da API.
- `.env`: configuração local do banco e da porta; nunca copie valores para o código ou documentação.
- `src/`: inicialização do servidor, acesso ao banco e rotas HTTP.

## Orientações para agentes
- Mantenha a API e o frontend compatíveis ao alterar rotas ou formatos de resposta.
- Use variáveis de ambiente para configuração e não exponha credenciais.
- Prefira consultas PostgreSQL parametrizadas e preserve o tratamento explícito de erros.
