# Maestro Frontend 🎨

# Highlights:

Component-by-component documentation
Interactive features breakdown (Query Interface, Metrics Dashboard, Adversarial Tester, Audit Trail)
API client architecture with type-safe interfaces
Detailed setup instructions
Development workflow and styling guidelines
Performance optimizations
Deployment guide
Troubleshooting section

**Real-Time Analytics Dashboard for Enterprise RAG**

Built with Next.js 14, React, and Tailwind CSS

---

## Overview

The Maestro frontend provides a comprehensive, real-time dashboard for monitoring and testing your RAG system. It transforms complex backend metrics into actionable insights through interactive visualizations and an intuitive user interface.

## Key Features

### 1. Interactive Query Interface

- **Real-time Query Execution** - Submit queries and see instant results
- **Confidence Visualization** - Visual indicators for answer quality (high/medium/low)
- **Document Attribution** - See exactly which documents contributed to each answer
- **Cost & Latency Tracking** - Monitor performance metrics per query

### 2. Real-Time Metrics Dashboard

- **Query Volume Trends** - Time-series charts showing query patterns
- **Cache Hit Rate Evolution** - Visualize cache effectiveness over time
- **Cost Optimization Tracking** - Compare naive vs actual costs
- **Performance Monitoring** - Average latency trends
- **Live Updates** - Metrics refresh every 5 seconds

### 3. Adversarial Testing UI

- **AI-Generated Challenges** - Gemini-powered test query generation
- **Live Test Execution** - Run tests and see results in real-time
- **Pass/Fail Indicators** - Visual feedback on test outcomes
- **Weakness Analysis** - See Gemini's recommendations for failures
- **Summary Statistics** - Track overall test pass rates

### 4. Query Audit Trail

- **Complete History** - Full log of all processed queries
- **Source Tracking** - Cache hit vs retrieval indicators
- **Strategy Breakdown** - See which routing strategy was used
- **Performance Metrics** - Latency and cost per query

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS 3.4
- **Charts:** Recharts (time-series visualization)
- **Icons:** Lucide React
- **HTTP Client:** Axios with retry logic
- **Type Safety:** TypeScript

## Project Structure

\`\`\`
frontend/
├── app/ # Next.js app router
│ ├── layout.tsx # Root layout
│ ├── page.tsx # Main dashboard page
│ └── globals.css # Global styles
│
├── components/ # React components
│ ├── QueryInterface.tsx # Query input/output UI
│ ├── MetricsCards.tsx # Analytics dashboard with charts
│ ├── AuditTrail.tsx # Query history table
│ └── AdversarialTester.tsx # Adversarial testing panel
│
├── lib/ # Utilities and API client
│ └── api.ts # Axios API client with type-safe endpoints
│
├── public/ # Static assets
└── package.json # Dependencies
\`\`\`

## Component Architecture

### QueryInterface.tsx

**Purpose:** Main query input/output component

**Features:**

- Text input with submit button
- Loading states during query execution
- Confidence score visualization with color coding
- Document cards showing retrieved context
- Cost and latency metrics display
- Cache hit/miss indicators

**State Management:**
\`\`\`typescript
const [query, setQuery] = useState('');
const [response, setResponse] = useState<QueryResponse | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
\`\`\`

### MetricsCards.tsx

**Purpose:** Real-time analytics dashboard

**Features:**

- 5 metric cards (queries, cache rate, cost, latency, savings)
- 4 time-series charts (query volume, cache rate, cost comparison, latency)
- Auto-refresh every 5 seconds
- Responsive grid layout

**Charts:**

- Line charts for trends
- Area charts for cumulative metrics
- Custom tooltips with formatted values
- Color-coded data series

### AdversarialTester.tsx

**Purpose:** AI-powered testing interface

**Features:**

- Collapsible panel (starts collapsed)
- Gemini status indicator
- Challenge query list with metadata
- Individual test execution buttons
- Pass/fail result cards
- Weakness and recommendation display
- Summary statistics

**Challenge Query Display:**
\`\`\`typescript
interface ChallengeQuery {
query: string;
type: string; // cross_domain, edge_case, multi_hop
expectedCategories: string[];
difficulty: string; // easy, medium, hard
description: string;
}
\`\`\`

### AuditTrail.tsx

**Purpose:** Query history table

**Features:**

- Reverse chronological order (newest first)
- Expandable rows for full query text
- Source badges (cache/retrieval)
- Strategy labels
- Time formatting (relative and absolute)
- Cost and latency columns

## API Client (lib/api.ts)

### Type-Safe API Interface

\`\`\`typescript
// Main query API
export const queryAPI = {
process(request: QueryRequest): Promise<QueryResponse>
getMetrics(): Promise<Metrics>
getRecentQueries(limit?: number): Promise<RecentQuery[]>
getQueryTimeSeries(bucketSeconds, numBuckets): Promise<QueryTimeSeriesDataPoint[]>
getCacheHitRateTimeSeries(...): Promise<CacheHitRateTimeSeriesDataPoint[]>
getAvgCostTimeSeries(...): Promise<AvgCostTimeSeriesDataPoint[]>
getAvgLatencyTimeSeries(...): Promise<AvgLatencyTimeSeriesDataPoint[]>
getCumulativeCostTimeSeries(...): Promise<CumulativeCostTimeSeriesDataPoint[]>
healthCheck(): Promise<{ status: string }>
}

// Adversarial testing API
export const adversarialAPI = {
getChallenges(regenerate?: boolean): Promise<ChallengeQuery[]>
runTest(query: string): Promise<TestResult>
getReport(): Promise<AdversarialReport>
healthCheck(): Promise<{ status, geminiApi, cachedQueries, message }>
}
\`\`\`

### Automatic snake_case to camelCase Transformation

The API client automatically transforms backend responses:
\`\`\`typescript
// Backend: similarity_score → Frontend: similarityScore
// Backend: latency_ms → Frontend: latency
// Backend: cache_hit_rate → Frontend: cacheHitRate
\`\`\`

### Retry Logic for Cold Starts

Handles Railway cold starts with automatic retry:
\`\`\`typescript
catch (error) {
if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
// Retry once for cold start
return await api.post('/api/query', request);
}
throw error;
}
\`\`\`

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment

Create `.env.local`:
\`\`\`bash
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

For production:
\`\`\`bash
NEXT_PUBLIC_API_URL=https://your-backend-url.up.railway.app
\`\`\`

### 3. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## Development Workflow

### Adding a New Component

1. Create component in `components/` directory
2. Use TypeScript for type safety
3. Import types from `lib/api.ts`
4. Follow existing component patterns
5. Add to `page.tsx` if needed

Example:
\`\`\`typescript
import { QueryResponse } from '@/lib/api';

export default function MyComponent() {
const [data, setData] = useState<QueryResponse | null>(null);
// ...
}
\`\`\`

### Adding a New API Endpoint

1. Add TypeScript interface in `lib/api.ts`
2. Add method to `queryAPI` or `adversarialAPI`
3. Handle snake_case → camelCase transformation
4. Add error handling

### Styling Guidelines

**Use Tailwind utility classes:**

- Spacing: `p-4`, `m-2`, `space-y-4`
- Colors: `bg-gray-50`, `text-blue-600`, `border-gray-200`
- Layout: `flex`, `grid`, `grid-cols-2`
- Responsive: `lg:grid-cols-4`, `md:space-y-0`

**Consistent color scheme:**

- Cache hit: `bg-green-50`, `text-green-600`
- Cache miss: `bg-purple-50`, `text-purple-600`
- High confidence: `bg-green-100`, `text-green-900`
- Medium confidence: `bg-yellow-100`, `text-yellow-900`
- Low confidence: `bg-red-100`, `text-red-900`

## Performance Optimizations

### 1. Efficient Re-rendering

- Use `useState` for local state
- Use `useEffect` with proper dependencies
- Memoize expensive calculations

### 2. API Call Management

- Poll metrics every 5 seconds (not more frequently)
- Load adversarial challenges only when expanded
- Use loading states to prevent duplicate requests

### 3. Chart Performance

- Limit data points (20 buckets default)
- Use responsive containers
- Disable animations for large datasets

## Deployment

### Railway (Current Production)

\`\`\`bash

# From frontend directory

railway link
railway up
\`\`\`

### Vercel (Recommended for Next.js)

\`\`\`bash
vercel
\`\`\`

### Environment Variables in Production

- `NEXT_PUBLIC_API_URL` - Backend API URL

## Troubleshooting

### Issue: "Failed to fetch" errors

**Solution:** Check that backend is running and `NEXT_PUBLIC_API_URL` is correct

### Issue: CORS errors

**Solution:** Backend must allow frontend origin in CORS config

### Issue: Cold start timeouts

**Solution:** API client automatically retries (60s timeout)

### Issue: Charts not rendering

**Solution:** Ensure Recharts is installed and data format matches expected types

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Follow existing code structure
2. Use TypeScript for all new code
3. Maintain consistent styling with Tailwind
4. Test on multiple screen sizes
5. Ensure accessibility (semantic HTML, ARIA labels)

---

**Built with ❤️ for the AI ATL Hackathon**

_Transforming complex RAG metrics into actionable insights._
