import Ember from 'ember';

export default Ember.Controller.extend({
  modlog: Ember.inject.service(),
  snoocore: Ember.inject.service(),
  
  detectedSort: ['score:desc'],
  detected: Ember.computed.sort('modlog.detected', 'detectedSort'),


  itemsToShow: 100,

  detections: function() {
    return this.get('detected').slice(0, this.get('itemsToShow'));
  }.property('detected.@each', 'itemsToShow'),

  detectionsNotShown: Ember.computed.setDiff('detected', 'detections'),

  startScanning: function() {
    this.get('modlog').scanLoop('all');
  }.on('init'),

  actions: {
    showMore: function() {
      this.set('itemsToShow', this.get('itemsToShow') + 100);
    }
  }
});
