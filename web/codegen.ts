import type { CodegenConfig } from "@graphql-codegen/cli";

// Types for every query in src/ come from the API's schema file: change the schema, rerun, and the
// compiler points at every page that needs updating.
const config: CodegenConfig = {
  schema: "../api/src/schema.graphql",
  documents: ["src/**/*.{ts,tsx}", "!src/gql/**"],
  ignoreNoDocuments: false,
  generates: {
    "src/gql/": {
      preset: "client",
      presetConfig: { fragmentMasking: false },
      config: {
        scalars: { DateTime: "string" },
        useTypeImports: true,
        enumsAsTypes: true,
        nonOptionalTypename: true,
      },
    },
  },
};
export default config;
