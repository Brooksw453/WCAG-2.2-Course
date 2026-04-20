import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ContentBlock {
  type: string;
  title?: string;
  body: string;
}

interface SectionData {
  sectionId: string;
  chapterId: number;
  title: string;
  contentBlocks: ContentBlock[];
}

interface ChapterMeta {
  chapterId: number;
  title: string;
  sections: string[];
}

interface SearchResult {
  chapterId: number;
  chapterTitle: string;
  sectionId: string;
  sectionTitle: string;
  snippet: string;
}

function buildSnippet(text: string, query: string, snippetLength: number = 120): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) return '';

  // Calculate window around the match
  const matchEnd = matchIndex + query.length;
  const halfWindow = Math.floor((snippetLength - query.length) / 2);
  let start = Math.max(0, matchIndex - halfWindow);
  let end = Math.min(text.length, matchEnd + halfWindow);

  // Adjust if near boundaries
  if (start === 0) {
    end = Math.min(text.length, snippetLength);
  }
  if (end === text.length) {
    start = Math.max(0, text.length - snippetLength);
  }

  let snippet = text.slice(start, end).trim();

  // Add ellipsis
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  // Highlight all occurrences of the query in the snippet (case-insensitive)
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  snippet = snippet.replace(
    new RegExp(escaped, 'gi'),
    (match) => `<<match>>${match}<</match>>`
  );

  return snippet;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const contentDir = path.join(process.cwd(), 'content', 'chapters');
  const results: SearchResult[] = [];

  try {
    const chapterDirs = fs.readdirSync(contentDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && entry.name.startsWith('ch'))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const chapterDir of chapterDirs) {
      if (results.length >= 20) break;

      const metaPath = path.join(contentDir, chapterDir.name, 'meta.json');
      if (!fs.existsSync(metaPath)) continue;

      const meta: ChapterMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      const sectionsDir = path.join(contentDir, chapterDir.name, 'sections');

      if (!fs.existsSync(sectionsDir)) continue;

      for (const sectionId of meta.sections) {
        if (results.length >= 20) break;

        const sectionPath = path.join(sectionsDir, `${sectionId}.json`);
        if (!fs.existsSync(sectionPath)) continue;

        const section: SectionData = JSON.parse(fs.readFileSync(sectionPath, 'utf-8'));
        const lowerQuery = query.toLowerCase();

        // Check section title
        if (section.title.toLowerCase().includes(lowerQuery)) {
          results.push({
            chapterId: meta.chapterId,
            chapterTitle: meta.title,
            sectionId: section.sectionId,
            sectionTitle: section.title,
            snippet: buildSnippet(section.title, query),
          });
          continue;
        }

        // Check content blocks
        let found = false;
        for (const block of section.contentBlocks) {
          if (found) break;

          // Check block title
          if (block.title && block.title.toLowerCase().includes(lowerQuery)) {
            const snippet = buildSnippet(block.title, query);
            results.push({
              chapterId: meta.chapterId,
              chapterTitle: meta.title,
              sectionId: section.sectionId,
              sectionTitle: section.title,
              snippet,
            });
            found = true;
            continue;
          }

          // Check block body
          // Strip markdown formatting for cleaner search
          const plainBody = block.body.replace(/\*\*/g, '').replace(/[#>_`]/g, '');
          if (plainBody.toLowerCase().includes(lowerQuery)) {
            const snippet = buildSnippet(plainBody, query);
            results.push({
              chapterId: meta.chapterId,
              chapterTitle: meta.title,
              sectionId: section.sectionId,
              sectionTitle: section.title,
              snippet,
            });
            found = true;
          }
        }
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
