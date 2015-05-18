import Ember from 'ember';

export default Ember.Route.extend({
  snoocore: Ember.inject.service(),

  model: function() {
    return this.get('snoocore');
  },

  redirect: function() {
    var route = this;
    return this.get('snoocore').checkLogin().then(function(isLoggedIn) {
      if (isLoggedIn) {
        route.transitionTo('monitor');
      }
    });
  }
});
