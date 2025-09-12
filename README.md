# RAIL-PRISM: AI-Assisted Railway Decision Support System

![RAIL-PRISM Dashboard](https://img.shields.io/badge/RAIL--PRISM-AI%20Railway%20Control-blue)
![Status](https://img.shields.io/badge/Status-Demo%20Ready-green)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20TypeScript%20%7C%20D3.js-blue)

A professional, fully interactive frontend demo of RAIL-PRISM — an AI-assisted decision-support dashboard for railway Section Controllers. This system provides real-time train monitoring, intelligent conflict detection, and AI-powered recommendations for optimal railway operations.

## 🚆 Features

### Core Functionality
- **Real-time Train Visualization**: Interactive time-distance graph showing live train positions
- **AI Conflict Detection**: Automated detection of potential train conflicts and safety issues
- **Intelligent Recommendations**: AI-generated solutions with confidence scores and impact analysis
- **Decision Support**: Accept, simulate, or override AI recommendations with full audit trails
- **Multi-Role Access**: Controller (full access) and Viewer (read-only) modes

### Advanced Features
- **Simulation Engine**: Client-side discrete-event simulation with realistic train physics
- **Scenario Management**: Pre-built scenarios including normal operations, planned maintenance, and emergency breakdowns
- **Audit Trail**: Comprehensive logging of all decisions and system events with JSON export
- **Professional UI**: Dark-themed control room interface optimized for critical operations

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ and npm installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Installation & Running

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Alternative: Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 How to Use the Demo

### 1. Login & Role Selection
- Choose between **Controller** (full access) or **Viewer** (read-only)
- No authentication required - this is a demonstration system

### 2. Main Dashboard Components

#### **Control Panel (Top)**
- **Live Clock**: Shows current simulation time
- **Play/Pause**: Start or stop the simulation
- **Scenario Selection**: Load different operational scenarios
- **Status Indicators**: Active trains and conflict alerts

#### **Time-Distance Graph (Left)**
- Vertical axis: Railway stations (A → B → C → D)
- Horizontal axis: Time progression
- **Colored lines**: Train trajectories (Blue=Express, Green=Local, Orange=Freight)
- **Current time line**: Yellow dashed vertical line
- **Conflict zones**: Red highlighted areas showing potential issues

#### **Recommendation Panel (Right)**
- Appears when conflicts are detected
- Shows 2-3 AI-generated options with:
  - Action description and confidence score
  - Predicted delay and throughput impact
  - Detailed rationale
- **Controllers** can Accept, Simulate, or Override recommendations
- **Viewers** see read-only information

#### **Audit Log (Bottom)**
- Real-time log of all system events and decisions
- Filter by event type (recommendations, actions, overrides, failures)
- Export complete audit trail as JSON
- Statistics dashboard showing system performance

### 3. Demo Scenarios

#### **Normal Operations**
- Standard day with 6 trains running normal schedules
- Good for understanding basic system operation

#### **Planned Maintenance** 
- Repair window at Station C (11:30-11:50)
- Shows AI handling of scheduled disruptions
- Demonstrates conflict between Express E1 and Freight F3

#### **Emergency Breakdown**
- Freight train F3 breaks down at 11:22 between stations B and C
- Cascading effects on other trains
- AI generates emergency response recommendations

### 4. Using the AI Recommender

1. **Load a scenario** with conflicts (Planned Maintenance or Emergency Breakdown)
2. **Start the simulation** and wait for conflicts to appear
3. **Review AI options** in the recommendation panel:
   - Each option shows predicted outcomes
   - Confidence scores indicate AI certainty
   - Impact analysis shows delay and throughput effects
4. **Simulate** an option to see predicted outcomes overlaid on the graph
5. **Accept** the recommendation or **Override** with a mandatory reason
6. **Monitor results** in the audit log

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for robust component architecture
- **D3.js** for sophisticated data visualization and interactive graphs
- **Tailwind CSS** with custom design system for professional control room aesthetics
- **Shadcn/ui** components customized for railway operations

### Simulation Engine
- **Discrete-event simulation** running entirely in the browser
- **Real-time conflict detection** using headway analysis and position tracking
- **Physics-based movement** with realistic train speeds and acceleration
- **Scenario management** with configurable train schedules and infrastructure

### AI Mock System
- **Rule-based recommender** simulating ML decision trees
- **Multi-criteria optimization** considering priority, delay, and throughput
- **Confidence scoring** based on historical pattern matching
- **Impact prediction** using fast-forward simulation

### Data Management
- **Client-side JSON data** with sample scenarios embedded
- **Real-time state management** using React hooks
- **Local storage** for user preferences and session data

## 📊 Sample Data Structure

The system includes realistic railway operational data:

```json
{
  "stations": ["A", "B", "C", "D"],
  "trains": [
    {
      "id": "E1",
      "type": "Express", 
      "priority": 10,
      "start": "A",
      "depart": "11:10",
      "speed_kmph": 90
    }
  ],
  "repairs": [
    {
      "id": "R-C",
      "block": "C-loop", 
      "start": "11:30",
      "end": "11:50",
      "flexible": true
    }
  ]
}
```

## 🔧 Customization

### Adding New Scenarios
Edit `src/data/scenarios.ts` to add custom operational scenarios with different train schedules and infrastructure events.

### Modifying AI Logic
Update `src/hooks/useSimulation.ts` in the `generateRecommendations` function to implement different decision-making algorithms.

### UI Themes
Customize the control room design system in `src/index.css` and `tailwind.config.ts` to match your operational requirements.

## 🎯 Key Demo Points

### For Railway Operations
- **Real-world accuracy**: Based on actual railway operational procedures
- **Scalable architecture**: Designed for integration with real railway management systems
- **Safety-first approach**: All recommendations prioritize operational safety

### For AI/ML Demonstration  
- **Explainable AI**: Every recommendation includes clear reasoning and confidence metrics
- **Human-AI collaboration**: Controllers can accept, modify, or override AI suggestions
- **Continuous learning simulation**: System adapts recommendations based on operational outcomes

### For Technical Stakeholders
- **Modern web architecture**: Built with industry-standard React ecosystem
- **Real-time performance**: Handles complex simulations without backend requirements
- **Professional UX**: Control room-grade interface suitable for 24/7 operations

## 📱 Browser Compatibility

- **Chrome/Edge**: Fully supported with optimal performance
- **Firefox**: Complete functionality with all features
- **Safari**: Core features supported (some animations may vary)
- **Mobile**: Responsive design, optimized for desktop use

## 🚀 Deployment

### Local Deployment
The built application is a static SPA that can be served from any web server.

### Cloud Deployment
Compatible with Vercel, Netlify, GitHub Pages, or any static hosting service.

## 📄 License & Usage

This is a demonstration system built for the Smart India Hackathon (SIH). The code is organized and commented for easy handoff and further development.

---

**RAIL-PRISM Demo System** | Built with ❤️ for Smart India Hackathon | Professional Railway AI Control