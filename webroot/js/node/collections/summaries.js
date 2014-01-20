define([
  'underscore',
  'backbone',
  'node/models/summary'
], function(_, Backbone, SummaryModel) {
  
  var SummaryCollection = Backbone.Collection.extend({
    
    model: SummaryModel,
    
    url: '/node/json/summaries',
    
    parse: function(response) {
      return response;
    }
    
  });
  
  return SummaryCollection;
});
