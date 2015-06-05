import Ember from 'ember';

export default Ember.Component.extend({
  gradio: Ember.inject.service(),
  classNames: 'profs-gradio'.w(),
  updates: function() {
    return this.get('gradio.updates').slice(0, this.get('maxUpdates'));
  }.property('gradio.updates.@each', 'maxUpdates'),
  maxUpdates: 100,
  actions: {
    ytEnded: function() {
      console.log('playback ended');
      this.get('gradio').playNext();
    },
    ytPlaying: function() {
      this.get('gradio').set('autoplay', true);
    }
  }
});
