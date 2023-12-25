import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  // build: {
  //   // sourcemap: true,
  //   outDir: "visual-regex",
  // },
  css: {
    modules: {
      //  localsConvention: 'camelCaseOnly',
      scopeBehaviour: "global",
      exportGlobals: true,
      // localsConvention: (originalClassName, generatedClassName, inputFile) => {
      //   console.log(originalClassName, generatedClassName, inputFile);
      //   return generatedClassName;
      // },
    },
  },
});
