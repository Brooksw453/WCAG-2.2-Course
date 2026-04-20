import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGateQuiz } from '@/lib/content';
import { COURSE_ID } from '@/lib/course.config';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapterId, sectionId, answers } = await request.json();

    // Load the gate quiz to grade against
    const quiz = getGateQuiz(chapterId, sectionId);

    if (quiz.questions.length === 0) {
      return NextResponse.json({
        score: 100,
        passed: true,
        correctAnswers: {},
      });
    }

    // Grade the quiz
    let correct = 0;
    const correctAnswers: Record<string, number> = {};

    quiz.questions.forEach((question) => {
      const correctIdx = question.options.findIndex((opt) => opt.correct);
      correctAnswers[question.id] = correctIdx;
      if (answers[question.id] === correctIdx) {
        correct++;
      }
    });

    const score = (correct / quiz.questions.length) * 100;
    const passed = score >= quiz.passThreshold;

    // Count previous attempts
    const { count } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID)
      .eq('chapter_id', chapterId)
      .eq('section_id', sectionId);

    const attemptNumber = (count || 0) + 1;

    // Store the attempt
    await supabase.from('quiz_attempts').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      chapter_id: chapterId,
      section_id: sectionId,
      attempt_number: attemptNumber,
      answers,
      score,
      passed,
    });

    // Update section progress
    if (passed) {
      await supabase
        .from('section_progress')
        .upsert(
          {
            user_id: user.id,
            course_id: COURSE_ID,
            chapter_id: chapterId,
            section_id: sectionId,
            status: 'in_progress', // Will become 'completed' after free-text
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,course_id,chapter_id,section_id' }
        );
    } else {
      // Increment remediation count
      const { data: existing } = await supabase
        .from('section_progress')
        .select('remediation_count')
        .eq('user_id', user.id)
        .eq('course_id', COURSE_ID)
        .eq('chapter_id', chapterId)
        .eq('section_id', sectionId)
        .single();

      await supabase
        .from('section_progress')
        .upsert(
          {
            user_id: user.id,
            course_id: COURSE_ID,
            chapter_id: chapterId,
            section_id: sectionId,
            status: 'needs_remediation',
            remediation_count: (existing?.remediation_count || 0) + 1,
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,course_id,chapter_id,section_id' }
        );
    }

    return NextResponse.json({
      score,
      passed,
      correctAnswers,
      attemptNumber,
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
