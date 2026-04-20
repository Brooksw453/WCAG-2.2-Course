import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClaudeClient } from '@/lib/claude';
import { getAssignment } from '@/lib/content';
import { rateLimit } from '@/lib/rateLimit';
import { COURSE_ID } from '@/lib/course.config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { success } = rateLimit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const { assignmentId, sectionKey, messages, currentDraft } = await request.json();

    if (!assignmentId || !sectionKey || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load assignment config
    const assignment = getAssignment(assignmentId);
    const section = assignment.sections.find(s => s.key === sectionKey);

    if (!section) {
      return NextResponse.json({ error: 'Invalid section key' }, { status: 400 });
    }

    // Build system prompt for collaborative drafting
    const systemPrompt = `You are an AI drafting assistant helping a community college student write their business plan for Assignment ${assignmentId}: "${assignment.title}".

Current section: "${section.title}"
Section prompt: "${section.instructions}"
Required word count: ${section.minWords}-${section.maxWords} words

Key criteria the response will be graded on: ${section.rubric}

Writing tips: ${section.tips.join('; ')}

${currentDraft ? `The student's current draft:\n"${currentDraft}"\n` : ''}

YOUR ROLE — You are a collaborative drafting partner, NOT just a coach:

PHASE 1 (Gathering info): If the student hasn't shared enough details yet, ask 2-3 specific questions about their business idea relevant to this section. Keep questions focused and conversational. Don't ask all questions at once — adapt based on what they've shared.

PHASE 2 (Drafting): Once you have enough information from the student's answers (usually after 2-3 exchanges), GENERATE A COMPLETE DRAFT for this section. The draft should:
- Be written in the student's voice (first person, conversational but professional)
- Be ${section.minWords}-${section.maxWords} words
- Directly address all rubric criteria
- Incorporate the specific details the student shared
- Sound like a community college student wrote it, not an AI
- Be wrapped between markers like this:

--- DRAFT ---
[the actual draft content here]
--- END DRAFT ---

After the draft, briefly explain what you included and ask if they'd like to adjust anything.

PHASE 3 (Refining): If the student wants changes, generate an updated draft with the same markers.

IMPORTANT:
- Use the student's actual ideas and details — don't invent business details they didn't share
- When you have enough info, go ahead and draft — don't keep asking questions endlessly
- If the student says "improve my draft" or "refine this", work with their existing text
- If asked to "write it for me" without any input, ask 2-3 starter questions first
- Keep non-draft conversation brief and focused`;

    // Format messages for Claude API
    const claudeMessages = messages.map((msg: { role: 'user' | 'assistant'; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }));

    const claude = createClaudeClient();
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      temperature: 0.7,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const aiText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Check if the response contains a draft
    const hasDraft = aiText.includes('--- DRAFT ---') && aiText.includes('--- END DRAFT ---');

    // Log AI interaction
    await supabase.from('ai_interactions').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      interaction_type: 'draft_chat',
      context: { assignmentId, sectionKey, messageCount: messages.length, hasDraft },
      prompt_sent: messages[messages.length - 1]?.content || '',
      response_received: aiText,
      tokens_used: response.usage?.output_tokens || 0,
    });

    return NextResponse.json({ message: aiText, hasDraft });
  } catch (error) {
    console.error('Draft chat error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
