import Ember from 'ember';

export default Ember.Service.extend({
  snoocore: Ember.inject.service(),

  handleExpiredAuth: function() {
    var self = this;
    this.get('snoocore.api').on('access_token_expired', function(responseError) {
      window.location = self.get('snoocore.loginUrl');
    });
  }.observes('snoocore.api').on('init'),

  scanUrl: function(url) {
    var anon = this.get('snoocore.anon');
    return anon('/api/info').get({url: url}).then(function(result) {
      return result.data.children.getEach('data');
    }).then(function(known) {
      if (!known || !known.length) {throw 'No known posts for ' + url;}
      if (known.length === 1) {throw 'Not enough posts for ' + url;}
      var mirror = known.get('firstObject.id');
      return anon('/duplicates/$article').listing({
        $article: mirror, limit: 100
      }, {listingIndex: 1}).then(function(dupes) {
        return dupes.children.getEach('data');
      }).then(function(dupes) {
        var knownIds = known.getEach('id');
        var dupeIds = dupes.getEach('id').concat([mirror]);
        var removedIds = knownIds.slice().removeObjects(dupeIds);
        return removedIds.map(function(id) {
          return known.findProperty('id', id);
        });
      });
    });
  },

  detected: function() {return [];}.property(),
  reported: function() {return [];}.property(),

  shouldReport: Ember.computed.alias('snoocore.isLoggedIn'),

  scanLoop: function(listing) {
    var modlog = this;
    var after;
    var detected = this.get('detected');
    var reported = this.get('reported');
    var snoo = this.get('snoocore.api');
    function loop() {
      var shouldReport = modlog.get('snoocore.isLoggedIn')
      return modlog.scanListing(listing, detected, after).then(function(removed) {
        after = removed.nextAfter;
        return removed.filter(function(item) {
          return !detected.findProperty('id', item.id);
        });
      }).then(function(removed) {
        detected.addObjects(removed);
        if (!shouldReport) {return;}
        return Ember.RSVP.all(removed.map(function(item) {
          return snoo('/api/submit').post({
            sr: 'modlog',
            kind: 'link',
            title: item.title,
            url: 'https://www.reddit.com' + item.permalink,
            extension: 'json',
            sendreplies: false
          }).then(function() {
            reported.addObject(item);
          }).catch(function() {
            //console.warn(error, error.stack);
          });
        }));
      }).then(loop);
    }
    return loop();
  },

  scanListing: function(listing, detected, after) {
    var anon = this.get('snoocore.anon');
    var modlog = this;
    detected = detected || [];
    return anon('/r/' + listing).listing({
      limit: 10,
      after: after
    }).then(function(slice) {
      return slice.children.getEach('data');
    }).then(function(posts) {
      return posts.filterProperty('is_self', false);
    }).then(function(posts) {
      return posts.filterProperty('over_18', false);
    }).then(function(posts) {
      after = posts.get('lastObject.name');
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
      removed.listing = listing;
      removed.nextAfter = after;
      return removed;
    });
  }
});
