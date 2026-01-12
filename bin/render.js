#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import puppeteer from 'puppeteer';
import { program } from 'commander';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);

program
  .name('render')
  .description('Render HTML slides to MP4 video')
  .option('-i, --input <path>', 'Input HTML file', 'output/slides.html')
  .option('-o, --output <path>', 'Output video file', 'output/slides.mp4')
  .option('-c, --content <path>', 'Content YAML for timing info', 'content/slides.yaml')
  .option('--fps <number>', 'Frames per second', '30')
  .option('--width <number>', 'Video width', '3840')
  .option('--height <number>', 'Video height', '2160')
  .parse();

const opts = program.opts();

// Load config
let config = {
  timing: { default: 5, transition: 0.8 },
  video: { width: 3840, height: 2160, fps: 30 }
};

try {
  const configPath = path.join(projectRoot, 'config.yaml');
  if (fs.existsSync(configPath)) {
    config = { ...config, ...yaml.load(fs.readFileSync(configPath, 'utf-8')) };
  }
} catch (err) {
  console.warn('Warning: Could not load config.yaml, using defaults');
}

// Override from CLI
const width = parseInt(opts.width) || config.video?.width || 3840;
const height = parseInt(opts.height) || config.video?.height || 2160;
const fps = parseInt(opts.fps) || config.video?.fps || 30;
const defaultTiming = config.timing?.default || 5;
const transitionTime = config.timing?.transition || 0.8;

// Load content for timing info
let content = { slides: [] };
try {
  content = yaml.load(fs.readFileSync(opts.content, 'utf-8'));
} catch (err) {
  console.warn('Warning: Could not load content YAML, using default timing');
}

// Check if ffmpeg is available
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
} catch (err) {
  console.error('Error: ffmpeg is not installed or not in PATH');
  console.error('Please install ffmpeg: https://ffmpeg.org/download.html');
  process.exit(1);
}

// Check if input file exists
const inputPath = path.resolve(opts.input);
if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  console.error('Run "npm run build" first to generate HTML slides.');
  process.exit(1);
}

async function render() {
  console.log(`Rendering ${width}x${height} @ ${fps}fps...`);

  // Create temp directory for frames
  const tempDir = path.join(projectRoot, '.temp-frames');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--window-size=${width},${height}`
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });

  // Load the presentation
  const fileUrl = `file://${inputPath}`;
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  // Wait for reveal.js to initialize
  await page.waitForFunction(() => {
    return typeof Reveal !== 'undefined' && Reveal.isReady();
  }, { timeout: 10000 });

  // Get total slide count
  const totalSlides = await page.evaluate(() => {
    return Reveal.getTotalSlides();
  });

  console.log(`Found ${totalSlides} slides`);

  let frameIndex = 0;

  // Capture each slide
  for (let slideIndex = 0; slideIndex < totalSlides; slideIndex++) {
    // Navigate to slide
    await page.evaluate((index) => {
      Reveal.slide(index);
    }, slideIndex);

    // Wait for transition
    await sleep(transitionTime * 1000);

    // Get timing for this slide
    const slideTiming = content.slides?.[slideIndex]?.timing || defaultTiming;
    const frameCount = Math.round(slideTiming * fps);

    console.log(`Slide ${slideIndex + 1}/${totalSlides}: ${slideTiming}s (${frameCount} frames)`);

    // Capture frames for this slide
    for (let f = 0; f < frameCount; f++) {
      const framePath = path.join(tempDir, `frame-${String(frameIndex).padStart(6, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });
      frameIndex++;

      // Show progress
      if (f % fps === 0) {
        process.stdout.write('.');
      }
    }
    console.log('');
  }

  await browser.close();

  console.log(`Captured ${frameIndex} frames`);

  // Ensure output directory exists
  const outputPath = path.resolve(opts.output);
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Compile frames to video using ffmpeg
  console.log('Encoding video...');

  const ffmpegArgs = [
    '-y',
    '-framerate', String(fps),
    '-i', path.join(tempDir, 'frame-%06d.png'),
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outputPath
  ];

  await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
    ffmpeg.on('error', reject);
  });

  // Clean up temp files
  fs.rmSync(tempDir, { recursive: true });

  console.log(`\nVideo saved to: ${outputPath}`);

  // Show video info
  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`Size: ${sizeMB} MB`);
  console.log(`Duration: ~${(frameIndex / fps).toFixed(1)} seconds`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

render().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
