import type { Config } from "tailwindcss";

/**
 * Single source of truth for the Tailwind theme lives in `tailwind.config.js`
 * (Tailwind resolves the .js entry point first). This typed wrapper simply
 * re-exports it so both entry points can never drift apart.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require("./tailwind.config.js") as Config;

export default config;
