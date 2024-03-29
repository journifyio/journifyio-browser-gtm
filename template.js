const injectScript = require('injectScript');
const log = require('logToConsole');
const makeNumber = require('makeNumber');
const makeTableMap = require('makeTableMap');
const copyFromWindow = require('copyFromWindow');
const copyFromDataLayer = require('copyFromDataLayer');
const getType = require('getType');
const readTitle = require('readTitle');

// constants
const DEFAULT_SDK_VERSION = 'latest';
const SDK_VERSION = data.sdk_version || DEFAULT_SDK_VERSION;
const JS_URL = 'https://static.journify.io/@journifyio/js-sdk@'+SDK_VERSION+'/journifyio.min.js';
const LOG_PREFIX = '[Journify / GTM] ';
const JOURNIFY_WINDOW_KEY = 'journify';

const STANDARD_DATA_LAYER_EVENT_KEYS = [
    'accept_time',
    'achievement_id',
    'aclid',
    'ad_event_id',
    'ad_unit_code',
    'affiliation',
    'anid',
    'campaign',
    'campaign_info_source',
    'cancellation_reason',
    'character',
    'click_timestamp',
    'client_id',
    'content',
    'content_id',
    'content_type',
    'coupon',
    'cp1',
    'creative_name',
    'creative_slot',
    'currency',
    'deferred_analytics_collection',
    'discount',
    'engagement_time_msec',
    'exposure_time',
    'fatal',
    'file_extension',
    'file_name',
    'firebase_error',
    'firebase_error_value',
    'firebase_previous_class',
    'firebase_previous_id',
    'firebase_previous_screen',
    'firebase_screen',
    'firebase_screen_class',
    'firebase_screen_id',
    'form_destination',
    'form_id',
    'form_name',
    'form_start',
    'form_submit_text',
    'free_trial',
    'gclid',
    'group_id',
    'index',
    'introductory_price',
    'item_brand',
    'item_category',
    'item_category2',
    'item_category3',
    'item_category4',
    'item_category5',
    'item_id',
    'item_list_id',
    'item_list_name',
    'item_name',
    'item_variant',
    'items',
    'label',
    'language',
    'level',
    'level_name',
    'link_classes',
    'link_domain',
    'link_id',
    'link_text',
    'link_url',
    'location_id',
    'medium',
    'message_channel',
    'message_device_time',
    'message_id',
    'message_name',
    'message_time',
    'method',
    'outbound',
    'page_encoding',
    'page_location',
    'page_referrer',
    'page_title',
    'payment_type',
    'previous_first_open_count',
    'previous_gmp_app_id',
    'previous_os_version',
    'price',
    'product_id',
    'promotion_id',
    'promotion_name',
    'quantity',
    'renewal_count',
    'reset_analytics_cause',
    'reward_type',
    'reward_value',
    'score',
    'screen_resolution',
    'search_term',
    'shipping',
    'shipping_tier',
    'source',
    'subscription',
    'success',
    'system_app',
    'system_app_update',
    'tax',
    'term',
    'timestamp',
    'topic',
    'transaction_id',
    'unique_search_term',
    'updated_with_analytics',
    'user_agent',
    'value',
    'video_current_time',
    'video_duration',
    'video_percent',
    'video_provider',
    'video_title',
    'video_url',
    'virtual_currency_name',
    'visible'
];

// helpers

const fail = msg => {
    log(LOG_PREFIX + 'Error: ' + msg);
    return data.gtmOnFailure();
};

const onsuccess = () => {
    const journify = copyFromWindow(JOURNIFY_WINDOW_KEY);
    if (!journify) {
        return fail('Failed to load the window.journify');
    }

    switch(data.tag_type) {
        case 'init':
            init(journify);
            break;

        case 'identify':
            identify(journify);
            break;

        case 'group':
            group(journify);
            break;

        case 'track':
            track(journify);
            break;

        case 'page':
            page(journify);
            break;

        case 'data_layer_event':
            dataLayerEvent(journify);
            break;

        default:
            log(LOG_PREFIX + ' Unsupported tag type `'+ data.tag_type +'`, skipping');
            break;
    }


    data.gtmOnSuccess();
};

const init = (journify) => {
    if (!dataHasField('write_key')) {
        return fail('`write_key` setting is required when calling `load`');
    }

    const settings = {
        writeKey: data.write_key,
    };

    if (dataHasField('api_host')) {
        settings.apiHost = data.api_host;
    }

    if (dataHasField('cookie_domain')) {
        settings.cookie = {
            domain: data.cookie_domain,
        };
    }

    if (dataHasField('session_duration_min')){
        const sessionDurationMin = makeNumber(data.session_duration_min);
        if (typeof sessionDurationMin !== 'undefined') {
            settings.sessionDurationMin = sessionDurationMin;
        }
    }

    if (dataHasField('cdn_host')) {
        settings.cdnHost = data.cdn_host;
    }


    log(LOG_PREFIX + 'Initializing Journify SDK with settings: ', settings);

    journify.load(settings);

    if (data.track_page_view_on_init === true) {
        page(journify);
    }

    log(LOG_PREFIX + 'Success: initializing Journify SDK');
};

const dataHasField = (fieldKey) => {
    const val = data[fieldKey];
    return val && val.length > 0;
};

const identify = (journify) => {
    const traits = makeTableMap(data.user_traits || [], 'key', 'value');
    let externalIDs = null;
    if (dataHasField('external_ids')) {
        externalIDs = makeTableMap(data.external_ids || [], 'key', 'value');
    }

    journify.identify(data.user_id, traits, externalIDs);
};

const group = (journify) => {
    const traits = makeTableMap(data.group_traits || [], 'key', 'value');
    journify.group(data.group_id, traits);
};

const track = (journify) => {
    const properties = makeTableMap(data.track_properties || [], 'key', 'value');
    journify.track(data.event_name, properties);
};

const page = (journify) => {
    let pageName = data.page_name;
    if (!pageName) {
        pageName = readTitle();
    }

    const properties = makeTableMap(data.page_properties || [], 'key', 'value');

    log(LOG_PREFIX + 'Page properties: ', properties);
    journify.page(pageName, properties);
};

const dataLayerEvent = (journify) => {
    const eventsMap = getDataLayerMappedEvents();
    if (!dataLayerEventName) {
        log(LOG_PREFIX + ' Event name is not defined, skipping event');
        return;
    }

    const eventType = eventsMap[dataLayerEventName];
    if (!eventType) {
        log(LOG_PREFIX + 'Event name`'+ dataLayerEventName +'` is not mapped, skipping event');
        return;
    }

    switch(eventType) {
        case 'identify':
            dataLayerIdentify(journify);
            break;
        case 'group':
            dataLayerGroup(journify);
            break;
        case 'track':
            dataLayerTrack(journify, dataLayerEventName);
            break;
        case 'page':
            dataLayerPage(journify);
            break;
        default:
            log(LOG_PREFIX + 'Event name`'+ dataLayerEventName +'` is mapped to unsupported event type `'+ eventType +'`, skipping event');
            break;
    }

};

const dataLayerIdentify = (journify) => {
    if (!dataLayerUserID) {
        return fail('`user_id` is required when calling `identify`');
    }

    journify.identify(dataLayerUserID, dataLayerTraits,  dataLayerExternalIds);
};

const dataLayerGroup = (journify) => {
    if (!dataLayerGroupId) {
        return fail('`group_id` is required when calling `group`');
    }

    journify.group(dataLayerGroupId, dataLayerTraits);
};

const dataLayerTrack = (journify, eventName) => {
    journify.track(eventName, dataLayerEventProperties);
};

const dataLayerPage = (journify) => {
    if (!dataLayerPageName) {
        dataLayerPageName = readTitle();
    }

    journify.page(dataLayerPageName, dataLayerEventProperties);
};

const getDataLayerMappedEvents = () => {
    const mappings = [];
    if (data.ga4_enhannced_events_enabled === true && data.ga4_enhannced_events_mapping && data.ga4_enhannced_events_mapping.length > 0) {
        mappings.push(data.ga4_enhannced_events_mapping);
    }

    if (data.ga4_recommended_events_enabled === true && data.ga4_recommended_events_mapping && data.ga4_recommended_events_mapping.length > 0) {
        mappings.push(data.ga4_recommended_events_mapping);
    }

    if (data.ga4_automatic_events_enabled === true && data.ga4_automatic_events_mapping && data.ga4_automatic_events_mapping.length > 0) {
        mappings.push(data.ga4_automatic_events_mapping);
    }


    if (data.data_layer_additional_mappings && data.data_layer_additional_mappings.length > 0) {
        mappings.push(data.data_layer_additional_mappings);
    }

    const eventsMap = {};
    for (let i = 0; i < mappings.length; i++) {
        const currentMap = makeTableMap(mappings[i] || [], 'event_name', 'event_type');
        copyObj(eventsMap, currentMap);
    }

    return eventsMap;
};

const copyObj = (target, source) => {
    for (let key in source) {
        target[key] = source[key];
    }
};

const copyKeysFromDataLayer = (keys) => {
    const copy = {};
    keys.forEach((key) => {
        const value = copyFromDataLayer(key);
        if (value) {
            copy[key] = value;
        }
    });

    return copy;
};

const onfailure = () => {
    return fail('Failed to load the Journify JavaScript library');
};

// Main
// init data layer variables
let dataLayerEventName = null;
let dataLayerEventProperties = null;
let dataLayerUserID = null;
let dataLayerExternalIds = null;
let dataLayerTraits = null;
let dataLayerPageName = null;
let dataLayerGroupId = null;

if (data.tag_type == 'data_layer_event') {
    dataLayerEventName = copyFromDataLayer('event') || copyFromDataLayer('event_name');
    dataLayerUserID = copyFromDataLayer('user_id');
    dataLayerExternalIds = copyFromDataLayer('external_ids');
    dataLayerTraits = copyFromDataLayer('traits') || {};
    const traitsKeys = {
        'user_data.email_address': 'email',
        'user_data.phone_number': 'phone',
        'user_data.first_name': 'firstname',
        'user_data.last_name': 'lastname',
        'user_data.street': 'street_address',
        'user_data.city': 'city',
        'user_data.region': 'state_code',
        'user_data.postal_code': 'postal_code',
        'user_data.country': 'country_code',
    };

    dataLayerPageName = copyFromDataLayer('name');

    for (let key in traitsKeys) {
        const journifyKey = traitsKeys[key];
        const value = copyFromDataLayer(key);
        if (value) {
            dataLayerTraits[journifyKey] = value;
        }
    }

    dataLayerGroupId = copyFromDataLayer('group_id');

    dataLayerEventProperties = copyKeysFromDataLayer(STANDARD_DATA_LAYER_EVENT_KEYS);

    if (dataHasField('additional_data_layer_properties')) {
        for (let i = 0; i < data.additional_data_layer_properties.length; i++) {
            const key = data.additional_data_layer_properties[i].property_key;
            const value = copyFromDataLayer(key);
            if (value) {
                dataLayerEventProperties[key] = value;
            }
        }
    }

    if (dataHasField('data_layer_prop_values')) {
        const props = makeTableMap(data.data_layer_prop_values || [], 'key', 'value');
        copyObj(dataLayerEventProperties, props);
    }

    const ecommerce = copyFromDataLayer('ecommerce');
    if (getType(ecommerce) == 'object') {
        copyObj(dataLayerEventProperties, ecommerce);
    }

    const nestedProperties = copyFromDataLayer('properties');
    if (getType(nestedProperties) == 'object') {
        copyObj(dataLayerEventProperties, nestedProperties);
    }
}

log(LOG_PREFIX + ' Tag is fired with Event name from data layer `'+ dataLayerEventName +'` and tag_type `'+ data.tag_type +'`');

// inject the Journify JavaScript SDK
injectScript(JS_URL, onsuccess, onfailure, 'journify');