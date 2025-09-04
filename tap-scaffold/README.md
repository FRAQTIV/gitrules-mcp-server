## FRAQTIV Homebrew Tap (git)

This directory is a scaffold you can copy into a new repository: `fraqtiv/homebrew-gitrules`.

### Create Tap Repo

1. On GitHub create **fraqtiv/homebrew-gitrules** (public, MIT).
2. Copy contents of `tap-scaffold/` to the root of that repo.
3. Commit & push.

### Usage

```bash
brew tap fraqtiv/gitrules https://github.com/FRAQTIV/homebrew-gitrules
brew install gitrules-mcp
```

Or (after users tap once):

```bash
brew install fraqtiv/gitrules/gitrules-mcp
```

### Releasing a New Version

1. Tag release in main project (e.g. `v0.3.1`).
2. Compute new SHA256:

   ```bash
   VERSION=v0.3.1
    BASE=https://github.com/FRAQTIV/gitrules-mcp-server/archive/refs/tags
    curl -L -s "${BASE}/${VERSION}.tar.gz" \
       -o /tmp/gitrules-mcp-${VERSION}.tar.gz
   shasum -a 256 /tmp/gitrules-mcp-${VERSION}.tar.gz | awk '{print $1}'
   ```

3. Update `url` & `sha256` in `Formula/gitrules-mcp.rb`.
4. Bump version if needed (Homebrew infers from URL).
5. For first submission run:

   ```bash
   brew audit --new-formula --strict Formula/gitrules-mcp.rb
   ```

   Afterwards:

   ```bash
   brew audit --strict gitrules-mcp
   ```

6. Commit and push; users can `brew upgrade gitrules-mcp`.

### CI

The provided workflow runs a basic install/test on macOS latest.

### Bottles (Optional Later)

You can add bottle generation via GitHub Actions using `brew test-bot`.
For now the formula builds from source.

### License

Same MIT license as the upstream project.
