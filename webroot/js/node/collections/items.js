define([
  'jquery',
  'underscore',
  'backbone',
  'node/models/item'
], function($, _, Backbone, ItemModel) {
  
  var ItemCollection = Backbone.Collection.extend({
    
    model: ItemModel,
    
    url: '/node/json/items',
    
    parse: function(response) {
      
      /* pagination */
		  var offset = parseInt($('input.filter[name="offset"]', '#hiddenforms').val());
		  var limit  = parseInt($('input.filter[name="limit"]',  '#hiddenforms').val());
		  
		  var loaded = offset + limit;
		  if (loaded > response.json.cnt) {
			  loaded = response.json.cnt;
		  }
		  $('#listcount').html(loaded + ' of ' + response.json.cnt);
      
		  $('input.filter[name="total"]',  '#hiddenforms').val(response.json.cnt);
      
      console.dir(response.json.items);
      
	    var htmlencoded = $('<div/>').text($.dump(response.json.items)).html();
	    $('#debug').html('<pre>'+htmlencoded+'</pre>');
      
      return response.json.items;
    }
    
  });
  
  return ItemCollection;
});
