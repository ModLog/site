import Ember from 'ember';

export default Ember.Service.extend({
  snoocore: Ember.inject.service(),

  handleExpiredAuth: function() {
    var self = this;
    this.get('snoocore.api').on('access_token_expired', function(responseError) {
      window.location = self.get('snoocore.loginUrl');
    });
  }.observes('snoocore.api').on('init'),

  multis: {},

  subs: function() {
    return ['snew', 'modlog'].concat(this.getMulti('self')).concat(this.getMulti('link')).uniq().sort();
  }.property('multis', 'multis'),

  getMulti: function(name) {
    return this.get('multis.' + name.toLowerCase()) || [];
  },

  fetchMultis: function() {
    var anon = this.get('snoocore.anon');
    var self = this;
    return anon('/api/multi/user/PoliticBot').get({
    }).then(function(result) {
      return result.getEach('data').map(function(multi) {
        multi.subreddits = (multi.subreddits || []).getEach('name').map(function(j) {
          return j.toLowerCase();
        });
        return multi;
      });
    }).then(function(multis) {
      var result = {};
      multis.forEach(function(multi) {
        result[multi.name.toLowerCase()] = multi.subreddits;
      });
      return result;
    }).then(function(multis) {
      self.set('multis', multis);
      return multis;
    });
  }.on('init'),

  scanUrl: function(url) {
    var anon = this.get('snoocore.anon');
    var snoo = this.get('snoocore.api');
    var self = this;
    return anon('/api/info').get({url: url}).then(function(result) {
      return (result.data.children || []).getEach('data');
    }).then(function(known) {
      return known.filter(function(item) {return item.author !== '[deleted]';});
    }).then(function(known) {
      if (!known) {return;}
      if (known.length === 1) {
        var item = known[0];
        if (!item.over_18 && !item.domain.match(/(imgur|reddit.com)/)) {
          snoo('/api/submit').post({
            sr: 'Stuff',
            kind: 'link',
            title: (item.title).slice(0, 299),
            url: item.url + '#' + item.subreddit + '|' + item.author,
            extension: 'json',
            sendreplies: false
          });
        }
        return;
      }
      var mirror = known.get('firstObject.id');
      return anon('/duplicates/$article').listing({
        $article: mirror, limit: 100
      }, {listingIndex: 1}).then(function(dupes) {
        return (dupes.children || []).getEach('data');
      }).then(function(dupes) {
        if (!known) {return [];}
        var knownIds = known.getEach('id');
        var dupeIds = dupes.getEach('id').concat([mirror]);
        var removedIds = knownIds.slice().removeObjects(dupeIds);
        var known = known.sortBy('sort:desc');
        self.processPosts(known);
        return removedIds.map(function(id) {
          return known.findProperty('id', id);
        });
      });
    });
  },

  detected: function() {return [];}.property(),
  detectedComments: function() {return [];}.property(),
  reported: function() {return [];}.property(),
  reportedComments: function() {return [];}.property(),
  scannedUsers: function() {return {};}.property(),
  unprocessed: Ember.computed.setDiff('detected', 'processed'),
  unprocessedComments: Ember.computed.setDiff('detectedComments', 'processedComments'),
  processed: function() {return [];}.property(),
  processedComments: function() {return [];}.property(),
  shouldReport: Ember.computed.alias('snoocore.isLoggedIn'),

  scanLoop: function(listing) {
    var modlog = this;
    var before;
    var detected = this.get('detected');
    var reported = this.get('reported');
    var snoo = this.get('snoocore.api');
    function loop() {
      var shouldReport = modlog.get('snoocore.isLoggedIn');
      return modlog.fetchMultis().then(function() {
        return modlog.scanListing(listing, detected, before);
      }).then(function(removed) {
        before = removed.nextbefore;
        return (removed || []).filter(function(item) {
          return !detected.findProperty('id', item.id);
        })
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
      var score = item.score;
      if (item.score > 0) {
        score = '+' + item.score;
      }
      return snoo('/api/submit').post({
        sr: 'modlog',
        kind: 'link',
        title: (score + ' ' + item.num_comments + ' ' + item.title).slice(0, 299),
        url: 'https://rm.reddit.com' + item.permalink + '#' + flair,
        extension: 'json',
        sendreplies: false
      }).then(function() {
        reported.addObject(item);
      }).catch(function() {
        //console.warn(error, error.stack);
      }).finally(function() {
        if (item.score > 100 || item.num_comments > 50) {
          return snoo('/api/submit').post({
            sr: 'snew',
            kind: 'link',
            title: (score + ' ' + item.num_comments + ' ' + item.title).slice(0, 299),
            url: 'https://us.reddit.com' + item.permalink + '#' + flair,
            extension: 'json',
            sendreplies: false
          });
        }
      });
    }));
  }.observes('unprocessed.@each', 'shouldReport').on('init'),

  unprocessedCommentsDidChange: function() {
    var snoo = this.get('snoocore.api');
    if (!this.get('shouldReport')) {return;}
    var unprocessed = this.get('unprocessedComments').slice();
    var reported = this.get('reportedComments');
    if (!unprocessed.length) {return;}
    this.get('processedComments').addObjects(unprocessed);
    return Ember.RSVP.all(unprocessed.map(function(item) {
      var flair = item.subreddit + '|' + item.author;
      var score = item.score;
      if (item.score > 0) {
        score = '+' + item.score;
      }
      return snoo('/api/submit').post({
        sr: 'modlog',
        kind: 'link',
        title: (score + ' Comment ' + item.id + 'on ' + item.link_id+':' + item.parent_id + ' ' + item.link_title).slice(0, 299),
        url: 'https://rm.reddit.com' + item.profilelink + '#' + flair,
        extension: 'json',
        sendreplies: false
      }).then(function() {
        reported.addObject(item);
      }).catch(function() {
        //console.warn(error, error.stack);
      });
    }));
  }.observes('detectedComments.length').on('init'),

  findMissingComments: function(comments) {
    var anon = this.get('snoocore.anon');
    var detected = this.get('detectedComments');
    return anon('/api/info').get({
      id: comments.getEach('name').join(',')
    }).then(function(result) {
      return result.data.children.getEach('data');
    }).then(function(result) {
      return result.filterProperty('author', '[deleted]');
    }).then(function(removed) {
      return removed.map(function(item) {
        return comments.findProperty('id', item.id);
      });
    }).then(function(removed) {
      detected.addObjects(removed.filter(function(item) {
        return !detected.findProperty('id', item.id);
      }));
      return removed;
    });
  },

  processPosts: function(posts) {
    var snoo = this.get('snoocore.api');
    var self = this;
    var linksubs = this.getMulti('link');
    var selfsubs = this.getMulti('self');
    console.log(linksubs, selfsubs, posts.getEach('subreddit').uniq());
    this.getMulti('link').forEach(function(sub) {
      return posts.filterProperty('is_self', false).filter(function(item) {
        return !!item.url && self.getMulti(sub).contains(item.subreddit.toLowerCase());
      }).forEach(function(item) {
        console.log('link', item);
        return snoo('/api/submit').post({
          sr: sub,
          kind: 'link',
          title: (item.title).slice(0, 299),
          url: item.url,
          extension: 'json',
          sendreplies: false
        });
      });
    });
    this.getMulti('self').forEach(function(sub) {
      posts.filterProperty('is_self', true).filter(function(item) {
        return self.getMulti(sub).contains(item.subreddit.toLowerCase());
      }).forEach(function(item) {
        console.log('self', item);
        return snoo('/api/submit').post({
          sr: sub,
          kind: 'link',
          title: item.title,
          url: 'https://us.reddit.com' + item.permalink + '#' + item.subreddit + '|' + item.author,
          extension: 'json',
          sendreplies: false
        });
      });
    });
  },

  scanListing: function(listing, detected, before) {
    var anon = this.get('snoocore.anon');
    var snoo = this.get('snoocore.api');
    var modlog = this;
    var self = this;
    detected = detected || [];
    return anon('/r/' + listing).listing({
      limit: 100,
      before: before
    }).then(function(slice) {
      return (slice.children || []).getEach('data');
    }).then(function(posts) {
      return posts.filterProperty('is_self', false);
    }).then(function(posts) {
      return posts;//.filterProperty('over_18', false);
    }).then(function(posts) {
      before = posts.get('firstObject.name');
      self.processPosts(posts);
      return posts.getEach('author').uniq().without('[deleted]');
    }).then(function(authors) {
      return Ember.RSVP.all(authors.map(function(author) {
        return anon('/user/' + author + '/overview').listing({
          limit: 100
        }).then(function(slice) {
          return (slice.children || []).getEach('data');
        }).then(function(items) {
          var urls = items.filterProperty('is_self', false).getEach('url').without(undefined).uniq().slice(0, 10);
          var comments = items.filter(function(item) {
            return !!item.parent_id;
          });
          var after = null;
          comments = comments.map(function(comment) {
            if (after) {
              after.before = comment.name;
              comment.after = after.name;
            }
            after = comment;
            return comment;
          });
          comments.forEach(function(item) {
            item.profilelink = '/user/' + item.author + '/comments?limit=1&before=' + item.before + '&after=' + item.after;
            return item;
          });
          comments.popObject();
          comments = comments.reverse();
          comments.popObject();
          return Ember.RSVP.all(urls.map(function(url) {
            return modlog.scanUrl(url).catch(function(e) {
              console.warn(e);
              return [];
            });
          })).then(function(removedLists) {
            var removed = [];
            if (!removedLists) {return;}
            removedLists.forEach(function(items) {
              removed.addObjects((items || []).filter(function(post) {
                return !detected.findProperty('id', post.id);
              }));
            });
            detected.addObjects(removed);
            return removed;
          }).then(function(removed) {
            if (!removed) {return [];}
            if (!comments.length) {return removed;}
            return modlog.findMissingComments(comments).then(function() {
              return removed;
            });
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
