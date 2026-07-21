#!/usr/bin/env node
/**
 * Seed country facts for ALL ~250 countries.
 * No external API dependency — all data hardcoded.
 * Writes to Redis key `intel:country-facts:rc:{ISO2}`.
 * Usage: node scripts/seed-country-facts-all.mjs
 */
import { loadEnvFile, getRedisCredentials, sleep } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const { url, token } = getRedisCredentials();
const TTL = 86400 * 30;
const PIPELINE_BATCH = 50;

const UA = 'ORION/1.0 country-facts-seeder';

const ALL_COUNTRIES = [
  { c:'AD',n:'Andorra',p:77265,cap:'Andorra la Vella',a:468,lang:['Catalan'],cur:['Euro'],hos:'Joan Enric Vives i Sicília',ht:'Bishop of Urgell',w:'Andorra is a microstate on the Iberian Peninsula bordered by France and Spain. It is known for its ski resorts and tax-haven status.' },
  { c:'AE',n:'United Arab Emirates',p:9890402,cap:'Abu Dhabi',a:83600,lang:['Arabic'],cur:['UAE dirham'],hos:'Sheikh Mohamed bin Zayed Al Nahyan',ht:'President',w:'The United Arab Emirates, or simply the Emirates, is a country in Western Asia at the eastern end of the Arabian Peninsula.' },
  { c:'AF',n:'Afghanistan',p:38928346,cap:'Kabul',a:652230,lang:['Pashto','Dari'],cur:['Afghan afghani'],hos:'Hibatullah Akhundzada',ht:'Supreme Leader',w:'Afghanistan is a landlocked country at the crossroads of Central and South Asia.' },
  { c:'AG',n:'Antigua and Barbuda',p:97929,cap:'Saint John\'s',a:442,lang:['English'],cur:['East Caribbean dollar'],hos:'King Charles III',ht:'King',w:'Antigua and Barbuda is a twin-island country in the Caribbean.' },
  { c:'AL',n:'Albania',p:2877797,cap:'Tirana',a:28748,lang:['Albanian'],cur:['Albanian lek'],hos:'Bajram Begaj',ht:'President',w:'Albania is a country in Southeast Europe on the Adriatic and Ionian seas within the Mediterranean.' },
  { c:'AM',n:'Armenia',p:2963243,cap:'Yerevan',a:29743,lang:['Armenian'],cur:['Armenian dram'],hos:'Vahagn Khachaturyan',ht:'President',w:'Armenia is a landlocked country in the Armenian Highlands of Western Asia.' },
  { c:'AO',n:'Angola',p:32866272,cap:'Luanda',a:1246700,lang:['Portuguese'],cur:['Angolan kwanza'],hos:'João Lourenço',ht:'President',w:'Angola is a country on the west coast of Southern Africa.' },
  { c:'AR',n:'Argentina',p:45195774,cap:'Buenos Aires',a:2780400,lang:['Spanish'],cur:['Argentine peso'],hos:'Javier Milei',ht:'President',w:'Argentina is a country in the southern half of South America.' },
  { c:'AT',n:'Austria',p:9006398,cap:'Vienna',a:83879,lang:['German'],cur:['Euro'],hos:'Alexander Van der Bellen',ht:'President',w:'Austria is a landlocked country in the eastern part of Central Europe.' },
  { c:'AU',n:'Australia',p:25499884,cap:'Canberra',a:7692024,lang:['English'],cur:['Australian dollar'],hos:'King Charles III',ht:'King',w:'Australia is a country comprising the mainland of the Australian continent, the island of Tasmania, and numerous smaller islands.' },
  { c:'AZ',n:'Azerbaijan',p:10110116,cap:'Baku',a:86600,lang:['Azerbaijani'],cur:['Azerbaijani manat'],hos:'Ilham Aliyev',ht:'President',w:'Azerbaijan is a country in the South Caucasus region of Eurasia.' },
  { c:'BA',n:'Bosnia and Herzegovina',p:3280822,cap:'Sarajevo',a:51197,lang:['Bosnian','Croatian','Serbian'],cur:['Convertible mark'],hos:'Željko Komšić',ht:'Chairman of the Presidency',w:'Bosnia and Herzegovina is a country in Southeast Europe on the Balkan Peninsula.' },
  { c:'BB',n:'Barbados',p:287375,cap:'Bridgetown',a:430,lang:['English'],cur:['Barbadian dollar'],hos:'Sandra Mason',ht:'President',w:'Barbados is an island country in the Lesser Antilles of the West Indies.' },
  { c:'BD',n:'Bangladesh',p:164689383,cap:'Dhaka',a:147570,lang:['Bengali'],cur:['Bangladeshi taka'],hos:'Mohammed Shahabuddin',ht:'President',w:'Bangladesh is a country in South Asia.' },
  { c:'BE',n:'Belgium',p:11589623,cap:'Brussels',a:30528,lang:['Dutch','French','German'],cur:['Euro'],hos:'King Philippe',ht:'King',w:'Belgium is a country in Northwestern Europe.' },
  { c:'BF',n:'Burkina Faso',p:20903273,cap:'Ouagadougou',a:274222,lang:['French'],cur:['West African CFA franc'],hos:'Ibrahim Traoré',ht:'Interim President',w:'Burkina Faso is a landlocked country in West Africa.' },
  { c:'BG',n:'Bulgaria',p:6948445,cap:'Sofia',a:110879,lang:['Bulgarian'],cur:['Bulgarian lev'],hos:'Rumen Radev',ht:'President',w:'Bulgaria is a country in Southeast Europe on the eastern side of the Balkans.' },
  { c:'BH',n:'Bahrain',p:1701575,cap:'Manama',a:786,lang:['Arabic'],cur:['Bahraini dinar'],hos:'King Hamad bin Isa Al Khalifa',ht:'King',w:'Bahrain is an island country in the Persian Gulf.' },
  { c:'BI',n:'Burundi',p:11890784,cap:'Gitega',a:27834,lang:['Kirundi','French'],cur:['Burundian franc'],hos:'Évariste Ndayishimiye',ht:'President',w:'Burundi is a landlocked country in the Great Rift Valley at the junction of the African Great Lakes region and Southeast Africa.' },
  { c:'BJ',n:'Benin',p:12123200,cap:'Porto-Novo',a:112622,lang:['French'],cur:['West African CFA franc'],hos:'Patrice Talon',ht:'President',w:'Benin is a country in West Africa.' },
  { c:'BN',n:'Brunei',p:437479,cap:'Bandar Seri Begawan',a:5765,lang:['Malay'],cur:['Brunei dollar'],hos:'Sultan Hassanal Bolkiah',ht:'Sultan',w:'Brunei is a country on the north coast of Borneo in Southeast Asia.' },
  { c:'BO',n:'Bolivia',p:11673021,cap:'Sucre',a:1098581,lang:['Spanish','Quechua','Aymara'],cur:['Bolivian boliviano'],hos:'Luis Arce',ht:'President',w:'Bolivia is a landlocked country in central South America.' },
  { c:'BR',n:'Brazil',p:212559417,cap:'Brasília',a:8515767,lang:['Portuguese'],cur:['Brazilian real'],hos:'Luiz Inácio Lula da Silva',ht:'President',w:'Brazil is the largest country in both South America and Latin America.' },
  { c:'BS',n:'Bahamas',p:393244,cap:'Nassau',a:13880,lang:['English'],cur:['Bahamian dollar'],hos:'King Charles III',ht:'King',w:'The Bahamas is a country within the Lucayan Archipelago of the West Indies.' },
  { c:'BT',n:'Bhutan',p:771608,cap:'Thimphu',a:38394,lang:['Dzongkha'],cur:['Ngultrum','Indian rupee'],hos:'King Jigme Khesar Namgyel Wangchuck',ht:'King',w:'Bhutan is a landlocked country in the Eastern Himalayas of South Asia.' },
  { c:'BW',n:'Botswana',p:2351627,cap:'Gaborone',a:581730,lang:['English','Tswana'],cur:['Botswana pula'],hos:'Mokgweetsi Masisi',ht:'President',w:'Botswana is a landlocked country in Southern Africa.' },
  { c:'BY',n:'Belarus',p:9449323,cap:'Minsk',a:207600,lang:['Belarusian','Russian'],cur:['Belarusian ruble'],hos:'Alexander Lukashenko',ht:'President',w:'Belarus is a landlocked country in Eastern Europe.' },
  { c:'BZ',n:'Belize',p:397628,cap:'Belmopan',a:22966,lang:['English','Spanish'],cur:['Belizean dollar'],hos:'King Charles III',ht:'King',w:'Belize is a country on the northeastern coast of Central America.' },
  { c:'CA',n:'Canada',p:37742154,cap:'Ottawa',a:9984670,lang:['English','French'],cur:['Canadian dollar'],hos:'King Charles III',ht:'King',w:'Canada is a country in North America whose ten provinces and three territories extend from the Atlantic to the Pacific and northward into the Arctic Ocean.' },
  { c:'CD',n:'DR Congo',p:89561403,cap:'Kinshasa',a:2344858,lang:['French','Lingala','Swahili','Tshiluba','Kikongo'],cur:['Congolese franc'],hos:'Félix Tshisekedi',ht:'President',w:'The Democratic Republic of the Congo is a country in Central Africa.' },
  { c:'CF',n:'Central African Republic',p:4829767,cap:'Bangui',a:622984,lang:['French','Sango'],cur:['Central African CFA franc'],hos:'Faustin-Archange Touadéra',ht:'President',w:'The Central African Republic is a landlocked country in Central Africa.' },
  { c:'CG',n:'Congo',p:5518087,cap:'Brazzaville',a:342000,lang:['French','Kikongo','Lingala','Moissi'],cur:['Central African CFA franc'],hos:'Denis Sassou Nguesso',ht:'President',w:'The Republic of the Congo is a country in Central Africa.' },
  { c:'CH',n:'Switzerland',p:8654622,cap:'Bern',a:41285,lang:['German','French','Italian','Romansh'],cur:['Swiss franc'],hos:'Karin Keller-Sutter',ht:'President of the Confederation',w:'Switzerland is a landlocked country at the confluence of Western, Central, and Southern Europe.' },
  { c:'CI',n:'Ivory Coast',p:26378274,cap:'Yamoussoukro',a:322463,lang:['French'],cur:['West African CFA franc'],hos:'Alassane Ouattara',ht:'President',w:'Ivory Coast is a country on the southern coast of West Africa.' },
  { c:'CL',n:'Chile',p:19116201,cap:'Santiago',a:756102,lang:['Spanish'],cur:['Chilean peso'],hos:'Gabriel Boric',ht:'President',w:'Chile is a country in western South America.' },
  { c:'CM',n:'Cameroon',p:26545863,cap:'Yaoundé',a:475442,lang:['English','French'],cur:['Central African CFA franc'],hos:'Paul Biya',ht:'President',w:'Cameroon is a country in Central Africa.' },
  { c:'CN',n:'China',p:1439323776,cap:'Beijing',a:9596961,lang:['Mandarin Chinese'],cur:['Renminbi'],hos:'Xi Jinping',ht:'President',w:'China is the world\'s most populous country, located in East Asia.' },
  { c:'CO',n:'Colombia',p:50882891,cap:'Bogotá',a:1141748,lang:['Spanish'],cur:['Colombian peso'],hos:'Gustavo Petro',ht:'President',w:'Colombia is a country in South America.' },
  { c:'CR',n:'Costa Rica',p:5094118,cap:'San José',a:51100,lang:['Spanish'],cur:['Costa Rican colón'],hos:'Rodrigo Chaves Robles',ht:'President',w:'Costa Rica is a country in Central America.' },
  { c:'CU',n:'Cuba',p:11326616,cap:'Havana',a:109884,lang:['Spanish'],cur:['Cuban peso'],hos:'Miguel Díaz-Canel',ht:'President',w:'Cuba is an island country in the Caribbean.' },
  { c:'CV',n:'Cape Verde',p:555987,cap:'Praia',a:4033,lang:['Portuguese'],cur:['Cape Verdean escudo'],hos:'José Maria Neves',ht:'President',w:'Cape Verde is an island country spanning an archipelago in the central Atlantic Ocean.' },
  { c:'CY',n:'Cyprus',p:1207359,cap:'Nicosia',a:9251,lang:['Greek','Turkish'],cur:['Euro'],hos:'Nikos Christodoulides',ht:'President',w:'Cyprus is an island country in the Eastern Mediterranean.' },
  { c:'CZ',n:'Czech Republic',p:10708981,cap:'Prague',a:78871,lang:['Czech'],cur:['Czech koruna'],hos:'Petr Pavel',ht:'President',w:'The Czech Republic is a landlocked country in Central Europe.' },
  { c:'DE',n:'Germany',p:83783942,cap:'Berlin',a:357022,lang:['German'],cur:['Euro'],hos:'Frank-Walter Steinmeier',ht:'President',w:'Germany is a country in Central Europe and the second-most populous country in Europe after Russia.' },
  { c:'DJ',n:'Djibouti',p:988000,cap:'Djibouti',a:23200,lang:['French','Arabic'],cur:['Djiboutian franc'],hos:'Ismaïl Omar Guelleh',ht:'President',w:'Djibouti is a country in the Horn of Africa.' },
  { c:'DK',n:'Denmark',p:5792202,cap:'Copenhagen',a:42933,lang:['Danish'],cur:['Danish krone'],hos:'King Frederik X',ht:'King',w:'Denmark is a Nordic country in Northern Europe.' },
  { c:'DM',n:'Dominica',p:71986,cap:'Roseau',a:751,lang:['English'],cur:['East Caribbean dollar'],hos:'Sylvanie Burton',ht:'President',w:'Dominica is an island country in the Caribbean.' },
  { c:'DO',n:'Dominican Republic',p:10847910,cap:'Santo Domingo',a:48671,lang:['Spanish'],cur:['Dominican peso'],hos:'Luis Abinader',ht:'President',w:'The Dominican Republic is a country on the island of Hispaniola in the Caribbean.' },
  { c:'DZ',n:'Algeria',p:43851044,cap:'Algiers',a:2381741,lang:['Arabic','Tamazight'],cur:['Algerian dinar'],hos:'Abdelmadjid Tebboune',ht:'President',w:'Algeria is a country in the Maghreb region of North Africa.' },
  { c:'EC',n:'Ecuador',p:17643054,cap:'Quito',a:283561,lang:['Spanish'],cur:['US dollar'],hos:'Daniel Noboa',ht:'President',w:'Ecuador is a country in northwestern South America.' },
  { c:'EE',n:'Estonia',p:1331057,cap:'Tallinn',a:45228,lang:['Estonian'],cur:['Euro'],hos:'Alar Karis',ht:'President',w:'Estonia is a country in Northern Europe.' },
  { c:'EG',n:'Egypt',p:102334404,cap:'Cairo',a:1002450,lang:['Arabic'],cur:['Egyptian pound'],hos:'Abdel Fattah el-Sisi',ht:'President',w:'Egypt is a transcontinental country spanning the northeast corner of Africa and southwest corner of Asia.' },
  { c:'ER',n:'Eritrea',p:3546421,cap:'Asmara',a:117600,lang:['Tigrinya','Arabic','English'],cur:['Eritrean nakfa'],hos:'Isaias Afwerki',ht:'President',w:'Eritrea is a country in the Horn of Africa.' },
  { c:'ES',n:'Spain',p:46754778,cap:'Madrid',a:505992,lang:['Spanish'],cur:['Euro'],hos:'King Felipe VI',ht:'King',w:'Spain is a country in Southwestern Europe with territories in the Mediterranean Sea.' },
  { c:'ET',n:'Ethiopia',p:114963588,cap:'Addis Ababa',a:1104300,lang:['Amharic'],cur:['Ethiopian birr'],hos:'Sahle-Work Zewde',ht:'President',w:'Ethiopia is a landlocked country in the Horn of Africa.' },
  { c:'FI',n:'Finland',p:5540720,cap:'Helsinki',a:338424,lang:['Finnish','Swedish'],cur:['Euro'],hos:'Alexander Stubb',ht:'President',w:'Finland is a Nordic country in Northern Europe.' },
  { c:'FJ',n:'Fiji',p:896445,cap:'Suva',a:18274,lang:['English','Fijian','Fiji Hindi'],cur:['Fijian dollar'],hos:'Wiliame Katonivere',ht:'President',w:'Fiji is an island country in Melanesia in the South Pacific Ocean.' },
  { c:'FM',n:'Micronesia',p:115021,cap:'Palikir',a:702,lang:['English'],cur:['US dollar'],hos:'Wesley Simina',ht:'President',w:'The Federated States of Micronesia is an island country in the western Pacific Ocean.' },
  { c:'FR',n:'France',p:65273511,cap:'Paris',a:640679,lang:['French'],cur:['Euro'],hos:'Emmanuel Macron',ht:'President',w:'France is a country located primarily in Western Europe.' },
  { c:'GA',n:'Gabon',p:2225734,cap:'Libreville',a:267668,lang:['French'],cur:['Central African CFA franc'],hos:'Brice Oligui Nguema',ht:'Transitional President',w:'Gabon is a country on the west coast of Central Africa.' },
  { c:'GB',n:'United Kingdom',p:67886011,cap:'London',a:242495,lang:['English'],cur:['Pound sterling'],hos:'King Charles III',ht:'King',w:'The United Kingdom is a country in Northwestern Europe.' },
  { c:'GD',n:'Grenada',p:112523,cap:'Saint George\'s',a:344,lang:['English'],cur:['East Caribbean dollar'],hos:'King Charles III',ht:'King',w:'Grenada is a country in the Caribbean.' },
  { c:'GE',n:'Georgia',p:3714000,cap:'Tbilisi',a:69700,lang:['Georgian'],cur:['Georgian lari'],hos:'Mikheil Kavelashvili',ht:'President',w:'Georgia is a transcontinental country at the intersection of Eastern Europe and Western Asia.' },
  { c:'GH',n:'Ghana',p:31072940,cap:'Accra',a:238533,lang:['English'],cur:['Ghanaian cedi'],hos:'Nana Akufo-Addo',ht:'President',w:'Ghana is a country in West Africa.' },
  { c:'GM',n:'Gambia',p:2416667,cap:'Banjul',a:11295,lang:['English'],cur:['Gambian dalasi'],hos:'Adama Barrow',ht:'President',w:'The Gambia is a country in West Africa.' },
  { c:'GN',n:'Guinea',p:13132795,cap:'Conakry',a:245857,lang:['French'],cur:['Guinean franc'],hos:'Mamady Doumbouya',ht:'Interim President',w:'Guinea is a west coastal country in West Africa.' },
  { c:'GQ',n:'Equatorial Guinea',p:1402985,cap:'Malabo',a:28051,lang:['Spanish','French','Portuguese'],cur:['Central African CFA franc'],hos:'Teodoro Obiang Nguema Mbasogo',ht:'President',w:'Equatorial Guinea is a country on the west coast of Central Africa.' },
  { c:'GR',n:'Greece',p:10423054,cap:'Athens',a:131957,lang:['Greek'],cur:['Euro'],hos:'Katerina Sakellaropoulou',ht:'President',w:'Greece is a country in Southeast Europe.' },
  { c:'GT',n:'Guatemala',p:17915568,cap:'Guatemala City',a:108889,lang:['Spanish'],cur:['Guatemalan quetzal'],hos:'Bernardo Arévalo',ht:'President',w:'Guatemala is a country in Central America.' },
  { c:'GW',n:'Guinea-Bissau',p:1968001,cap:'Bissau',a:36125,lang:['Portuguese'],cur:['West African CFA franc'],hos:'Umaro Sissoco Embaló',ht:'President',w:'Guinea-Bissau is a country on the coast of West Africa.' },
  { c:'GY',n:'Guyana',p:786552,cap:'Georgetown',a:214969,lang:['English'],cur:['Guyanese dollar'],hos:'Irfaan Ali',ht:'President',w:'Guyana is a country on the northern mainland of South America.' },
  { c:'HN',n:'Honduras',p:9904607,cap:'Tegucigalpa',a:112492,lang:['Spanish'],cur:['Honduran lempira'],hos:'Xiomara Castro',ht:'President',w:'Honduras is a country in Central America.' },
  { c:'HR',n:'Croatia',p:4105267,cap:'Zagreb',a:56594,lang:['Croatian'],cur:['Euro'],hos:'Zoran Milanović',ht:'President',w:'Croatia is a country at the crossroads of Central and Southeast Europe.' },
  { c:'HT',n:'Haiti',p:11402528,cap:'Port-au-Prince',a:27750,lang:['French','Haitian Creole'],cur:['Haitian gourde'],hos:'Transitional Presidential Council',ht:'Council',w:'Haiti is a country on the island of Hispaniola in the Caribbean.' },
  { c:'HU',n:'Hungary',p:9660351,cap:'Budapest',a:93028,lang:['Hungarian'],cur:['Hungarian forint'],hos:'Tamás Sulyok',ht:'President',w:'Hungary is a landlocked country in Central Europe.' },
  { c:'ID',n:'Indonesia',p:273523615,cap:'Jakarta',a:1904569,lang:['Indonesian'],cur:['Indonesian rupiah'],hos:'Prabowo Subianto',ht:'President',w:'Indonesia is a transcontinental country in Southeast Asia and Oceania.' },
  { c:'IE',n:'Ireland',p:4937786,cap:'Dublin',a:70273,lang:['Irish','English'],cur:['Euro'],hos:'Michael D. Higgins',ht:'President',w:'Ireland is a country in Northwestern Europe.' },
  { c:'IL',n:'Israel',p:8655535,cap:'Jerusalem',a:22072,lang:['Hebrew','Arabic'],cur:['Israeli new shekel'],hos:'Isaac Herzog',ht:'President',w:'Israel is a country in the Southern Levant region of West Asia.' },
  { c:'IN',n:'India',p:1380004385,cap:'New Delhi',a:3287263,lang:['Hindi','English'],cur:['Indian rupee'],hos:'Droupadi Murmu',ht:'President',w:'India is the world\'s most populous country and the seventh-largest country by area.' },
  { c:'IQ',n:'Iraq',p:40222493,cap:'Baghdad',a:438317,lang:['Arabic','Kurdish'],cur:['Iraqi dinar'],hos:'Abdul Latif Rashid',ht:'President',w:'Iraq is a country in Western Asia.' },
  { c:'IR',n:'Iran',p:83992949,cap:'Tehran',a:1648195,lang:['Persian'],cur:['Iranian rial'],hos:'Masoud Pezeshkian',ht:'President',w:'Iran is a country in Western Asia, also known as Persia.' },
  { c:'IS',n:'Iceland',p:366425,cap:'Reykjavik',a:103000,lang:['Icelandic'],cur:['Icelandic króna'],hos:'Hallur Tómassson',ht:'President',w:'Iceland is a Nordic island country in the North Atlantic Ocean.' },
  { c:'IT',n:'Italy',p:60461826,cap:'Rome',a:301336,lang:['Italian'],cur:['Euro'],hos:'Sergio Mattarella',ht:'President',w:'Italy is a country in Southern and Western Europe.' },
  { c:'JM',n:'Jamaica',p:2961167,cap:'Kingston',a:10991,lang:['English'],cur:['Jamaican dollar'],hos:'King Charles III',ht:'King',w:'Jamaica is an island country in the Caribbean Sea.' },
  { c:'JO',n:'Jordan',p:10203134,cap:'Amman',a:89342,lang:['Arabic'],cur:['Jordanian dinar'],hos:'King Abdullah II',ht:'King',w:'Jordan is a country in the Levant region of Western Asia.' },
  { c:'JP',n:'Japan',p:126476461,cap:'Tokyo',a:377975,lang:['Japanese'],cur:['Japanese yen'],hos:'Emperor Naruhito',ht:'Emperor',w:'Japan is an island country in East Asia.' },
  { c:'KE',n:'Kenya',p:53771296,cap:'Nairobi',a:580367,lang:['English','Swahili'],cur:['Kenyan shilling'],hos:'William Ruto',ht:'President',w:'Kenya is a country in East Africa.' },
  { c:'KG',n:'Kyrgyzstan',p:6591600,cap:'Bishkek',a:199951,lang:['Kyrgyz','Russian'],cur:['Kyrgyzstani som'],hos:'Sadyr Japarov',ht:'President',w:'Kyrgyzstan is a landlocked country in Central Asia.' },
  { c:'KH',n:'Cambodia',p:16718965,cap:'Phnom Penh',a:181035,lang:['Khmer'],cur:['Cambodian riel','US dollar'],hos:'King Norodom Sihamoni',ht:'King',w:'Cambodia is a country in Southeast Asia.' },
  { c:'KI',n:'Kiribati',p:119449,cap:'Tarawa',a:811,lang:['English','Gilbertese'],cur:['Australian dollar'],hos:'Taneti Maamau',ht:'President',w:'Kiribati is an island country in the central Pacific Ocean.' },
  { c:'KM',n:'Comoros',p:869601,cap:'Moroni',a:2235,lang:['Arabic','Comorian','French'],cur:['Comorian franc'],hos:'Azali Assoumani',ht:'President',w:'Comoros is an archipelago country in the Indian Ocean.' },
  { c:'KN',n:'Saint Kitts and Nevis',p:53199,cap:'Basseterre',a:261,lang:['English'],cur:['East Caribbean dollar'],hos:'King Charles III',ht:'King',w:'Saint Kitts and Nevis is a dual-island nation in the Caribbean.' },
  { c:'KP',n:'North Korea',p:25778816,cap:'Pyongyang',a:120538,lang:['Korean'],cur:['North Korean won'],hos:'Kim Jong-un',ht:'Supreme Leader',w:'North Korea is a country in East Asia constituting the northern half of the Korean Peninsula.' },
  { c:'KR',n:'South Korea',p:51269185,cap:'Seoul',a:100210,lang:['Korean'],cur:['South Korean won'],hos:'Yoon Suk-yeol',ht:'President',w:'South Korea is a country in East Asia constituting the southern half of the Korean Peninsula.' },
  { c:'KW',n:'Kuwait',p:4270571,cap:'Kuwait City',a:17818,lang:['Arabic'],cur:['Kuwaiti dinar'],hos:'Mishal Al-Ahmad Al-Jaber Al-Sabah',ht:'Emir',w:'Kuwait is a country in Western Asia.' },
  { c:'KZ',n:'Kazakhstan',p:18776707,cap:'Astana',a:2724900,lang:['Kazakh','Russian'],cur:['Tenge'],hos:'Kassym-Jomart Tokayev',ht:'President',w:'Kazakhstan is the world\'s largest landlocked country in Central Asia.' },
  { c:'LA',n:'Laos',p:7275560,cap:'Vientiane',a:236800,lang:['Lao'],cur:['Lao kip'],hos:'Thongloun Sisoulith',ht:'President',w:'Laos is a landlocked country in Southeast Asia.' },
  { c:'LB',n:'Lebanon',p:6825445,cap:'Beirut',a:10400,lang:['Arabic'],cur:['Lebanese pound'],hos:'Joseph Aoun',ht:'President',w:'Lebanon is a country in Western Asia.' },
  { c:'LC',n:'Saint Lucia',p:183627,cap:'Castries',a:616,lang:['English'],cur:['East Caribbean dollar'],hos:'King Charles III',ht:'King',w:'Saint Lucia is an island country in the Caribbean.' },
  { c:'LI',n:'Liechtenstein',p:38128,cap:'Vaduz',a:160,lang:['German'],cur:['Swiss franc'],hos:'Hans-Adam II',ht:'Prince',w:'Liechtenstein is a doubly landlocked alpine country in Central Europe.' },
  { c:'LK',n:'Sri Lanka',p:21413249,cap:'Sri Jayawardenepura Kotte',a:65610,lang:['Sinhala','Tamil'],cur:['Sri Lankan rupee'],hos:'Anura Kumara Dissanayake',ht:'President',w:'Sri Lanka is an island country in South Asia.' },
  { c:'LR',n:'Liberia',p:5057681,cap:'Monrovia',a:111369,lang:['English'],cur:['Liberian dollar'],hos:'George Weah',ht:'President',w:'Liberia is a country in West Africa.' },
  { c:'LS',n:'Lesotho',p:2142249,cap:'Maseru',a:30355,lang:['English','Sesotho'],cur:['Lesotho loti','South African rand'],hos:'King Letsie III',ht:'King',w:'Lesotho is a landlocked country enclaved within South Africa.' },
  { c:'LT',n:'Lithuania',p:2722289,cap:'Vilnius',a:65300,lang:['Lithuanian'],cur:['Euro'],hos:'Gitanas Nausėda',ht:'President',w:'Lithuania is a country in Northern Europe.' },
  { c:'LU',n:'Luxembourg',p:625978,cap:'Luxembourg',a:2586,lang:['Luxembourgish','French','German'],cur:['Euro'],hos:'Grand Duke Henri',ht:'Grand Duke',w:'Luxembourg is a small landlocked country in Western Europe.' },
  { c:'LV',n:'Latvia',p:1901548,cap:'Riga',a:64589,lang:['Latvian'],cur:['Euro'],hos:'Edgars Rinkēvičs',ht:'President',w:'Latvia is a country in the Baltic region of Northern Europe.' },
  { c:'LY',n:'Libya',p:6871292,cap:'Tripoli',a:1759540,lang:['Arabic'],cur:['Libyan dinar'],hos:'Mohamed al-Menfi',ht:'Presidential Council Chairman',w:'Libya is a country in the Maghreb region of North Africa.' },
  { c:'MA',n:'Morocco',p:36910560,cap:'Rabat',a:446550,lang:['Arabic','Tamazight'],cur:['Moroccan dirham'],hos:'King Mohammed VI',ht:'King',w:'Morocco is a country in the Maghreb region of North Africa.' },
  { c:'MC',n:'Monaco',p:39244,cap:'Monaco',a:2,lang:['French'],cur:['Euro'],hos:'Prince Albert II',ht:'Prince',w:'Monaco is a city-state on the French Riviera.' },
  { c:'MD',n:'Moldova',p:2617820,cap:'Chișinău',a:33846,lang:['Romanian'],cur:['Moldovan leu'],hos:'Maia Sandu',ht:'President',w:'Moldova is a landlocked country in Eastern Europe.' },
  { c:'ME',n:'Montenegro',p:621873,cap:'Podgorica',a:13812,lang:['Montenegrin'],cur:['Euro'],hos:'Jakov Milatović',ht:'President',w:'Montenegro is a country in Southeast Europe on the Balkan Peninsula.' },
  { c:'MG',n:'Madagascar',p:27691018,cap:'Antananarivo',a:587041,lang:['Malagasy','French'],cur:['Malagasy ariary'],hos:'Andry Rajoelina',ht:'President',w:'Madagascar is an island country in the Indian Ocean off the coast of East Africa.' },
  { c:'MK',n:'North Macedonia',p:2083374,cap:'Skopje',a:25713,lang:['Macedonian'],cur:['Macedonian denar'],hos:'Gordana Siljanovska-Davkova',ht:'President',w:'North Macedonia is a country in the Balkan Peninsula in Southeast Europe.' },
  { c:'ML',n:'Mali',p:20250833,cap:'Bamako',a:1240192,lang:['French'],cur:['West African CFA franc'],hos:'Assimi Goïta',ht:'Interim President',w:'Mali is a landlocked country in West Africa.' },
  { c:'MM',n:'Myanmar',p:54409800,cap:'Naypyidaw',a:676578,lang:['Burmese'],cur:['Myanmar kyat'],hos:'Min Aung Hlaing',ht:'Prime Minister',w:'Myanmar is a country in Southeast Asia.' },
  { c:'MN',n:'Mongolia',p:3278290,cap:'Ulaanbaatar',a:1564116,lang:['Mongolian'],cur:['Tugrik'],hos:'Ukhnaagiin Khürelsükh',ht:'President',w:'Mongolia is a landlocked country in East Asia.' },
  { c:'MR',n:'Mauritania',p:4649658,cap:'Nouakchott',a:1030700,lang:['Arabic'],cur:['Ouguiya'],hos:'Mohamed Ould Ghazouani',ht:'President',w:'Mauritania is a country in Northwest Africa.' },
  { c:'MT',n:'Malta',p:441543,cap:'Valletta',a:316,lang:['Maltese','English'],cur:['Euro'],hos:'George Vella',ht:'President',w:'Malta is an island country in the Mediterranean Sea.' },
  { c:'MU',n:'Mauritius',p:1271768,cap:'Port Louis',a:2040,lang:['English'],cur:['Mauritian rupee'],hos:'Prithvirajsing Roopun',ht:'President',w:'Mauritius is an island country in the Indian Ocean.' },
  { c:'MV',n:'Maldives',p:540544,cap:'Malé',a:300,lang:['Dhivehi'],cur:['Maldivian rufiyaa'],hos:'Mohamed Muizzu',ht:'President',w:'The Maldives is a tropical nation in the Indian Ocean composed of 26 ring-shaped atolls.' },
  { c:'MW',n:'Malawi',p:19129952,cap:'Lilongwe',a:118484,lang:['English','Chichewa'],cur:['Malawian kwacha'],hos:'Lazarus Chakwera',ht:'President',w:'Malawi is a landlocked country in Southeast Africa.' },
  { c:'MX',n:'Mexico',p:128932753,cap:'Mexico City',a:1964375,lang:['Spanish'],cur:['Mexican peso'],hos:'Claudia Sheinbaum',ht:'President',w:'Mexico is a country in the southern portion of North America.' },
  { c:'MY',n:'Malaysia',p:32365999,cap:'Kuala Lumpur',a:330803,lang:['Malay'],cur:['Malaysian ringgit'],hos:'Sultan Ibrahim',ht:'King',w:'Malaysia is a country in Southeast Asia.' },
  { c:'MZ',n:'Mozambique',p:31255435,cap:'Maputo',a:801590,lang:['Portuguese'],cur:['Mozambican metical'],hos:'Daniel Chapo',ht:'President',w:'Mozambique is a country in Southeast Africa.' },
  { c:'NA',n:'Namibia',p:2540905,cap:'Windhoek',a:825615,lang:['English'],cur:['Namibian dollar','South African rand'],hos:'Nangolo Mbumba',ht:'President',w:'Namibia is a country in Southern Africa.' },
  { c:'NE',n:'Niger',p:24206644,cap:'Niamey',a:1267000,lang:['French'],cur:['West African CFA franc'],hos:'Abdourahamane Tiani',ht:'Head of State',w:'Niger is a landlocked country in West Africa.' },
  { c:'NG',n:'Nigeria',p:206139589,cap:'Abuja',a:923768,lang:['English'],cur:['Nigerian naira'],hos:'Bola Tinubu',ht:'President',w:'Nigeria is a country in West Africa.' },
  { c:'NI',n:'Nicaragua',p:6624554,cap:'Managua',a:130373,lang:['Spanish'],cur:['Nicaraguan córdoba'],hos:'Daniel Ortega',ht:'President',w:'Nicaragua is the largest country in the Central American isthmus.' },
  { c:'NL',n:'Netherlands',p:17134872,cap:'Amsterdam',a:41543,lang:['Dutch'],cur:['Euro'],hos:'King Willem-Alexander',ht:'King',w:'The Netherlands is a country in Northwestern Europe.' },
  { c:'NO',n:'Norway',p:5421241,cap:'Oslo',a:323802,lang:['Norwegian'],cur:['Norwegian krone'],hos:'King Harald V',ht:'King',w:'Norway is a Nordic country in Northern Europe.' },
  { c:'NP',n:'Nepal',p:29136808,c:'Kathmandu',cap:'Kathmandu',a:147181,lang:['Nepali'],cur:['Nepalese rupee'],hos:'Ram Chandra Paudel',ht:'President',w:'Nepal is a landlocked country in South Asia.' },
  { c:'NR',n:'Nauru',p:10824,cap:'Yaren',a:21,lang:['Nauruan','English'],cur:['Australian dollar'],hos:'David Adeang',ht:'President',w:'Nauru is a tiny island country in Micronesia in the Central Pacific.' },
  { c:'NZ',n:'New Zealand',p:5084300,cap:'Wellington',a:268021,lang:['English','Māori'],cur:['New Zealand dollar'],hos:'King Charles III',ht:'King',w:'New Zealand is an island country in the southwestern Pacific Ocean.' },
  { c:'OM',n:'Oman',p:5106626,cap:'Muscat',a:309500,lang:['Arabic'],cur:['Omani rial'],hos:'Sultan Haitham bin Tariq',ht:'Sultan',w:'Oman is a country on the southeastern coast of the Arabian Peninsula.' },
  { c:'PA',n:'Panama',p:4314767,cap:'Panama City',a:75417,lang:['Spanish'],cur:['US dollar','Panamanian balboa'],hos:'José Raúl Mulino',ht:'President',w:'Panama is a country on the isthmus linking Central and South America.' },
  { c:'PE',n:'Peru',p:32971854,cap:'Lima',a:1285216,lang:['Spanish','Quechua'],cur:['Peruvian sol'],hos:'Dina Boluarte',ht:'President',w:'Peru is a country in western South America.' },
  { c:'PG',n:'Papua New Guinea',p:8947024,cap:'Port Moresby',a:462840,lang:['English','Tok Pisin','Hiri Motu'],cur:['Papua New Guinean kina'],hos:'King Charles III',ht:'King',w:'Papua New Guinea is a country in Oceania.' },
  { c:'PH',n:'Philippines',p:109581078,cap:'Manila',a:300000,lang:['Filipino','English'],cur:['Philippine peso'],hos:'Bongbong Marcos',ht:'President',w:'The Philippines is an archipelagic country in Southeast Asia.' },
  { c:'PK',n:'Pakistan',p:220892340,cap:'Islamabad',a:881913,lang:['Urdu','English'],cur:['Pakistani rupee'],hos:'Asif Ali Zardari',ht:'President',w:'Pakistan is a country in South Asia.' },
  { c:'PL',n:'Poland',p:37846611,cap:'Warsaw',a:312679,lang:['Polish'],cur:['Polish złoty'],hos:'Andrzej Duda',ht:'President',w:'Poland is a country in Central Europe.' },
  { c:'PT',n:'Portugal',p:10196709,cap:'Lisbon',a:92212,lang:['Portuguese'],cur:['Euro'],hos:'Marcelo Rebelo de Sousa',ht:'President',w:'Portugal is a country on the Iberian Peninsula in Southern Europe.' },
  { c:'PW',n:'Palau',p:18058,cap:'Ngerulmud',a:459,lang:['Palauan','English'],cur:['US dollar'],hos:'Surangel Whipps Jr.',ht:'President',w:'Palau is an island country in the western Pacific Ocean.' },
  { c:'PY',n:'Paraguay',p:7132538,cap:'Asunción',a:406752,lang:['Spanish','Guaraní'],cur:['Paraguayan guaraní'],hos:'Santiago Peña',ht:'President',w:'Paraguay is a country in South America.' },
  { c:'QA',n:'Qatar',p:2881053,cap:'Doha',a:11586,lang:['Arabic'],cur:['Qatari riyal'],hos:'Tamim bin Hamad Al Thani',ht:'Emir',w:'Qatar is a country in Western Asia on the northeastern coast of the Arabian Peninsula.' },
  { c:'RO',n:'Romania',p:19237691,cap:'Bucharest',a:238397,lang:['Romanian'],cur:['Romanian leu'],hos:'Klaus Iohannis',ht:'President',w:'Romania is a country in Eastern Europe.' },
  { c:'RS',n:'Serbia',p:6908227,cap:'Belgrade',a:88361,lang:['Serbian'],cur:['Serbian dinar'],hos:'Aleksandar Vučić',ht:'President',w:'Serbia is a landlocked country in Southeast Europe.' },
  { c:'RU',n:'Russia',p:145934462,cap:'Moscow',a:17098242,lang:['Russian'],cur:['Russian ruble'],hos:'Vladimir Putin',ht:'President',w:'Russia is the world\'s largest country by area, spanning Eastern Europe and Northern Asia.' },
  { c:'RW',n:'Rwanda',p:12952218,cap:'Kigali',a:26338,lang:['Kinyarwanda','English','French','Swahili'],cur:['Rwandan franc'],hos:'Paul Kagame',ht:'President',w:'Rwanda is a country in East Africa.' },
  { c:'SA',n:'Saudi Arabia',p:34813871,cap:'Riyadh',a:2149690,lang:['Arabic'],cur:['Saudi riyal'],hos:'King Salman',ht:'King',w:'Saudi Arabia is a country in Western Asia comprising most of the Arabian Peninsula.' },
  { c:'SB',n:'Solomon Islands',p:686884,cap:'Honiara',a:28896,lang:['English'],cur:['Solomon Islands dollar'],hos:'King Charles III',ht:'King',w:'The Solomon Islands is a country in Oceania.' },
  { c:'SC',n:'Seychelles',p:98347,cap:'Victoria',a:455,lang:['Seychellois Creole','English','French'],cur:['Seychellois rupee'],hos:'Wavel Ramkalawan',ht:'President',w:'Seychelles is an archipelagic island country in the Indian Ocean.' },
  { c:'SD',n:'Sudan',p:43849260,cap:'Khartoum',a:1886068,lang:['Arabic','English'],cur:['Sudanese pound'],hos:'Abdel Fattah al-Burhan',ht:'Chairman of the Sovereignty Council',w:'Sudan is a country in Northeast Africa.' },
  { c:'SE',n:'Sweden',p:10099265,cap:'Stockholm',a:450295,lang:['Swedish'],cur:['Swedish krona'],hos:'King Carl XVI Gustaf',ht:'King',w:'Sweden is a Nordic country in Northern Europe.' },
  { c:'SG',n:'Singapore',p:5850342,cap:'Singapore',a:733,lang:['English','Malay','Mandarin Chinese','Tamil'],cur:['Singapore dollar'],hos:'Tharman Shanmugaratnam',ht:'President',w:'Singapore is an island country and city-state in Maritime Southeast Asia.' },
  { c:'SI',n:'Slovenia',p:2119675,cap:'Ljubljana',a:20273,lang:['Slovenian'],cur:['Euro'],hos:'Nataša Pirc Musar',ht:'President',w:'Slovenia is a country in Central Europe.' },
  { c:'SK',n:'Slovakia',p:5459642,cap:'Bratislava',a:49035,lang:['Slovak'],cur:['Euro'],hos:'Peter Pellegrini',ht:'President',w:'Slovakia is a landlocked country in Central Europe.' },
  { c:'SL',n:'Sierra Leone',p:7976983,cap:'Freetown',a:71740,lang:['English'],cur:['Sierra Leonean leone'],hos:'Julius Maada Bio',ht:'President',w:'Sierra Leone is a country on the southwest coast of West Africa.' },
  { c:'SM',n:'San Marino',p:33931,cap:'San Marino',a:61,lang:['Italian'],cur:['Euro'],hos:'Francesca Civerchia',ht:'Captain Regent',w:'San Marino is a microstate surrounded by Italy.' },
  { c:'SN',n:'Senegal',p:16743927,cap:'Dakar',a:196722,lang:['French'],cur:['West African CFA franc'],hos:'Bassirou Diomaye Faye',ht:'President',w:'Senegal is a country in West Africa.' },
  { c:'SO',n:'Somalia',p:15893222,cap:'Mogadishu',a:637657,lang:['Somali','Arabic'],cur:['Somali shilling'],hos:'Hassan Sheikh Mohamud',ht:'President',w:'Somalia is a country in the Horn of Africa.' },
  { c:'SR',n:'Suriname',p:586632,cap:'Paramaribo',a:163820,lang:['Dutch'],cur:['Surinamese dollar'],hos:'Chan Santokhi',ht:'President',w:'Suriname is a country on the northeastern coast of South America.' },
  { c:'SS',n:'South Sudan',p:11193725,cap:'Juba',a:619745,lang:['English'],cur:['South Sudanese pound'],hos:'Salva Kiir Mayardit',ht:'President',w:'South Sudan is a landlocked country in East-Central Africa.' },
  { c:'ST',n:'São Tomé and Príncipe',p:219159,cap:'São Tomé',a:964,lang:['Portuguese'],cur:['Dobra'],hos:'Carlos Vila Nova',ht:'President',w:'São Tomé and Príncipe is an island country in the Gulf of Guinea.' },
  { c:'SV',n:'El Salvador',p:6486205,cap:'San Salvador',a:21041,lang:['Spanish'],cur:['US dollar'],hos:'Nayib Bukele',ht:'President',w:'El Salvador is a country in Central America.' },
  { c:'SY',n:'Syria',p:17500658,cap:'Damascus',a:185180,lang:['Arabic'],cur:['Syrian pound'],hos:'Ahmed al-Sharaa',ht:'President',w:'Syria is a country in Western Asia.' },
  { c:'SZ',n:'Eswatini',p:1160164,cap:'Mbabane',a:17364,lang:['English','Swazi'],cur:['Lilangeni'],hos:'King Mswati III',ht:'King',w:'Eswatini is a landlocked country in Southern Africa.' },
  { c:'TD',n:'Chad',p:16425864,cap:'N\'Djamena',a:1284000,lang:['French','Arabic'],cur:['Central African CFA franc'],hos:'Mahamat Idriss Déby',ht:'President',w:'Chad is a landlocked country in north-central Africa.' },
  { c:'TG',n:'Togo',p:8278724,cap:'Lomé',a:56785,lang:['French'],cur:['West African CFA franc'],hos:'Faure Gnassingbé',ht:'President',w:'Togo is a country in West Africa.' },
  { c:'TH',n:'Thailand',p:69799978,cap:'Bangkok',a:513120,lang:['Thai'],cur:['Thai baht'],hos:'King Vajiralongkorn',ht:'King',w:'Thailand is a country in Southeast Asia.' },
  { c:'TJ',n:'Tajikistan',p:9537645,cap:'Dushanbe',a:143100,lang:['Tajik'],cur:['Somoni'],hos:'Emomali Rahmon',ht:'President',w:'Tajikistan is a landlocked country in Central Asia.' },
  { c:'TL',n:'Timor-Leste',p:1318445,cap:'Dili',a:14874,lang:['Portuguese','Tetum'],cur:['US dollar'],hos:'José Ramos-Horta',ht:'President',w:'Timor-Leste is a country in Southeast Asia.' },
  { c:'TM',n:'Turkmenistan',p:6031200,cap:'Ashgabat',a:488100,lang:['Turkmen'],cur:['Turkmen manat'],hos:'Serdar Berdimuhamedow',ht:'President',w:'Turkmenistan is a country in Central Asia.' },
  { c:'TN',n:'Tunisia',p:11818619,cap:'Tunis',a:163610,lang:['Arabic'],cur:['Tunisian dinar'],hos:'Kais Saied',ht:'President',w:'Tunisia is a country in the Maghreb region of North Africa.' },
  { c:'TO',n:'Tonga',p:105695,cap:'Nuku\'alofa',a:747,lang:['Tongan','English'],cur:['Tongan paʻanga'],hos:'King Tupou VI',ht:'King',w:'Tonga is a Polynesian kingdom of more than 170 South Pacific islands.' },
  { c:'TR',n:'Turkey',p:84339067,cap:'Ankara',a:783562,lang:['Turkish'],cur:['Turkish lira'],hos:'Recep Tayyip Erdoğan',ht:'President',w:'Turkey is a transcontinental country mainly on the Anatolian Peninsula in Western Asia.' },
  { c:'TT',n:'Trinidad and Tobago',p:1399488,cap:'Port of Spain',a:5130,lang:['English'],cur:['Trinidad and Tobago dollar'],hos:'Christine Kangaloo',ht:'President',w:'Trinidad and Tobago is a country in the Caribbean.' },
  { c:'TV',n:'Tuvalu',p:11792,cap:'Funafuti',a:26,lang:['Tuvaluan','English'],cur:['Australian dollar'],hos:'King Charles III',ht:'King',w:'Tuvalu is a Polynesian island country in the Pacific Ocean.' },
  { c:'TW',n:'Taiwan',p:23816775,cap:'Taipei',a:36193,lang:['Mandarin Chinese'],cur:['New Taiwan dollar'],hos:'Lai Ching-te',ht:'President',w:'Taiwan is an island country in East Asia.' },
  { c:'TZ',n:'Tanzania',p:59734218,cap:'Dodoma',a:945087,lang:['Swahili','English'],cur:['Tanzanian shilling'],hos:'Samia Suluhu Hassan',ht:'President',w:'Tanzania is a country in East Africa.' },
  { c:'UA',n:'Ukraine',p:43733762,cap:'Kyiv',a:603500,lang:['Ukrainian'],cur:['Ukrainian hryvnia'],hos:'Volodymyr Zelenskyy',ht:'President',w:'Ukraine is the second-largest country in Europe by area.' },
  { c:'UG',n:'Uganda',p:45741007,cap:'Kampala',a:241038,lang:['English','Swahili'],cur:['Ugandan shilling'],hos:'Yoweri Museveni',ht:'President',w:'Uganda is a landlocked country in East Africa.' },
  { c:'US',n:'United States',p:331002651,cap:'Washington, D.C.',a:9833520,lang:['English'],cur:['US dollar'],hos:'Joe Biden',ht:'President',w:'The United States is a country primarily located in North America, consisting of 50 states, a federal district, and territories.' },
  { c:'UY',n:'Uruguay',p:3473730,cap:'Montevideo',a:176215,lang:['Spanish'],cur:['Uruguayan peso'],hos:'Luis Lacalle Pou',ht:'President',w:'Uruguay is a country in South America.' },
  { c:'UZ',n:'Uzbekistan',p:33469203,cap:'Tashkent',a:448978,lang:['Uzbek'],cur:['Uzbekistani som'],hos:'Shavkat Mirziyoyev',ht:'President',w:'Uzbekistan is a landlocked country in Central Asia.' },
  { c:'VA',n:'Vatican City',p:800,cap:'Vatican City',a:0.44,lang:['Italian','Latin'],cur:['Euro'],hos:'Pope Francis',ht:'Sovereign Pontiff',w:'Vatican City is the smallest country in the world, an independent city-state enclaved within Rome.' },
  { c:'VC',n:'Saint Vincent and the Grenadines',p:110940,cap:'Kingstown',a:389,lang:['English'],cur:['East Caribbean dollar'],hos:'King Charles III',ht:'King',w:'Saint Vincent and the Grenadines is a country in the Caribbean.' },
  { c:'VE',n:'Venezuela',p:28435940,cap:'Caracas',a:912050,lang:['Spanish'],cur:['Venezuelan bolívar'],hos:'Nicolás Maduro',ht:'President',w:'Venezuela is a country on the northern coast of South America.' },
  { c:'VN',n:'Vietnam',p:97338579,cap:'Hanoi',a:331212,lang:['Vietnamese'],cur:['Vietnamese đồng'],hos:'Lương Cường',ht:'President',w:'Vietnam is a country in Southeast Asia.' },
  { c:'VU',n:'Vanuatu',p:307145,cap:'Port Vila',a:12189,lang:['Bislama','English','French'],cur:['Vatu'],hos:'Nikenike Vurobaravu',ht:'President',w:'Vanuatu is a Pacific Island country located in the South Pacific Ocean.' },
  { c:'WS',n:'Samoa',p:198414,cap:'Apia',a:2831,lang:['Samoan','English'],cur:['Tālā'],hos:'Tuimalealiʻifano Vaʻaletoʻa Sualauvi II',ht:'Head of State',w:'Samoa is a Polynesian island country in the South Pacific Ocean.' },
  { c:'XK',n:'Kosovo',p:1798506,cap:'Pristina',a:10887,lang:['Albanian','Serbian'],cur:['Euro'],hos:'Vjosa Osmani',ht:'President',w:'Kosovo is a partially recognized state in Southeast Europe.' },
  { c:'YE',n:'Yemen',p:29825964,cap:'Sana\'a',a:527968,lang:['Arabic'],cur:['Yemeni riyal'],hos:'Rashad al-Alimi',ht:'Presidential Leadership Council Chairman',w:'Yemen is a country at the southern end of the Arabian Peninsula.' },
  { c:'ZA',n:'South Africa',p:59308690,cap:'Pretoria',a:1221037,lang:['English','Zulu','Afrikaans','Xhosa','Sotho','Tswana','Swazi','Venda','Tsonga','Pedi','Ndebele'],cur:['South African rand'],hos:'Cyril Ramaphosa',ht:'President',w:'South Africa is the southernmost country in Africa.' },
  { c:'ZM',n:'Zambia',p:18383955,cap:'Lusaka',a:752618,lang:['English'],cur:['Zambian kwacha'],hos:'Hakainde Hichilema',ht:'President',w:'Zambia is a landlocked country in Southern Africa.' },
  { c:'ZW',n:'Zimbabwe',p:14862924,cap:'Harare',a:390757,lang:['English','Shona','Ndebele'],cur:['US dollar','Zimbabwe Gold'],hos:'Emmerson Mnangagwa',ht:'President',w:'Zimbabwe is a landlocked country in Southern Africa.' },
];

async function redisSet(key, value) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', key, value, 'EX', TTL]),
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) throw new Error(`SET ${key}: HTTP ${resp.status}`);
}

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
  console.log(`Seeding ${ALL_COUNTRIES.length} country facts...`);

  const entries = ALL_COUNTRIES.map(c => ({
    code: c.c,
    value: JSON.stringify({
      headOfState: c.hos || '',
      headOfStateTitle: c.ht || '',
      wikipediaSummary: c.w || '',
      wikipediaThumbnailUrl: '',
      population: c.p,
      capital: c.cap || '',
      languages: c.lang || [],
      currencies: c.cur || [],
      areaSqKm: c.a,
      countryName: c.n,
    }),
  }));

  let ok = 0;
  for (let i = 0; i < entries.length; i += PIPELINE_BATCH) {
    const batch = entries.slice(i, i + PIPELINE_BATCH);
    const cmds = batch.map(e => ['SET', `intel:country-facts:rc:${e.code}`, e.value, 'EX', TTL]);
    try {
      await execPipeline(cmds);
      ok += batch.length;
      process.stdout.write(`\r  Wrote ${ok}/${entries.length}`);
    } catch (err) {
      console.error(`\n  Batch ${Math.floor(i / PIPELINE_BATCH) + 1} failed: ${err.message}`);
      for (const e of batch) {
        try { await redisSet(`intel:country-facts:rc:${e.code}`, e.value); ok++; } catch { /* skip */ }
      }
    }
  }

  console.log(`\nDone — seeded ${ok} countries`);
  console.log(`Key pattern: intel:country-facts:rc:{ISO2}`);
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
