#!/usr/bin/env node

import { loadEnvFile, getRedisCredentials } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const CANONICAL_KEY = 'news:insights:v1';
const CACHE_TTL = 10800;

function generateRecentDate(hoursAgo) {
  return new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
}

function generateMockInsights() {
  const stories = [
    {
      primaryTitle: 'Israel-Iran tensions escalate as military exercises resume in Strait of Hormuz',
      primarySource: 'Reuters',
      primaryLink: 'https://reuters.com/world/middle-east',
      pubDate: generateRecentDate(2),
      sourceCount: 12,
      importanceScore: 0.92,
      velocity: { level: 'high', sourcesPerHour: 4.2 },
      isAlert: true,
      category: 'conflict',
      threatLevel: 'critical',
      countryCode: 'IR',
    },
    {
      primaryTitle: 'EU announces new sanctions package targeting Russian energy sector',
      primarySource: 'BBC News',
      primaryLink: 'https://bbc.com/news/world-europe',
      pubDate: generateRecentDate(5),
      sourceCount: 8,
      importanceScore: 0.85,
      velocity: { level: 'normal', sourcesPerHour: 1.5 },
      isAlert: false,
      category: 'geopolitical',
      threatLevel: 'high',
      countryCode: 'RU',
    },
    {
      primaryTitle: 'Category 4 hurricane projected to make landfall on US Gulf Coast within 72 hours',
      primarySource: 'NOAA',
      primaryLink: 'https://noaa.gov/hurricanes',
      pubDate: generateRecentDate(1),
      sourceCount: 15,
      importanceScore: 0.88,
      velocity: { level: 'high', sourcesPerHour: 6.1 },
      isAlert: true,
      category: 'natural_disaster',
      threatLevel: 'high',
      countryCode: 'US',
    },
    {
      primaryTitle: 'Global semiconductor supply chain disruption after Taiwan earthquake',
      primarySource: 'Nikkei Asia',
      primaryLink: 'https://nikkei.com/tech',
      pubDate: generateRecentDate(8),
      sourceCount: 6,
      importanceScore: 0.78,
      velocity: { level: 'normal', sourcesPerHour: 1.2 },
      isAlert: false,
      category: 'economic',
      threatLevel: 'medium',
      countryCode: 'TW',
    },
    {
      primaryTitle: 'Sudan conflict intensifies as RSF advances on Khartoum',
      primarySource: 'Al Jazeera',
      primaryLink: 'https://aljazeera.com/africa',
      pubDate: generateRecentDate(3),
      sourceCount: 9,
      importanceScore: 0.82,
      velocity: { level: 'normal', sourcesPerHour: 2.0 },
      isAlert: false,
      category: 'conflict',
      threatLevel: 'high',
      countryCode: 'SD',
    },
    {
      primaryTitle: 'South China Sea naval standoff escalates between Philippines and China',
      primarySource: 'AP News',
      primaryLink: 'https://apnews.com/asia-pacific',
      pubDate: generateRecentDate(6),
      sourceCount: 7,
      importanceScore: 0.80,
      velocity: { level: 'normal', sourcesPerHour: 1.8 },
      isAlert: false,
      category: 'geopolitical',
      threatLevel: 'medium',
      countryCode: 'PH',
    },
    {
      primaryTitle: 'Arctic sea ice reaches new record low for June, alarming climate scientists',
      primarySource: 'The Guardian',
      primaryLink: 'https://theguardian.com/environment',
      pubDate: generateRecentDate(4),
      sourceCount: 11,
      importanceScore: 0.75,
      velocity: { level: 'normal', sourcesPerHour: 1.3 },
      isAlert: false,
      category: 'environment',
      threatLevel: 'medium',
      countryCode: null,
    },
    {
      primaryTitle: 'NATO summit addresses collective defense posture amid Baltic tensions',
      primarySource: 'NATO Communications',
      primaryLink: 'https://nato.int/news',
      pubDate: generateRecentDate(10),
      sourceCount: 5,
      importanceScore: 0.70,
      velocity: { level: 'normal', sourcesPerHour: 0.8 },
      isAlert: false,
      category: 'geopolitical',
      threatLevel: 'low',
      countryCode: null,
    },
  ];

  return {
    worldBrief: 'Tensions remain elevated across multiple theaters this week. The Israel-Iran confrontation in the Strait of Hormuz continues to disrupt global shipping lanes, while a Category 4 hurricane threatens the US Gulf Coast. The EU has expanded its sanctions regime against Russia, and armed conflicts persist in Sudan and the South China Sea.',
    worldBriefSources: [
      {
        title: 'Israel-Iran tensions escalate as military exercises resume in Strait of Hormuz',
        source: 'Reuters',
        url: 'https://reuters.com/world/middle-east',
        publishedAt: generateRecentDate(2),
      },
    ],
    briefProvider: 'mock',
    briefModel: 'seed',
    status: 'ok',
    topStories: stories,
    generatedAt: new Date().toISOString(),
    clusterCount: 24,
    multiSourceCount: 6,
    fastMovingCount: 2,
  };
}

async function seedInsights() {
  const { url, token } = getRedisCredentials();
  const data = generateMockInsights();

  const resp = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['SET', CANONICAL_KEY, JSON.stringify(data), 'EX', CACHE_TTL],
    ]),
  });

  if (!resp.ok) {
    throw new Error(`Failed to set insights: ${resp.status} ${await resp.text()}`);
  }

  const result = await resp.json();
  console.log(`Seeded ${CANONICAL_KEY}: ${result[0]?.result === 'OK' ? 'OK' : result[0]?.result}`);
  console.log(`  Stories: ${data.topStories.length}`);
  console.log(`  Generated at: ${data.generatedAt}`);
  console.log(`  Status: ${data.status}`);
}

seedInsights().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
