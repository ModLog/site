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
      return known.filter(function(item) {return item.author !== '[deleted]';});
    }).then(function(known) {
      if (!known.length) {throw 'No known posts for ' + url;}
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
  scannedUsers: function() {return {};}.property(),
  unprocessed: Ember.computed.setDiff('detected', 'processed'),
  processed: function() {return [];}.property(),
  shouldReport: Ember.computed.alias('snoocore.isLoggedIn'),

  scanLoop: function(listing) {
    var modlog = this;
    var before;
    var detected = this.get('detected');
    var reported = this.get('reported');
    var snoo = this.get('snoocore.api');
    function loop() {
      var shouldReport = modlog.get('snoocore.isLoggedIn')
      return modlog.scanListing(listing, detected, before).then(function(removed) {
        before = removed.nextbefore;
        return removed.filter(function(item) {
          return !detected.findProperty('id', item.id);
        });
      }).then(loop);
    }
    return loop();
  },

  unprocessedDidChange: function() {
    var snoo = this.get('snoocore.api');
    if (!this.get('shouldReport')) {return;}
    var unprocessed = this.get('unprocessed').slice();
    var reported = this.get('reported');
    if (!unprocessed.length) {return;}
    this.get('processed').addObjects(unprocessed);
    return Ember.RSVP.all(unprocessed.map(function(item) {
      var flair = item.subreddit + '|' + item.author;
      return snoo('/api/submit').post({
        sr: 'modlog',
        kind: 'link',
        title: item.title,
        url: 'https://www.reddit.com' + item.permalink + '#' + flair,
        extension: 'json',
        sendreplies: false
      }).then(function() {
        reported.addObject(item);
      }).catch(function() {
        //console.warn(error, error.stack);
      });
    }));
  }.observes('unprocessed.@each', 'shouldReport').on('init'),

  scanListing: function(listing, detected, before) {
    var anon = this.get('snoocore.anon');
    var modlog = this;
    detected = detected || [];
    return anon('/r/' + listing).listing({
      limit: 10,
      before: before
    }).then(function(slice) {
      return slice.children.getEach('data');
    }).then(function(posts) {
      return posts.filterProperty('is_self', false);
    }).then(function(posts) {
      return posts.filterProperty('over_18', false);
    }).then(function(posts) {
      before = posts.get('firstObject.name');
      return posts.getEach('author').uniq().without('[deleted]');
    }).then(function(authors) {
      return Ember.RSVP.all(authors.map(function(author) {
        return anon('/user/' + author + '/overview').listing({
          limit: 100
        }).then(function(slice) {
          return slice.children.getEach('data');
        }).then(function(items) {
          var urls = items.getEach('url').without(undefined).uniq().slice(0, 10);
          return Ember.RSVP.all(urls.map(function(url) {
            return modlog.scanUrl(url).catch(function(e) {
              console.warn(e);
              return [];
            });
          })).then(function(removedLists) {
            var removed = [];
            removedLists.forEach(function(items) {
              removed.addObjects(items.filter(function(post) {
                return !detected.findProperty('id', post.id);
              }));
            });
            detected.addObjects(removed);
            return removed;
          });
        }).catch(function(error) {
          console.warn('error with', author, error);
          return [];
        });
      }));
    }).then(function(removedLists) {
      var removed = [];
      removedLists.forEach(function(items) {
        removed.addObjects(items);
      });
      removed.listing = listing;
      removed.nextbefore = before;
      return removed;
    });
  }
});
