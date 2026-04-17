import type { NavigateFunction } from "react-router-dom";

// Variable to store navigate function
let navigateInstance: NavigateFunction | null = null;

/**
 * Set navigate function instance
 * Should be called from component at app startup
 */
export const setNavigate = (navigate: NavigateFunction) => {
  navigateInstance = navigate;
};

/**
 * Get navigate function instance
 * Can be used in non-component contexts
 */
export const getNavigate = (): NavigateFunction | null => {
  return navigateInstance;
};

