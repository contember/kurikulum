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
export { CourseContext, createNotifier } from './context.ts'
export type { CourseContextValue } from './context.ts'

// Hooks
export { useCourse, useNavigation, useCompletion, useAssessment, usePage } from './hooks/index.ts'
