import Ember from 'ember';

var decodeEntities = (function() {
  // this prevents any overhead from creating the object each time
  var element = document.createElement('div');

  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }

  return decodeHTMLEntities;
})();

export default Ember.Route.extend({
  model: function() {
    return Ember.RSVP.resolve(Ember.$.ajax({
      url: 'https://www.reddit.com/r/publicmodlogs/wiki/index.json'
    })).then(function(result) {return result.data;}).then(function(data) {
      data.content_html = decodeEntities(data.content_html);
      return data;
    });
  }
});
