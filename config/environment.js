/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'modlog',
    environment: environment,
    baseURL: '/',
    locationType: 'hash',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    redditUser: 'publicmodlogs',
    redditFeed: 'c7b83b457469643f1912d5fee30e18dba808f351',

    consumerKey: 'p93jnimz0njKow',
    redirectUrl: 'http://localhost:4342/#/?',

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    contentSecurityPolicy: {
      'default-src': "'none'",
      'script-src': "'self'",
      'font-src': "'self' http://maxcdn.bootstrapcdn.com https://maxcdn.bootstrapcdn.com http://fonts.gstatic.com https://fonts.gstatic.com",
      'connect-src': "'self' https://*.reddit.com http://*.reddit.com",
      'img-src': "'self' http://maxcdn.bootstrapcdn.com https://maxcdn.bootstrapcdn.com http://*.redditmedia.com data",
      'style-src': "'self' 'unsafe-inline' http://maxcdn.bootstrapcdn.com https://maxcdn.bootstrapcdn.com http://fonts.googleapis.com https://fonts.googleapis.com",
      'media-src': "'self'"
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.baseURL = '/';
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {
    ENV.consumerKey = 'UA_O1fRBjh7_lQ';
    ENV.redirectUrl = 'https://modlog.github.io/#/?';
  }

  return ENV;
};
