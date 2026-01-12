# Claude Code Context

This file provides context for Claude Code sessions working on this project.

## Project Overview

Slides Factory is a Node.js CLI tool that converts plain text outlines into reveal.js HTML presentations and 4K videos.

## Architecture

```
Input (plain text) → Parser → YAML → Builder → HTML → Renderer → MP4
```

### Key Files

| File | Purpose |
|------|---------|
| `bin/parse.js` | Converts markdown-like outline to structured YAML |
| `bin/build.js` | Generates reveal.js HTML from YAML using Handlebars |
| `bin/preview.js` | Simple HTTP server for local preview |
| `bin/render.js` | Uses Puppeteer to screenshot slides, ffmpeg to encode video |
| `slides.sh` | Bash wrapper for multi-presentation workflow |
| `config.yaml` | Global settings (theme, timing, video resolution) |

### Content Types

The YAML intermediate format supports these content types:

```yaml
content:
  - type: bullets
    items:
      - text: "Item text"
        level: 0  # 0 = top level, 1 = nested, etc.
  - type: text
    text: "Paragraph content"
  - type: code
    language: "python"
    code: "print('hello')"
  - type: image
    src: "path/to/image.png"
    alt: "Description"
```

### Themes

CSS files in `themes/` directory. Each theme styles:
- `.reveal` - base styles
- `.reveal h1, h2` - headings
- `.reveal .title-slide` - first slide
- `.reveal ul, li` - bullet lists
- `.reveal pre, code` - code blocks
- `.reveal img` - images
- `.reveal .progress` - progress bar

## Common Tasks

### Adding a new content type

1. Update `bin/parse.js` - add parsing logic in `parseSlideBlock()`
2. Update `bin/build.js` - add case in `renderContent` Handlebars helper
3. Update `docs/user-guide.md` - document the new type

### Adding a new theme

1. Create `themes/mytheme.css`
2. Follow structure of existing themes
3. Use with `./slides.sh build name -t mytheme`

### Changing video output

Settings in `config.yaml` under `video:` or via CLI flags to render.js:
- `--width`, `--height` - resolution
- `--fps` - frame rate

### Debugging

- Parse issues: Check `content/slides.yaml` output
- Build issues: Check browser console when previewing
- Render issues: Puppeteer logs to console; check ffmpeg is installed

## Dependencies

- `reveal.js` - Slide framework (loaded from CDN in built HTML)
- `puppeteer` - Headless Chrome for screenshots
- `handlebars` - HTML templating
- `js-yaml` - YAML parsing
- `commander` - CLI argument parsing
- `marked` - Not currently used but available for markdown parsing

## Testing Changes

```bash
# Quick test cycle
./slides.sh new test-pres
# Edit presentations/test-pres/outline.txt
./slides.sh all test-pres
./slides.sh preview test-pres

# Test video rendering
./slides.sh render test-pres
```

## Future Improvements

Potential enhancements to consider:

- [ ] Speaker notes support (`Note:` syntax in outline)
- [ ] PDF export via Puppeteer's `page.pdf()`
- [ ] Watch mode for auto-rebuild on file changes
- [ ] Remote image fetching and caching
- [ ] Syntax highlighting in code blocks (highlight.js)
- [ ] Custom slide layouts (two-column, image-left, etc.)
- [ ] Animation/fragment support for bullet reveals
- [ ] Audio narration track (TTS integration)
- [ ] Template system for consistent branding
