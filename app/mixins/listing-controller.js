import Ember from 'ember';

export default Ember.Mixin.create({
  queryParams: ['before', 'after', 'limit'],
  before: '',
  after: '',
  count: 0,
  limit: 25,
  last: Ember.computed.alias('model.lastObject'),
  first: Ember.computed.alias('model.firstObject'),
  hasMore: function() {
    return this.get('listing.length') >= this.get('limit');
  }.property('listing.length', 'limit')
});
