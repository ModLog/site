import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

export default Router.map(function() {
  this.route('log', {path: '/r/:subreddit'});
  this.resource('scanner', {path: '/scan'}, function() {
    this.resource('scan', {path: ':subreddit'});
  });
  this.route('radio');
  this.route('monitor');
  this.route('privacy');
});
