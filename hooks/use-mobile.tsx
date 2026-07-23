import * as React from "react";

export function useIsMobile(mobileBreakpoint = 768) {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(
        `(max-width: ${mobileBreakpoint - 1}px)`,
      );
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    [mobileBreakpoint],
  );

  const getSnapshot = React.useCallback(() => {
    return window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`).matches;
  }, [mobileBreakpoint]);

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
