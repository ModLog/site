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
    if (!this.get('snoocore.isLoggedIn')) {return;}
    //this.get('modlog').scanLoop('/r/all/new');
    var modlog = this.get('modlog');
    this.get('modlog').scanLoop('/r/Stuff/hot');
    this.get('modlog').scanLoop('/user/PoliticBot/m/watch/hot.json');
  }.observes('snoocore.isLoggedIn').on('init'),

  actions: {
    showMore: function() {
      this.set('itemsToShow', this.get('itemsToShow') + 100);
    }
  }
});
