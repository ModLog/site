/* globals Snoocore */
import Ember from 'ember';
import config from 'modlog/config/environment';

function getParamByName(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(location.hash.replace(/^#/, '?'));
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


export default Ember.Service.extend({
  userAgent: 'ModLog 0.0.1 by go1dfish',

  scope: [
    'submit'
  ],

  api: function() {
    return new Snoocore({
      userAgent: this.get('userAgent'),
      decodeHtmlEntities: true,
      oauth: {
        type: 'implicit',
        mobile: false,
        duration: 'temporary',
        key: config.consumerKey,
        redirectUri: config.redirectUrl,
        scope: this.get('scope')
      }
    });
  }.property('userAgent', 'scope'),

  anon: function() {
    return new Snoocore({
      userAgent: this.get('userAgent'),
      decodeHtmlEntities: true,
      oauth: {
        type: 'implicit',
        mobile: false,
        duration: 'temporary',
        key: config.consumerKey,
        redirectUri: config.redirectUrl,
        scope: ['read']
      }
    });
  }.property('userAgent'),

  loginUrl: function() {
    return this.get('api').getImplicitAuthUrl();
  }.property('user', 'api'),

  checkLogin: function() {
    var code = getParamByName('access_token');
    var self = this;
    var snoo = this.get('api');
    if (code) {
      return snoo.auth(code).then(function() {
        self.set('isLoggedIn', true);
        return true;
      });
    }
    return Ember.RSVP.resolve(false);
  }
});
