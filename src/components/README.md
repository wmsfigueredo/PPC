# Componentes

Componentes reutilizáveis de interface, identidade visual, navegação, autenticação e mapa.

## Arquivos importantes
- `AppShell.tsx`: estrutura principal, navegação e ações da sessão.
- `AuthScreen.tsx`: tela de login/cadastro integrada ao fluxo principal.
- `Auth.tsx` e `Auth.css`: formulário de autenticação independente; confirme seu uso antes de alterá-lo.
- `Brand.tsx`: marca PPC reutilizável.
- `InteractiveMap.tsx`: mapa Leaflet e marcadores dos pontos.

## Orientações para agentes
- Mantenha componentes configuráveis por props e respeite os tipos de `src/types.ts`.
- Em mudanças de navegação, sincronize a página com os tipos e os consumidores em `App.tsx`.
- Preserve a integração React-Leaflet e evite inserir lógica de persistência diretamente nos componentes visuais.
