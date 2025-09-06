import { terser } from '@rollup/plugin-terser';

export default [
  // Build para navegador (ES modules)
  {
    input: 'src/frontend/core/sdk.js',
    output: {
      file: 'dist/nextrust-sdk.esm.js',
      format: 'es',
      name: 'NextTrustSDK'
    },
    plugins: [
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  },
  // Build para navegador (UMD)
  {
    input: 'src/frontend/core/sdk.js',
    output: {
      file: 'dist/nextrust-sdk.umd.js',
      format: 'umd',
      name: 'NextTrustSDK'
    },
    plugins: [
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  },
  // Build para navegador (IIFE)
  {
    input: 'src/frontend/core/sdk.js',
    output: {
      file: 'dist/nextrust-sdk.js',
      format: 'iife',
      name: 'NextTrustSDK'
    },
    plugins: [
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  },
  // Build de desenvolvimento (sem minificação)
  {
    input: 'src/frontend/core/sdk.js',
    output: {
      file: 'dist/nextrust-sdk.dev.js',
      format: 'iife',
      name: 'NextTrustSDK'
    }
  }
];
