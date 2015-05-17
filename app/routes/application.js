import Ember from 'ember';

export default Ember.Route.extend({
  snoocore: Ember.inject.service(),

  model: function() {
    return this.get('snoocore');
  },

  redirect: function() {
    if (this.get('snoocore').checkLogin()) {
      this.transitionTo('index');
    }
  }
});
