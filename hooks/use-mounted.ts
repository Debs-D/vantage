import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Returns false during SSR and the first client render, true afterwards. Using
// useSyncExternalStore (rather than a state-in-effect flag) keeps this free of
// hydration mismatches and the set-state-in-effect lint rule. Used to gate
// content that depends on persisted localStorage state.
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
