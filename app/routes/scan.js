import Ember from 'ember';

export default Ember.Route.extend({
  snoocore: Ember.inject.service(),
  modlog: Ember.inject.service(),

  queryParams: {
    after: {
      refreshModel: true
    },
    before: {
      refreshModel: true
    },
    limit: {}
  },

  model: function(args) {
    var snoo = this.get('snoocore.api');
    var modlog = this.get('modlog');
    var nextAfter;
    var detected = this.modelFor('scanner');
    return snoo('/r/' + args.subreddit).listing({
      limit: args.limit,
      after: args.after,
      before: args.before
    }).then(function(slice) {
      return slice.children.getEach('data');
    }).then(function(posts) {
      nextAfter = posts.get('lastObject.name');
      return Ember.RSVP.all(posts.map(function(post) {
        return modlog.scanUrl(post.url).catch(function(e) {
          console.warn(e);
          return [];
        });
      }));
    }).then(function(removedLists) {
      var removed = [];
      removedLists.forEach(function(items) {
        removed.addObjects(items);
      });
      removed = removed.filter(function(post) {
        return !detected.findProperty('id', post.id);
      });
      removed.nextAfter = nextAfter;
      return removed;
    });
  },

  afterModel: function(model) {
    var detected = this.modelFor('scanner');
    model.forEach(function(post) {
      detected.insertAt(0, post);
    });
  }
});
