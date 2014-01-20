define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var Summary = Backbone.Model.extend({
    idAttribute: 'userid'
  });
  
  return Summary;
});
