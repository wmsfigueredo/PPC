# Telas

Implementações das telas funcionais apresentadas no painel autenticado.

## Arquivos importantes
- `DashboardPages.tsx`: exporta `MapPage`, `ListPage`, `RegisterPage`, `SupplyPage`, `OccurrencesPage` e `ProfilePage`, além de componentes auxiliares de tela.

## Orientações para agentes
- Mantenha cada tela alinhada aos tipos e callbacks recebidos por props.
- Ao alterar uma operação, preserve a comunicação com `App.tsx` e os contratos centralizados em `src/services/api.ts`.
- Para novas páginas, considere extrair componentes próprios quando a responsabilidade deixar de caber neste módulo.
