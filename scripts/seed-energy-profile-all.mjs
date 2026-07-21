#!/usr/bin/env node
/**
 * Seed energy profiles for ALL countries.
 * Usage: node scripts/seed-energy-profile-all.mjs
 */
import { loadEnvFile, getRedisCredentials } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const { url, token } = getRedisCredentials();
const TTL = 86400 * 30;
const PIPELINE_BATCH = 50;

const ALL = [
  {c:'AD',coal:0,gas:0,oil:0,nuc:0,rn:20,wind:0,sol:5,hy:15,imp:85},{c:'AE',coal:0,gas:88,oil:5,nuc:0,rn:7,wind:0,sol:4,hy:0,imp:32},
  {c:'AF',coal:0,gas:18,oil:5,nuc:0,rn:77,wind:0,sol:3,hy:74,imp:15},{c:'AG',coal:0,gas:80,oil:10,nuc:0,rn:10,wind:0,sol:5,hy:5,imp:95},
  {c:'AL',coal:2,gas:2,oil:1,nuc:0,rn:95,wind:15,sol:5,hy:75,imp:40},{c:'AM',coal:0,gas:60,oil:1,nuc:0,rn:39,wind:0,sol:1,hy:38,imp:30},
  {c:'AO',coal:0,gas:55,oil:30,nuc:0,rn:15,wind:0,sol:3,hy:12,imp:20},{c:'AR',coal:2,gas:50,oil:3,nuc:5,rn:40,wind:12,sol:5,hy:23,imp:10},
  {c:'AT',coal:5,gas:15,oil:1,nuc:0,rn:79,wind:25,sol:10,hy:44,imp:35},{c:'AU',coal:48,gas:20,oil:2,nuc:0,rn:30,wind:13,sol:14,hy:5,imp:5},
  {c:'AZ',coal:0,gas:70,oil:5,nuc:0,rn:25,wind:0,sol:2,hy:23,imp:15},{c:'BA',coal:30,gas:10,oil:1,nuc:0,rn:59,wind:5,sol:3,hy:51,imp:25},
  {c:'BB',coal:0,gas:100,oil:0,nuc:0,rn:0,wind:0,sol:0,hy:0,imp:100},{c:'BD',coal:5,gas:55,oil:1,nuc:0,rn:39,wind:0,sol:3,hy:36,imp:25},
  {c:'BE',coal:2,gas:25,oil:1,nuc:50,rn:22,wind:12,sol:5,hy:2,imp:55},{c:'BF',coal:0,gas:0,oil:20,nuc:0,rn:80,wind:0,sol:2,hy:78,imp:45},
  {c:'BG',coal:30,gas:8,oil:1,nuc:35,rn:26,wind:5,sol:5,hy:16,imp:15},{c:'BH',coal:0,gas:90,oil:5,nuc:0,rn:5,wind:0,sol:3,hy:0,imp:10},
  {c:'BI',coal:0,gas:0,oil:10,nuc:0,rn:90,wind:0,sol:1,hy:89,imp:35},{c:'BJ',coal:0,gas:0,oil:30,nuc:0,rn:70,wind:0,sol:5,hy:65,imp:40},
  {c:'BN',coal:0,gas:65,oil:5,nuc:0,rn:30,wind:0,sol:1,hy:29,imp:70},{c:'BO',coal:3,gas:30,oil:2,nuc:0,rn:65,wind:0,sol:2,hy:63,imp:10},
  {c:'BR',coal:3,gas:12,oil:2,nuc:1,rn:82,wind:14,sol:6,hy:63,imp:8},{c:'BS',coal:0,gas:90,oil:5,nuc:0,rn:5,wind:0,sol:3,hy:2,imp:95},
  {c:'BT',coal:0,gas:0,oil:0,nuc:0,rn:100,wind:0,sol:1,hy:99,imp:40},{c:'BW',coal:40,gas:0,oil:10,nuc:0,rn:50,wind:0,sol:10,hy:40,imp:25},
  {c:'BY',coal:10,gas:45,oil:1,nuc:30,rn:14,wind:0,sol:1,hy:13,imp:20},{c:'BZ',coal:0,gas:55,oil:5,nuc:0,rn:40,wind:0,sol:5,hy:35,imp:70},
  {c:'CA',coal:4,gas:15,oil:1,nuc:13,rn:68,wind:9,sol:3,hy:56,imp:18},{c:'CD',coal:0,gas:0,oil:5,nuc:0,rn:95,wind:0,sol:0,hy:95,imp:25},
  {c:'CF',coal:0,gas:40,oil:10,nuc:0,rn:50,wind:0,sol:2,hy:48,imp:35},{c:'CG',coal:0,gas:55,oil:10,nuc:0,rn:35,wind:0,sol:1,hy:34,imp:30},
  {c:'CH',coal:0,gas:5,oil:1,nuc:35,rn:59,wind:3,sol:8,hy:48,imp:45},{c:'CI',coal:0,gas:35,oil:10,nuc:0,rn:55,wind:0,sol:3,hy:52,imp:30},
  {c:'CL',coal:15,gas:18,oil:1,nuc:0,rn:66,wind:12,sol:20,hy:34,imp:5},{c:'CM',coal:0,gas:35,oil:10,nuc:0,rn:55,wind:0,sol:2,hy:53,imp:20},
  {c:'CN',coal:58,gas:9,oil:2,nuc:5,rn:26,wind:10,sol:7,hy:9,imp:22},{c:'CO',coal:5,gas:30,oil:2,nuc:0,rn:63,wind:3,sol:2,hy:58,imp:15},
  {c:'CR',coal:0,gas:55,oil:1,nuc:0,rn:44,wind:1,sol:1,hy:42,imp:35},{c:'CU',coal:5,gas:20,oil:5,nuc:5,rn:65,wind:0,sol:1,hy:59,imp:40},
  {c:'CV',coal:0,gas:50,oil:20,nuc:0,rn:30,wind:0,sol:10,hy:20,imp:75},{c:'CY',coal:0,gas:70,oil:5,nuc:0,rn:25,wind:3,sol:12,hy:0,imp:55},
  {c:'CZ',coal:40,gas:15,oil:1,nuc:35,rn:9,wind:1,sol:3,hy:4,imp:15},{c:'DE',coal:24,gas:18,oil:1,nuc:0,rn:56,wind:28,sol:15,hy:4,imp:68},
  {c:'DJ',coal:0,gas:65,oil:15,nuc:0,rn:20,wind:0,sol:5,hy:15,imp:65},{c:'DK',coal:2,gas:15,oil:1,nuc:0,rn:82,wind:55,sol:5,hy:0,imp:35},
  {c:'DM',coal:0,gas:30,oil:15,nuc:0,rn:55,wind:0,sol:10,hy:45,imp:80},{c:'DO',coal:10,gas:50,oil:5,nuc:0,rn:35,wind:5,sol:5,hy:25,imp:35},
  {c:'DZ',coal:1,gas:60,oil:1,nuc:0,rn:38,wind:3,sol:5,hy:30,imp:20},{c:'EC',coal:2,gas:50,oil:2,nuc:0,rn:46,wind:3,sol:3,hy:40,imp:15},
  {c:'EE',coal:0,gas:8,oil:1,nuc:0,rn:91,wind:55,sol:2,hy:34,imp:25},{c:'EG',coal:1,gas:89,oil:5,nuc:0,rn:5,wind:2,sol:3,hy:1,imp:42},
  {c:'ER',coal:0,gas:0,oil:0,nuc:0,rn:100,wind:0,sol:1,hy:99,imp:55},{c:'ES',coal:2,gas:30,oil:1,nuc:21,rn:47,wind:23,sol:18,hy:6,imp:28},
  {c:'ET',coal:0,gas:0,oil:1,nuc:0,rn:99,wind:0,sol:1,hy:98,imp:35},{c:'FI',coal:1,gas:5,oil:1,nuc:30,rn:63,wind:15,sol:1,hy:47,imp:20},
  {c:'FJ',coal:0,gas:50,oil:5,nuc:0,rn:45,wind:0,sol:5,hy:40,imp:60},{c:'FM',coal:0,gas:40,oil:20,nuc:0,rn:40,wind:0,sol:10,hy:30,imp:80},
  {c:'FR',coal:1,gas:7,oil:1,nuc:64,rn:27,wind:10,sol:6,hy:11,imp:12},{c:'GA',coal:0,gas:40,oil:15,nuc:0,rn:45,wind:0,sol:2,hy:43,imp:25},
  {c:'GB',coal:1,gas:37,oil:0,nuc:15,rn:47,wind:30,sol:5,hy:2,imp:42},{c:'GD',coal:0,gas:50,oil:10,nuc:0,rn:40,wind:0,sol:10,hy:30,imp:80},
  {c:'GE',coal:0,gas:55,oil:3,nuc:0,rn:42,wind:1,sol:1,hy:40,imp:25},{c:'GH',coal:15,gas:50,oil:5,nuc:0,rn:30,wind:0,sol:3,hy:27,imp:30},
  {c:'GM',coal:0,gas:60,oil:10,nuc:0,rn:30,wind:0,sol:5,hy:25,imp:70},{c:'GN',coal:0,gas:0,oil:5,nuc:0,rn:95,wind:0,sol:1,hy:94,imp:45},
  {c:'GQ',coal:0,gas:60,oil:20,nuc:0,rn:20,wind:0,sol:2,hy:18,imp:20},{c:'GR',coal:5,gas:40,oil:1,nuc:0,rn:54,wind:25,sol:15,hy:12,imp:35},
  {c:'GT',coal:5,gas:40,oil:5,nuc:0,rn:50,wind:3,sol:5,hy:42,imp:45},{c:'GW',coal:0,gas:0,oil:10,nuc:0,rn:90,wind:0,sol:2,hy:88,imp:65},
  {c:'GY',coal:0,gas:10,oil:5,nuc:0,rn:85,wind:0,sol:1,hy:84,imp:30},{c:'HN',coal:5,gas:25,oil:5,nuc:0,rn:65,wind:0,sol:3,hy:62,imp:50},
  {c:'HR',coal:8,gas:15,oil:1,nuc:0,rn:76,wind:10,sol:5,hy:61,imp:45},{c:'HT',coal:0,gas:50,oil:30,nuc:0,rn:20,wind:0,sol:3,hy:17,imp:80},
  {c:'HU',coal:15,gas:25,oil:1,nuc:45,rn:14,wind:3,sol:5,hy:3,imp:30},{c:'ID',coal:63,gas:18,oil:2,nuc:0,rn:17,wind:1,sol:3,hy:13,imp:15},
  {c:'IE',coal:1,gas:30,oil:1,nuc:0,rn:68,wind:35,sol:2,hy:5,imp:55},{c:'IL',coal:1,gas:42,oil:2,nuc:0,rn:15,wind:1,sol:13,hy:2,imp:72},
  {c:'IN',coal:72,gas:4,oil:1,nuc:3,rn:20,wind:6,sol:7,hy:8,imp:18},{c:'IQ',coal:0,gas:75,oil:5,nuc:0,rn:20,wind:0,sol:2,hy:18,imp:35},
  {c:'IR',coal:1,gas:72,oil:1,nuc:2,rn:24,wind:1,sol:3,hy:20,imp:5},{c:'IS',coal:0,gas:0,oil:0,nuc:0,rn:100,wind:45,sol:0,hy:55,imp:0},
  {c:'IT',coal:5,gas:49,oil:2,nuc:0,rn:44,wind:11,sol:12,hy:19,imp:62},{c:'JM',coal:0,gas:80,oil:10,nuc:0,rn:10,wind:0,sol:5,hy:5,imp:90},
  {c:'JO',coal:0,gas:80,oil:5,nuc:0,rn:15,wind:1,sol:5,hy:9,imp:55},{c:'JP',coal:29,gas:32,oil:5,nuc:8,rn:26,wind:1,sol:12,hy:8,imp:88},
  {c:'KE',coal:5,gas:5,oil:3,nuc:0,rn:87,wind:5,sol:3,hy:79,imp:20},{c:'KG',coal:5,gas:20,oil:3,nuc:0,rn:72,wind:0,sol:2,hy:70,imp:25},
  {c:'KH',coal:0,gas:50,oil:5,nuc:0,rn:45,wind:0,sol:2,hy:43,imp:40},{c:'KI',coal:0,gas:50,oil:20,nuc:0,rn:30,wind:0,sol:10,hy:20,imp:90},
  {c:'KM',coal:0,gas:40,oil:30,nuc:0,rn:30,wind:0,sol:10,hy:20,imp:70},{c:'KN',coal:0,gas:60,oil:10,nuc:0,rn:30,wind:0,sol:10,hy:20,imp:90},
  {c:'KP',coal:50,gas:5,oil:5,nuc:0,rn:40,wind:0,sol:0,hy:40,imp:15},{c:'KR',coal:32,gas:30,oil:1,nuc:28,rn:10,wind:1,sol:5,hy:3,imp:82},
  {c:'KW',coal:0,gas:90,oil:5,nuc:0,rn:5,wind:0,sol:3,hy:0,imp:5},{c:'KZ',coal:35,gas:35,oil:2,nuc:15,rn:13,wind:1,sol:1,hy:11,imp:10},
  {c:'LA',coal:0,gas:5,oil:1,nuc:0,rn:94,wind:0,sol:1,hy:93,imp:30},{c:'LB',coal:0,gas:85,oil:5,nuc:0,rn:10,wind:0,sol:5,hy:5,imp:85},
  {c:'LC',coal:0,gas:60,oil:10,nuc:0,rn:30,wind:0,sol:10,hy:20,imp:85},{c:'LI',coal:0,gas:0,oil:0,nuc:0,rn:100,wind:0,sol:10,hy:90,imp:90},
  {c:'LK',coal:25,gas:15,oil:2,nuc:0,rn:58,wind:3,sol:5,hy:50,imp:35},{c:'LR',coal:0,gas:30,oil:20,nuc:0,rn:50,wind:0,sol:2,hy:48,imp:60},
  {c:'LS',coal:0,gas:0,oil:5,nuc:0,rn:95,wind:0,sol:1,hy:94,imp:70},{c:'LT',coal:2,gas:15,oil:1,nuc:0,rn:82,wind:20,sol:5,hy:57,imp:40},
  {c:'LU',coal:0,gas:30,oil:1,nuc:0,rn:69,wind:15,sol:10,hy:44,imp:75},{c:'LV',coal:1,gas:20,oil:1,nuc:0,rn:78,wind:20,sol:2,hy:56,imp:45},
  {c:'LY',coal:0,gas:90,oil:5,nuc:0,rn:5,wind:0,sol:3,hy:2,imp:30},{c:'MA',coal:2,gas:50,oil:1,nuc:0,rn:47,wind:5,sol:5,hy:37,imp:30},
  {c:'MC',coal:0,gas:100,oil:0,nuc:0,rn:0,wind:0,sol:0,hy:0,imp:100},{c:'MD',coal:0,gas:50,oil:5,nuc:0,rn:45,wind:5,sol:5,hy:35,imp:55},
  {c:'ME',coal:30,gas:5,oil:1,nuc:0,rn:64,wind:2,sol:3,hy:59,imp:35},{c:'MG',coal:0,gas:30,oil:5,nuc:0,rn:65,wind:0,sol:3,hy:62,imp:30},
  {c:'MK',coal:40,gas:10,oil:1,nuc:0,rn:49,wind:3,sol:2,hy:44,imp:35},{c:'ML',coal:0,gas:10,oil:15,nuc:0,rn:75,wind:0,sol:2,hy:73,imp:40},
  {c:'MM',coal:25,gas:40,oil:5,nuc:0,rn:30,wind:0,sol:1,hy:29,imp:35},{c:'MN',coal:50,gas:10,oil:5,nuc:0,rn:35,wind:2,sol:3,hy:30,imp:25},
  {c:'MR',coal:0,gas:50,oil:15,nuc:0,rn:35,wind:0,sol:5,hy:30,imp:45},{c:'MT',coal:0,gas:100,oil:0,nuc:0,rn:0,wind:0,sol:5,hy:0,imp:100},
  {c:'MU',coal:15,gas:50,oil:5,nuc:0,rn:30,wind:0,sol:5,hy:25,imp:60},{c:'MV',coal:0,gas:80,oil:10,nuc:0,rn:10,wind:0,sol:8,hy:2,imp:95},
  {c:'MW',coal:10,gas:0,oil:10,nuc:0,rn:80,wind:0,sol:2,hy:78,imp:40},{c:'MX',coal:5,gas:59,oil:4,nuc:2,rn:31,wind:8,sol:6,hy:17,imp:28},
  {c:'MY',coal:39,gas:42,oil:1,nuc:0,rn:18,wind:1,sol:3,hy:15,imp:12},{c:'MZ',coal:10,gas:20,oil:5,nuc:0,rn:65,wind:0,sol:2,hy:63,imp:35},
  {c:'NA',coal:0,gas:30,oil:5,nuc:0,rn:65,wind:5,sol:10,hy:50,imp:30},{c:'NE',coal:0,gas:60,oil:15,nuc:0,rn:25,wind:0,sol:5,hy:20,imp:40},
  {c:'NG',coal:0,gas:79,oil:15,nuc:0,rn:6,wind:0,sol:1,hy:5,imp:8},{c:'NI',coal:5,gas:30,oil:5,nuc:0,rn:60,wind:0,sol:3,hy:57,imp:40},
  {c:'NL',coal:1,gas:43,oil:2,nuc:3,rn:51,wind:19,sol:12,hy:1,imp:65},{c:'NO',coal:0,gas:2,oil:0,nuc:0,rn:98,wind:11,sol:1,hy:87,imp:8},
  {c:'NP',coal:2,gas:1,oil:1,nuc:0,rn:96,wind:0,sol:1,hy:95,imp:20},{c:'NR',coal:0,gas:100,oil:0,nuc:0,rn:0,wind:0,sol:0,hy:0,imp:100},
  {c:'NZ',coal:2,gas:20,oil:1,nuc:0,rn:77,wind:5,sol:3,hy:60,imp:5},{c:'OM',coal:0,gas:85,oil:5,nuc:0,rn:10,wind:0,sol:5,hy:0,imp:10},
  {c:'PA',coal:0,gas:55,oil:5,nuc:0,rn:40,wind:3,sol:5,hy:32,imp:50},{c:'PE',coal:3,gas:45,oil:3,nuc:0,rn:49,wind:3,sol:3,hy:43,imp:20},
  {c:'PG',coal:0,gas:30,oil:20,nuc:0,rn:50,wind:0,sol:2,hy:48,imp:30},{c:'PH',coal:45,gas:20,oil:2,nuc:0,rn:33,wind:1,sol:3,hy:29,imp:25},
  {c:'PK',coal:55,gas:33,oil:2,nuc:5,rn:5,wind:1,sol:1,hy:3,imp:32},{c:'PL',coal:55,gas:11,oil:1,nuc:0,rn:33,wind:13,sol:8,hy:3,imp:22},
  {c:'PT',coal:1,gas:20,oil:1,nuc:0,rn:78,wind:25,sol:12,hy:41,imp:28},{c:'PW',coal:0,gas:50,oil:20,nuc:0,rn:30,wind:0,sol:10,hy:20,imp:90},
  {c:'PY',coal:0,gas:40,oil:1,nuc:0,rn:59,wind:1,sol:2,hy:56,imp:20},{c:'QA',coal:0,gas:95,oil:3,nuc:0,rn:2,wind:0,sol:1,hy:1,imp:5},
  {c:'RO',coal:15,gas:20,oil:1,nuc:18,rn:46,wind:12,sol:4,hy:30,imp:15},{c:'RS',coal:55,gas:10,oil:1,nuc:0,rn:34,wind:2,sol:2,hy:30,imp:20},
  {c:'RU',coal:16,gas:49,oil:2,nuc:20,rn:13,wind:1,sol:1,hy:12,imp:2},{c:'RW',coal:0,gas:0,oil:10,nuc:0,rn:90,wind:0,sol:1,hy:89,imp:35},
  {c:'SA',coal:0,gas:62,oil:29,nuc:0,rn:9,wind:0,sol:5,hy:0,imp:5},{c:'SB',coal:0,gas:30,oil:10,nuc:0,rn:60,wind:0,sol:3,hy:57,imp:70},
  {c:'SC',coal:0,gas:80,oil:10,nuc:0,rn:10,wind:0,sol:5,hy:5,imp:85},{c:'SD',coal:0,gas:70,oil:10,nuc:0,rn:20,wind:0,sol:2,hy:18,imp:35},
  {c:'SE',coal:1,gas:1,oil:0,nuc:30,rn:68,wind:13,sol:2,hy:46,imp:15},{c:'SG',coal:1,gas:95,oil:1,nuc:0,rn:3,wind:0,sol:3,hy:0,imp:98},
  {c:'SI',coal:15,gas:5,oil:1,nuc:0,rn:79,wind:2,sol:5,hy:33,imp:40},{c:'SK',coal:10,gas:15,oil:1,nuc:55,rn:19,wind:1,sol:3,hy:15,imp:25},
  {c:'SL',coal:0,gas:10,oil:5,nuc:0,rn:85,wind:0,sol:1,hy:84,imp:55},{c:'SM',coal:0,gas:100,oil:0,nuc:0,rn:0,wind:0,sol:5,hy:0,imp:100},
  {c:'SN',coal:0,gas:40,oil:10,nuc:0,rn:50,wind:0,sol:5,hy:45,imp:35},{c:'SO',coal:0,gas:10,oil:20,nuc:0,rn:70,wind:0,sol:2,hy:68,imp:60},
  {c:'SR',coal:0,gas:20,oil:5,nuc:0,rn:75,wind:0,sol:2,hy:73,imp:40},{c:'SS',coal:0,gas:50,oil:20,nuc:0,rn:30,wind:0,sol:2,hy:28,imp:50},
  {c:'ST',coal:0,gas:30,oil:20,nuc:0,rn:50,wind:0,sol:10,hy:40,imp:70},{c:'SV',coal:15,gas:30,oil:5,nuc:0,rn:50,wind:0,sol:8,hy:42,imp:40},
  {c:'SY',coal:1,gas:50,oil:10,nuc:0,rn:39,wind:0,sol:1,hy:38,imp:50},{c:'SZ',coal:0,gas:10,oil:5,nuc:0,rn:85,wind:0,sol:3,hy:82,imp:50},
  {c:'TD',coal:0,gas:50,oil:15,nuc:0,rn:35,wind:0,sol:2,hy:33,imp:35},{c:'TG',coal:0,gas:30,oil:20,nuc:0,rn:50,wind:0,sol:3,hy:47,imp:55},
  {c:'TH',coal:13,gas:55,oil:1,nuc:0,rn:31,wind:2,sol:6,hy:24,imp:18},{c:'TJ',coal:5,gas:30,oil:3,nuc:0,rn:62,wind:0,sol:1,hy:61,imp:25},
  {c:'TL',coal:0,gas:40,oil:10,nuc:0,rn:50,wind:0,sol:5,hy:45,imp:60},{c:'TM',coal:0,gas:85,oil:5,nuc:0,rn:10,wind:0,sol:2,hy:8,imp:15},
  {c:'TN',coal:1,gas:90,oil:2,nuc:0,rn:7,wind:2,sol:3,hy:2,imp:35},{c:'TO',coal:0,gas:50,oil:20,nuc:0,rn:30,wind:0,sol:10,hy:20,imp:85},
  {c:'TR',coal:31,gas:29,oil:1,nuc:5,rn:35,wind:11,sol:7,hy:17,imp:52},{c:'TT',coal:0,gas:80,oil:5,nuc:0,rn:15,wind:0,sol:5,hy:10,imp:65},
  {c:'TV',coal:0,gas:100,oil:0,nuc:0,rn:0,wind:0,sol:0,hy:0,imp:100},{c:'TW',coal:30,gas:35,oil:1,nuc:12,rn:22,wind:3,sol:5,hy:15,imp:60},
  {c:'TZ',coal:5,gas:10,oil:3,nuc:0,rn:82,wind:0,sol:2,hy:80,imp:20},{c:'UA',coal:23,gas:9,oil:1,nuc:55,rn:13,wind:3,sol:2,hy:8,imp:18},
  {c:'UG',coal:0,gas:10,oil:5,nuc:0,rn:85,wind:0,sol:2,hy:83,imp:30},{c:'US',coal:16,gas:43,oil:1,nuc:18,rn:22,wind:10,sol:6,hy:6,imp:15},
  {c:'UY',coal:0,gas:40,oil:2,nuc:0,rn:58,wind:15,sol:8,hy:35,imp:20},{c:'UZ',coal:10,gas:50,oil:3,nuc:0,rn:37,wind:0,sol:2,hy:35,imp:15},
  {c:'VA',coal:0,gas:100,oil:0,nuc:0,rn:0,wind:0,sol:15,hy:0,imp:100},{c:'VC',coal:0,gas:50,oil:10,nuc:0,rn:40,wind:0,sol:10,hy:30,imp:85},
  {c:'VE',coal:0,gas:40,oil:10,nuc:0,rn:50,wind:0,sol:1,hy:49,imp:10},{c:'VN',coal:30,gas:15,oil:1,nuc:0,rn:54,wind:3,sol:5,hy:46,imp:10},
  {c:'VU',coal:0,gas:30,oil:15,nuc:0,rn:55,wind:0,sol:5,hy:50,imp:65},{c:'WS',coal:0,gas:50,oil:20,nuc:0,rn:30,wind:0,sol:10,hy:20,imp:80},
  {c:'XK',coal:70,gas:5,oil:2,nuc:0,rn:23,wind:2,sol:1,hy:20,imp:50},{c:'YE',coal:0,gas:80,oil:10,nuc:0,rn:10,wind:0,sol:3,hy:7,imp:60},
  {c:'ZA',coal:83,gas:3,oil:1,nuc:5,rn:9,wind:4,sol:3,hy:2,imp:12},{c:'ZM',coal:5,gas:5,oil:5,nuc:0,rn:85,wind:0,sol:1,hy:84,imp:20},
  {c:'ZW',coal:40,gas:5,oil:5,nuc:0,rn:50,wind:0,sol:2,hy:48,imp:20},
];

async function execPipeline(commands) {
  const resp = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) throw new Error(`Pipeline HTTP ${resp.status}`);
  return resp.json();
}

async function main() {
  console.log(`Seeding ${ALL.length} energy profiles...`);
  let ok = 0;
  for (let i = 0; i < ALL.length; i += PIPELINE_BATCH) {
    const batch = ALL.slice(i, i + PIPELINE_BATCH);
    const cmds = batch.map(p => {
      const d = JSON.stringify({
        mixAvailable: true, mixYear: 2024, coalShare: p.coal, gasShare: p.gas,
        oilShare: p.oil, nuclearShare: p.nuc, renewShare: p.rn,
        windShare: p.wind, solarShare: p.sol, hydroShare: p.hy,
        importShare: p.imp, gasStorageAvailable: false,
        electricityAvailable: false, jodiOilAvailable: false,
        jodiGasAvailable: false, ieaStocksAvailable: false,
      });
      return ['SET', `energy:spine:v1:${p.c}`, d, 'EX', TTL];
    });
    try { await execPipeline(cmds); ok += batch.length; process.stdout.write(`\r  Wrote ${ok}/${ALL.length}`); }
    catch (err) { console.error(`\n  Batch failed: ${err.message}`); }
  }
  console.log(`\nDone — seeded ${ok} energy profiles`);
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
