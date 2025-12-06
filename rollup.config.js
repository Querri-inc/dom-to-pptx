import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const input = 'src/index.js';

// Config A: produce module (mjs), cjs and a lightweight UMD that keeps `pptxgenjs` external.
const configModules = {
  input,
  output: [
    {
      file: 'dist/dom-to-pptx.mjs',
      format: 'es',
      sourcemap: false,
    },
    {
      file: 'dist/dom-to-pptx.cjs',
      format: 'cjs',
      sourcemap: false,
      exports: 'named',
    },
    {
      file: 'dist/dom-to-pptx.min.js',
      format: 'umd',
      name: 'domToPptx',
      esModule: false,
      globals: {
        pptxgenjs: 'PptxGenJS',
      },
    },
  ],
  plugins: [resolve(), commonjs()],
  // Keep pptxgenjs external for module builds so bundlers like Vite don't attempt to resolve Node-only
  // builtins that may be present in pptxgenjs; consumers should install `pptxgenjs` alongside this package
  // when using ESM/CJS builds.
  external: ['pptxgenjs'],
};

// Config B: produce a single standalone UMD bundle that includes dependencies (for script-tag consumers).
const configBundle = {
  input,
  output: {
    file: 'dist/dom-to-pptx.bundle.js',
    format: 'umd',
    name: 'domToPptx',
    esModule: false,
    sourcemap: false,
  },
  plugins: [resolve(), commonjs()],
  // Bundle everything for the standalone artifact.
  external: [],
};

export default [configModules, configBundle];
