const injectScript = require('injectScript');
const log = require('logToConsole');
const makeNumber = require('makeNumber');
const makeTableMap = require('makeTableMap');
const copyFromWindow = require('copyFromWindow');

// constants
const JS_URL = 'https://unpkg.com/@journifyio/js-sdk@latest/dist/_bundles/journifyio.min.js';
const LOG_PREFIX = '[Journify / GTM] ';
const JOURNIFY_WINDOW_KEY = 'journify';

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

    load(journify);

    switch (data.tagType) {
        case 'identify':
            identify(journify);
            break;
        case 'group':
            break;
        case 'track':
            break;
        case 'page':
            break;
    }

    data.gtmOnSuccess();
};

const load = (journify) => {
    if (!dataHasField("writeKey")) {
        return fail('`Write Key` setting is required when calling `load`');
    }

    const settings = {
        writeKey: data.writeKey,
    };

    if (dataHasField("cookieDomain")) {
        settings.cookie = {
            domain: data.cookieDomain,
        };
    }

    if (dataHasField("sessionDurationMin")){
        const sessionDurationMin = makeNumber(data.sessionDurationMin);
        if (typeof sessionDurationMin !== "undefined") {
            settings.sessionDurationMin = sessionDurationMin;
        }
    }

    journify.load(settings);
    log(LOG_PREFIX + 'Success: load journify with settings', settings);
};

const identify = (journify) => {
    if (!dataHasField("userId")) {
        return fail('`User ID` setting is required when calling `identify`');
    }

    let traits = null;
    if (dataHasField("userTraits")) {
        traits = makeTableMap(data.userTraits || [], 'traitKey', 'traitValue');
    }

    let externalId = null;
    if (dataHasField("externalIdValue")) {
        externalId = {
            externalId: data.externalIdValue,
            type: data.externalIdType,
            collection: data.externalIdCollection,
        };
    }

    journify.identify(data.userId, traits,  externalId)
        .then((ctx) => {
            log('Identify success: ', ctx);
        })
        .catch((e) => fail(e));
};

const dataHasField = (fieldKey) => {
    const val = data[fieldKey];
    return val && val.length > 0;
};

const onfailure = () => {
    return fail('Failed to load the Journify JavaScript library');
};


injectScript(JS_URL, onsuccess, onfailure, 'journify');