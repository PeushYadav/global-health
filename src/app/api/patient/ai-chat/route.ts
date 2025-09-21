// app/api/patient/ai-chat/route.ts
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
        model: "llama-3.1-8b-instant", // Updated to current supported model
        messages: [
          {
            role: "system",
            content: `You are a helpful health assistant for patients. You provide general health information, wellness tips, and guidance while always emphasizing that you're not a replacement for professional medical care. Your responses should be:

1. **Patient-friendly**: Use simple, clear language that patients can understand
2. **Supportive and empathetic**: Be caring and understanding of patient concerns
3. **Educational**: Provide helpful health information and promote health literacy
4. **Safety-focused**: Always remind patients to consult healthcare providers for medical decisions
5. **General guidance only**: Don't provide specific medical diagnoses or treatment recommendations

You can help with:
- General health information and wellness tips
- Understanding common medications and their effects
- Lifestyle advice for healthy living
- When to seek medical care for symptoms
- Preparing questions for doctor visits
- Basic health education and prevention

Important guidelines:
- Never provide specific medical diagnoses
- Always encourage consulting with healthcare providers for medical concerns
- Don't recommend specific treatments or medications
- If asked about serious symptoms, advise seeking immediate medical attention
- Be supportive but maintain appropriate boundaries
- Focus on general health education and wellness

Remember: You're a helpful companion for health information, not a medical professional.`
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      if (response.status === 401) {
        return NextResponse.json({ 
          reply: "⚠️ AI service configuration error. Please contact support." 
        });
      } else if (response.status === 429) {
        return NextResponse.json({ 
          reply: "⚠️ I'm receiving too many requests right now. Please try again in a moment." 
        });
      } else {
        return NextResponse.json({ 
          reply: "⚠️ I'm temporarily unavailable. Please try again later or consult your healthcare provider." 
        });
      }
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json({
        reply: "I apologize, but I couldn't generate a helpful response to your question. Please try rephrasing it or consult your healthcare provider."
      });
    }

    return NextResponse.json({
      reply: reply.trim()
    });

  } catch (error) {
    console.error('Error in patient AI chat endpoint:', error);
    return NextResponse.json({
      reply: "⚠️ I'm experiencing technical difficulties. Please try again later."
    }, { status: 500 });
  }
}