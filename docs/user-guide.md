# Slides Factory User Guide

## Quick Start (Multiple Presentations)

```bash
cd slides-factory

# Create a new presentation
./slides.sh new my-talk

# Edit your content
vi presentations/my-talk/outline.txt

# Build it
./slides.sh all my-talk

# Preview in browser
./slides.sh preview my-talk

# Export to video
./slides.sh render my-talk

# List all presentations
./slides.sh list
```

## Quick Start (Single Presentation)

```bash
cd slides-factory
npm run parse      # Convert outline to YAML
npm run build      # Generate HTML slides
npm run preview    # View in browser
npm run render     # Export to 4K video
```

---

## Managing Multiple Presentations

The factory supports two approaches for handling independent presentations:

### Option A: Separate Directories (Recommended)

Create a subfolder for each presentation:

```
slides-factory/
├── presentations/
│   ├── project-a/
│   │   ├── outline.txt
│   │   ├── slides.yaml
│   │   └── slides.html
│   └── project-b/
│       ├── outline.txt
│       ├── slides.yaml
│       └── slides.html
```

**Workflow for Project A:**

```bash
# Parse
npm run parse presentations/project-a/outline.txt -- -o presentations/project-a/slides.yaml

# Build
npm run build -- -c presentations/project-a/slides.yaml -o presentations/project-a/slides.html

# Preview
npm run preview -- -f presentations/project-a/slides.html

# Render video
npm run render -- -i presentations/project-a/slides.html -o presentations/project-a/slides.mp4 -c presentations/project-a/slides.yaml
```

### Option B: Different Filenames in Default Folders

Keep everything in the default folders but use different names:

```
slides-factory/
├── input/
│   ├── project-a.txt
│   └── project-b.txt
├── content/
│   ├── project-a.yaml
│   └── project-b.yaml
└── output/
    ├── project-a.html
    ├── project-a.mp4
    ├── project-b.html
    └── project-b.mp4
```

**Workflow:**

```bash
# Project A
npm run parse input/project-a.txt -- -o content/project-a.yaml
npm run build -- -c content/project-a.yaml -o output/project-a.html

# Project B
npm run parse input/project-b.txt -- -o content/project-b.yaml
npm run build -- -c content/project-b.yaml -o output/project-b.html
```

---

## Writing Your Outline

Create a plain text file with this format:

```markdown
# Presentation Title
## Subtitle or Author Name

---

# First Slide Title
- Bullet point one
- Bullet point two
  - Nested bullet (indent with 2 spaces)
  - Another nested item

---

# Second Slide Title
Regular paragraph text goes here.

Another paragraph.

---

# Slide with Code

Here's some example code:

```python
def hello():
    print("Hello, world!")
```

---

# Slide with Image

![Description](path/to/image.png)

---

# Final Slide
Thank you!
```

### Syntax Rules

| Element | Syntax |
|---------|--------|
| Slide separator | `---` on its own line |
| Slide title | `# Title` |
| Presentation title | First `# Title` before any `---` |
| Subtitle | `## Subtitle` after presentation title |
| Bullet points | `- Item` or `* Item` |
| Nested bullets | Indent with 2 spaces |
| Images | `![alt text](path/to/image.png)` |
| Code blocks | Triple backticks with language |
| Paragraphs | Plain text |

---

## Editing the YAML (Intermediate Format)

After running `npm run parse`, you get a YAML file you can edit:

```yaml
title: "My Presentation"
subtitle: "By Author"
theme: minimal
timing:
  default: 5          # Default seconds per slide

slides:
  - title: "Introduction"
    timing: 8         # Override: 8 seconds for this slide
    content:
      - type: bullets
        items:
          - text: "First point"
            level: 0
          - text: "Second point"
            level: 0
          - text: "Nested point"
            level: 1

  - title: "Code Example"
    content:
      - type: text
        text: "Here's how it works:"
      - type: code
        language: javascript
        code: |
          function demo() {
            return "Hello";
          }
```

### Content Types

| Type | Description | Fields |
|------|-------------|--------|
| `bullets` | Bullet list | `items` (array with `text` and `level`) |
| `text` | Paragraph | `text` |
| `code` | Code block | `language`, `code` |
| `image` | Image | `src`, `alt` |

---

## Themes

Three built-in themes are available:

| Theme | Description |
|-------|-------------|
| `minimal` | Clean white background, simple typography |
| `dark` | Dark gradient background, purple accents |
| `corporate` | Professional look with blue accents |

### Changing Theme

**Method 1:** Edit `config.yaml`

```yaml
theme: dark
```

**Method 2:** Command line flag

```bash
npm run build -- -t dark
```

### Creating Custom Themes

1. Copy an existing theme from `themes/`
2. Rename it (e.g., `themes/custom.css`)
3. Edit the CSS
4. Set `theme: custom` in config

---

## Configuration Reference

Edit `config.yaml`:

```yaml
# Visual theme
theme: minimal        # minimal, dark, corporate, or custom

# Slide transitions
transition: fade      # none, fade, slide, convex, concave, zoom

# Timing
timing:
  default: 5          # Seconds per slide (for video)
  transition: 0.8     # Transition duration

# Video output settings
video:
  width: 3840         # 4K width
  height: 2160        # 4K height
  fps: 30             # Frames per second
  format: mp4
```

---

## Command Reference

### Parse: Convert outline to YAML

```bash
npm run parse [input-file] -- [options]

# Options:
#   -o, --output <path>   Output YAML file (default: content/slides.yaml)

# Examples:
npm run parse                                    # Uses input/outline.txt
npm run parse my-talk.txt                        # Custom input file
npm run parse my-talk.txt -- -o my-talk.yaml    # Custom output
```

### Build: Generate HTML slides

```bash
npm run build -- [options]

# Options:
#   -c, --content <path>  Content YAML (default: content/slides.yaml)
#   -o, --output <path>   Output HTML (default: output/slides.html)
#   -t, --theme <name>    Theme override

# Examples:
npm run build                                    # Default paths
npm run build -- -t dark                         # Dark theme
npm run build -- -c my.yaml -o my.html          # Custom paths
```

### Preview: View in browser

```bash
npm run preview -- [options]

# Options:
#   -p, --port <number>   Server port (default: 3000)
#   -f, --file <path>     HTML file (default: output/slides.html)
#   --no-open             Don't auto-open browser

# Examples:
npm run preview                                  # Default
npm run preview -- -f output/my-talk.html       # Specific file
npm run preview -- -p 8080                       # Different port
```

### Render: Export to video

```bash
npm run render -- [options]

# Options:
#   -i, --input <path>    Input HTML (default: output/slides.html)
#   -o, --output <path>   Output video (default: output/slides.mp4)
#   -c, --content <path>  Content YAML for timing (default: content/slides.yaml)
#   --fps <number>        Frames per second (default: 30)
#   --width <number>      Video width (default: 3840)
#   --height <number>     Video height (default: 2160)

# Examples:
npm run render                                   # Default 4K
npm run render -- --width 1920 --height 1080    # 1080p instead
npm run render -- -i my.html -o my.mp4          # Custom paths
```

---

## Keyboard Shortcuts (Preview Mode)

| Key | Action |
|-----|--------|
| `→` / `Space` | Next slide |
| `←` | Previous slide |
| `F` | Fullscreen |
| `O` | Overview mode |
| `S` | Speaker notes |
| `Esc` | Exit fullscreen/overview |
| `Home` | First slide |
| `End` | Last slide |

---

## Tips

1. **Start simple**: Write your outline first, don't worry about formatting
2. **Iterate**: Use preview frequently while editing
3. **Per-slide timing**: Add `timing: N` to specific slides in YAML for longer/shorter display
4. **Images**: Place images in the output folder or use absolute paths
5. **Version control**: The plain text and YAML files work great with git

---

## Troubleshooting

**"Cannot find module" error**
```bash
npm install
```

**Preview won't open browser**
```bash
npm run preview -- --no-open
# Then manually open http://localhost:3000
```

**Video rendering fails**
- Ensure ffmpeg is installed: `ffmpeg -version`
- Check that HTML file exists: `npm run build` first

**Slides look wrong**
- Check YAML syntax (proper indentation)
- Verify theme file exists in `themes/`
