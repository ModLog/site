import Ember from 'ember';

export default Ember.Route.extend({
  snoocore: Ember.inject.service(),
  gradio: Ember.inject.service(),


  model: function() {
    return this.get('snoocore');
  },

  redirect: function() {
    var route = this;
    return this.get('snoocore').checkLogin().then(function(isLoggedIn) {
      if (isLoggedIn) {
        route.transitionTo('monitor').then(function() {
          route.transitionTo('radio');
        });
      }
    });
  },

  actions: {
    playRadio: function() {
      this.get('gradio').play();
    },
    stopRadio: function() {
      this.get('gradio').stop();
    },
    playNext: function() {
      this.get('gradio').playNext();
    },
    playPrevious: function() {
      this.get('gradio').playPrevious();
    }
  }
});
