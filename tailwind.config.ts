import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{vue,js,ts}",
    "./components/**/*.{vue,js,ts}",
    "./composables/**/*.{js,ts}",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        layer: {
          primary: "#00dc82",
          ink: "#04140c",
        },
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
    },
  },
} satisfies Config;
