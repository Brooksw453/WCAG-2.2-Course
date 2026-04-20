#!/bin/bash
# Run this script from inside the WCAG-2.2-Course directory to initialize the repo
# Usage: cd WCAG-2.2-Course && bash setup-repo.sh

echo "=== Initializing WCAG-2.2-Course repo ==="

# Initialize git repo
git init -b main

# Add all content
git add -A

# Initial commit
git commit -m "Initial course content: 8 modules, 21 sections, 42 quiz questions

Complete WCAG 2.2 for Higher Ed textbook content:
- 8 modules with meta.json, section content, gate quizzes, and discussions
- ~27,900 words of original faculty-focused accessibility content
- Detailed course outline and source reference guide
- CLAUDE.md with full build instructions for the adaptive learning platform
- Assignment specs for 3 assignments (to be generated during build)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

echo ""
echo "=== Creating GitHub repo ==="

# Create the GitHub repo and push
gh repo create WCAG-2.2-Course --public --source=. --remote=origin --push

echo ""
echo "=== Done! ==="
echo "Repo URL: https://github.com/$(gh api user -q .login)/WCAG-2.2-Course"
