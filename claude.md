# Project: Google Meet Caption Pro — AI Coding Guidelines

## Design Language: Apple Style

This project follows Apple Human Interface Guidelines principles:

- **Spacing & padding**: generous whitespace; prefer `12–20px` gaps, `14–16px` padding inside cards
- **Border radius**: rounded corners throughout — cards `14–16px`, buttons `10–12px`, chips `20px` (pill)
- **Typography**: system font stack; hierarchy via font-weight (400/500/600/700), not size alone
- **Color palette**: neutral grays (`#1a202c`, `#374151`, `#94a3b8`), accent blue `#1a73e8`, success green `#16a34a`; avoid hard blacks
- **Shadows**: subtle — `0 2px 12px rgba(0,0,0,0.05)`; never heavy drop shadows
- **Motion**: short, ease transitions (`0.18–0.22s ease`); `scaleX` for tab indicators, no janky snaps
- **Icons**: Ant Design icons only; consistent `15–16px` size inside rows
- **Backgrounds**: white cards on light gray page (`#f5f7fa`); avoid pure `#ffffff` on `#ffffff`

## Multi-Language (i18n)

**Every visible string must be localised.** The system supports 16 languages:

`en`, `zh`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `it`, `ja`, `ko`, `pt`, `ru`, `th`, `vi`

Rules:
- Never hardcode display text in TSX/TS. Always use `t('key')` from `useI18n()`.
- When adding a new key, add it to **all 16** files under `utils/i18n/translations/`.
- Prefer the Python script pattern (see previous commits) for bulk additions to avoid control-character corruption — write raw bytes carefully.
- Key naming convention: `snake_case`, prefixed by feature area (e.g. `calendar_`, `live_`, `meetings_`, `settings_`).
- Use `{param}` interpolation for dynamic values: `t('key', { n: String(count) })`.

## Code Maintainability

- **No magic strings**: route names, storage keys, and config field names must be constants or enum-like objects, not scattered literals.
- **Single responsibility**: each component owns one concern. Extract logic to hooks (`hooks/`) when state + effects grow beyond ~30 lines.
- **Config access**: always use `getConfigValue` / `setConfigValue` from `~/utils/appConfig`. Never read `chrome.storage` directly for app config fields.
- **Storage keys**: `calendarEvents`, `calendarLastSync`, `calendarConnected` live in `chrome.storage.local`. App settings live in `chrome.storage.sync` under key `"appConfig"` (lazy-write pattern — fields only appear after first explicit set).
- **Avoid over-engineering**: don't add abstractions for one-off operations. Keep components readable at a glance.
- **Types**: define types in `components/popup/types.ts` (for popup) or co-locate with the component for options-only types.

## Checklist Before Every Change

1. Does any new visible text need a translation key? → Add to all 16 language files.
2. Does the UI match Apple style (radius, spacing, color, motion)?
3. Is the change scoped — no unrelated refactors in the same diff?
4. Are storage reads/writes using the correct helper (appConfig vs. direct local storage)?
5. After editing, run `get_errors` to confirm no new TypeScript errors were introduced.
