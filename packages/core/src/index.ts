export const VERSION = '0.1.0'

export {
  CompletableRegistry,
  createCompletionHandler,
  createInteractiveHandler,
  createManualHandler,
  createMountHandler,
  createScrollHandler,
  createTimerHandler,
  resolveCompletionStrategy,
} from './completion.ts'
export type { CompletionHandler } from './completion.ts'
export { createCourseRuntime, CURRENT_SCHEMA_VERSION } from './runtime.ts'
export type {
  AssessmentResult,
  AttemptAnswer,
  AttemptRecord,
  CompletionStrategy,
  CourseConfig,
  CourseRuntime,
  CourseState,
  DeliveryAdapter,
  InteractionRecord,
  RestoreInfo,
  SuspendEnvelope,
} from './types.ts'

// Context
export { CourseContext, CourseProvider, createNotifier } from './context.tsx'
export type { CourseContextValue, CourseProviderProps } from './context.tsx'

// Hooks
export {
  useAssessment,
  useAssessmentTimer,
  useAudio,
  useCompletion,
  useCourse,
  useFocusTrap,
  useGlossary,
  useNavigation,
  useNotes,
  usePage,
  useRestore,
  useSearch,
} from './hooks/index.ts'
export type { RestoreContext } from './hooks/index.ts'

// Adapters
export { createAdapter, createScorm2004Adapter, createStandaloneAdapter, createXApiAdapter } from './adapters/index.ts'
export type { XApiConfig, XApiStatement } from './adapters/index.ts'

// Components (headless)
export {
  Assessment,
  AssessmentContext,
  Audio,
  AudioContext,
  CategorySort,
  CategorySortContext,
  Course,
  extractSnippet,
  FillBlank,
  FillBlankContext,
  Glossary,
  GlossaryContext,
  Matching,
  MatchingContext,
  MAX_NOTEPAD_LENGTH,
  MCQ,
  MCQContext,
  MultiSelect,
  MultiSelectContext,
  Navigation,
  normalize,
  Notes,
  NotesContext,
  Ordering,
  OrderingContext,
  OrderingItemContext,
  Page,
  Search,
  SearchContext,
  searchEntries,
  TimerContext,
} from './components/index.ts'
export type {
  AssessmentContextValue,
  AudioContextValue,
  CategoryDef,
  CategoryItemDef,
  CategorySortContextValue,
  FillBlankContextValue,
  GlossaryContextValue,
  GlossaryEntry,
  MatchingContextValue,
  MatchingSlotRenderProps,
  MCQContextValue,
  MultiSelectContextValue,
  NotesContextValue,
  OrderingContextValue,
  OrderingItemContextValue,
  SearchContextValue,
  SearchEntry,
  SearchResult,
  TimerContextValue,
} from './components/index.ts'

// SCORM packaging (types + manifest only; createScormPackage is Node-only,
// import it directly from 'kurikulum/scorm/package' in build scripts)
export { generateManifest } from './scorm/manifest.ts'
export type { ManifestOptions } from './scorm/manifest.ts'
export type { PackageOptions } from './scorm/package.ts'

// Vite plugins (runtime values are Node-only; import from 'kurikulum/vite'
// in build scripts / vite.config so that node:fs/node:path don't leak into
// the browser bundle)
export type { KurikulumCmi5Options, KurikulumPluginOptions, KurikulumScormOptions, KurikulumTarget } from './vite/kurikulum-plugin.ts'
export type { SearchIndexPluginOptions } from './vite/search-index-plugin.ts'

// cmi5 packaging (types + manifest only; createCmi5Package is Node-only,
// import it directly from 'kurikulum/cmi5/package' in build scripts)
export { generateCmi5Manifest } from './cmi5/manifest.ts'
export type { Cmi5ManifestOptions } from './cmi5/manifest.ts'
export type { Cmi5PackageOptions } from './cmi5/package.ts'
