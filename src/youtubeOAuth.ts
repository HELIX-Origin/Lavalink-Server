import crypto from 'node:crypto';
import http from 'node:http';
import { config } from './config.js';
import { saveSystemSetting, getSystemSetting, logSystemEvent } from './db.js';
import {
  setCachedYouTubeToken,
  getCachedYouTubeToken,
  setCachedYouTubeOAuthState
} from './redis.js';

const CLIENT_ID = '861556708454-d6dlm3lh05idd8npek18k6be8ba3oc68.apps.googleusercontent.com';
const CLIENT_SECRET = 'SboVhoG9s0rNafixCSGGKXAT';
const SCOPE = 'http://gdata.youtube.com https://www.googleapis.com/auth/youtube';
const DEVICE_CODE_URL = 'https://www.youtube.com/o/oauth2/device/code';
const TOKEN_URL = 'https://www.youtube.com/o/oauth2/token';

export interface OAuthState {
  status: 'idle' | 'pending' | 'authorized' | 'failed';
  hasToken: boolean;
  tokenPreview: string | null;
  userCode: string | null;
  verificationUrl: string | null;
  directUrl: string | null;
  expiresAt: number | null;
  error: string | null;
  updatedAt: string | null;
}

let activePollTimer: NodeJS.Timeout | null = null;
let currentPollId = 0;

let state: OAuthState = {
  status: 'idle',
  hasToken: false,
  tokenPreview: null,
  userCode: null,
  verificationUrl: null,
  directUrl: null,
  expiresAt: null,
  error: null,
  updatedAt: null
};

/**
 * Mask a token for display in logs and UI (e.g. 1//04abc...wxyz)
 */
function maskToken(token: string): string {
  if (!token || token.length < 10) return '••••••••';
  const prefix = token.substring(0, 6);
  const suffix = token.substring(token.length - 4);
  return `${prefix}...${suffix}`;
}

/**
 * Loads saved token from Redis live cache or SQLite database on startup,
 * and sets process.env.YOUTUBE_REFRESH_TOKEN before Lavalink spawns.
 */
export async function loadSavedOAuthToken(): Promise<string | null> {
  // 1. Check Redis in-memory cache first
  const cached = await getCachedYouTubeToken();
  if (cached && cached.trim().length > 0) {
    const token = cached.trim();
    process.env.YOUTUBE_REFRESH_TOKEN = token;
    state.hasToken = true;
    state.status = 'authorized';
    state.tokenPreview = maskToken(token);
    state.updatedAt = new Date().toISOString();
    console.log(`[YouTube OAuth] Loaded token from Redis live memory (${state.tokenPreview})`);
    return token;
  }

  // 2. Check SQLite persistent database
  const dbToken = getSystemSetting('youtube_refresh_token');
  if (dbToken && dbToken.trim().length > 0) {
    const token = dbToken.trim();
    await setCachedYouTubeToken(token);
    process.env.YOUTUBE_REFRESH_TOKEN = token;
    state.hasToken = true;
    state.status = 'authorized';
    state.tokenPreview = maskToken(token);
    state.updatedAt = new Date().toISOString();
    console.log(`[YouTube OAuth] Loaded token from SQLite database (${state.tokenPreview})`);
    return token;
  }

  // 3. Check environment variable (e.g. initial one-click deploy config)
  if (process.env.YOUTUBE_REFRESH_TOKEN && process.env.YOUTUBE_REFRESH_TOKEN.trim().length > 0) {
    const envToken = process.env.YOUTUBE_REFRESH_TOKEN.trim();
    saveSystemSetting('youtube_refresh_token', envToken);
    await setCachedYouTubeToken(envToken);
    state.hasToken = true;
    state.status = 'authorized';
    state.tokenPreview = maskToken(envToken);
    state.updatedAt = new Date().toISOString();
    console.log(`[YouTube OAuth] Imported token from environment variable (${state.tokenPreview})`);
    return envToken;
  }

  return null;
}

/**
 * Saves refresh token to SQLite DB for persistence across restarts
 * and Redis live memory for real-time instant access.
 */
export async function saveYouTubeRefreshToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (trimmed.length < 5) return false;

  try {
    const nowIso = new Date().toISOString();

    // 1. Save to SQLite database (persistent across container restarts)
    saveSystemSetting('youtube_refresh_token', trimmed);

    // 2. Cache in Redis (instant in-live memory access)
    await setCachedYouTubeToken(trimmed);

    process.env.YOUTUBE_REFRESH_TOKEN = trimmed;
    state.hasToken = true;
    state.status = 'authorized';
    state.tokenPreview = maskToken(trimmed);
    state.updatedAt = nowIso;
    state.error = null;
    state.userCode = null;
    state.verificationUrl = null;
    state.directUrl = null;
    state.expiresAt = null;

    await setCachedYouTubeOAuthState(state as any);

    console.log('======================================================================');
    console.log('✅ [YouTube OAuth] AUTHORIZATION SUCCESSFUL!');
    console.log('💾 Persisted to SQLite Database (system_settings)');
    console.log('⚡ Cached in Redis Live Memory');
    console.log(`🔑 Token Preview: ${state.tokenPreview}`);
    console.log('======================================================================');

    logSystemEvent('info', 'YouTube OAuth refresh token saved to database & Redis', {
      tokenPreview: state.tokenPreview
    });

    // Notify internal running Lavalink node
    notifyLavalinkNode(trimmed).catch(() => {});

    return true;
  } catch (err: any) {
    console.error('[YouTube OAuth] Failed to save refresh token to database/Redis:', err);
    return false;
  }
}

/**
 * Sends POST /youtube with the new refresh token to Lavalink's internal HTTP interface
 */
async function notifyLavalinkNode(refreshToken: string): Promise<void> {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      refreshToken,
      skipInitialization: true
    });

    const req = http.request(
      {
        hostname: config.lavalinkHost,
        port: config.lavalinkPort,
        path: '/youtube',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.lavalinkPass,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 4000
      },
      (res) => {
        if (res.statusCode && res.statusCode < 400) {
          console.log('[YouTube OAuth] Successfully updated running Lavalink node with new refresh token.');
        } else {
          console.warn(`[YouTube OAuth] Lavalink node returned HTTP ${res.statusCode} on /youtube update.`);
        }
        resolve();
      }
    );

    req.on('error', (err) => {
      console.warn(`[YouTube OAuth] Could not notify Lavalink node directly (${err.message}). Token will be used on next start.`);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Initiates the Google / YouTube Device Flow and outputs authorization details to console
 */
export async function initiateDeviceFlow(): Promise<OAuthState> {
  if (activePollTimer) {
    clearInterval(activePollTimer);
    activePollTimer = null;
  }
  const pollId = ++currentPollId;

  const deviceId = crypto.randomUUID().replace(/-/g, '');
  const payload = {
    client_id: CLIENT_ID,
    scope: SCOPE,
    device_id: deviceId,
    device_model: 'ytlr::'
  };

  let responseData: any = null;

  // Try InnerTube TV endpoint first
  try {
    const res = await fetch(DEVICE_CODE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      responseData = await res.json();
    } else {
      const errTxt = await res.text();
      console.warn(`[YouTube OAuth] Primary endpoint returned HTTP ${res.status}: ${errTxt}. Trying fallback googleapis...`);
    }
  } catch (err: any) {
    console.warn(`[YouTube OAuth] Primary device code fetch failed: ${err.message}. Trying fallback...`);
  }

  // Fallback to standard oauth2.googleapis.com
  if (!responseData) {
    const res = await fetch('https://oauth2.googleapis.com/device/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        scope: SCOPE
      })
    });

    if (!res.ok) {
      const errTxt = await res.text();
      state.status = 'failed';
      state.error = `Device code request failed (${res.status}): ${errTxt}`;
      throw new Error(state.error);
    }

    responseData = await res.json();
  }

  const deviceCode = responseData.device_code;
  const userCode = responseData.user_code;
  const verificationUrl = responseData.verification_url || 'https://www.google.com/device';
  const expiresIn = responseData.expires_in || 1800;
  const interval = Math.max(responseData.interval || 5, 5);

  const directUrl = `${verificationUrl}?user_code=${encodeURIComponent(userCode)}`;
  const expiresAt = Date.now() + expiresIn * 1000;

  state.status = 'pending';
  state.userCode = userCode;
  state.verificationUrl = verificationUrl;
  state.directUrl = directUrl;
  state.expiresAt = expiresAt;
  state.error = null;

  await setCachedYouTubeOAuthState(state as any);

  // CRITICAL REQUIREMENT: Output clear authorization link and instructions to the server console!
  console.log('\n======================================================================');
  console.log('🔑 [YouTube OAuth] DEVICE AUTHORIZATION REQUIRED');
  console.log('----------------------------------------------------------------------');
  console.log(`👉 1. Open in browser:  ${verificationUrl}`);
  console.log(`👉 2. Enter code:       ${userCode}`);
  console.log(`👉 3. Or direct link:   ${directUrl}`);
  console.log(`⏳ Waiting for authorization... (Expires in ${Math.round(expiresIn / 60)} minutes)`);
  console.log('======================================================================\n');

  logSystemEvent('info', 'YouTube OAuth device flow initiated', {
    userCode,
    verificationUrl,
    directUrl,
    expiresIn
  });

  // Start background poller
  startPolling(pollId, deviceCode, interval, expiresAt);

  return { ...state };
}

/**
 * Background polling loop for device flow authorization
 */
function startPolling(pollId: number, deviceCode: string, intervalSeconds: number, expiresAt: number): void {
  const pollIntervalMs = intervalSeconds * 1000;

  activePollTimer = setInterval(async () => {
    if (pollId !== currentPollId) {
      if (activePollTimer) clearInterval(activePollTimer);
      return;
    }

    if (Date.now() > expiresAt) {
      if (activePollTimer) clearInterval(activePollTimer);
      activePollTimer = null;
      state.status = 'failed';
      state.error = 'Authorization timed out. Please initiate a new OAuth code.';
      console.warn('[YouTube OAuth] Device authorization code timed out.');
      logSystemEvent('warn', 'YouTube OAuth device authorization code expired');
      await setCachedYouTubeOAuthState(state as any);
      return;
    }

    try {
      const payload = {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: deviceCode,
        grant_type: 'http://oauth.net/grant_type/device/1.0'
      };

      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: JSON.stringify(payload)
      });

      const data = (await res.json()) as any;

      if (res.ok && data?.refresh_token) {
        if (activePollTimer) clearInterval(activePollTimer);
        activePollTimer = null;
        await saveYouTubeRefreshToken(data.refresh_token);
        return;
      }

      if (data?.error === 'authorization_pending' || data?.error === 'slow_down') {
        return;
      }

      // Other error occurred
      if (activePollTimer) clearInterval(activePollTimer);
      activePollTimer = null;
      state.status = 'failed';
      state.error = data?.error_description || data?.error || 'Authorization rejected';
      console.error(`[YouTube OAuth] Polling error: ${state.error}`);
      logSystemEvent('error', `YouTube OAuth polling error: ${state.error}`);
      await setCachedYouTubeOAuthState(state as any);
    } catch (err: any) {
      console.warn(`[YouTube OAuth] Polling network warning: ${err.message}`);
    }
  }, pollIntervalMs);
}

/**
 * Manually apply an existing refresh token
 */
export async function applyManualToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (trimmed.length < 5) return false;

  if (activePollTimer) {
    clearInterval(activePollTimer);
    activePollTimer = null;
    currentPollId++;
  }

  return await saveYouTubeRefreshToken(trimmed);
}

/**
 * Returns current OAuth status and details
 */
export function getOAuthState(): OAuthState {
  if (state.status === 'pending' && state.expiresAt && Date.now() > state.expiresAt) {
    state.status = 'failed';
    state.error = 'Authorization code expired';
  }
  return { ...state };
}
