# Aplicação frontend

Frontend React com TypeScript, construído com Vite. `main.tsx` monta a aplicação e `App.tsx` coordena sessão, navegação e dados compartilhados.

## Arquivos importantes
- `App.tsx`: estado global da sessão, carregamento de pontos e seleção de página.
- `types.ts`: tipos e contratos compartilhados entre telas e serviços.
- `index.css` e `App.css`: estilos globais e da aplicação.
- `components/`, `pages/`, `services/`, `data/`: interface, telas, integração HTTP e dados locais.

## Orientações para agentes
- Mantenha os tipos e contratos de API alinhados com o backend.
- Reutilize os diretórios por responsabilidade; evite concentrar novas telas ou lógica de rede em `App.tsx`.
- Preserve o fluxo de autenticação e os identificadores de página definidos em `types.ts`.
