/** @type {import('@serwist/cli').BuildOptions} */
export default {
  globDirectory: '.output/public',
  globPatterns: ['**/*.{css,html,ico,js,json,png,svg,txt,webp,woff,woff2}'],
  globIgnores: ['sw.js', '**/*.map'],
  swSrc: 'src/sw.ts',
  swDest: '.output/public/sw.js',
}
