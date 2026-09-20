import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // client-provided palette
          light: "#83B7DE", // light blue accent
          DEFAULT: "#3566AB", // mid blue - primary actions
          dark: "#114084", // navy - headers, disclaimer, emphasis
        },
        neutral: {
          off: "#F1F1F1", // off-white background
          mid: "#808080", // gray - secondary text, borders
          ink: "#1C1C1C", // near-black - primary text
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
