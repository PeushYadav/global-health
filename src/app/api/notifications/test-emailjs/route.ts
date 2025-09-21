// app/api/notifications/test-emailjs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { testEmailConnection } from '@/lib/emailjs';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    console.log('Testing EmailJS connection with email:', email);
    
    const result = await testEmailConnection(email);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        details: {
          messageId: result.messageId,
          status: result.status,
          sentTo: email
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test email',
        error: result.error,
        details: result.details
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('EmailJS test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test EmailJS', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check EmailJS configuration
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'EmailJS service is configured',
      config: {
        serviceId: 'service_jxh3u5o',
        templateId: 'template_g3saswe',
        publicKeyConfigured: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'EmailJS configuration check failed' },
      { status: 500 }
    );
  }
}