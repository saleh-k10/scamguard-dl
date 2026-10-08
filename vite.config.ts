// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Publishable (browser-safe) backend values. Used only as a fallback when .env is
// absent from the build (it is git-ignored). NEVER add secrets here.
const PUBLIC_ENV = {
  VITE_SUPABASE_URL: "https://wtmzbfqbsupgdsgeqkvk.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_1gCi3Sy_QkwqeqtKEDK2pw_zcRtJ_Ss",
  VITE_SUPABASE_PROJECT_ID: "wtmzbfqbsupgdsgeqkvk",
};
for (const [k, v] of Object.entries(PUBLIC_ENV)) {
  if (!process.env[k]) process.env[k] = v;
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: Object.fromEntries(
      Object.keys(PUBLIC_ENV).map((k) => [`import.meta.env.${k}`, JSON.stringify(process.env[k])]),
    ),
  },
});
