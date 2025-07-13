# Caption Component Refactoring

This document describes the refactored structure of the caption component.

## Structure Overview

The original `caption.tsx` component has been refactored into multiple smaller, focused modules:

### 📁 Types (`types.ts`)
- `Actions` enum: Defines available AI actions
- `AIDataItem` interface: Structure for AI response data

### 📁 Hooks (`hooks/`)
- `useCaptionText.ts`: Handles text processing, highlighting, and word wrapping
- `useTranslation.ts`: Manages translation functionality (word, text selection, manual)
- `useAIInteraction.ts`: Handles AI requests and response management
- `useLanguageDetection.ts`: Detects text language and RTL direction

### 📁 Components (`components/`)
- `CaptionHeader.tsx`: Speaker info and action buttons
- `CaptionActionButtons.tsx`: Translation and AI action buttons
- `AIAnswerSection.tsx`: Displays AI responses with markdown rendering
- `AutoTranslationSection.tsx`: Shows auto-translated content
- `CaptionTimestamp.tsx`: Displays formatted timestamp

### 📁 Utils (`utils/`)
- `scrollUtils.ts`: Scroll-related utilities and content change events

### 📁 Main Component (`caption.tsx`)
The main component now focuses on:
- Orchestrating hooks and components
- Managing state and lifecycle
- Handling user interactions
- Rendering the complete caption UI

## Benefits of Refactoring

1. **Improved Maintainability**: Each module has a single responsibility
2. **Better Testability**: Smaller, focused functions are easier to test
3. **Enhanced Reusability**: Components and hooks can be reused elsewhere
4. **Cleaner Code**: Reduced complexity in the main component
5. **Better Performance**: Memoization and optimized re-renders

## Usage

The main component can be imported and used as before:

```typescript
import Caption from './components/captions/caption';

// Usage remains the same
<Caption data={transcriptData} />
```

Individual components and hooks can also be imported separately if needed:

```typescript
import { useTranslation } from './components/captions/hooks';
import { CaptionHeader } from './components/captions/components';
``` 