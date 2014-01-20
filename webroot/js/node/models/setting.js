define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var Setting = Backbone.Model.extend({
    
    url: '/node/json/settings',
    
    parse: function(response) {
      return response.json.settings;
    }
    
  });
  
  return Setting;
});
