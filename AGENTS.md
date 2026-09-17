# Agent notes

Charlie UI is a Next.js 15 chat frontend for [`@jbcbdse/charlie`](https://github.com/jbcbdse/charlie). Chat is the product. Setup and commands are in the README.

## Code hygiene

- Prefer the smallest change that solves the problem. Do not refactor adjacent code, add helpers, or introduce abstractions unless they are required for the fix.
- When you remove a feature, delete all of it: pages, API routes, components, types, nav links, and unused dependencies. Do not leave experiment pages or dead wiring.
- Do not leave unused exports, types, CSS classes, comments, or commented-out code.
- If a TypeScript module's main export is a class, put helpers on the class as `private` methods. Shared helpers used by multiple modules can live in their own file.
- Colocate unit tests as `*.spec.ts` next to the module. Add or extend Playwright coverage in `e2e/` when you change user-visible UI.
- After UI, layout, or routing changes, verify the flow in the browser, not only by reading the code.

### Front-end

- `src/app` pages and layouts are thin: they route, wrap, and compose. They do not contain fetch logic, persistence, or agent rules.
- UI lives in `src/app/components`. Client code talks to the server only through `src/lib/send-message`.
- Keep components focused on rendering and local interaction. Lift shared session/chat state into the shell or page that already owns it.

### Backend routes

- `src/app/api` route files are thin adapters: parse the request, call `src/lib`, return JSON or `jsonError`.
- Shared HTTP glue (user email header, stores, error mapping) lives in `src/lib/chat-route.ts`.
- Persistence, agents, tools, and stream encoding live in `src/lib`, not in route files. Do not grow a new `/api/...` surface unless the UI has a real caller for it.
