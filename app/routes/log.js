import Ember from 'ember';
import config from 'modlog/config/environment';

export default Ember.Route.extend({
  model: function(args) {
    var url = 'http://www.reddit.com/r/' + args.subreddit + '/about/log/.json?feed=' + config.redditFeed +'&user=' + config.redditUser + '&limit=100';
    return Ember.RSVP.resolve(Ember.$.ajax({
      url: 'http://jsonp.afeld.me/?url=' + encodeURIComponent(url),
      dataType: 'json'
    })).then(function(result) {
      return result.data.children.getEach('data');
    }).then(function(model) {
      model.subreddit = args.subreddit;
      //console.log('model', model);
      return model;
    });
  }
});
