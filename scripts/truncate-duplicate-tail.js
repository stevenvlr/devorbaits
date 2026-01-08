const fs = require('fs')

function main() {
  const targetPath = process.argv[2]
  const customMarker = process.argv[3]
  if (!targetPath) {
    console.error('Usage: node scripts/truncate-duplicate-tail.js <file-path> [marker]')
    process.exit(1)
  }

  const input = fs.readFileSync(targetPath, 'utf8')

  // Marker that appears when a duplicated component was appended after file end.
  const marker = customMarker || '\n}\n  // Pop-up Duo'
  const idx = input.indexOf(marker)
  if (idx === -1) {
    console.error('Marker not found; file not modified.')
    process.exit(1)
  }

  const truncated = input.slice(0, idx + '\n}\n'.length)
  fs.writeFileSync(targetPath, truncated, 'utf8')
  console.log(`Truncated file at index ${idx}`)
}

main()

