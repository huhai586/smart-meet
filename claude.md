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
6. **Does the new UI support both light AND dark mode?** Every new component, screen, or modal must work in both modes. Use `var(--opt-*)` CSS variables for all backgrounds, text, and borders in styled-components. Add `:root.dark-mode` overrides in SCSS files. Never ship hardcoded `#fff`, `#1C1C1E`, `rgba(60,60,67,…)`, or `#F2F2F7` in new code without a corresponding dark mode value.

## Dark Mode System

The project uses a CSS-class-based dark mode (`document.documentElement.classList` toggle `.dark-mode`) driven by `useDarkMode()` hook reading `appConfig.darkMode`.

**CSS custom properties** (`styles/theme-vars.scss`) — use these in every styled-component:

| Token | Light | Dark |
|---|---|---|
| `--opt-bg-card` | `#fff` | `#1c2028` |
| `--opt-bg-page` | `#F2F2F7` | `#161a21` |
| `--opt-text-primary` | `#1C1C1E` | `#e2e8f0` |
| `--opt-text-secondary` | `#8E8E93` | `#606878` |
| `--opt-text-tertiary` | `#3C3C43` | `#94a3b8` |
| `--opt-border-subtle` | `rgba(60,60,67,0.14)` | `rgba(255,255,255,0.08)` |
| `--opt-border-divider` | `rgba(60,60,67,0.12)` | `rgba(255,255,255,0.06)` |
| `--opt-border-faint` | `rgba(60,60,67,0.10)` | `rgba(255,255,255,0.05)` |
| `--opt-hover-clickable` | `rgba(0,0,0,0.03)` | `rgba(255,255,255,0.06)` |
| `--opt-hover-default` | `rgba(0,0,0,0.018)` | `rgba(255,255,255,0.03)` |
| `--opt-segment-bg` | `#E5E5EA` | `#2d3340` |
| `--opt-segment-active` | `#FFFFFF` | `#3d4758` |
| `--opt-navbar-bg` | `rgba(255,255,255,0.92)` | `rgba(28,32,40,0.92)` |

**SCSS dark mode**: append `:root.dark-mode { … }` at end of each SCSS file with per-class overrides.

**Pages wired for dark mode**: options (`options.tsx`), popup (`popup.tsx`). Wire new pages by importing `useDarkMode` and wrapping with `<ConfigProvider theme={{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }}>`.

## Dev Tooling for Coding Agents

Configured in the repo (`.mcp.json`, `.agents/skills/`, `skills-lock.json`). A new MCP server needs a Claude Code restart or `/mcp` reconnect to show up.

### Test browser (CDP)

- Always test in the one fixed Chrome profile `~/smart-meet-cdp/profile` (stays logged in, keeps the downloaded on-device translation models). Never create throwaway profiles.
- Start / reload it with `~/smart-meet-cdp/launch.sh`: Chrome on `--remote-debugging-port=9222`, then loads `build/chrome-mv3-dev` as an unpacked extension.
- `build/chrome-mv3-dev` is produced by `yarn dev` (`plasmo dev`); `yarn build` only writes `chrome-mv3-prod`. Rebuild before testing, then `reload_extension`. If `plasmo dev`'s own auto-reload drops the unpacked extension, rerun `launch.sh`. Content scripts only pick up new code after the Meet tab is reloaded.
- If the Chrome Web Store build of Smart Meet is also enabled in that profile, content scripts run twice. Disable the store copy.

### Google OAuth in the test browser (Drive / Calendar)

`package.json` keeps several OAuth client ids as `local_client_id_*`; `manifest.oauth2.client_id` is the one that ships (the `_online` one). The id `local_client_id_cdp` is bound to the extension id of the unpacked copy in the CDP profile and has the Google APIs (Drive, Calendar) enabled in Google Cloud.

- Which id is which:
  - `821598308749-rf9ji9i79dmolfgp5kdon1sg3pqeeitq.apps.googleusercontent.com` is the **online** (production) id, `local_client_id_online`. It is what ships, and it only works for the Chrome Web Store build.
  - `77378635877-dsg4faa9k5vlduj8s156qhcqpg1if3ar.apps.googleusercontent.com` is the **CDP** id, `local_client_id_cdp`. The CDP browser must use this one.
- To debug anything that talks to Google, **temporarily** set `manifest.oauth2.client_id` to the value of `local_client_id_cdp`, rebuild (`yarn dev`), then `reload_extension`.
- Symptom of forgetting the swap: sign-in fails with `OAuth2 request failed: ... 'bad client id: 821598308749-rf9ji9i...'`. That is the online id being used by the unpacked extension, not a bug in the sign-in code.
- **Never commit that swap.** Put `manifest.oauth2.client_id` back to the `local_client_id_online` value before committing, and check `git diff package.json` shows no change to it.
- **Never uninstall the extension in the CDP profile** (no `uninstall_extension`, no removing it from `chrome://extensions`). The client id is bound to its extension id; a reinstall can change the id and the granted permissions stop working. Use `reload_extension` or `launch.sh` instead.

### `chrome-devtools` MCP

`chrome-devtools-mcp` with `--categoryExtensions --browserUrl http://127.0.0.1:9222`, so it attaches to the test browser above (start that first, or it has nothing to connect to). Tools (load their schemas with ToolSearch first):

- Extensions: `list_extensions`, `install_extension`, `uninstall_extension`, `reload_extension` (use this after a rebuild instead of `chrome.runtime.reload()`), `trigger_extension_action`.
- Pages: `list_pages` (also lists extension service workers), `new_page`, `navigate_page`, `select_page`, `take_snapshot`, `take_screenshot`, `evaluate_script`, `wait_for`, `emulate`, `resize_page`.
- Input: `click`, `hover`, `fill`, `fill_form`, `type_text`, `press_key`, `drag`, `upload_file`.
- Debugging: `list_console_messages`, `get_console_message`, `list_network_requests`, `get_network_request`, `get_css_styles`.
- Performance: `performance_start_trace` / `performance_stop_trace` / `performance_analyze_insight`, `lighthouse_audit`, `take_heapsnapshot`.

`evaluate_script` can also run inside an extension service worker (`serviceWorkerId`). Content scripts run in an isolated world, so page-world `evaluate_script` cannot see their variables or stub their globals.

Testing Meet UI without a real meeting: Meet's SPA wipes injected DOM, so block Meet's own scripts, open `https://meet.google.com/meet/abc-defg-hij`, then inject fake captions with `createElement` / `textContent` (Trusted Types forbids `innerHTML`). The captions container is found by `div[aria-label="<localized Captions label>"]`, so set `<html lang>` to match.

### Skills (`.agents/skills`, symlinked from `.claude/skills`)

- `chrome-extensions`: Manifest V3 best practices and current extension API behavior. Use it for any change to `manifest`, content scripts, the service worker, the side panel, permissions or messaging. Its Web Store references (permission justifications, review checklist, privacy policy, listing template, `chromewebstore-template.md`) apply when preparing a release.
- `modern-web-guidance`: search tool for current web platform patterns. Run it before writing HTML/CSS/client JS or anything that uses a newer web API:

```bash
npx modern-web-guidance@latest search "<topic>"     # find use cases
npx modern-web-guidance@latest retrieve <id>        # read one
```

### Chrome built-in AI APIs (as of Chrome 156)

Check availability in the test browser before relying on one; `downloadable` means the model is not on the machine yet.

| API | Use in this project | Status in the test browser |
|---|---|---|
| `Translator` | local translation provider (`utils/translators/local-translator.ts`) | available |
| `LanguageDetector` | picks the source language for local translation | available |
| `LanguageModel` (Prompt API) | not used yet; candidate for a local AI summary / polish fallback | downloadable |
| `Summarizer` | not used yet | downloadable |
| `Writer` / `Rewriter` / `Proofreader` | not present in Chrome 156 | no API |

Rules learned the hard way: model download (`create()` on a `downloadable` model) needs a user gesture, so confirm in the UI before downloading and offer cancel via `AbortSignal`; always check `availability()` before `create()`; a language pair can be unavailable even when the API exists (including source equal to target).

Gotcha: `npx` fails with `EACCES` if `~/.npm` contains root-owned files; fix with `sudo chown -R 501:20 ~/.npm`.

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.