/* eslint-disable max-len */
// Uses GA "Measurement Protocol" API since we can't use traditional gtag.js due to MV3 service worker
// https://stackoverflow.com/a/73825802

import { v4 as uuidv4 } from 'uuid';
import { ClientIdAndSession, Session } from '../../shared/types';
import { getClientId, getSession, storeClientId, storeSession } from '../state/chromeStoredData';

// Note: This api does not give response codes if something is wrong
const debug = false;
const rootUrl = `https://www.google-analytics.com/${debug ? 'debug/' : ''}mp/collect`;
const extUrl = 'https://davididol.com/xcloud-keyboard-mouse/EXT';

// https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#required_parameters
const GA_API_TOKEN = process.env.GA_API_TOKEN;
const GA_MEASUREMENT_ID = 'G-DKKYLRVJYT';

export type GaEventName =
  | 'exception' // https://developers.google.com/analytics/devguides/collection/ga4/exceptions
  | 'page_view' // https://developers.google.com/analytics/devguides/collection/ga4/views?client_type=gtag
  | 'begin_checkout' // https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events#begin_checkout
  | 'btn_click'
  | 'initialize'
  | 'play'
  | 'dismiss'
  | 'update_prefs'
  | 'switch_config'
  | 'disable_config'
  | 'modify_config'
  | 'keyboard_command';

export interface GaEventData {
  name: string;
  params?: object;
}

export interface GaPostBody {
  /**
   * Required. A unique identifier for a client.
   * In the normal use of Google Analytics, the ClientID is generated for you.
   * With the Measurement Protocol, you need to provide it.
   * There is nothing particularly special about it - it just needs to be unique for each user, and stay consistent.
   * We generate a unique id for each user of the extension and store it in sync storage to persist it over time.
   */
  client_id: string;
  /**
   * Optional. A unique identifier for a user.
   */
  user_id?: string;
  /**
   * https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events
   */
  events?: Array<GaEventData>;
}

let cachedClientId: string | null = null;
let cachedSession: Session | null = null;

export async function getClientIdAndSession(): Promise<ClientIdAndSession> {
  const [maybeClientId, maybeSession] = await Promise.all([
    cachedClientId || getClientId(),
    cachedSession || getSession(),
  ]);
  const savePromises: Array<Promise<void>> = [];
  if (!maybeClientId) {
    cachedClientId = uuidv4();
    savePromises.push(storeClientId(cachedClientId));
  } else {
    cachedClientId = maybeClientId;
  }
  // By default, a session ends (times out) after 30 minutes of user inactivity.
  const sessionExpirationMs = 30 * 60 * 1000;
  const now = new Date().getTime();
  if (!maybeSession || now - maybeSession.startMs > sessionExpirationMs) {
    cachedSession = { sessionId: uuidv4(), startMs: now };
    savePromises.push(storeSession(cachedSession));
  } else {
    cachedSession = maybeSession;
  }
  await Promise.all(savePromises);
  return { clientId: cachedClientId!, session: cachedSession! };
}

// Fire-and-forget function to send an event to GA from anywhere in the extension
// TODO add queue so we can ensure proper sequencing without needing to await at the top level - avoids blocking UI
export async function postGa(eventName: GaEventName, inputParams: Record<string, any> = {}): Promise<void> {
  if (!GA_API_TOKEN) {
    console.error('Missing GA API token');
    return;
  }

  const { clientId, session } = await getClientIdAndSession();
  if (!cachedClientId) {
    console.error(`Ignoring GA event "${eventName}" due to missing cid`);
    return;
  }
  // Extend with session information in order to show up in Realtime
  // https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
  let params: Record<string, any> = {
    ...inputParams,
    // https://support.google.com/analytics/answer/11109416
    engagement_time_msec: String(new Date().getTime() - session.startMs),
    // https://support.google.com/analytics/answer/9191807
    session_id: session.sessionId.toString(),
  };
  if (eventName === 'page_view') {
    params = {
      ...params,
      page_location: extUrl + params.page_location,
    };
  }

  console.log('GA:', eventName, params);
  try {
    // update session timestamp (no await)
    storeSession({ ...session, startMs: new Date().getTime() });
    // send request
    await fetch(`${rootUrl}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_TOKEN}`, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({
        client_id: clientId,
        events: [{ name: eventName, params }],
      }),
    });
  } catch (e) {
    console.error('GA failed to send');
  }
}
