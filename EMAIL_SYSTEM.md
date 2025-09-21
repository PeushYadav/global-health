# MedTrack Email Notification System

A comprehensive email notification system for MedTrack Health that sends automated medication reminders, streak alerts, appointment notifications, and patient condition reports.

## 🚀 Features

### For Patients
- **📱 Daily Medication Reminders**: Automated emails with medication schedules
- **🏆 Streak Milestones**: Celebration emails for medication adherence achievements
- **⚠️ Streak Breaking Alerts**: Gentle reminders when medication streaks are at risk
- **📅 Appointment Reminders**: 24-hour advance notice for upcoming appointments

### For Doctors  
- **📊 Daily Patient Reports**: Comprehensive adherence summaries for all patients
- **🚨 Patient Condition Alerts**: Priority notifications for patients needing attention
- **📅 Appointment Notifications**: Reminders about upcoming patient appointments

## 📧 Email Templates

All emails feature professional medical-grade designs with:
- Responsive HTML layouts
- MedTrack branding
- Clear call-to-action buttons
- Mobile-friendly formatting
- Accessibility considerations

## ⚙️ Quick Setup

### 1. Install Dependencies
```bash
npm install nodemailer @types/nodemailer
```

### 2. Configure Environment Variables
Copy `.env.email.example` to `.env.local` and configure:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

### 3. Test Email Configuration
```bash
curl -X POST http://localhost:3003/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 📚 API Endpoints

### Notification Services

| Endpoint | Purpose | Schedule |
|----------|---------|----------|
| `/api/notifications/medication-reminders` | Daily medication reminders | 8:00 AM daily |
| `/api/notifications/streak-alerts` | Streak milestones & breaking alerts | 7:00 PM daily |
| `/api/notifications/appointment-reminders` | 24hr appointment reminders | 6:00 PM daily |
| `/api/notifications/doctor-alerts` | Patient condition reports | 8:00 AM daily |
| `/api/notifications/scheduler` | Master scheduler for all services | On-demand |
| `/api/notifications/test` | Email testing service | Manual only |

### Usage Examples

#### Send Daily Medication Reminders
```bash
curl -X POST http://localhost:3003/api/notifications/medication-reminders
```

#### Run All Notifications
```bash
curl -X POST http://localhost:3003/api/notifications/scheduler \
  -H "Content-Type: application/json" \
  -d '{"runAll": true}'
```

#### Send Specific Notification Type
```bash
curl -X POST http://localhost:3003/api/notifications/scheduler \
  -H "Content-Type: application/json" \
  -d '{"type": "streak-alerts"}'
```

#### Test Different Email Types
```bash
# Test medication reminder
curl -X POST http://localhost:3003/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "type": "medication-reminder"}'

# Test streak milestone
curl -X POST http://localhost:3003/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "type": "streak-milestone"}'
```

## ⏰ Setting Up Automated Scheduling

### Using Cron Jobs (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add these lines:
0 8 * * * curl -X POST http://your-domain.com/api/notifications/medication-reminders
0 8 * * * curl -X POST http://your-domain.com/api/notifications/doctor-alerts  
0 18 * * * curl -X POST http://your-domain.com/api/notifications/appointment-reminders
0 19 * * * curl -X POST http://your-domain.com/api/notifications/streak-alerts
```

### Using Vercel Cron (Recommended for Vercel deployments)
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/notifications/medication-reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/notifications/doctor-alerts", 
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/notifications/appointment-reminders",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/notifications/streak-alerts",
      "schedule": "0 19 * * *"
    }
  ]
}
```

### Using GitHub Actions
Create `.github/workflows/notifications.yml`:
```yaml
name: Daily Notifications
on:
  schedule:
    - cron: '0 8 * * *'  # 8:00 AM UTC
    - cron: '0 18 * * *' # 6:00 PM UTC
    - cron: '0 19 * * *' # 7:00 PM UTC

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Send Medication Reminders
        if: github.event.schedule == '0 8 * * *'
        run: curl -X POST ${{ secrets.APP_URL }}/api/notifications/medication-reminders
      
      - name: Send Appointment Reminders  
        if: github.event.schedule == '0 18 * * *'
        run: curl -X POST ${{ secrets.APP_URL }}/api/notifications/appointment-reminders
        
      - name: Send Streak Alerts
        if: github.event.schedule == '0 19 * * *'  
        run: curl -X POST ${{ secrets.APP_URL }}/api/notifications/streak-alerts
```

## 🔧 Configuration Options

### Email Providers

#### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate App Password: Google Account → Security → App passwords
3. Use app password (not your regular password)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Other Providers
- **Outlook**: `smtp.live.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`  
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`

### Production Email Services
For production, consider using dedicated email services:
- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [AWS SES](https://aws.amazon.com/ses/)
- [Postmark](https://postmarkapp.com/)

## 📊 Monitoring & Analytics

### Response Format
All notification endpoints return detailed statistics:

```json
{
  "success": true,
  "message": "Medication reminders processed",
  "stats": {
    "total": 150,
    "sent": 145,
    "errors": 5
  },
  "sentEmails": [...],
  "errors": [...]
}
```

### Logging
- All email activities are logged to console
- Failed sends include error details
- Success includes message IDs for tracking

## 🛡️ Security & Privacy

- Emails contain no sensitive medical data
- Patient identification uses names only (no IDs)
- All links redirect to authenticated dashboard areas
- SMTP credentials stored securely in environment variables
- No email addresses stored in logs

## 🐛 Troubleshooting

### Common Issues

**"Email service connection failed"**
- Check SMTP credentials in `.env.local`
- Verify firewall allows outbound connections on port 587
- For Gmail, ensure app password is used (not regular password)

**"Module not found: nodemailer"**
- Install dependencies: `npm install nodemailer @types/nodemailer`
- Restart development server

**Emails not sending**
- Test with `/api/notifications/test` endpoint
- Check server logs for error details
- Verify email provider settings

**Emails going to spam**
- Set up SPF, DKIM, and DMARC DNS records
- Use a dedicated email service for production
- Warm up your domain reputation gradually

### Debug Mode
Enable detailed logging by adding to `.env.local`:
```env
DEBUG=email:*
```

## 🔄 Maintenance

### Regular Tasks
- Monitor email bounce rates
- Update patient email addresses
- Review notification schedules
- Test email deliverability

### Scaling Considerations
- For high volume, implement email queuing
- Consider rate limiting to avoid provider limits
- Monitor server resources during peak sending times
- Set up email analytics and tracking

## 📈 Future Enhancements

Potential improvements:
- Email preference management for users
- A/B testing for email templates  
- Advanced scheduling (timezone-aware)
- Email analytics dashboard
- Integration with push notifications
- Multi-language support

---

**Need help?** Check the API documentation at `/api/notifications/scheduler` or test your setup with `/api/notifications/test`.