import Ember from 'ember';

var detected = [];

export default Ember.Route.extend({
  model: function() {
    return detected;
  }
});
