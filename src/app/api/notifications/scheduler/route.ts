// app/api/notifications/scheduler/route.ts
import { NextResponse } from 'next/server';

// Master notification scheduler - can be called by cron jobs or manually
export async function POST(request: Request) {
  try {
    const { type, runAll } = await request.json().catch(() => ({ type: null, runAll: false }));
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const results: any[] = [];

    // Define notification services
    const services = [
      {
        name: 'medication-reminders',
        url: `${baseUrl}/api/notifications/medication-reminders`,
        description: 'Daily medication reminders for patients',
        schedule: 'daily at 8:00 AM'
      },
      {
        name: 'streak-alerts',
        url: `${baseUrl}/api/notifications/streak-alerts`,
        description: 'Streak milestone and breaking alerts',
        schedule: 'daily at 7:00 PM'
      },
      {
        name: 'appointment-reminders',
        url: `${baseUrl}/api/notifications/appointment-reminders`,
        description: '24-hour appointment reminders',
        schedule: 'daily at 6:00 PM'
      },
      {
        name: 'doctor-alerts',
        url: `${baseUrl}/api/notifications/doctor-alerts`,
        description: 'Daily patient condition reports for doctors',
        schedule: 'daily at 8:00 AM'
      }
    ];

    // If specific type requested, run only that service
    if (type && !runAll) {
      const service = services.find(s => s.name === type);
      if (!service) {
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
      }
      
      try {
        const response = await fetch(service.url, { method: 'POST' });
        const result = await response.json();
        
        return NextResponse.json({
          success: true,
          service: service.name,
          result
        });
      } catch (error) {
        return NextResponse.json(
          { 
            success: false, 
            service: service.name,
            error: error instanceof Error ? error.message : 'Unknown error' 
          },
          { status: 500 }
        );
      }
    }

    // Run all services (or all if runAll is true)
    for (const service of services) {
      try {
        console.log(`Running notification service: ${service.name}`);
        const response = await fetch(service.url, { method: 'POST' });
        const result = await response.json();
        
        results.push({
          service: service.name,
          success: true,
          result
        });
      } catch (error) {
        console.error(`Failed to run ${service.name}:`, error);
        results.push({
          service: service.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      message: `Notification scheduler completed: ${successCount} successful, ${failureCount} failed`,
      results,
      stats: {
        total: services.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Notification scheduler failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return NextResponse.json({
    message: 'MedTrack Notification Scheduler',
    version: '1.0.0',
    services: [
      {
        name: 'medication-reminders',
        endpoint: `${baseUrl}/api/notifications/medication-reminders`,
        description: 'Daily medication reminders for patients',
        schedule: 'Daily at 8:00 AM',
        trigger: 'POST /api/notifications/scheduler with {"type": "medication-reminders"}'
      },
      {
        name: 'streak-alerts',
        endpoint: `${baseUrl}/api/notifications/streak-alerts`,
        description: 'Streak milestone and breaking alerts',
        schedule: 'Daily at 7:00 PM',
        trigger: 'POST /api/notifications/scheduler with {"type": "streak-alerts"}'
      },
      {
        name: 'appointment-reminders',
        endpoint: `${baseUrl}/api/notifications/appointment-reminders`,
        description: '24-hour appointment reminders',
        schedule: 'Daily at 6:00 PM',
        trigger: 'POST /api/notifications/scheduler with {"type": "appointment-reminders"}'
      },
      {
        name: 'doctor-alerts',
        endpoint: `${baseUrl}/api/notifications/doctor-alerts`,
        description: 'Daily patient condition reports for doctors',
        schedule: 'Daily at 8:00 AM',
        trigger: 'POST /api/notifications/scheduler with {"type": "doctor-alerts"}'
      }
    ],
    usage: {
      'Run all services': 'POST /api/notifications/scheduler with {"runAll": true}',
      'Run specific service': 'POST /api/notifications/scheduler with {"type": "service-name"}',
      'View status': 'GET /api/notifications/scheduler'
    },
    cronJobSetup: {
      description: 'Set up these cron jobs on your server or use a service like Vercel Cron, GitHub Actions, or external cron services',
      jobs: [
        {
          time: '0 8 * * *',
          description: 'Daily at 8:00 AM',
          command: 'curl -X POST ' + baseUrl + '/api/notifications/scheduler -H "Content-Type: application/json" -d \'{"type": "medication-reminders"}\''
        },
        {
          time: '0 8 * * *',
          description: 'Daily at 8:00 AM',
          command: 'curl -X POST ' + baseUrl + '/api/notifications/scheduler -H "Content-Type: application/json" -d \'{"type": "doctor-alerts"}\''
        },
        {
          time: '0 18 * * *',
          description: 'Daily at 6:00 PM',
          command: 'curl -X POST ' + baseUrl + '/api/notifications/scheduler -H "Content-Type: application/json" -d \'{"type": "appointment-reminders"}\''
        },
        {
          time: '0 19 * * *',
          description: 'Daily at 7:00 PM',
          command: 'curl -X POST ' + baseUrl + '/api/notifications/scheduler -H "Content-Type: application/json" -d \'{"type": "streak-alerts"}\''
        }
      ]
    }
  });
}