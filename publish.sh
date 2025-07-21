#!/bin/bash
set -e

# 1. Checkout orphan docs branch
git checkout --orphan docs
git reset  # Unstage all files

# 2. Build the project
npm run build

# 3. Move build output to docs folder
mv ./dist ./docs

# 4. Add only docs folder and commit
git add docs
git commit -m "Deploy to docs branch"

# 5. Force push docs branch
git push -f origin docs

# 6. Switch back to main branch
rm -rf docs
git checkout main --force

# 7. Remove orphan branch
git branch -D docs