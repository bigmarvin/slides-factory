# Slides Factory

A reproducible pipeline for converting plain text outlines into HTML slides and 4K videos.

```
Plain Text → YAML (editable) → HTML Slides → 4K Video
```

## Features

- **Simple input format** - Write outlines in plain text with markdown-like syntax
- **Editable intermediate** - YAML format allows fine-tuning before final build
- **Beautiful slides** - Powered by reveal.js with smooth animations
- **Themeable** - Three built-in themes (minimal, dark, corporate) + easy custom themes
- **4K video export** - Generate MP4 videos via Puppeteer + ffmpeg
- **Multi-presentation support** - Manage multiple presentations independently

## Quick Start

```bash
# Install dependencies
npm install

# Create a new presentation
./slides.sh new my-talk

# Edit your content
vi presentations/my-talk/outline.txt

# Build slides
./slides.sh all my-talk

# Preview in browser
./slides.sh preview my-talk

# Export to 4K video
./slides.sh render my-talk
```

## Writing Outlines

Create a plain text file with this format:

````
# Presentation Title
## Your Name

---

# First Slide
- Bullet point one
- Bullet point two
  - Nested bullet

---

# Second Slide
Regular paragraph text.

---

# Code Example

```python
def hello():
    print("Hello!")
```

---

# Thank You!
````

### Syntax

| Element | Syntax |
|---------|--------|
| Slide separator | `---` on its own line |
| Slide title | `# Title` |
| Bullets | `- Item` (indent 2 spaces for nesting) |
| Images | `![alt](path/to/image.png)` |
| Code | Triple backticks with language |
| Paragraphs | Plain text |

## Commands

| Command | Description |
|---------|-------------|
| `./slides.sh new <name>` | Create new presentation |
| `./slides.sh all <name>` | Parse + build |
| `./slides.sh parse <name>` | Convert outline to YAML |
| `./slides.sh build <name>` | Generate HTML from YAML |
| `./slides.sh preview <name>` | Open in browser |
| `./slides.sh render <name>` | Export to 4K video |
| `./slides.sh list` | List all presentations |
| `./slides.sh status <name>` | Show presentation status |

### Options

```bash
./slides.sh build my-talk -t dark    # Use dark theme
./slides.sh --help                   # Full help
```

## Themes

| Theme | Description |
|-------|-------------|
| `minimal` | Clean white background, simple typography |
| `dark` | Dark gradient background, purple accents |
| `corporate` | Professional look with blue accents |

Change theme in `config.yaml`:

```yaml
theme: dark
```

## Configuration

Edit `config.yaml`:

```yaml
theme: minimal
transition: fade          # none, fade, slide, convex, concave, zoom

timing:
  default: 5              # Seconds per slide (for video)
  transition: 0.8         # Transition duration

video:
  width: 3840             # 4K
  height: 2160
  fps: 30
```

Override timing per-slide in the YAML:

```yaml
slides:
  - title: "Important Slide"
    timing: 10            # 10 seconds for this slide
    content:
      - type: text
        text: "Take your time reading this."
```

## Project Structure

```
slides-factory/
├── slides.sh              # Main CLI wrapper
├── bin/
│   ├── parse.js           # Plain text → YAML
│   ├── build.js           # YAML → HTML
│   ├── preview.js         # Local server
│   └── render.js          # HTML → MP4
├── themes/
│   ├── minimal.css
│   ├── dark.css
│   └── corporate.css
├── presentations/         # Your presentations
│   └── my-talk/
│       ├── outline.txt
│       ├── slides.yaml
│       ├── slides.html
│       └── slides.mp4
├── config.yaml            # Global settings
└── docs/user-guide.md     # Detailed documentation
```

## Requirements

- Node.js 18+
- ffmpeg (for video rendering)

## Keyboard Shortcuts (Preview)

| Key | Action |
|-----|--------|
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `F` | Fullscreen |
| `O` | Overview mode |
| `Esc` | Exit fullscreen/overview |

## License

MIT
