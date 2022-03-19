import { build } from 'esbuild'
import { rmSync } from 'fs'

rmSync('dist', {
  recursive: true,
  force: true,
})

build({
  entryPoints: [
    'src/bin/pm-auth.ts',
    'src/bin/pm-notifier.ts',
    'src/bin/pm-proxy.ts',
  ],
  bundle: true,
  outdir: 'dist',
  platform: 'node',
  target: 'node12',
  format: 'esm',
  external: ['./node_modules/*'],
  sourcemap: 'external',
})
