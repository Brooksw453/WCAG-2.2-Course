import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSectionContent, getChapterMeta } from '@/lib/content';
import { createClaudeClient } from '@/lib/claude';
import { rateLimit } from '@/lib/rateLimit';
import { courseConfig, COURSE_ID } from '@/lib/course.config';

export async function POST(request: Request) {
  try {
    const anthropic = createClaudeClient();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success, remaining } = rateLimit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const { chapterId, sectionId, promptId, responseText } = await request.json();

    // Load section content for context
    const section = getSectionContent(chapterId, sectionId);
    const chapterMeta = getChapterMeta(chapterId);
    const sectionList = chapterMeta.sections.map(sid => {
      try { return `Section ${sid}: ${getSectionContent(chapterId, sid).title}`; } catch { return `Section ${sid}`; }
    }).join('\n');
    const keyTermsList = section.keyTerms.map((t) => t.term).join(', ');
    const objectivesList = section.learningObjectives.join('\n- ');

    // Call Claude to evaluate
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are ${courseConfig.aiTutor.role}. You are evaluating a student's written response for section ${sectionId}: "${section.title}".

Your students are introductory-level learners. Many are first-generation college students. Your goal is to ENCOURAGE learning, not gatekeep. Grade generously while still being helpful.

Key concepts for this section: ${keyTermsList}

Learning objectives:
- ${objectivesList}

Evaluation rubric: ${section.freeTextPrompt.rubric}

GRADING GUIDELINES:
- If a student shows they understand the GENERAL IDEA, even with imperfect terminology or spelling errors, give them credit
- A response that addresses the prompt with a relevant example and shows basic understanding = 80+
- A response that mentions key concepts by name and applies them = 85+
- Only score below 70 if the response is off-topic, extremely vague, or shows no understanding
- Spelling and grammar mistakes should NOT lower the score — focus on comprehension
- Always find at least 2 genuine strengths to highlight
- Frame improvements as "to make your response even stronger" not as criticisms
- When suggesting improvements, reference specific course sections the student should review. Available sections in Chapter ${chapterId}:
${sectionList}
- Format improvement suggestions like: "To strengthen your answer, review Section X.Y (Topic) for more on [concept]"

Respond with ONLY valid JSON in this exact format (no other text):
{
  "score": <number 0-100>,
  "feedback": "<2-3 sentences of encouraging, constructive feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<suggestion with section reference>", "<suggestion with section reference>"]
}`,
      messages: [
        {
          role: 'user',
          content: `Student's response to the prompt "${section.freeTextPrompt.prompt}":\n\n${responseText}`,
        },
      ],
    });

    // Parse Claude's response
    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let evaluation;
    try {
      evaluation = JSON.parse(responseContent.text);
    } catch {
      // Try to extract JSON from the response if it has extra text
      const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Claude response as JSON');
      }
    }

    // Store the response and evaluation
    await supabase.from('free_text_responses').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      chapter_id: chapterId,
      section_id: sectionId,
      prompt_id: promptId,
      response_text: responseText,
      ai_evaluation: evaluation,
      ai_model: 'claude-sonnet-4-20250514',
    });

    // If passed, update section progress to completed
    const passed = evaluation.score >= courseConfig.thresholds.freeTextPass;
    if (passed) {
      // Get the quiz score for mastery calculation
      const { data: quizAttempt } = await supabase
        .from('quiz_attempts')
        .select('score')
        .eq('user_id', user.id)
        .eq('course_id', COURSE_ID)
        .eq('chapter_id', chapterId)
        .eq('section_id', sectionId)
        .eq('passed', true)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      const quizScore = quizAttempt?.score || 100;
      const masteryScore = (quizScore * 0.6) + (evaluation.score * 0.4);

      await supabase
        .from('section_progress')
        .upsert(
          {
            user_id: user.id,
            course_id: COURSE_ID,
            chapter_id: chapterId,
            section_id: sectionId,
            status: 'completed',
            mastery_score: Math.round(masteryScore * 100) / 100,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,course_id,chapter_id,section_id' }
        );
    }

    // Log the AI interaction
    await supabase.from('ai_interactions').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      interaction_type: 'free_text_eval',
      context: { chapterId, sectionId, promptId },
      prompt_sent: `Evaluate response for ${sectionId}`,
      response_received: responseContent.text,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    });

    return NextResponse.json({
      evaluation,
      passed,
    });
  } catch (error) {
    console.error('Free-text evaluate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to evaluate response: ${errorMessage}` },
      { status: 500 }
    );
  }
}
