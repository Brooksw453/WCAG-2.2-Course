import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClaudeClient } from '@/lib/claude';
import { getAssignment, getChapterMeta, getSectionContent } from '@/lib/content';
import { rateLimit } from '@/lib/rateLimit';
import { courseConfig, COURSE_ID } from '@/lib/course.config';

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

    const { assignmentId, sectionKey, content } = await request.json();

    if (!assignmentId || !sectionKey || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load assignment config
    const assignment = getAssignment(assignmentId);
    const section = assignment.sections.find(s => s.key === sectionKey);

    if (!section) {
      return NextResponse.json({ error: 'Invalid section key' }, { status: 400 });
    }

    // Count words
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < Math.floor(section.minWords * 0.5)) {
      return NextResponse.json({
        error: `Please write at least ${section.minWords} words. You have ${wordCount} words so far.`
      }, { status: 400 });
    }

    // Get previous drafts for context
    const { data: previousDrafts } = await supabase
      .from('assignment_drafts')
      .select('draft_number, ai_feedback')
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID)
      .eq('assignment_id', assignmentId)
      .eq('section_key', sectionKey)
      .order('draft_number', { ascending: false })
      .limit(3);

    const draftNumber = (previousDrafts?.[0]?.draft_number || 0) + 1;
    const previousFeedback = previousDrafts?.[0]?.ai_feedback;

    // Build section reference map from related chapters
    const relatedSections: string[] = [];
    for (const chId of (assignment.relatedChapters || [])) {
      try {
        const meta = getChapterMeta(chId);
        for (const sid of meta.sections) {
          try { relatedSections.push(`Section ${sid}: ${getSectionContent(chId, sid).title}`); } catch { relatedSections.push(`Section ${sid}`); }
        }
      } catch { /* chapter not found */ }
    }

    // Build system prompt
    const systemPrompt = `You are ${courseConfig.aiTutor.role}. You are evaluating a section of their assignment.

ASSIGNMENT: "${assignment.title}" (${assignment.points} points total)
SECTION: "${section.title}"
SECTION INSTRUCTIONS: ${section.instructions}
WORD REQUIREMENTS: ${section.minWords}-${section.maxWords} words
GRADING RUBRIC: ${section.rubric}

${previousFeedback ? `PREVIOUS FEEDBACK (draft ${draftNumber - 1}): The student received this feedback on their last draft and may have revised. Acknowledge improvements if you see them.
${JSON.stringify(previousFeedback)}` : ''}

GRADING GUIDELINES:
- This is a community college course. Be encouraging and constructive.
- Score on a scale of 0-100:
  - 90-100: Excellent — meets all rubric criteria with depth and specificity
  - 80-89: Good — meets most criteria, minor gaps
  - 70-79: Satisfactory — addresses the prompt but lacks specificity or depth
  - 60-69: Needs Improvement — missing key elements or too vague
  - Below 60: Incomplete — does not address the prompt adequately
- A student who shows understanding and makes a genuine effort = 75+
- Focus feedback on being ACTIONABLE — tell them exactly what to add or change
- If this is a revision, highlight what improved since the last draft
- Be warm and encouraging, especially for first drafts
- When suggesting improvements, reference specific course sections the student should review:
${relatedSections.join('\n')}
- Format improvement suggestions like: "Review Section X.Y (Topic) for more depth on [concept]"

Respond in this exact JSON format:
{
  "score": <number 0-100>,
  "feedback": "<2-3 sentences of overall assessment>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "improvements": ["<specific, actionable suggestion 1>", "<specific, actionable suggestion 2>"]
}`;

    const claude = createClaudeClient();
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here is the student's draft (${wordCount} words):\n\n${content}`
        }
      ],
    });

    const aiText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse the JSON response
    let evaluation;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      evaluation = JSON.parse(jsonMatch?.[0] || aiText);
    } catch {
      evaluation = {
        score: 75,
        feedback: aiText,
        strengths: ['Submitted a response'],
        improvements: ['Could not parse detailed feedback']
      };
    }

    // Save the draft
    await supabase.from('assignment_drafts').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      assignment_id: assignmentId,
      section_key: sectionKey,
      draft_number: draftNumber,
      content: content,
      ai_feedback: evaluation,
    });

    // Log AI interaction
    await supabase.from('ai_interactions').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      interaction_type: 'assignment_coaching',
      context: { assignmentId, sectionKey, draftNumber, wordCount },
      prompt_sent: `Assignment ${assignmentId}, Section: ${section.title}`,
      response_received: aiText,
      tokens_used: response.usage?.output_tokens || 0,
    });

    return NextResponse.json({
      evaluation,
      draftNumber,
      wordCount,
    });
  } catch (error) {
    console.error('Assignment evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate assignment section' },
      { status: 500 }
    );
  }
}
