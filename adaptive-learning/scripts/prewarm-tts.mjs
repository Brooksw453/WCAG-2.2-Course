/**
 * Pre-warm the OpenAI TTS cache for a course's Listen audio.
 *
 * Generates the MP3 audio the app would request on first Listen and uploads it
 * to the shared Supabase `audio-cache` bucket, so playback is served from cache
 * (instant, no live OpenAI call, no stutter) instead of generated on demand.
 *
 * It replicates EXACTLY how the app builds + chunks + hashes Listen text
 * (TTSController section builder, FreeTextPrompt prompt block, chunkText, and
 * the /api/tts SHA-256 cache key) so the pre-generated clips hash-match what the
 * runtime asks for. Quiz audio is intentionally skipped — QuizGate shuffles
 * options per session, so its text isn't stable enough to pre-cache (the
 * playback resilience fix covers it instead).
 *
 * Usage:  node scripts/prewarm-tts.mjs            (generate)
 *         node scripts/prewarm-tts.mjs --dry-run  (count + cost only)
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY,
 * COURSE_SLUG from .env.local.
 */
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const VOICE = 'echo';          // app default voice
const MODEL = 'tts-1';         // matches /api/tts DEFAULT_MODEL
const BUCKET = 'audio-cache';
const CONCURRENCY = 3;
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';

// ── env ──────────────────────────────────────────────────────────────
function loadEnv() {
  const env = {};
  const p = '.env.local';
  if (existsSync(p)) {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  // Real process-env vars win over the (often placeholder) .env.local, so the
  // script can be run with secrets passed inline instead of written to disk.
  for (const k of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY', 'COURSE_SLUG']) {
    if (process.env[k]) env[k] = process.env[k];
  }
  return env;
}
const env = loadEnv();
const COURSE_SLUG = env.COURSE_SLUG || 'ai-admin-higher-ed';
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── replicate src/lib/stripMarkdown.ts ───────────────────────────────
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── replicate chunkText() from src/hooks/useTextToSpeech.ts ───────────
function chunkText(text) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if (current.length + sentence.length > 200 && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}

// ── replicate TTSController section block builder ────────────────────
function sectionBlocks(section) {
  const result = [];
  result.push(`Section ${section.sectionId}: ${section.title}`);
  if (section.learningObjectives?.length > 0) {
    result.push('Learning objectives: ' + section.learningObjectives.join('. ') + '.');
  }
  for (const block of section.contentBlocks || []) {
    // Interactive sandbox panels have no static body — the app's TTSController
    // skips them (they render their own per-message Listen), so skip here too.
    if (block.type === 'sandbox') continue;
    if (block.type === 'image') {
      const alt = (block.imageAlt || '').trim();
      const caption = (block.imageCaption || '').trim();
      const parts = [];
      if (block.title) parts.push(block.title);
      if (alt) parts.push(alt);
      if (caption && caption !== alt && !alt.includes(caption)) parts.push(caption);
      const text = parts.join('. ');
      if (text) result.push(text);
      continue;
    }
    const plainBody = stripMarkdown(block.body ?? '');
    result.push(block.title ? `${block.title}. ${plainBody}` : plainBody);
  }
  if (section.keyTerms?.length > 0) {
    const termsText = section.keyTerms.map(t => `${t.term}: ${t.definition}`).join('. ');
    result.push('Key terms. ' + termsText);
  }
  // FreeTextPrompt Listen block (text = prompt.prompt, verbatim)
  if (section.freeTextPrompt?.prompt) {
    result.push(section.freeTextPrompt.prompt);
  }
  return result;
}

// ── collect every unique chunk across all sections ───────────────────
function collectChunks() {
  const chunks = new Set();
  const chaptersDir = 'content/chapters';
  for (const ch of readdirSync(chaptersDir).filter(d => d.startsWith('ch'))) {
    const secDir = join(chaptersDir, ch, 'sections');
    if (!existsSync(secDir)) continue;
    for (const f of readdirSync(secDir).filter(n => n.endsWith('.json'))) {
      const section = JSON.parse(readFileSync(join(secDir, f), 'utf8'));
      for (const blockText of sectionBlocks(section)) {
        for (const c of chunkText(blockText)) chunks.add(c);
      }
    }
  }
  return [...chunks];
}

// ── /api/tts hashKey: sha256(`${voice}:${text}`) hex, first 32 chars ──
function cachePath(text) {
  const hash = createHash('sha256').update(`${VOICE}:${text}`).digest('hex').slice(0, 32);
  return `${COURSE_SLUG}/${hash}.mp3`;
}

async function listExisting() {
  const existing = new Set();
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(BUCKET).list(COURSE_SLUG, { limit: 1000, offset });
    if (error) throw new Error('list failed: ' + error.message);
    if (!data || data.length === 0) break;
    for (const o of data) existing.add(`${COURSE_SLUG}/${o.name}`);
    if (data.length < 1000) break;
    offset += data.length;
  }
  return existing;
}

async function generateAndUpload(text, path) {
  const res = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, voice: VOICE, input: text, response_format: 'mp3' }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: 'audio/mpeg', upsert: true });
  if (error) throw new Error('upload: ' + error.message);
}

// ── main ─────────────────────────────────────────────────────────────
const chunks = collectChunks();
const totalChars = chunks.reduce((n, c) => n + c.length, 0);
console.log(`Course: ${COURSE_SLUG} · voice: ${VOICE}`);
console.log(`Unique chunks: ${chunks.length} · total chars: ${totalChars} · est. full-generate cost: $${(totalChars / 1e6 * 15).toFixed(2)}`);

const existing = await listExisting();
const todo = chunks.filter(c => !existing.has(cachePath(c)));
const todoChars = todo.reduce((n, c) => n + c.length, 0);
console.log(`Already cached: ${chunks.length - todo.length} · to generate: ${todo.length} · est. cost now: $${(todoChars / 1e6 * 15).toFixed(2)}`);

if (DRY_RUN) { console.log('(dry run — nothing generated)'); process.exit(0); }
if (todo.length === 0) { console.log('Nothing to do — cache already warm.'); process.exit(0); }

let done = 0, failed = 0;
async function worker(queue) {
  for (;;) {
    const text = queue.pop();
    if (text === undefined) return;
    const path = cachePath(text);
    let ok = false;
    for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
      try { await generateAndUpload(text, path); ok = true; }
      catch (e) {
        if (attempt === 4) { failed++; console.warn(`FAIL (${++done}/${todo.length}): ${e.message}`); }
        else await new Promise(r => setTimeout(r, 800 * attempt));
      }
    }
    if (ok) { done++; if (done % 25 === 0 || done === todo.length) console.log(`  ${done}/${todo.length} generated`); }
  }
}
const queue = [...todo];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));
console.log(`Done. Generated ${done - failed}, failed ${failed}.`);
process.exit(failed > 0 ? 1 : 0);
