const fs = require('fs')

function main() {
  const targetPath = process.argv[2]
  if (!targetPath) {
    console.error('Usage: node scripts/truncate-account-duplicates.js <file-path>')
    process.exit(1)
  }

  const input = fs.readFileSync(targetPath, 'utf8')

  // We expect duplicated JSX blocks like:
  // "  )\n\n  return (" repeated multiple times.
  const markerRe = /\n  \)\r?\n\r?\n  return \([\s\S]*$/m
  if (!markerRe.test(input)) {
    console.error('Duplicate return marker not found; file not modified.')
    process.exit(1)
  }

  const output = input.replace(markerRe, '\n  )\n}\n')
  fs.writeFileSync(targetPath, output, 'utf8')
  console.log('Account page duplicates truncated')
}

main()

