import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  adapter: vercel({ maxDuration: 60 }),
  integrations: [tailwind()],
  security: {
    checkOrigin: false,
  },
});
