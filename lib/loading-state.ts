let globalLoadingState = false;
let loadingResetTimer: NodeJS.Timeout | null = null;

export function acquireLoadingLock(): boolean {
  if (globalLoadingState) return false;

  globalLoadingState = true;

  // Safety reset after 5 seconds in case of errors
  if (loadingResetTimer) clearTimeout(loadingResetTimer);
  loadingResetTimer = setTimeout(() => {
    globalLoadingState = false;
  }, 5000);

  return true;
}

export function releaseLoadingLock(): void {
  globalLoadingState = false;
  if (loadingResetTimer) {
    clearTimeout(loadingResetTimer);
    loadingResetTimer = null;
  }
}
