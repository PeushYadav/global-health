# Groq AI Integration Setup Guide

## Overview
The AI Medical Assistant is integrated into the doctor's dashboard using Groq's API to provide instant medical information and assistance to healthcare professionals.

## Setup Instructions

### 1. Get Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for a free account or log in
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the key (it starts with `gsk_...`)

### 2. Configure Environment Variables
1. Open the `.env.local` file in your project root
2. Replace `gsk_YOUR_ACTUAL_GROQ_API_KEY_HERE` with your actual Groq API key:
   ```
   GROQ_API_KEY=gsk_your_actual_api_key_here
   ```
3. Save the file

### 3. Restart Development Server
After setting the API key, restart your development server:
```bash
npm run dev
```

## Features

### AI Medical Assistant
- **Model**: Uses Llama3-8B-8192 for high-quality medical responses
- **Context**: Specialized for healthcare professionals
- **Features**:
  - Differential diagnosis assistance
  - Treatment recommendations
  - Drug interaction information
  - Medical procedure guidance
  - Laboratory result interpretation
  - Patient management strategies

### User Interface
- **Tabbed Interface**: Switch between Patient Chat and AI Assistant
- **Real-time Responses**: Streaming-like experience with loading indicators
- **Chat History**: Maintains conversation context within session
- **Clear Chat**: Reset conversation anytime
- **Responsive Design**: Works on all device sizes

### Safety Features
- **Medical Disclaimers**: Emphasizes that AI is for informational purposes
- **Authentication Required**: Only authenticated doctors can access
- **Error Handling**: Graceful handling of API failures and rate limits
- **Professional Context**: System prompt optimized for medical professionals

## API Endpoint

### POST `/api/doctor/ai-chat`
Processes medical queries and returns AI responses.

**Headers:**
- Authentication via cookies (JWT)
- Content-Type: application/json

**Request Body:**
```json
{
  "userMessage": "What are the differential diagnoses for chest pain in a 45-year-old male?"
}
```

**Response:**
```json
{
  "reply": "For a 45-year-old male presenting with chest pain, the differential diagnoses include:\n\n**Cardiac Causes:**\n- Acute coronary syndrome (MI, unstable angina)\n- Stable angina pectoris\n- Aortic dissection\n- Pericarditis\n\n**Pulmonary Causes:**\n- Pulmonary embolism\n- Pneumothorax\n- Pneumonia\n- Pleuritis\n\n**Other Considerations:**\n- GERD/esophageal spasm\n- Musculoskeletal (costochondritis)\n- Panic disorder\n\n**Immediate Assessment:**\n- 12-lead ECG\n- Troponins\n- D-dimer if PE suspected\n- Chest X-ray\n\nGiven the age and gender, cardiac causes should be prioritized in the differential. Consider HEART score for risk stratification."
}
```

## Error Handling

The system handles various error scenarios:
- **Invalid API Key**: Displays configuration error message
- **Rate Limiting**: Informs user to try again later
- **Network Issues**: Shows temporary unavailability message
- **Empty Responses**: Provides fallback message

## Best Practices

### For Doctors Using the AI Assistant:
1. **Be Specific**: Provide detailed patient information for better responses
2. **Verify Information**: Always cross-reference AI suggestions with clinical guidelines
3. **Patient Privacy**: Avoid including personally identifiable information
4. **Emergency Cases**: Don't rely on AI for urgent/emergency situations
5. **Clinical Judgment**: Use AI as a supplementary tool, not a replacement

### Query Examples:
- "What are the contraindications for ACE inhibitors?"
- "Explain the mechanism of action of metformin"
- "What lab tests should I order for suspected hyperthyroidism?"
- "How do I interpret these arterial blood gas results: pH 7.30, PCO2 50, HCO3 24?"

## Troubleshooting

### Common Issues:

1. **"AI service is not configured"**
   - Check that GROQ_API_KEY is set in `.env.local`
   - Ensure the key starts with `gsk_`
   - Restart the development server

2. **"Invalid API key"**
   - Verify the API key is correct and active
   - Check Groq console for key status
   - Regenerate key if necessary

3. **"Rate limit exceeded"**
   - Groq has usage limits on free tier
   - Wait before making additional requests
   - Consider upgrading Groq plan if needed

4. **Slow responses**
   - Normal for complex medical queries
   - Model processes detailed medical context
   - Response time varies with query complexity

## Security Considerations

- API keys stored as environment variables (not in code)
- Authentication required for all AI chat requests
- No patient data stored in chat logs
- HTTPS encryption for all API communications
- Medical disclaimers prominently displayed

## Future Enhancements

Possible improvements:
- Chat history persistence across sessions
- Integration with medical knowledge bases
- Customizable AI personas for different specialties
- Voice input/output capabilities
- Integration with patient records (with proper consent)
- Multi-language support for international use