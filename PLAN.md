# Plan: Update 5 Panel Files with Real Live Data

## Context
All 5 panel files currently fetch from their existing services (which already work via gRPC/proto with hydration fallbacks). The user wants to add additional live data sources for richer content. No new services need to be created — all referenced services exist in the codebase.

## Files to Update

### 1. `src/components/panels/ClimateAnomalyPanel.ts`
- **Current**: Imports `fetchClimateAnomalies`, `fetchCo2Monitoring` from `@/services/climate`
- **Change**: Add `import { fetchClimateAirQuality } from '@/services/climate-air-quality'`
- In `fetchData()`, add a third `Promise.allSettled` call to `fetchClimateAirQuality()`
- Map `ListAirQualityDataResponse.stations[]` (AirQualityStation: `{ name, aqi, category, lat, lon }`) into anomaly entries with type `'air_quality'` and severity derived from AQI thresholds (0-50 normal, 51-100 moderate, 101-150 elevated, 151+ extreme)
- Prepend air quality anomalies to `this.anomalies` (they show first since they're live sensor data)
- Add air quality summary stat in the grid: show number of stations with elevated AQI
- Keep existing demo fallback data for anomalies and co2

### 2. `src/components/panels/DiseaseOutbreaksPanel.ts`
- **Current**: Imports `fetchDiseaseOutbreaks` from `@/services/disease-outbreaks`
- **Change**: Add `import { fetchHealthAirQuality } from '@/services/health-air-quality'` (health alerts with air quality focus)
- In `fetchData()`, add `Promise.allSettled([fetchHealthAirQuality()])` alongside existing fetch
- Map `ListAirQualityAlertsResponse.alerts[]` (AirQualityAlert: `{ type, severity, message, location, timestamp }`) into outbreak-style entries where `type` becomes `name`, `message` becomes context, `location` becomes `region`
- Merge these health air quality alerts into `this.outbreaks` array
- Keep existing demo fallback

### 3. `src/components/panels/DisplacementPanel.ts`
- **Current**: Imports `fetchUnhcrPopulation` from `@/services/displacement` (already fetches real UNHCR data)
- **Change**: Add `import { fetchConflictEvents } from '@/services/conflict'`
- In `fetchData()`, also call `fetchConflictEvents()` via `Promise.allSettled`
- Use conflict fatalities as a proxy: countries with high fatalities get an "estimated displacement" multiplier applied (e.g., fatalities × 50 = estimated newly displaced)
- Merge conflict-driven displacement estimates with UNHCR data: if UNHCR data is stale or missing for a country, use conflict estimates
- Add a "conflict cause" label for each displacement entry
- Keep existing demo fallback

### 4. `src/components/panels/SocialVelocityPanel.ts`
- **Current**: Imports `fetchProtestEvents` from `@/services/unrest`
- **Change**: Add `import { fetchSocialVelocity } from '@/services/social-velocity'`
- In `fetchData()`, call `Promise.allSettled([fetchSocialVelocity()])` alongside existing
- `GetSocialVelocityResponse` has `posts[]` with fields like `{ platform, text, sentiment, velocity, country, timestamp }`
- Compute velocity scores by country: average velocity, count of posts, max velocity
- Add a velocity column to the event display
- Show severity as `low/medium/high` based on velocity thresholds
- Keep existing demo fallback

### 5. `src/components/panels/WeatherAlertsPanel.ts`
- **Current**: Imports `fetchWeatherAlerts` from `@/services/weather`
- **Change**: Add direct fetch to NWS API as a fallback/enhancement
- In `fetchData()`, try NWS API first: `fetch('https://api.weather.gov/alerts/active?status=actual&severity=Extreme,Severe')`
- If NWS returns data, map GeoJSON features to alerts: `feature.properties.event`, `feature.properties.areaDesc`, `feature.properties.severity`, `feature.properties.headline`
- Color-code severity: Extreme → red badge, Severe → orange badge (existing `sevStyle` method)
- Fall back to existing `fetchWeatherAlerts()` if NWS fails
- Keep existing demo fallback

## Implementation Notes
- All changes wrap new fetches in `Promise.allSettled` so failure of one source doesn't break others
- All panels keep their existing UI structure (no layout changes)
- Status badges, color coding, and animation remain unchanged
- Each panel's `sevStyle()` helper is already in place and compatible
- No new TypeScript interfaces needed — extend existing inline types where necessary
