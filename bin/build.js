#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Handlebars from 'handlebars';
import { program } from 'commander';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);

program
  .name('build')
  .description('Build HTML slides from YAML content')
  .option('-c, --content <path>', 'Content YAML file', 'content/slides.yaml')
  .option('-o, --output <path>', 'Output HTML file', 'output/slides.html')
  .option('-t, --theme <name>', 'Theme name (minimal, dark, corporate)')
  .parse();

const opts = program.opts();

// Load config
let config = {
  theme: 'minimal',
  transition: 'fade',
  timing: { default: 5, transition: 0.8 }
};

try {
  const configPath = path.join(projectRoot, 'config.yaml');
  if (fs.existsSync(configPath)) {
    config = { ...config, ...yaml.load(fs.readFileSync(configPath, 'utf-8')) };
  }
} catch (err) {
  console.warn('Warning: Could not load config.yaml, using defaults');
}

// Override theme from CLI
if (opts.theme) {
  config.theme = opts.theme;
}

// Load content
let content;
try {
  content = yaml.load(fs.readFileSync(opts.content, 'utf-8'));
} catch (err) {
  console.error(`Error reading content file: ${opts.content}`);
  console.error('Run "npm run parse" first to generate content from outline.');
  process.exit(1);
}

// Load theme CSS
let themeCSS = '';
const themePath = path.join(projectRoot, 'themes', `${config.theme}.css`);
try {
  themeCSS = fs.readFileSync(themePath, 'utf-8');
} catch (err) {
  console.warn(`Warning: Theme "${config.theme}" not found, using minimal`);
  try {
    themeCSS = fs.readFileSync(path.join(projectRoot, 'themes', 'minimal.css'), 'utf-8');
  } catch (e) {
    // Use embedded fallback
    themeCSS = getDefaultTheme();
  }
}

// Register Handlebars helpers
Handlebars.registerHelper('renderContent', function(contentItem) {
  switch (contentItem.type) {
    case 'bullets':
      return new Handlebars.SafeString(renderBullets(contentItem.items));
    case 'text':
      return new Handlebars.SafeString(`<p>${escapeHtml(contentItem.text)}</p>`);
    case 'image':
      return new Handlebars.SafeString(
        `<img src="${escapeHtml(contentItem.src)}" alt="${escapeHtml(contentItem.alt || '')}" />`
      );
    case 'code':
      return new Handlebars.SafeString(
        `<pre><code class="language-${escapeHtml(contentItem.language)}">${escapeHtml(contentItem.code)}</code></pre>`
      );
    default:
      return '';
  }
});

function renderBullets(items, level = 0) {
  if (!items || items.length === 0) return '';

  let html = '<ul>';
  let i = 0;

  while (i < items.length) {
    const item = items[i];
    const itemLevel = item.level || 0;

    if (itemLevel === level) {
      html += `<li>${escapeHtml(item.text)}`;

      // Check for nested items
      const nested = [];
      let j = i + 1;
      while (j < items.length && (items[j].level || 0) > level) {
        nested.push(items[j]);
        j++;
      }

      if (nested.length > 0) {
        html += renderBullets(nested, level + 1);
        i = j;
      } else {
        i++;
      }

      html += '</li>';
    } else {
      i++;
    }
  }

  html += '</ul>';
  return html;
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate HTML
const template = getTemplate();
const compiledTemplate = Handlebars.compile(template);

const html = compiledTemplate({
  title: content.title || 'Presentation',
  subtitle: content.subtitle || '',
  slides: content.slides || [],
  theme: config.theme,
  themeCSS: themeCSS,
  transition: config.transition,
  transitionSpeed: config.timing?.transition || 0.8
});

// Ensure output directory exists
const outputDir = path.dirname(opts.output);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write output
fs.writeFileSync(opts.output, html);
console.log(`Built ${content.slides?.length || 0} slides to ${opts.output}`);

function getTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/white.css">
  <style>
    {{{themeCSS}}}
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      {{#if title}}
      <section class="title-slide">
        <h1>{{title}}</h1>
        {{#if subtitle}}<h2>{{subtitle}}</h2>{{/if}}
      </section>
      {{/if}}

      {{#each slides}}
      <section data-timing="{{#if this.timing}}{{this.timing}}{{else}}5{{/if}}">
        {{#if this.title}}<h2>{{this.title}}</h2>{{/if}}
        {{#each this.content}}
        {{{renderContent this}}}
        {{/each}}
      </section>
      {{/each}}
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      transition: '{{transition}}',
      transitionSpeed: 'default',
      autoSlide: 0,
      controls: true,
      progress: true,
      center: true,
      width: 1920,
      height: 1080
    });
  </script>
</body>
</html>`;
}

function getDefaultTheme() {
  return `
    .reveal {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .reveal h1, .reveal h2 {
      color: #333;
      font-weight: 600;
    }
    .reveal .title-slide h1 {
      font-size: 2.5em;
    }
    .reveal .title-slide h2 {
      font-size: 1.5em;
      color: #666;
      font-weight: 400;
    }
    .reveal ul {
      text-align: left;
    }
    .reveal li {
      margin: 0.5em 0;
    }
    .reveal pre {
      width: 100%;
    }
    .reveal code {
      background: #f4f4f4;
      padding: 0.2em 0.4em;
      border-radius: 4px;
    }
    .reveal pre code {
      padding: 1em;
    }
    .reveal img {
      max-width: 80%;
      max-height: 60vh;
    }
  `;
}
