# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# Package Management
- Use npm instead of pnpm for package management. Confidence: 0.85

# Frontend UI
- Use custom modals instead of generic Alert dialogs. Confidence: 0.70

# Project Structure
- Maintain mobile apps in app/ directory and website in web/ directory. Confidence: 0.55

# Environment / Config Files
- Keep .env.example as an exact mirror of the keys the code actually reads: add every missing key and delete entries that are no longer referenced. Confidence: 0.6

# Development Scope
- Only build features and pages that are listed in features.md; remove anything not in the spec. Confidence: 0.65

