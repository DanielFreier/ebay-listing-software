define([
  'jquery',
  'underscore',
  'backbone',
  'events',
  'ebay-amd'
], function($, _, Backbone, Events, ebayjs) {
  
  var HelpView = Backbone.View.extend({
    
    el: '#help',
    
    events: {
      'click .addebayaccount': 'clickAddeBayAccount'
    },
    
    initialize: function() {
      
      Events.on('help:click', _.bind(function(message) {
        
        $('#help').show();
        $('#items').hide();
        $('#settings').hide();
        
      }, this));
      
    },
    
    clickAddeBayAccount: function(e) {

      if (ebayjs.checkdemoaccount()) return;
      
      $('span', $(e.currentTarget).parent()).show();
      
		  $.post('/node/json/addaccount',
			       null,
			       function(data) {
               if (data.message) {
                 $('span', $(e.currentTarget).parent()).hide();
                 alert(data.message);
               } else {
				         window.location.href = data.json.url;
               }
			       },
			       'json');
      
    }
    
  });
  
  return HelpView;
});
