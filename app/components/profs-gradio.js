import Ember from 'ember';

export default Ember.Component.extend({
  gradio: Ember.inject.service(),
  classNames: 'profs-gradio'.w(),
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
