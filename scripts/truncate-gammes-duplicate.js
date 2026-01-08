const fs = require('fs')

function main() {
  const targetPath = process.argv[2]
  if (!targetPath) {
    console.error('Usage: node scripts/truncate-gammes-duplicate.js <file-path>')
    process.exit(1)
  }

  const input = fs.readFileSync(targetPath, 'utf8')

  // In this repo, a duplicated block was appended after the component ended:
  // "\n}\n  const [gammes, setGammes] = useState..."
  // Remove everything from that point to EOF.
  const re = /\n}\r?\n  const \[gammes, setGammes\][\s\S]*$/m
  if (!re.test(input)) {
    console.error('Duplicate marker not found; file not modified.')
    process.exit(1)
  }

  const output = input.replace(re, '\n}\n')
  fs.writeFileSync(targetPath, output, 'utf8')
  console.log('Gammes duplicate tail removed')
}

main()

