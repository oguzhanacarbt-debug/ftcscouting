# Advanced Features Documentation

This document describes the three major feature sets added to the FTC Field Companion app:

## 🎯 1. Match Predictions & Simulation

### Overview
Advanced Monte Carlo simulation engine for predicting match outcomes with statistical confidence intervals.

### Features

#### Monte Carlo Match Simulation
- Runs 10,000+ simulations per match
- Provides win probability for each alliance
- Calculates predicted scores with 95% confidence intervals
- Accounts for team consistency and variance
- Real-time simulation with visual feedback

#### What-If Scenario Builder
- Create custom alliance combinations
- Test different team pairings
- See predicted outcomes instantly
- Compare multiple scenarios side-by-side

#### Optimal Alliance Finder
- Analyzes all possible team combinations
- Ranks alliances by win probability
- Considers complementary strengths
- Provides expected scores for each combination

### Technical Implementation
- **File**: `/src/analysis/SimulationEngine.ts`
- **Page**: `/src/pages/MatchPredictions.tsx`
- **Route**: `/predictions`

### Key Functions
```typescript
runMonteCarloSimulation(match, teamStatsMap, iterations)
analyzeWhatIfScenario(scenarioName, redAlliance, blueAlliance, eventId, teamStatsMap)
findOptimalAlliance(availableTeams, opponentAlliance, eventId, teamStatsMap, allianceSize)
```

---

## 🧠 2. ML-Powered Insights

### Overview
Machine learning analytics engine that classifies teams, detects anomalies, and provides intelligent recommendations.

### Features

#### Team Classification
- **Archetypes**: Scorer, Defender, Specialist, Balanced, Inconsistent
- AI-powered classification with confidence scores
- Identifies team characteristics, strengths, and weaknesses
- Adaptive learning based on performance data

#### Anomaly Detection
- Detects exceptional performances (outliers above average)
- Identifies underperformance (below expected levels)
- Flags unusual patterns (e.g., failed autonomous when usually reliable)
- Severity ratings: Low, Medium, High

#### Performance Trend Analysis
- Linear regression for trend detection
- Trends: Improving, Declining, Stable, Volatile
- Predicts next match score with confidence level
- Visual trend charts with recent performance data

#### Alliance Partner Recommendations
- Analyzes complementary strengths
- Identifies synergies (e.g., weak auto + strong auto partner)
- Flags potential concerns (inconsistency, low scoring)
- Scores partners based on compatibility

#### Mechanical Issue Prediction
- Detects performance degradation over time
- Identifies speed reduction, scoring decline
- Predicts potential mechanism failures
- Provides confidence level for predictions

### Technical Implementation
- **File**: `/src/analysis/MLAnalytics.ts`
- **Page**: `/src/pages/MLInsights.tsx`
- **Route**: `/ml-insights`

### Key Functions
```typescript
classifyTeam(teamNumber, stats, entries)
detectAnomalies(teamNumber, entries, stats)
analyzePerformanceTrend(teamNumber, entries, stats)
recommendAlliancePartners(myTeamNumber, availableTeams, teamStatsMap, allEntries)
predictMechanicalIssues(teamNumber, entries)
```

---

## 📡 3. Real-Time Features

### Overview
Live match tracking with push notifications, real-time updates, and collaborative commentary system.

### Features

#### Live Match Updates
- Automatic polling from FTC API (configurable interval, default 30s)
- Real-time score updates
- Match status changes (pending → in_progress → completed)
- Upcoming match alerts (5 minutes before start)

#### Push Notifications
- Browser push notifications (requires permission)
- Notification types:
  - **Upcoming Match**: 5-minute warning
  - **Match Started**: When match begins
  - **Match Completed**: Final scores
  - **Score Update**: During match
- Priority levels: Low, Medium, High
- Mark as read/unread functionality

#### Live Commentary System
- Add timestamped notes during matches
- Commentary types:
  - **Observation**: General notes
  - **Strategy**: Strategic insights
  - **Issue**: Problems or concerns
  - **Highlight**: Notable plays
- Scout attribution
- Match-specific commentary feed
- Team-specific commentary filtering

#### Notification Management
- View all notifications
- Filter unread notifications
- Mark all as read
- Clear notifications
- Persistent storage

### Technical Implementation
- **File**: `/src/services/RealTimeService.ts`
- **Page**: `/src/pages/LiveUpdates.tsx`
- **Route**: `/live-updates`

### Key Functions
```typescript
startLiveUpdates(eventCode, matches)
stopLiveUpdates()
addCommentary(matchId, teamNumber, comment, scoutName, type, tags)
getCommentary(matchId)
requestNotificationPermission()
```

### Usage Example
```typescript
import { getRealTimeService } from '@/services/RealTimeService';

const service = getRealTimeService();

// Start live updates
service.startLiveUpdates(eventCode, matches);

// Subscribe to notifications
const unsubscribe = service.onNotification((notification) => {
  console.log('New notification:', notification);
});

// Add commentary
service.addCommentary(
  matchId,
  teamNumber,
  'Great autonomous routine!',
  'Scout Name',
  'highlight'
);

// Stop updates when done
service.stopLiveUpdates();
```

---

## 🚀 Getting Started

### Accessing the Features

1. **From Home Page**: Click on the feature cards:
   - 🌟 Match Predictions (purple)
   - 🧠 ML Insights (blue)
   - 📡 Live Updates (red)

2. **Direct URLs**:
   - `/predictions`
   - `/ml-insights`
   - `/live-updates`

### Prerequisites

- Event must be selected
- Scout name must be set
- For predictions/ML: Scouting data should be available
- For live updates: FTC API key must be configured

### Configuration

#### Environment Variables
```env
VITE_FTC_API_KEY=your_api_key_here
```

#### Real-Time Polling Interval
```typescript
const service = getRealTimeService();
service.setPollingInterval(30000); // 30 seconds
```

---

## 📊 Data Flow

### Match Predictions
1. User selects match or creates scenario
2. System retrieves team stats from store
3. Monte Carlo simulation runs (10,000 iterations)
4. Results displayed with confidence intervals

### ML Insights
1. User selects team
2. System analyzes all scout entries for team
3. ML algorithms classify and detect patterns
4. Insights displayed with confidence scores

### Live Updates
1. User starts live updates
2. Service polls FTC API every 30s
3. Detects changes in match status/scores
4. Triggers notifications and updates UI
5. Commentary saved locally and displayed

---

## 🎨 UI Components

### Match Predictions
- Match selector dropdown
- Simulation progress indicator
- Win probability bars
- Score prediction cards with confidence intervals
- What-if scenario builder
- Optimal alliance rankings

### ML Insights
- Team selector
- Archetype badge with confidence
- Characteristics, strengths, weaknesses lists
- Performance trend chart (Recharts)
- Anomaly cards with severity badges
- Recommendation cards with synergy/concern tags
- Mechanical issue warnings

### Live Updates
- Live status indicator (pulsing when active)
- Notification feed with unread count
- Commentary panel with match selector
- Comment type selector
- Real-time updates list

---

## 🔧 Technical Details

### Dependencies
- **Recharts**: For trend visualization
- **Zustand**: State management
- **React Router**: Navigation
- **Lucide React**: Icons
- **Shadcn/ui**: UI components

### Performance Considerations
- Monte Carlo simulations run in main thread (consider Web Workers for larger iterations)
- Real-time polling can be adjusted based on network conditions
- Commentary and notifications stored in memory (consider IndexedDB for persistence)

### Browser Compatibility
- Push notifications require HTTPS (or localhost)
- Notification API support varies by browser
- Service works offline with cached data

---

## 📝 Future Enhancements

### Potential Additions
1. **WebSocket Support**: Replace polling with real-time WebSocket connections
2. **Playoff Bracket Simulation**: Full bracket prediction with probabilities
3. **Team Clustering**: Group similar teams using k-means clustering
4. **Neural Network Predictions**: Deep learning for more accurate predictions
5. **Video Analysis Integration**: Link commentary to video timestamps
6. **Multi-Device Sync**: Real-time commentary sync across devices
7. **Export Reports**: PDF/PowerPoint export of insights
8. **Historical Comparison**: Compare current performance to past seasons

---

## 🐛 Troubleshooting

### Match Predictions Not Working
- Ensure teams have scouting data
- Check that event is selected
- Verify team stats are calculated

### ML Insights Showing No Data
- Need at least 3-4 matches of data per team
- Ensure scout entries exist for selected team
- Check that event ID matches

### Live Updates Not Polling
- Verify FTC API key is set
- Check browser console for errors
- Ensure event code is valid
- Check network connectivity

### Notifications Not Appearing
- Grant browser notification permission
- Check browser notification settings
- Verify HTTPS connection (or localhost)
- Check if notifications are blocked

---

## 📚 API Reference

See individual files for detailed API documentation:
- `/src/analysis/SimulationEngine.ts`
- `/src/analysis/MLAnalytics.ts`
- `/src/services/RealTimeService.ts`

---

## 🤝 Contributing

When adding new features:
1. Follow existing code patterns
2. Add TypeScript types
3. Include error handling
4. Update this documentation
5. Test with real event data

---

## 📄 License

Part of the FTC Field Companion project.
