# skills-bundle

Extracts the bundled `*.md` skill files into a folder on your machine.

## Usage

```bash
npx skills-bundle --out ./skills
```

## Options

- `--out <path>` Output directory (default: `./skills`)
- `--overwrite` Overwrite existing files (default: off; existing files are skipped)
- `--list` Print the list of bundled files and exit

## Updating the bundle (when you add more skills)

If you add more `*.md` files to the parent folder, run:

```powershell
.\sync.ps1
```
