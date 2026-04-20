import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSectionContent, getGateQuiz } from '@/lib/content';
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

    const { chapterId, sectionId, missedQuestionIds, studentAnswers } = await request.json();

    // Load section content and quiz for context
    const section = getSectionContent(chapterId, sectionId);
    const quiz = getGateQuiz(chapterId, sectionId);

    // Build context about what the student got wrong
    const missedQuestions = quiz.questions.filter((q) =>
      missedQuestionIds.includes(q.id)
    );

    const missedContext = missedQuestions
      .map((q) => {
        const correctOption = q.options.find((o) => o.correct);
        const studentSelectedIndex = studentAnswers?.[q.id];
        const studentAnswer = studentSelectedIndex !== undefined ? q.options[studentSelectedIndex]?.text : null;
        return `- Question: "${q.question}"\n  Student's answer: "${studentAnswer || 'unknown'}"\n  Correct answer: "${correctOption?.text}"\n  Explanation: ${q.explanation}`;
      })
      .join('\n\n');

    const keyTermsList = section.keyTerms.map((t) => `${t.term}: ${t.definition}`).join('\n');

    // Call Claude to generate remediation content
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are ${courseConfig.aiTutor.role}. A student just failed a quiz on section ${sectionId}: "${section.title}". Your job is to help them understand the concepts they missed.

Key terms for this section:
${keyTermsList}

Generate supplementary learning content that:
1. Addresses WHY the student's specific wrong answer is incorrect — explain the misconception behind their choice
2. Re-explains the missed concepts in a different way than the original textbook
3. Uses relatable, real-world examples (think everyday businesses students interact with)
4. Includes a simple analogy or memory trick where helpful
5. Is encouraging and supportive in tone

Respond with ONLY valid JSON in this exact format (no other text):
{
  "title": "<catchy title for the remediation content>",
  "introduction": "<1-2 encouraging sentences acknowledging this is a learning opportunity>",
  "explanations": [
    {
      "concept": "<concept name>",
      "explanation": "<clear re-explanation in 2-3 paragraphs>",
      "example": "<relatable real-world example>",
      "tip": "<memory trick or key takeaway>"
    }
  ],
  "summary": "<2-3 sentence summary tying it all together>"
}`,
      messages: [
        {
          role: 'user',
          content: `The student missed these questions:\n\n${missedContext}\n\nPlease generate focused remediation content to help them understand these concepts better.`,
        },
      ],
    });

    // Parse Claude's response
    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    let remediation;
    try {
      remediation = JSON.parse(responseContent.text);
    } catch {
      const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        remediation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse Claude response as JSON');
      }
    }

    // Log the AI interaction
    await supabase.from('ai_interactions').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      interaction_type: 'remediation',
      context: { chapterId, sectionId, missedQuestionIds },
      prompt_sent: `Generate remediation for ${sectionId}`,
      response_received: responseContent.text,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    });

    return NextResponse.json({ remediation });
  } catch (error) {
    console.error('Remediation generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate remediation content. Please try again.' },
      { status: 500 }
    );
  }
}
