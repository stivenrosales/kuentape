/**
 * Brand configuration — single source of truth.
 *
 * Each deployment customizes these values via env vars.
 * The code NEVER hardcodes client-specific branding.
 *
 * Required env vars for full customization:
 *   NEXT_PUBLIC_BRAND_NAME       — e.g. "C&A"
 *   NEXT_PUBLIC_BRAND_TAGLINE    — e.g. "Contadores y Asociados"
 *   NEXT_PUBLIC_BRAND_FULL_NAME  — e.g. "C&A — Contadores y Asociados"
 */

export const brand = {
  /** Short name shown in sidebar, tabs, etc. */
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Estudio Contable",

  /** Tagline shown below the name */
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE ?? "Sistema de gestión contable",

  /** Full name for PDFs, metadata, alt texts */
  fullName:
    process.env.NEXT_PUBLIC_BRAND_FULL_NAME ??
    "Estudio Contable — Sistema de gestión",

  /** Logo paths (relative to /public) */
  logo: {
    /** Full logo with text — login, PDFs */
    full: "/brand/logo.svg",
    /** Icon-only mark — sidebar expanded */
    mark: "/brand/logo-mark.svg",
    /** Mark in circle — favicon, badges */
    badge: "/brand/logo-badge.svg",
  },
} as const;

export type Brand = typeof brand;
