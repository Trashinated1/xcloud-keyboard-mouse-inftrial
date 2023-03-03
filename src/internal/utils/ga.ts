/* eslint-disable max-len */
// https://stackoverflow.com/a/73825802
// https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide

import { getClientId } from '../state/chromeStoredData';

// Note: This api does not give response codes if something is wrong,
// instead of using https://www.google-analytics.com/mp/collect directly on prod,
// one should first try https://www.google-analytics.com/debug/mp/collect.
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
   * In my extension I generate a unique id for each user of the extension and store it in local storage to persist it over time.
   * I send this id as the ClientID to Google Analytics whenever that user does something in the extension.
   * To see metrics for a particular Client ID within Google Analytics go to Audience -> User Explorer.
   * Here is some more info from the Measure Protocol docs that may help:
   * https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters#cid
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

let client_id: string | undefined;

// Fire-and-forget function to send an event to GA from anywhere in the extension
// TODO add queue so we can ensure proper sequencing without needing to await at the top level - avoids blocking UI
export async function postGa(eventName: GaEventName, inputParams: Record<string, any> = {}): Promise<void> {
  if (!GA_API_TOKEN) {
    throw new Error('Missing GA API token');
  }
  if (!client_id) {
    client_id = await getClientId();
  }
  if (!client_id) {
    console.error(`Ignoring GA event "${eventName}" due to missing cid`);
    return;
  }
  let params = inputParams;
  if (eventName === 'page_view') {
    params = {
      ...params,
      page_location: extUrl + params.page_location,
    };
  }
  // May also want to extend with session information, e.g.
  // engagement_time_msec: '100',
  // session_id: '123',

  console.log('GA:', eventName, params);
  await fetch(`${rootUrl}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_TOKEN}`, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-cache',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify({
      client_id,
      events: [{ name: eventName, params }],
    }),
  });
}
