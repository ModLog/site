import Ember from 'ember';

export default Ember.Service.extend({
  snoocore: Ember.inject.service(),

  scanUrl: function(url) {
    var snoo = this.get('snoocore.api');
    return snoo('/api/info').get({url: url}).then(function(result) {
      return result.data.children.getEach('data');
    }).then(function(known) {
      if (!known || !known.length) {throw 'No known posts for ' + url;}
      var mirror = known.get('firstObject.id');
      return snoo('/duplicates/$article').listing({
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
  }
});
