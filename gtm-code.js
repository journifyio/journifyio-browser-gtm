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
            group(journify);
            break;
        case 'track':
            track(journify);
            break;
        case 'page':
            page(journify);
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
    log(LOG_PREFIX + 'Success: loading Journify SDK');
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
        .then((ctx) => log(LOG_PREFIX + 'Success: Journify Identify call, context', ctx))
        .catch((e) => fail(e));
};

const group = (journify) => {
    if (!dataHasField("groupId")) {
        return fail('`Group ID` setting is required when calling `group`');
    }

    let traits = null;
    if (dataHasField("groupTraits")) {
        traits = makeTableMap(data.groupTraits || [], 'traitKey', 'traitValue');
    }

    journify.group(data.groupId, traits)
        .then((ctx) => log(LOG_PREFIX + 'Success: Journify Group call, context', ctx))
        .catch((e) => fail(e));
};

const track = (journify) => {
    if (!dataHasField("eventName")) {
        return fail('`Event name` setting is required when calling `track`');
    }

    let properties = null;
    if (dataHasField("eventProperties")) {
        properties = makeTableMap(data.eventProperties || [], 'propertyKey', 'propertyValue');
    }

    journify.track(data.eventName, properties)
        .then((ctx) => log(LOG_PREFIX + 'Success: Journify Track call, context', ctx))
        .catch((e) => fail(e));
};

const page = (journify) => {
    let pageName = null;
    if (dataHasField("pageName")) {
        pageName = data.pageName;
    }

    let properties = null;
    if (dataHasField("pageProperties")) {
        properties = makeTableMap(data.pageProperties || [], 'propertyKey', 'propertyValue');
    }

    journify.page(pageName, properties)
        .then((ctx) => log(LOG_PREFIX + 'Success: Journify Page call, context', ctx))
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