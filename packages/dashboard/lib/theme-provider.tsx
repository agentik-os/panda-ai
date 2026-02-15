"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme Provider for Dashboard
 *
 * Wraps the application with next-themes for seamless dark mode support.
 * Persists user preference in localStorage and prevents flash of unstyled content.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
