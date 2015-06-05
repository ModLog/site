import Ember from 'ember';

function getParamByName(url, name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(url);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function shuffle(o){
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

export default Ember.Service.extend(Ember.Evented, {
  snoocore: Ember.inject.service(),
  threadId: 'uocz16gmx2s7',

  lastUpdate: {},

  playlist: [],

  autoplay: false,

  updates: function() {
    return [];
  }.property(),

  play: function() {
    this.playNext();
  },

  stop: function() {
    this.set('autoplay', false);
    this.set('lastUpdate.ytid', this.get('nextPlaylistId'));
  },

  fetchPlaylist: function() {
    var anon = this.get('snoocore.anon');
    var self = this;
    var results = this.get('playlist');
    results.removeObjects(results);
    return anon('/r/FORTradio/top.json').listing({
      limit: 100
    }).then(function(slice) {
      results.addObjects(slice.allChildren.getEach('data').map(function(post) {
        return getParamByName(post.url, 'v');
      }));
      function getNext() {
        return slice.next().then(function(nextSlice) {
          slice = nextSlice;
          results.addObjects(slice.allChildren.getEach('data').map(function(post) {
            return getParamByName(post.url, 'v');
          }));
          if (!slice.empty) {return getNext();}
          return results;
        });
      }
      return getNext();
    }).then(function(results) {
      return shuffle(results);
    }).then(function(results) {
      self.set('playlist', results);
    });
  }.on('init'),

  currentPlaylistIdx: function() {
    return this.get('playlist').indexOf(this.get('lastUpdate.ytid'));
  }.property('lastUpdate.ytid', 'playlist.@each'),

  nextPlaylistId: function() {
    var idx = (this.get('currentPlaylistIdx') + 1) % (this.get('playlist.length'));
    return this.get('playlist.' + idx) || this.get('playlist.firstObject');
  }.property('currentPlaylistIdx'),

  previousPlaylistId: function() {
    var idx = (this.get('currentPlaylistIdx') - 1);
    if (idx < 0) {
      idx = this.get('playlist.length') + idx;
      idx = idx % (this.get('playlist.length'));
    }
    return this.get('playlist.' + idx);
  }.property('currentPlaylistIdx'),

  playNext: function() {
    this.set('autoplay', true);
    this.set('lastUpdate.ytid', this.get('nextPlaylistId'));
  },

  playPrevious: function() {
    this.set('autoplay', true);
    this.set('lastUpdate.ytid', this.get('previousPlaylistId'));
  },

  socket: function() {
    var id = this.get('threadId');
    var anon = this.get('snoocore.anon');
    var self = this;
    return Ember.RSVP.hash({
      url: anon('/live/' + id + '/about.json').get().then(function(result) {
        return result.data.websocket_url;
      }),
      listing: anon('/live/' + id + '.json').listing({

      }).then(function(slice) {
        return (slice.children || []).getEach('data');
      })
    }).then(function(hash) {
      var ws = new WebSocket(hash.url);
      var listing = hash.listing.reverse();
      listing.forEach(function(item) {
        self.trigger('didReceiveSocketEvent', item);
      });
      ws.onopen = function() {
      };
      ws.onerror = function(e) {
        console.log('socket error', e);
      };
      ws.onclose = function() {
        console.log('socket close');
      };
      ws.onmessage = function(evt) {
        Ember.run(function() {
          var data = JSON.parse(evt.data);
          if (!data || !data.payload ||  !data.payload.data) {return;}
          self.trigger('didReceiveSocketEvent', data.payload.data);
        });
      }
    });
  }.property('threadId'),

  didReceiveSocketEvent: function(data) {
    try {
    var anon = this.get('snoocore.anon');
    var self = this;
    var lines = data.body.split('\n').map(function(line) {
      return line.trim();
    }).without('');
    var link = lines[0];
    var tube = lines[lines.length - 1];
    var parts = link.split('/');
    var id = parts.pop();
    var slut = parts.pop();
    var postId = parts.pop();
    var ytid = getParamByName(tube, 'v');
    return anon('/api/info').get({
      id: 't3_' + postId + ',t1_' + id
    }).then(function(result) {
      var update = {
        url: link,
        post: Ember.get(result, 'data.children.0.data'),
        comment: Ember.get(result, 'data.children.1.data'),
        ytid: self.get('lastUpdate.ytid') || ytid
      };
      self.get('updates').insertAt(0, update);
      self.set('lastUpdate', update);
    });
    } catch(e) {console.error(e);}
  }.on('didReceiveSocketEvent'),

  connectSocket: function() {
    var socket = this.get('socket');
  }.on('init')
});
