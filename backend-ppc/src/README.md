# Código da API

Contém a inicialização do Express e a integração com PostgreSQL.

## Arquivos importantes
- `server.js`: configura middlewares, registra as rotas `/api/*` e inicia a aplicação.
- `db.js`: cria o pool de conexões e inicializa o esquema básico de usuários.
- `routes/`: handlers HTTP agrupados por recurso.

## Orientações para agentes
- Registre novas rotas em `server.js` com um prefixo consistente (`/api/<recurso>`).
- Centralize conexões e inicialização de esquema em `db.js`; não crie pools duplicados.
- Não coloque segredos no código nem faça mudanças de esquema sem considerar dados existentes.
