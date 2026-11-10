// Turns the single-file demo build into a page fragment for hosts that supply their own
// <html>/<head>/<body> skeleton (e.g. a claude.ai Artifact). Output: dist-artifact/duit.html
import { readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync('dist-artifact/index.html', 'utf8')
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? ''
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? ''

// Keep inline styles and scripts; drop metas/links the host already provides or that point at missing files.
const keep = [...head.matchAll(/<(style|script)\b[\s\S]*?<\/\1>/g)].map((m) => m[0])

const out = [
  '<title>Duit</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  '<meta name="theme-color" content="#f7f5fc">',
  ...keep,
  body.trim(),
].join('\n')

writeFileSync('dist-artifact/duit.html', out)
console.log(`dist-artifact/duit.html  ${(out.length / 1024).toFixed(0)} kB`)
