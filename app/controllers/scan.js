import Ember from 'ember';
import ListingControllerMixin from 'modlog/mixins/listing-controller';

export default Ember.Controller.extend(ListingControllerMixin, {
  limit: 5
});
