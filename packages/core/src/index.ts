export const VERSION = '0.1.0';

export type { CourseState, CourseRuntime, CourseConfig, CompletionStrategy, DeliveryAdapter, AssessmentResult, AttemptRecord, AttemptAnswer, InteractionRecord, SuspendEnvelope, RestoreInfo, Note } from './types.ts'
export { createCourseRuntime, CURRENT_SCHEMA_VERSION } from './runtime.ts'
export {
  resolveCompletionStrategy,
  createCompletionHandler,
  createMountHandler,
  createTimerHandler,
  createManualHandler,
  createScrollHandler,
  createInteractiveHandler,
  CompletableRegistry,
} from './completion.ts'
export type { CompletionHandler } from './completion.ts'

// Context
export { CourseContext, createNotifier, CourseProvider } from './context.tsx'
export type { CourseContextValue, CourseProviderProps } from './context.tsx'

// Hooks
export { useCourse, useNavigation, useCompletion, useAssessment, usePage, useAudio, useRestore, useGlossary, useNotes, useAssessmentTimer, useSearch } from './hooks/index.ts'
export type { RestoreContext } from './hooks/index.ts'

// Adapters
export { createAdapter, createStandaloneAdapter, createScorm2004Adapter, createXApiAdapter } from './adapters/index.ts'
export type { XApiConfig, XApiStatement } from './adapters/index.ts'

// Components (headless)
export {
  Assessment, AssessmentContext, TimerContext,
  MCQ, MCQContext,
  MultiSelect, MultiSelectContext,
  FillBlank, FillBlankContext,
  Matching, MatchingContext,
  Ordering, OrderingContext, OrderingItemContext,
  Page, Navigation, Course,
  Audio, AudioContext,
  CategorySort, CategorySortContext,
  Glossary, GlossaryContext,
  Notes, NotesContext, MAX_NOTE_LENGTH, MAX_NOTES_COUNT,
  Search, SearchContext, normalize, extractSnippet, searchEntries,
} from './components/index.ts'
export type { AssessmentContextValue, TimerContextValue, MCQContextValue, MultiSelectContextValue, FillBlankContextValue, MatchingContextValue, OrderingContextValue, OrderingItemContextValue, AudioContextValue, CategorySortContextValue, CategoryDef, CategoryItemDef, GlossaryContextValue, GlossaryEntry, NotesContextValue, SearchContextValue, SearchEntry, SearchResult } from './components/index.ts'

// SCORM packaging (types + manifest only; createScormPackage is Node-only,
// import it directly from '@kurikulum/core/scorm/package' in build scripts)
export { generateManifest } from './scorm/manifest.ts'
export type { ManifestOptions } from './scorm/manifest.ts'
export type { PackageOptions } from './scorm/package.ts'

// Vite plugins
export { searchIndexPlugin, extractSearchEntries } from './vite/search-index-plugin.ts'
export type { SearchIndexPluginOptions } from './vite/search-index-plugin.ts'

// cmi5 packaging (types + manifest only; createCmi5Package is Node-only,
// import it directly from '@kurikulum/core/cmi5/package' in build scripts)
export { generateCmi5Manifest } from './cmi5/manifest.ts'
export type { Cmi5ManifestOptions } from './cmi5/manifest.ts'
export type { Cmi5PackageOptions } from './cmi5/package.ts'
