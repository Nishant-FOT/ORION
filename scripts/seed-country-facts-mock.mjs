#!/usr/bin/env node
/**
 * Seed mock country facts data to Redis for local dev.
 * Covers major economies so the country intelligence panel always shows data.
 * Usage: node scripts/seed-country-facts-mock.mjs
 */
import { loadEnvFile, getRedisCredentials } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const { url, token } = getRedisCredentials();

const FACTS = [
  { code: 'US', name: 'United States', pop: 331_002_651, capital: 'Washington, D.C.', area: 9_833_520, hos: 'Joe Biden', title: 'President', langs: ['English'], curs: ['United States dollar'], wiki: 'The United States of America is a country primarily located in North America. It consists of 50 states, a federal district, five major unincorporated territories, and nine Minor Outlying Islands.', thumb: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/320px-Flag_of_the_United_States.svg.png' },
  { code: 'CN', name: 'China', pop: 1_439_323_776, capital: 'Beijing', area: 9_596_961, hos: 'Xi Jinping', title: 'President', langs: ['Mandarin Chinese'], curs: ['Renminbi'], wiki: 'China, officially the People\'s Republic of China, is a country in East Asia. It is the world\'s most populous country, with a population exceeding 1.4 billion.', thumb: '' },
  { code: 'JP', name: 'Japan', pop: 126_476_461, capital: 'Tokyo', area: 377_975, hos: 'Naruhito', title: 'Emperor', langs: ['Japanese'], curs: ['Japanese yen'], wiki: 'Japan is an island country in East Asia. It is situated in the northwest Pacific Ocean, and is bordered on the west by the Sea of Japan.', thumb: '' },
  { code: 'DE', name: 'Germany', pop: 83_783_942, capital: 'Berlin', area: 357_022, hos: 'Frank-Walter Steinmeier', title: 'President', langs: ['German'], curs: ['Euro'], wiki: 'Germany is a country in Central Europe. It is the second-most populous country in Europe after Russia, and the most populous member state of the European Union.', thumb: '' },
  { code: 'GB', name: 'United Kingdom', pop: 67_886_011, capital: 'London', area: 242_495, hos: 'Charles III', title: 'King', langs: ['English'], curs: ['Pound sterling'], wiki: 'The United Kingdom of Great Britain and Northern Ireland, commonly known as the United Kingdom or Britain, is a country in Northwestern Europe.', thumb: '' },
  { code: 'IN', name: 'India', pop: 1_380_004_385, capital: 'New Delhi', area: 3_287_263, hos: 'Droupadi Murmu', title: 'President', langs: ['Hindi', 'English'], curs: ['Indian rupee'], wiki: 'India, officially the Republic of India, is a country in South Asia. It is the world\'s most populous country and the seventh-largest country by area.', thumb: '' },
  { code: 'BR', name: 'Brazil', pop: 212_559_417, capital: 'Brasília', area: 8_515_767, hos: 'Luiz Inácio Lula da Silva', title: 'President', langs: ['Portuguese'], curs: ['Brazilian real'], wiki: 'Brazil, officially the Federative Republic of Brazil, is the largest country in both South America and Latin America.', thumb: '' },
  { code: 'FR', name: 'France', pop: 65_273_511, capital: 'Paris', area: 640_679, hos: 'Emmanuel Macron', title: 'President', langs: ['French'], curs: ['Euro'], wiki: 'France, officially the French Republic, is a country located primarily in Western Europe. It includes overseas regions and territories in the Americas and the Atlantic, Pacific and Indian Oceans.', thumb: '' },
  { code: 'KR', name: 'South Korea', pop: 51_269_185, capital: 'Seoul', area: 100_210, hos: 'Yoon Suk-yeol', title: 'President', langs: ['Korean'], curs: ['South Korean won'], wiki: 'South Korea, officially the Republic of Korea, is a country in East Asia. It constitutes the southern half of the Korean Peninsula.', thumb: '' },
  { code: 'AU', name: 'Australia', pop: 25_499_884, capital: 'Canberra', area: 7_692_024, hos: 'Charles III', title: 'King', langs: ['English'], curs: ['Australian dollar'], wiki: 'Australia, officially the Commonwealth of Australia, is a country comprising the mainland of the Australian continent, the island of Tasmania, and numerous smaller islands.', thumb: '' },
  { code: 'CA', name: 'Canada', pop: 37_742_154, capital: 'Ottawa', area: 9_984_670, hos: 'Mark Carney', title: 'Prime Minister', langs: ['English', 'French'], curs: ['Canadian dollar'], wiki: 'Canada is a country in North America. Its ten provinces and three territories extend from the Atlantic Ocean to the Pacific Ocean and northward into the Arctic Ocean.', thumb: '' },
  { code: 'RU', name: 'Russia', pop: 145_934_462, capital: 'Moscow', area: 17_098_242, hos: 'Vladimir Putin', title: 'President', langs: ['Russian'], curs: ['Russian ruble'], wiki: 'Russia, or the Russian Federation, is a transcontinental country spanning Eastern Europe and Northern Asia. It is the world\'s largest country by area.', thumb: '' },
  { code: 'SA', name: 'Saudi Arabia', pop: 34_813_871, capital: 'Riyadh', area: 2_149_690, hos: 'King Salman', title: 'King', langs: ['Arabic'], curs: ['Saudi riyal'], wiki: 'Saudi Arabia, officially the Kingdom of Saudi Arabia, is a country in Western Asia. It covers the bulk of the Arabian Peninsula.', thumb: '' },
  { code: 'AE', name: 'United Arab Emirates', pop: 9_890_402, capital: 'Abu Dhabi', area: 83_600, hos: 'Sheikh Mohamed bin Zayed', title: 'President', langs: ['Arabic'], curs: ['UAE dirham'], wiki: 'The United Arab Emirates, or simply the Emirates, is a country in Western Asia. It is located at the eastern end of the Arabian Peninsula.', thumb: '' },
  { code: 'IL', name: 'Israel', pop: 8_655_535, capital: 'Jerusalem', area: 22_072, hos: 'Isaac Herzog', title: 'President', langs: ['Hebrew', 'Arabic'], curs: ['Israeli new shekel'], wiki: 'Israel, officially the State of Israel, is a country in the Southern Levant region of West Asia.', thumb: '' },
  { code: 'TR', name: 'Turkey', pop: 84_339_067, capital: 'Ankara', area: 783_562, hos: 'Recep Tayyip Erdoğan', title: 'President', langs: ['Turkish'], curs: ['Turkish lira'], wiki: 'Turkey, officially the Republic of Türkiye, is a transcontinental country located mainly on the Anatolian Peninsula in Western Asia.', thumb: '' },
  { code: 'ID', name: 'Indonesia', pop: 273_523_615, capital: 'Jakarta', area: 1_904_569, hos: 'Prabowo Subianto', title: 'President', langs: ['Indonesian'], curs: ['Indonesian rupiah'], wiki: 'Indonesia, officially the Republic of Indonesia, is a transcontinental country in Southeast Asia and Oceania between the Indian and Pacific oceans.', thumb: '' },
  { code: 'MX', name: 'Mexico', pop: 128_932_753, capital: 'Mexico City', area: 1_964_375, hos: 'Claudia Sheinbaum', title: 'President', langs: ['Spanish'], curs: ['Mexican peso'], wiki: 'Mexico, officially the United Mexican States, is a country in the southern portion of North America.', thumb: '' },
  { code: 'ZA', name: 'South Africa', pop: 59_308_690, capital: 'Pretoria', area: 1_221_037, hos: 'Cyril Ramaphosa', title: 'President', langs: ['English', 'Zulu', 'Afrikaans'], curs: ['South African rand'], wiki: 'South Africa, officially the Republic of South Africa, is the southernmost country in Africa.', thumb: '' },
  { code: 'NG', name: 'Nigeria', pop: 206_139_589, capital: 'Abuja', area: 923_768, hos: 'Bola Tinubu', title: 'President', langs: ['English'], curs: ['Nigerian naira'], wiki: 'Nigeria, officially the Federal Republic of Nigeria, is a country in West Africa.', thumb: '' },
  { code: 'PL', name: 'Poland', pop: 37_846_611, capital: 'Warsaw', area: 312_679, hos: 'Andrzej Duda', title: 'President', langs: ['Polish'], curs: ['Polish złoty'], wiki: 'Poland, officially the Republic of Poland, is a country in Central Europe. It is divided into 16 administrative provinces.', thumb: '' },
  { code: 'IT', name: 'Italy', pop: 60_461_826, capital: 'Rome', area: 301_336, hos: 'Sergio Mattarella', title: 'President', langs: ['Italian'], curs: ['Euro'], wiki: 'Italy, officially the Italian Republic, is a country in Southern and Western Europe. It consists of a peninsula that extends into the Mediterranean Sea.', thumb: '' },
  { code: 'ES', name: 'Spain', pop: 46_754_778, capital: 'Madrid', area: 505_992, hos: 'King Felipe VI', title: 'King', langs: ['Spanish'], curs: ['Euro'], wiki: 'Spain, or the Kingdom of Spain, is a country in Southwestern Europe with some territory in the Mediterranean Sea.', thumb: '' },
  { code: 'NL', name: 'Netherlands', pop: 17_134_872, capital: 'Amsterdam', area: 41_543, hos: 'King Willem-Alexander', title: 'King', langs: ['Dutch'], curs: ['Euro'], wiki: 'The Netherlands, informally Holland, is a country in Northwestern Europe with overseas territories in the Caribbean.', thumb: '' },
  { code: 'SE', name: 'Sweden', pop: 10_099_265, capital: 'Stockholm', area: 450_295, hos: 'King Carl XVI Gustaf', title: 'King', langs: ['Swedish'], curs: ['Swedish krona'], wiki: 'Sweden, officially the Kingdom of Sweden, is a Nordic country in Northern Europe.', thumb: '' },
  { code: 'CH', name: 'Switzerland', pop: 8_654_622, capital: 'Bern', area: 41_285, hos: 'Karin Keller-Sutter', title: 'President of the Confederation', langs: ['German', 'French', 'Italian'], curs: ['Swiss franc'], wiki: 'Switzerland, officially the Swiss Confederation, is a landlocked country located at the confluence of Western, Central, and Southern Europe.', thumb: '' },
  { code: 'NO', name: 'Norway', pop: 5_421_241, capital: 'Oslo', area: 323_802, hos: 'King Harald V', title: 'King', langs: ['Norwegian'], curs: ['Norwegian krone'], wiki: 'Norway, officially the Kingdom of Norway, is a Nordic country in Northern Europe whose territory comprises the western and northernmost portion of the Scandinavian Peninsula.', thumb: '' },
  { code: 'UA', name: 'Ukraine', pop: 43_733_762, capital: 'Kyiv', area: 603_500, hos: 'Volodymyr Zelenskyy', title: 'President', langs: ['Ukrainian'], curs: ['Ukrainian hryvnia'], wiki: 'Ukraine is a country in Eastern Europe. It is the second-largest country in Europe by area.', thumb: '' },
  { code: 'PK', name: 'Pakistan', pop: 220_892_340, capital: 'Islamabad', area: 881_913, hos: 'Asif Ali Zardari', title: 'President', langs: ['Urdu', 'English'], curs: ['Pakistani rupee'], wiki: 'Pakistan, officially the Islamic Republic of Pakistan, is a country in South Asia.', thumb: '' },
  { code: 'EG', name: 'Egypt', pop: 102_334_404, capital: 'Cairo', area: 1_002_450, hos: 'Abdel Fattah el-Sisi', title: 'President', langs: ['Arabic'], curs: ['Egyptian pound'], wiki: 'Egypt, officially the Arab Republic of Egypt, is a transcontinental country spanning the northeast corner of Africa and the southwest corner of Asia.', thumb: '' },
  { code: 'PH', name: 'Philippines', pop: 109_581_078, capital: 'Manila', area: 300_000, hos: 'Bongbong Marcos', title: 'President', langs: ['Filipino', 'English'], curs: ['Philippine peso'], wiki: 'The Philippines, officially the Republic of the Philippines, is an archipelagic country in Southeast Asia.', thumb: '' },
  { code: 'SG', name: 'Singapore', pop: 5_850_342, capital: 'Singapore', area: 733, hos: 'Tharman Shanmugaratnam', title: 'President', langs: ['English', 'Malay', 'Mandarin Chinese', 'Tamil'], curs: ['Singapore dollar'], wiki: 'Singapore, officially the Republic of Singapore, is an island country and city-state in Maritime Southeast Asia.', thumb: '' },
  { code: 'TH', name: 'Thailand', pop: 69_799_978, capital: 'Bangkok', area: 513_120, hos: 'King Vajiralongkorn', title: 'King', langs: ['Thai'], curs: ['Thai baht'], wiki: 'Thailand, historically known as Siam and officially the Kingdom of Thailand, is a country in Southeast Asia.', thumb: '' },
  { code: 'VN', name: 'Vietnam', pop: 97_338_579, capital: 'Hanoi', area: 331_212, hos: 'Lương Cường', title: 'President', langs: ['Vietnamese'], curs: ['Vietnamese đồng'], wiki: 'Vietnam, officially the Socialist Republic of Vietnam, is a country in Southeast Asia.', thumb: '' },
  { code: 'MY', name: 'Malaysia', pop: 32_365_999, capital: 'Kuala Lumpur', area: 330_803, hos: 'Sultan Ibrahim', title: 'King', langs: ['Malay'], curs: ['Malaysian ringgit'], wiki: 'Malaysia is a country in Southeast Asia. The federation is divided into two regions within the South China Sea.', thumb: '' },
  { code: 'AR', name: 'Argentina', pop: 45_195_774, capital: 'Buenos Aires', area: 2_780_400, hos: 'Javier Milei', title: 'President', langs: ['Spanish'], curs: ['Argentine peso'], wiki: 'Argentina, officially the Argentine Republic, is a country in the southern half of South America.', thumb: '' },
  { code: 'CO', name: 'Colombia', pop: 50_882_891, capital: 'Bogotá', area: 1_141_748, hos: 'Gustavo Petro', title: 'President', langs: ['Spanish'], curs: ['Colombian peso'], wiki: 'Colombia, officially the Republic of Colombia, is a country in South America.', thumb: '' },
  { code: 'CL', name: 'Chile', pop: 19_116_201, capital: 'Santiago', area: 756_102, hos: 'Gabriel Boric', title: 'President', langs: ['Spanish'], curs: ['Chilean peso'], wiki: 'Chile, officially the Republic of Chile, is a country in western South America.', thumb: '' },
  { code: 'KE', name: 'Kenya', pop: 53_771_296, capital: 'Nairobi', area: 580_367, hos: 'William Ruto', title: 'President', langs: ['Swahili', 'English'], curs: ['Kenyan shilling'], wiki: 'Kenya, officially the Republic of Kenya, is a country in East Africa.', thumb: '' },
  { code: 'ET', name: 'Ethiopia', pop: 114_963_588, capital: 'Addis Ababa', area: 1_104_300, hos: 'Sahle-Work Zewde', title: 'President', langs: ['Amharic'], curs: ['Ethiopian birr'], wiki: 'Ethiopia, officially the Federal Democratic Republic of Ethiopia, is a landlocked country in the Horn of Africa.', thumb: '' },
  { code: 'CZ', name: 'Czech Republic', pop: 10_708_981, capital: 'Prague', area: 78_871, hos: 'Petr Pavel', title: 'President', langs: ['Czech'], curs: ['Czech koruna'], wiki: 'The Czech Republic, or Czechia, is a landlocked country in Central Europe.', thumb: '' },
  { code: 'AT', name: 'Austria', pop: 9_006_398, capital: 'Vienna', area: 83_879, hos: 'Alexander Van der Bellen', title: 'President', langs: ['German'], curs: ['Euro'], wiki: 'Austria, officially the Republic of Austria, is a landlocked country in the eastern part of Central Europe.', thumb: '' },
  { code: 'BE', name: 'Belgium', pop: 11_589_623, capital: 'Brussels', area: 30_528, hos: 'King Philippe', title: 'King', langs: ['Dutch', 'French', 'German'], curs: ['Euro'], wiki: 'Belgium, officially the Kingdom of Belgium, is a country in Northwestern Europe.', thumb: '' },
  { code: 'PT', name: 'Portugal', pop: 10_196_709, capital: 'Lisbon', area: 92_212, hos: 'Marcelo Rebelo de Sousa', title: 'President', langs: ['Portuguese'], curs: ['Euro'], wiki: 'Portugal, officially the Portuguese Republic, is a country on the Iberian Peninsula in Southern Europe.', thumb: '' },
  { code: 'GR', name: 'Greece', pop: 10_423_054, capital: 'Athens', area: 131_957, hos: 'Katerina Sakellaropoulou', title: 'President', langs: ['Greek'], curs: ['Euro'], wiki: 'Greece, officially the Hellenic Republic, is a country in Southeast Europe.', thumb: '' },
  { code: 'RO', name: 'Romania', pop: 19_237_691, capital: 'Bucharest', area: 238_397, hos: 'Klaus Iohannis', title: 'President', langs: ['Romanian'], curs: ['Romanian leu'], wiki: 'Romania is a country in Eastern Europe. It is bordered by Hungary, Serbia, Ukraine, Moldova, and the Black Sea.', thumb: '' },
  { code: 'IQ', name: 'Iraq', pop: 40_222_493, capital: 'Baghdad', area: 438_317, hos: 'Abdul Latif Rashid', title: 'President', langs: ['Arabic', 'Kurdish'], curs: ['Iraqi dinar'], wiki: 'Iraq, officially the Republic of Iraq, is a country in Western Asia.', thumb: '' },
  { code: 'IR', name: 'Iran', pop: 83_992_949, capital: 'Tehran', area: 1_648_195, hos: 'Masoud Pezeshkian', title: 'President', langs: ['Persian'], curs: ['Iranian rial'], wiki: 'Iran, also called Persia, and officially the Islamic Republic of Iran, is a country in Western Asia.', thumb: '' },
];

async function redisSet(key, value, ex) {
  const args = ['SET', key, value];
  if (ex) args.push('EX', String(ex));
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!resp.ok) throw new Error(`SET ${key} failed: HTTP ${resp.status}`);
}

function buildFacts(f) {
  return JSON.stringify({
    headOfState: f.hos,
    headOfStateTitle: f.title,
    wikipediaSummary: f.wiki,
    wikipediaThumbnailUrl: f.thumb,
    population: f.pop,
    capital: f.capital,
    languages: f.langs,
    currencies: f.curs,
    areaSqKm: f.area,
    countryName: f.name,
  });
}

async function main() {
  console.log(`Seeding ${FACTS.length} country facts...`);
  const cmds = FACTS.map(f => redisSet(`intel:country-facts:rc:${f.code}`, buildFacts(f), 86400 * 30));
  await Promise.all(cmds);
  console.log(`Done — seeded ${FACTS.length} country facts`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
