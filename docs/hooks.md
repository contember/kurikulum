# Hooks

All exported from `kurikulum`. Read source for full API.

- `useCourse()` — full `CourseRuntime` (state, navigation, completion, assessment). Requires `CourseProvider`.
- `useNavigation()` — `currentPage`, `canGoNext/Prev`, `next()`, `prev()`, `goTo()`. Requires `CourseProvider`.
- `useCompletion(id)` — `isComplete`, `markComplete()`. Requires `CourseProvider`.
- `useAssessment(id?)` — `score`, `maxScore`, `passed`, `attempts`, `submit()`. Requires `CourseProvider`.
- `usePage()` — `pageId`, `completion` strategy. Requires `Page`.
- `useAudio()` — `playing`, `currentTime`, `duration`, `play()`, `pause()`, `seek()`. Requires `Audio.Root`.
- `useRestore()` — `hasStoredState`, `storedPage`, `resume()`, `restart()`. Requires `CourseProvider`.
- `useGlossary()` — `entries`, `filtered`, `query`, `isOpen`, `toggle()`. Requires `Glossary`.
- `useNotes()` — `text`, `setText()`, `isOpen`, `toggle()`. Requires `Notes`.
- `useAssessmentTimer()` — `remaining`, `isExpired`, `isWarning`, `formatted`. Requires `Assessment.Root` with `timeLimit`.
- `useSearch()` — `query`, `results`, `isOpen`, `navigateTo()`. Requires `Search`.
- `useFocusTrap(ref, active)` — traps Tab focus within container. No provider needed.
