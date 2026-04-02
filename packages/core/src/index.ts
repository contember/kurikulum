export const VERSION = '0.1.0';

export type { CourseState, CourseRuntime, CourseConfig, CompletionStrategy, DeliveryAdapter } from './types.ts'
export { createCourseRuntime } from './runtime.ts'
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
export { useCourse, useNavigation, useCompletion, useAssessment, usePage } from './hooks/index.ts'

// Adapters
export { createAdapter, createStandaloneAdapter } from './adapters/index.ts'

// Components (headless)
export {
  Assessment, AssessmentContext,
  MCQ, MCQContext,
  MultiSelect, MultiSelectContext,
  Page, Navigation, Course,
} from './components/index.ts'
export type { AssessmentContextValue, MCQContextValue, MultiSelectContextValue } from './components/index.ts'

// SCORM packaging
export { generateManifest } from './scorm/manifest.ts'
export type { ManifestOptions } from './scorm/manifest.ts'
export { createScormPackage } from './scorm/package.ts'
export type { PackageOptions } from './scorm/package.ts'
