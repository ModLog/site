import Ember from 'ember';

export default Ember.Controller.extend({
  gradio: Ember.inject.service(),
  snoocore: Ember.inject.service(),

  autoplay: Ember.computed.alias('gradio.autoplay'),
  ytid: Ember.computed.alias('gradio.lastUpdate.ytid'),
  queryParams: ['autoplay', 'ytid']
});
