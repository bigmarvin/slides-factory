#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { program } from 'commander';

program
  .name('parse')
  .description('Parse plain text outline into YAML format')
  .argument('[input]', 'Input file path', 'input/outline.txt')
  .option('-o, --output <path>', 'Output YAML file', 'content/slides.yaml')
  .parse();

const inputPath = program.args[0] || 'input/outline.txt';
const outputPath = program.opts().output;

// Read input file
let content;
try {
  content = fs.readFileSync(inputPath, 'utf-8');
} catch (err) {
  console.error(`Error reading file: ${inputPath}`);
  console.error('Create an outline file first. Example:');
  console.error(`
# My Presentation
## By Author Name

---

# First Slide
- Point one
- Point two

---

# Second Slide
Some content here.
`);
  process.exit(1);
}

// Parse the outline
const result = parseOutline(content);

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write YAML output
const yamlContent = yaml.dump(result, {
  lineWidth: -1,
  quotingType: '"',
  forceQuotes: false
});

fs.writeFileSync(outputPath, yamlContent);
console.log(`Parsed ${result.slides.length} slides to ${outputPath}`);

function parseOutline(text) {
  const lines = text.split('\n');
  const result = {
    title: '',
    subtitle: '',
    theme: 'minimal',
    timing: {
      default: 5
    },
    slides: []
  };

  // Split into slide blocks by ---
  const blocks = text.split(/^---$/m).map(b => b.trim()).filter(Boolean);

  if (blocks.length === 0) {
    return result;
  }

  // First block might be title slide
  const firstBlock = blocks[0];
  const titleMatch = firstBlock.match(/^#\s+(.+)$/m);
  const subtitleMatch = firstBlock.match(/^##\s+(.+)$/m);

  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }
  if (subtitleMatch) {
    result.subtitle = subtitleMatch[1].trim();
  }

  // Check if first block is just title/subtitle
  const firstBlockLines = firstBlock.split('\n').filter(l => l.trim());
  const isTitleOnly = firstBlockLines.every(line =>
    line.match(/^#{1,2}\s+/) || line.trim() === ''
  );

  const slideBlocks = isTitleOnly ? blocks.slice(1) : blocks;

  // Parse each slide block
  for (const block of slideBlocks) {
    const slide = parseSlideBlock(block);
    if (slide) {
      result.slides.push(slide);
    }
  }

  return result;
}

function parseSlideBlock(block) {
  const lines = block.split('\n');
  const slide = {
    title: '',
    content: []
  };

  let i = 0;

  // Find title (# heading)
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.match(/^#\s+(.+)$/)) {
      slide.title = line.replace(/^#\s+/, '').trim();
      i++;
      break;
    } else if (line) {
      // Non-empty line that's not a title
      break;
    }
    i++;
  }

  // Parse content
  let currentBullets = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines between content
    if (!trimmed) {
      // Flush bullets if we have them
      if (currentBullets.length > 0) {
        slide.content.push({
          type: 'bullets',
          items: currentBullets
        });
        currentBullets = [];
      }
      i++;
      continue;
    }

    // Check for image
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      if (currentBullets.length > 0) {
        slide.content.push({
          type: 'bullets',
          items: currentBullets
        });
        currentBullets = [];
      }
      slide.content.push({
        type: 'image',
        alt: imageMatch[1],
        src: imageMatch[2]
      });
      i++;
      continue;
    }

    // Check for bullet point
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const text = bulletMatch[2].trim();
      currentBullets.push({
        text,
        level: Math.floor(indent / 2)
      });
      i++;
      continue;
    }

    // Check for code block
    if (trimmed.startsWith('```')) {
      if (currentBullets.length > 0) {
        slide.content.push({
          type: 'bullets',
          items: currentBullets
        });
        currentBullets = [];
      }
      const lang = trimmed.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      slide.content.push({
        type: 'code',
        language: lang || 'text',
        code: codeLines.join('\n')
      });
      i++;
      continue;
    }

    // Otherwise it's a paragraph
    if (currentBullets.length > 0) {
      slide.content.push({
        type: 'bullets',
        items: currentBullets
      });
      currentBullets = [];
    }
    slide.content.push({
      type: 'text',
      text: trimmed
    });
    i++;
  }

  // Flush remaining bullets
  if (currentBullets.length > 0) {
    slide.content.push({
      type: 'bullets',
      items: currentBullets
    });
  }

  return slide;
}
