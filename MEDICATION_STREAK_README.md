# Medication Streak System

## Overview
The Medication Streak System replaces the previous Heart Rate, Blood Pressure, and Hydration Level boxes in the patient dashboard with a single medication tracking component that uses visual feedback to encourage medication adherence. This system integrates with the existing "Today's Medication" functionality.

## Features

### Integration with Existing System
- **Uses Existing Data**: Leverages the current `DailyLog` collection and `TodayMedsCard` functionality
- **Real-time Updates**: Automatically updates when medications are marked as taken in the "Today's Medication" section
- **Full Compliance Tracking**: Tracks days since ALL prescribed medications were taken, not just individual doses

### Visual Feedback System
- **Day Images**: Uses images from `public/day0.png` to `public/day30.svg` (every 3 days)
- **Progressive Indication**: As days without full compliance increase, the displayed image changes
- **Recovery**: When all medications are taken, the streak decreases and images improve
- **Maximum Cap**: Limited to 30 days maximum

### Image Mapping
- `day0.png`: Perfect compliance (all meds taken today or recently)
- `day3.svg`: 1-3 days since full compliance
- `day6.svg`: 4-6 days since full compliance  
- `day9.svg`: 7-9 days since full compliance
- `day12.svg`: 10-12 days since full compliance
- `day15.svg`: 13-15 days since full compliance
- `day18.svg`: 16-18 days since full compliance
- `day21.svg`: 19-21 days since full compliance
- `day24.svg`: 22-24 days since full compliance
- `day27.svg`: 25-27 days since full compliance
- `day30.svg`: 28+ days since full compliance (maximum)

### User Interface
The component displays:
1. **Visual Indicator**: Day image showing current compliance status
2. **Status Message**: Color-coded message based on compliance:
   - 🟢 Green: Perfect compliance or great progress
   - 🔵 Blue: Good progress today
   - 🟡 Yellow: Stay Strong (1-3 days)
   - 🟠 Orange: Get Back on Track (4-10 days)
   - 🔴 Red: Need Support (11+ days)
3. **Day Counter**: Number of days since full medication compliance
4. **Today's Progress**: Visual progress bar showing medications taken today
5. **Last Perfect Day**: When all medications were last taken

## API Endpoints

### GET `/api/patient/medication-streak-daily`
Retrieves current compliance streak data based on existing DailyLog data.

**Response:**
```json
{
  "daysSinceFullCompliance": 5,
  "lastFullComplianceDate": "2024-01-15",
  "totalDaysTracked": 25,
  "todaysProgress": {
    "taken": 2,
    "total": 3,
    "complete": false
  }
}
```

## How It Works

### Data Source
Uses existing database collections:
- **MedicalProfile**: Gets list of prescribed medications
- **DailyLog**: Tracks which medications were taken each day via `medicationsTaken` array

### Streak Calculation Logic
1. **Get Prescribed Medications**: Fetches user's prescribed medications from `MedicalProfile`
2. **Check Daily Compliance**: For each day, verifies if ALL prescribed medications were taken
3. **Count Days**: Counts consecutive days since last full compliance (max 30 days)
4. **Today's Status**: Separately tracks today's progress to show current state

### Integration Points
- **TodayMedsCard**: When users mark medications as taken, fires `medicationTaken` event
- **MedicationStreakCard**: Listens for this event and refreshes streak data
- **Existing APIs**: Uses current `/api/patient/medication/take` endpoint for marking medications

## Components

### MedicationStreakCard
Located at: `src/components/patient/cards/MedicationStreakCard.tsx`

**Key Features:**
- No props needed (uses authentication from cookies)
- Automatic updates via event listeners
- Real-time progress tracking
- Responsive design with loading states

### Integration with TodayMedsCard
- Uses existing medication tracking system
- Listens for `medicationTaken` events
- Updates streak when ANY medication is taken
- Shows progress toward daily compliance

## Usage Flow

1. **User Opens Dashboard**: Streak component loads and shows current status
2. **User Takes Medication**: Marks medication as taken in "Today's Medication" section
3. **Automatic Update**: Streak component automatically refreshes and updates display
4. **Visual Feedback**: Image and messages update to reflect new compliance status

## Behavioral Logic

### Streak Behavior
- **Decreases** when medications are taken (showing fewer days since compliance)
- **Increases** each day when full compliance is not achieved
- **Resets to 0** when all prescribed medications are taken in a day
- **Caps at 30** to prevent excessive negative feedback

### Visual Progression
- **Perfect Day (0)**: Shows day0.png with green "Perfect Streak" message
- **Recent Miss (1-3)**: Shows day3.svg with yellow "Stay Strong" message
- **Extended Miss (4-10)**: Shows day6-12.svg with orange "Get Back on Track" message
- **Long Miss (11+)**: Shows day15-30.svg with red "Need Support" message

### Today's Progress
- Shows real-time progress bar for today's medications
- Updates immediately when medications are marked as taken
- Differentiates between partial and full compliance

## Database Schema

Uses existing collections:
- **MedicalProfile**: Contains `medications` array with prescribed drugs
- **DailyLog**: Contains `medicationsTaken` array with names of taken medications

## Future Enhancements

Possible improvements:
1. **Weekly Trends**: Show patterns over longer periods
2. **Personalized Goals**: Allow users to set custom compliance targets
3. **Healthcare Provider View**: Share compliance data with doctors
4. **Reminder Integration**: Connect with notification systems
5. **Multiple Medication Types**: Handle different medication schedules
6. **Compliance Reports**: Generate detailed adherence reports