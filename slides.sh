#!/bin/bash

# Slides Factory CLI Wrapper
# Simplifies working with multiple presentations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRESENTATIONS_DIR="$SCRIPT_DIR/presentations"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_help() {
    cat << 'EOF'
Slides Factory - Presentation Management Tool

USAGE:
    ./slides.sh <command> <presentation-name> [options]

COMMANDS:
    new <name>          Create a new presentation
    parse <name>        Parse outline.txt to slides.yaml
    build <name>        Build HTML slides from YAML
    preview <name>      Preview slides in browser
    render <name>       Export to 4K video
    all <name>          Run parse + build (full rebuild)
    list                List all presentations
    status <name>       Show presentation status

OPTIONS:
    -t, --theme <name>  Override theme (minimal, dark, corporate)
    -h, --help          Show this help message

EXAMPLES:
    ./slides.sh new quarterly-review
    ./slides.sh build quarterly-review
    ./slides.sh build quarterly-review -t dark
    ./slides.sh preview quarterly-review
    ./slides.sh render quarterly-review
    ./slides.sh all quarterly-review

WORKFLOW:
    1. ./slides.sh new my-talk        # Create presentation
    2. Edit presentations/my-talk/outline.txt
    3. ./slides.sh all my-talk        # Parse and build
    4. ./slides.sh preview my-talk    # Check in browser
    5. Edit presentations/my-talk/slides.yaml (optional fine-tuning)
    6. ./slides.sh build my-talk      # Rebuild after YAML edits
    7. ./slides.sh render my-talk     # Export video
EOF
}

ensure_presentations_dir() {
    if [ ! -d "$PRESENTATIONS_DIR" ]; then
        mkdir -p "$PRESENTATIONS_DIR"
    fi
}

get_presentation_path() {
    local name="$1"
    echo "$PRESENTATIONS_DIR/$name"
}

cmd_new() {
    local name="$1"
    if [ -z "$name" ]; then
        echo -e "${RED}Error: Presentation name required${NC}"
        echo "Usage: ./slides.sh new <name>"
        exit 1
    fi

    ensure_presentations_dir
    local pres_path=$(get_presentation_path "$name")

    if [ -d "$pres_path" ]; then
        echo -e "${YELLOW}Warning: Presentation '$name' already exists${NC}"
        read -p "Overwrite outline.txt? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi

    mkdir -p "$pres_path"

    # Create template outline
    cat > "$pres_path/outline.txt" << 'TEMPLATE'
# Presentation Title
## Your Name

---

# Introduction

- First key point
- Second key point
- Third key point

---

# Main Content

Explain your main ideas here.

- Supporting point
  - Detail one
  - Detail two

---

# Conclusion

- Summary point one
- Summary point two

---

# Thank You!

Questions?
TEMPLATE

    # Create local config (optional override)
    cat > "$pres_path/config.yaml" << 'CONFIG'
# Presentation-specific config (overrides global config.yaml)
# Uncomment to customize:

# theme: minimal
# transition: fade
# timing:
#   default: 5
CONFIG

    echo -e "${GREEN}Created presentation: $name${NC}"
    echo ""
    echo "Next steps:"
    echo -e "  1. Edit ${BLUE}presentations/$name/outline.txt${NC}"
    echo -e "  2. Run ${BLUE}./slides.sh all $name${NC}"
    echo -e "  3. Run ${BLUE}./slides.sh preview $name${NC}"
}

cmd_parse() {
    local name="$1"
    if [ -z "$name" ]; then
        echo -e "${RED}Error: Presentation name required${NC}"
        exit 1
    fi

    local pres_path=$(get_presentation_path "$name")
    local outline="$pres_path/outline.txt"
    local yaml_out="$pres_path/slides.yaml"

    if [ ! -f "$outline" ]; then
        echo -e "${RED}Error: $outline not found${NC}"
        echo "Create it first with: ./slides.sh new $name"
        exit 1
    fi

    echo -e "${BLUE}Parsing${NC} $name..."
    cd "$SCRIPT_DIR"
    node bin/parse.js "$outline" -o "$yaml_out"
    echo -e "${GREEN}Done!${NC} Output: presentations/$name/slides.yaml"
}

cmd_build() {
    local name="$1"
    local theme="$2"

    if [ -z "$name" ]; then
        echo -e "${RED}Error: Presentation name required${NC}"
        exit 1
    fi

    local pres_path=$(get_presentation_path "$name")
    local yaml_in="$pres_path/slides.yaml"
    local html_out="$pres_path/slides.html"

    if [ ! -f "$yaml_in" ]; then
        echo -e "${RED}Error: $yaml_in not found${NC}"
        echo "Run first: ./slides.sh parse $name"
        exit 1
    fi

    echo -e "${BLUE}Building${NC} $name..."
    cd "$SCRIPT_DIR"

    local theme_arg=""
    if [ -n "$theme" ]; then
        theme_arg="-t $theme"
    fi

    node bin/build.js -c "$yaml_in" -o "$html_out" $theme_arg
    echo -e "${GREEN}Done!${NC} Output: presentations/$name/slides.html"
}

cmd_preview() {
    local name="$1"
    if [ -z "$name" ]; then
        echo -e "${RED}Error: Presentation name required${NC}"
        exit 1
    fi

    local pres_path=$(get_presentation_path "$name")
    local html_file="$pres_path/slides.html"

    if [ ! -f "$html_file" ]; then
        echo -e "${RED}Error: $html_file not found${NC}"
        echo "Run first: ./slides.sh build $name"
        exit 1
    fi

    echo -e "${BLUE}Starting preview server...${NC}"
    cd "$SCRIPT_DIR"
    node bin/preview.js -f "$html_file"
}

cmd_render() {
    local name="$1"
    if [ -z "$name" ]; then
        echo -e "${RED}Error: Presentation name required${NC}"
        exit 1
    fi

    local pres_path=$(get_presentation_path "$name")
    local html_file="$pres_path/slides.html"
    local yaml_file="$pres_path/slides.yaml"
    local video_out="$pres_path/slides.mp4"

    if [ ! -f "$html_file" ]; then
        echo -e "${RED}Error: $html_file not found${NC}"
        echo "Run first: ./slides.sh build $name"
        exit 1
    fi

    echo -e "${BLUE}Rendering video${NC} for $name..."
    cd "$SCRIPT_DIR"
    node bin/render.js -i "$html_file" -o "$video_out" -c "$yaml_file"
    echo -e "${GREEN}Done!${NC} Output: presentations/$name/slides.mp4"
}

cmd_all() {
    local name="$1"
    local theme="$2"

    if [ -z "$name" ]; then
        echo -e "${RED}Error: Presentation name required${NC}"
        exit 1
    fi

    cmd_parse "$name"
    cmd_build "$name" "$theme"

    echo ""
    echo -e "${GREEN}Build complete!${NC}"
    echo "Preview with: ./slides.sh preview $name"
}

cmd_list() {
    ensure_presentations_dir

    echo -e "${BLUE}Presentations:${NC}"
    echo ""

    if [ -z "$(ls -A "$PRESENTATIONS_DIR" 2>/dev/null)" ]; then
        echo "  (none yet)"
        echo ""
        echo "Create one with: ./slides.sh new <name>"
        return
    fi

    for dir in "$PRESENTATIONS_DIR"/*/; do
        if [ -d "$dir" ]; then
            local name=$(basename "$dir")
            local status=""

            if [ -f "$dir/slides.mp4" ]; then
                status="${GREEN}[video]${NC}"
            elif [ -f "$dir/slides.html" ]; then
                status="${BLUE}[html]${NC}"
            elif [ -f "$dir/slides.yaml" ]; then
                status="${YELLOW}[yaml]${NC}"
            else
                status="[outline only]"
            fi

            echo -e "  $name $status"
        fi
    done
}

cmd_status() {
    local name="$1"
    if [ -z "$name" ]; then
        echo -e "${RED}Error: Presentation name required${NC}"
        exit 1
    fi

    local pres_path=$(get_presentation_path "$name")

    if [ ! -d "$pres_path" ]; then
        echo -e "${RED}Presentation '$name' not found${NC}"
        exit 1
    fi

    echo -e "${BLUE}Presentation:${NC} $name"
    echo ""

    local files=("outline.txt" "slides.yaml" "slides.html" "slides.mp4" "config.yaml")

    for file in "${files[@]}"; do
        if [ -f "$pres_path/$file" ]; then
            local size=$(du -h "$pres_path/$file" | cut -f1)
            local modified=$(stat -c %y "$pres_path/$file" 2>/dev/null | cut -d. -f1 || stat -f %Sm "$pres_path/$file" 2>/dev/null)
            echo -e "  ${GREEN}✓${NC} $file ($size, $modified)"
        else
            echo -e "  ${RED}✗${NC} $file"
        fi
    done
}

# Parse arguments
COMMAND="$1"
shift || true

THEME=""
NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--theme)
            THEME="$2"
            shift 2
            ;;
        -h|--help)
            print_help
            exit 0
            ;;
        *)
            if [ -z "$NAME" ]; then
                NAME="$1"
            fi
            shift
            ;;
    esac
done

# Execute command
case "$COMMAND" in
    new)
        cmd_new "$NAME"
        ;;
    parse)
        cmd_parse "$NAME"
        ;;
    build)
        cmd_build "$NAME" "$THEME"
        ;;
    preview)
        cmd_preview "$NAME"
        ;;
    render)
        cmd_render "$NAME"
        ;;
    all)
        cmd_all "$NAME" "$THEME"
        ;;
    list|ls)
        cmd_list
        ;;
    status)
        cmd_status "$NAME"
        ;;
    -h|--help|help|"")
        print_help
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo "Run ./slides.sh --help for usage"
        exit 1
        ;;
esac
