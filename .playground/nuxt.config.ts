import colors from "tailwindcss/colors";

export default defineNuxtConfig({
  extends: [".."],
  tailwindcss: {
    config: {
      theme: {
        extend: { colors: { primary: colors.blue } },
      },
    },
  },
});
