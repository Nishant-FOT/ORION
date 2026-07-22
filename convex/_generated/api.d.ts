/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alertRules from "../alertRules.js";
import type * as apiKeys from "../apiKeys.js";
import type * as broadcast__localeHeuristic from "../broadcast/_localeHeuristic.js";
import type * as broadcast__poolSelection from "../broadcast/_poolSelection.js";
import type * as broadcast__resendContacts from "../broadcast/_resendContacts.js";
import type * as broadcast_audienceExport from "../broadcast/audienceExport.js";
import type * as broadcast_audienceWaveExport from "../broadcast/audienceWaveExport.js";
import type * as broadcast_backfillCanaryWaveStamps from "../broadcast/backfillCanaryWaveStamps.js";
import type * as broadcast_metrics from "../broadcast/metrics.js";
import type * as broadcast_proLaunchEmailContent from "../broadcast/proLaunchEmailContent.js";
import type * as broadcast_rampRunner from "../broadcast/rampRunner.js";
import type * as broadcast_sendBroadcast from "../broadcast/sendBroadcast.js";
import type * as broadcast_waveRuns from "../broadcast/waveRuns.js";
import type * as constants from "../constants.js";
import type * as contactMessages from "../contactMessages.js";
import type * as crons from "../crons.js";
import type * as emailSuppressions from "../emailSuppressions.js";
import type * as followedCountries from "../followedCountries.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_iso2 from "../lib/iso2.js";
import type * as lib_shards from "../lib/shards.js";
import type * as mcpProTokens from "../mcpProTokens.js";
import type * as notificationChannels from "../notificationChannels.js";
import type * as registerInterest from "../registerInterest.js";
import type * as resendWebhookHandler from "../resendWebhookHandler.js";
import type * as telegramPairingTokens from "../telegramPairingTokens.js";
import type * as userPreferences from "../userPreferences.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alertRules: typeof alertRules;
  apiKeys: typeof apiKeys;
  "broadcast/_localeHeuristic": typeof broadcast__localeHeuristic;
  "broadcast/_poolSelection": typeof broadcast__poolSelection;
  "broadcast/_resendContacts": typeof broadcast__resendContacts;
  "broadcast/audienceExport": typeof broadcast_audienceExport;
  "broadcast/audienceWaveExport": typeof broadcast_audienceWaveExport;
  "broadcast/backfillCanaryWaveStamps": typeof broadcast_backfillCanaryWaveStamps;
  "broadcast/metrics": typeof broadcast_metrics;
  "broadcast/proLaunchEmailContent": typeof broadcast_proLaunchEmailContent;
  "broadcast/rampRunner": typeof broadcast_rampRunner;
  "broadcast/sendBroadcast": typeof broadcast_sendBroadcast;
  "broadcast/waveRuns": typeof broadcast_waveRuns;
  constants: typeof constants;
  contactMessages: typeof contactMessages;
  crons: typeof crons;
  emailSuppressions: typeof emailSuppressions;
  followedCountries: typeof followedCountries;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/env": typeof lib_env;
  "lib/iso2": typeof lib_iso2;
  "lib/shards": typeof lib_shards;
  mcpProTokens: typeof mcpProTokens;
  notificationChannels: typeof notificationChannels;
  registerInterest: typeof registerInterest;
  resendWebhookHandler: typeof resendWebhookHandler;
  telegramPairingTokens: typeof telegramPairingTokens;
  userPreferences: typeof userPreferences;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
