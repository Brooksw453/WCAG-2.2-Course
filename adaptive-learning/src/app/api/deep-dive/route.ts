import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSectionContent } from '@/lib/content';
import { createClaudeClient } from '@/lib/claude';
import { rateLimit } from '@/lib/rateLimit';
import { courseConfig, COURSE_ID } from '@/lib/course.config';

type DeepDiveType = 'dive_deeper' | 'real_world_example' | 'ask_question';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

    const {
      chapterId,
      sectionId,
      type,
      blockTitle,
      blockBody,
      termName,
      termDefinition,
      messages: chatHistory,
      question,
    } = await request.json() as {
      chapterId: number;
      sectionId: string;
      type: DeepDiveType;
      blockTitle?: string;
      blockBody?: string;
      termName?: string;
      termDefinition?: string;
      messages?: ChatMessage[];
      question?: string;
    };

    // Rate limiting: max 20 deep-dive calls per user per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('ai_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', COURSE_ID)
      .eq('interaction_type', 'deep_dive')
      .gte('created_at', oneHourAgo);

    if ((count || 0) >= 20) {
      return NextResponse.json(
        { error: 'You\'ve reached the exploration limit (20 per hour). Take a break and come back soon!' },
        { status: 429 }
      );
    }

    // Load section for context
    const section = getSectionContent(chapterId, sectionId);

    // Build the concept context
    const conceptContext = termName
      ? `Term: "${termName}"\nDefinition: "${termDefinition}"`
      : `Concept: "${blockTitle}"\nContent: "${blockBody}"`;

    // Build system prompt based on type
    let systemPrompt: string;
    let maxTokens: number;

    switch (type) {
      case 'dive_deeper':
        systemPrompt = `You are ${courseConfig.aiTutor.role}. A student wants a deeper explanation of a concept from section ${sectionId}: "${section.title}".

${conceptContext}

Provide a clear, expanded explanation that:
1. Breaks down the concept into simpler parts
2. Uses everyday language a first-year college student would understand
3. Adds detail the textbook didn't cover
4. Is 2-3 paragraphs maximum

Do NOT repeat the original content. Add NEW understanding. Use **bold** for key terms.`;
        maxTokens = 500;
        break;

      case 'real_world_example':
        systemPrompt = `You are ${courseConfig.aiTutor.role}. A student wants a relatable real-world example for a concept from section ${sectionId}: "${section.title}".

${conceptContext}

Provide ONE vivid, relatable real-world example that:
1. Uses a business or brand students would know (Starbucks, TikTok, Amazon, local restaurants, etc.)
2. Shows exactly how this concept plays out in practice
3. Is specific and concrete, not abstract
4. Is 1-2 paragraphs maximum

Use **bold** for the business name and key concept terms.`;
        maxTokens = 500;
        break;

      case 'ask_question':
        systemPrompt = `You are ${courseConfig.aiTutor.role}. A student is reading about "${blockTitle || termName}" in section ${sectionId}: "${section.title}".

Context they are reading:
${blockBody || termDefinition || ''}

Answer their question helpfully. Keep answers concise (2-3 paragraphs max). Use simple language. Use **bold** for key terms. If they ask something outside the scope of this business course, gently redirect them.`;
        maxTokens = 600;
        break;

      default:
        return NextResponse.json({ error: 'Invalid deep dive type' }, { status: 400 });
    }

    // Build messages array
    let apiMessages: ChatMessage[];
    if (type === 'ask_question' && chatHistory && chatHistory.length > 0) {
      // For chat, send the conversation history
      apiMessages = chatHistory;
      if (question) {
        apiMessages = [...chatHistory, { role: 'user' as const, content: question }];
      }
    } else if (type === 'ask_question' && question) {
      apiMessages = [{ role: 'user' as const, content: question }];
    } else {
      // For one-shot types, single user message
      const userMessage = type === 'dive_deeper'
        ? `Please give me a deeper explanation of this concept.`
        : `Please give me a real-world example of this concept.`;
      apiMessages = [{ role: 'user' as const, content: userMessage }];
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: apiMessages,
    });

    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Log the interaction
    await supabase.from('ai_interactions').insert({
      user_id: user.id,
      course_id: COURSE_ID,
      interaction_type: 'deep_dive',
      context: { chapterId, sectionId, type, blockTitle: blockTitle || termName },
      prompt_sent: type === 'ask_question' ? question : `${type} for ${blockTitle || termName}`,
      response_received: responseContent.text,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    });

    return NextResponse.json({
      content: responseContent.text,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
    });
  } catch (error) {
    console.error('Deep dive error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
}
