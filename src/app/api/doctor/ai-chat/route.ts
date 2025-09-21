// app/api/doctor/ai-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('dsjfbdshgfadskjgfkjadgsfgakjgehjbjsdbgafgeibasdbfjagyu4gkjb');

// Hardcoded Groq API key
const GROQ_API_KEY = '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';

async function getUid() {
  const cookieStore = await cookies();
  const t = cookieStore.get('auth')?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, SECRET);
    return String(payload.sub || '');
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const userId = await getUid();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userMessage } = body;

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Make request to Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are an AI medical assistant helping healthcare professionals. You provide accurate, evidence-based medical information and guidance. Your responses should be:

1. Professional and medical-focused
2. Based on current medical knowledge and guidelines
3. Clear and concise for healthcare professionals
4. Include relevant medical terminology when appropriate
5. Always emphasize the importance of clinical judgment and patient-specific factors
6. Mention when further testing or specialist consultation may be needed

Important disclaimers:
- Always remind that this is for informational purposes
- Clinical decisions should always involve proper patient assessment
- Emergency cases require immediate medical attention
- Individual patient factors must be considered

You can help with:
- Differential diagnoses
- Treatment options and guidelines
- Drug interactions and contraindications
- Medical procedures and protocols
- Laboratory interpretation
- Patient management strategies

Remember: You're assisting qualified healthcare professionals, not replacing clinical judgment.`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json({ 
          reply: "⚠️ Invalid API key. Please check the Groq API configuration." 
        });
      } else if (response.status === 429) {
        return NextResponse.json({ 
          reply: "⚠️ Rate limit exceeded. Please try again in a moment." 
        });
      } else {
        return NextResponse.json({ 
          reply: "⚠️ AI service is temporarily unavailable. Please try again later." 
        });
      }
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json({
        reply: "I apologize, but I couldn't generate a response to your query. Please try rephrasing your question or providing more context."
      });
    }

    return NextResponse.json({
      reply: reply.trim()
    });

  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    return NextResponse.json({
      reply: "⚠️ An unexpected error occurred. Please try again later."
    }, { status: 500 });
  }
}