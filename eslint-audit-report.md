# ESLint Audit Report

Generated on: 2025-07-20T03:46:05.161Z

## Summary

- **Total Issues**: 155
- **Errors**: 0
- **Warnings**: 155  
- **Files with Issues**: 56
- **Rules Violated**: 6

## Top Rule Violations

1. **@typescript-eslint/no-unused-vars** (warning): 85 occurrences
2. **@typescript-eslint/no-explicit-any** (warning): 57 occurrences
3. **react-hooks/exhaustive-deps** (warning): 9 occurrences
4. **react/no-unescaped-entities** (warning): 2 occurrences
5. **@typescript-eslint/no-namespace** (warning): 1 occurrences

## Rule-by-Rule Breakdown

| Rule ID | Severity | Count | Files | Priority | Effort | Owner | Fix Strategy |
|---------|----------|-------|-------|----------|--------|-------|--------------|
| @typescript-eslint/no-unused-vars | warning | 85 | 32 | Medium | Low | Development Team | Remove unused variables or prefix with underscore if intentionally unused |
| @typescript-eslint/no-explicit-any | warning | 57 | 25 | High | Medium | Development Team | Replace `any` with proper TypeScript types or `unknown` if type is truly unknown |
| react-hooks/exhaustive-deps | warning | 9 | 8 | High | Medium | React Developer | Add missing dependencies to useEffect/useCallback/useMemo dependency arrays |
| react/no-unescaped-entities | warning | 2 | 1 | Medium | Medium | Development Team | Review ESLint documentation and apply appropriate fixes |
| @typescript-eslint/no-namespace | warning | 1 | 1 | Medium | Medium | Development Team | Review ESLint documentation and apply appropriate fixes |
| @typescript-eslint/no-unused-expressions | warning | 1 | 1 | Medium | Medium | Development Team | Review ESLint documentation and apply appropriate fixes |

## Files with Most Issues

| File | Errors | Warnings | Total |
|------|--------|----------|-------|
| sidepanel.tsx | 0 | 10 | 10 |
| components/words/WordDetailModal.tsx | 0 | 9 | 9 |
| components/extension.tsx | 0 | 8 | 8 |
| components/options/Calendar.tsx | 0 | 8 | 8 |
| components/google-drive/services/BackupService.ts | 0 | 7 | 7 |
| components/LocalStorageViewer.tsx | 0 | 6 | 6 |
| components/options/ClearCaptionsSettings.tsx | 0 | 5 | 5 |
| hooks/useTranscripts.ts | 0 | 5 | 5 |
| pages/welcome.tsx | 0 | 5 | 5 |
| utils/getAPIkey.ts | 0 | 5 | 5 |

## Detailed Fix Strategies


### @typescript-eslint/no-unused-vars

- **Priority**: Medium
- **Effort Level**: Low
- **Can be Automated**: Partially - ESLint can auto-fix some cases
- **Owner**: Development Team
- **Estimated Time**: 1-2 hours
- **Fix Strategy**: Remove unused variables or prefix with underscore if intentionally unused
- **Occurrences**: 85 across 32 files

**Files affected:**
- background/handle-tab-close.ts
- background/tab-tracking.ts
- components/LocalStorageViewer.tsx
- components/backup-and-restore.tsx
- components/captions/hooks/useTranslation.ts
- components/common/StyledTitle.tsx
- components/extension.tsx
- components/google-drive/hooks/useConflictResolution.ts
- components/google-drive/index.tsx
- components/google-drive/services/BackupService.ts
- components/options/Calendar.tsx
- components/options/ClearCaptionsSettings.tsx
- components/options/ExtensionSettings.tsx
- components/options/Sidebar.tsx
- components/options/TranslationSettings.tsx
- components/options/UILanguageSettings.tsx
- components/options/ai-settings/AISettings.tsx
- components/summary/index.tsx
- components/words.tsx
- components/words/WordDetailModal.tsx
- constant.ts
- contents/index.ts
- hooks/useTranscripts.ts
- hooks/useTranslationProvider.ts
- options.tsx
- pages/welcome.tsx
- sidepanel.tsx
- utils/get-is-extension-disabled.ts
- utils/getAPIkey.ts
- utils/getCaptions.ts
- utils/is-resetore-data-valid.ts
- utils/translate.ts


### @typescript-eslint/no-explicit-any

- **Priority**: High
- **Effort Level**: Medium
- **Can be Automated**: No - requires manual type definition
- **Owner**: Development Team
- **Estimated Time**: 4-8 hours
- **Fix Strategy**: Replace `any` with proper TypeScript types or `unknown` if type is truly unknown
- **Occurrences**: 57 across 25 files

**Files affected:**
- components/Account.tsx
- components/GlobalDatePicker.tsx
- components/captions/SearchBar.tsx
- components/captions/filterUtils.ts
- components/extension.tsx
- components/google-drive/services/BackupService.ts
- components/options/ai-settings/AISettings.tsx
- components/options/ai-settings/components/ApiKeyConfig.tsx
- components/options/ai-settings/components/ServiceConfigPanel.tsx
- components/options/ai-settings/components/ServiceList.tsx
- components/options/ai-settings/utils/model-service.ts
- components/words/WordDetailModal.tsx
- hooks/useAutoTranslate.ts
- hooks/useTranscripts.ts
- utils/ai-error-handler.ts
- utils/ai/AIServiceInterface.ts
- utils/ai/BaseAIService.ts
- utils/ai/GeminiAIService.ts
- utils/ai/OpenAIService.ts
- utils/ai/XAIService.ts
- utils/get-file-data.ts
- utils/getAPIkey.ts
- utils/google-calendar.ts
- utils/initAIService.ts
- utils/types/google-drive.types.ts


### react-hooks/exhaustive-deps

- **Priority**: High
- **Effort Level**: Medium
- **Can be Automated**: Partially - ESLint can suggest fixes
- **Owner**: React Developer
- **Estimated Time**: 2-4 hours
- **Fix Strategy**: Add missing dependencies to useEffect/useCallback/useMemo dependency arrays
- **Occurrences**: 9 across 8 files

**Files affected:**
- components/captions/hooks/useSearch.ts
- components/google-drive/GoogleAccountInfo.tsx
- components/google-drive/hooks/useConflictResolution.ts
- components/options/ai-settings/components/ModelSelector.tsx
- components/summary/useSummary.ts
- components/words/WordDetailModal.tsx
- contexts/GoogleAuthContext.tsx
- sidepanel.tsx


### react/no-unescaped-entities

- **Priority**: Medium
- **Effort Level**: Medium
- **Can be Automated**: Unknown
- **Owner**: Development Team
- **Estimated Time**: TBD
- **Fix Strategy**: Review ESLint documentation and apply appropriate fixes
- **Occurrences**: 2 across 1 files

**Files affected:**
- components/words/WordDetailModal.tsx


### @typescript-eslint/no-namespace

- **Priority**: Medium
- **Effort Level**: Medium
- **Can be Automated**: Unknown
- **Owner**: Development Team
- **Estimated Time**: TBD
- **Fix Strategy**: Review ESLint documentation and apply appropriate fixes
- **Occurrences**: 1 across 1 files

**Files affected:**
- components/google-drive/services/BackupService.ts


### @typescript-eslint/no-unused-expressions

- **Priority**: Medium
- **Effort Level**: Medium
- **Can be Automated**: Unknown
- **Owner**: Development Team
- **Estimated Time**: TBD
- **Fix Strategy**: Review ESLint documentation and apply appropriate fixes
- **Occurrences**: 1 across 1 files

**Files affected:**
- components/summary/index.tsx

