define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone) {
  
  var Item = Backbone.Model.extend({
    
    idAttribute: '_id',
    
    // http://stackoverflow.com/questions/18652437/backbone-not-parse-each-model-in-collection-after-fetch
    parse: function(response, options) {
      
      if (options.collection) return response;
      
      this.detailView.HashModel.set({
        json: response.json
      });
      
	    var htmlencoded = $('<div/>').text($.dump(response.json.item)).html();
	    $('#debug').html('<pre>'+htmlencoded+'</pre>');
      
      return response.json.item;
    }
    
  });
  
  return Item;
});
