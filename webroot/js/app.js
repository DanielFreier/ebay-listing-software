define([
  'jquery',
  'underscore',
  'backbone',
  'router',
  'events',
  'ebay-amd',
], function($, _, Backbone, Router, Events, ebayjs) {
  
  /*
  _.templateSettings = {
    interpolate : /\{\{(.+?)\}\}/g
  };
  */
  
  var initialize = function() {
    
	  $('#message').width($('#navbar').width() - 300).css('margin', '0 150px');
    
    /* global hook */
    $(document).ajaxComplete(function(event, xhr, settings) {
	    
	    var data = $.parseJSON(xhr.responseText);
	    
	    if (data.json == null
          || data.json.message == null
			    || data.json.message.message == null
			    || data.json.message.message == '') {
        
	      $('#message').fadeOut(800);
        //ebayjs.showmessage('');
        
		    return;
	    }
	    
      ebayjs.showmessage(data.json.message.message);
	    
	    if (data.json.message.hasnext) {
        
		    timeout = setTimeout(function() {
          Events.trigger('items:refresh', {});
          //ebayjs.refresh();
        }, 2000);
        
	    } else {
        
		    //timeout = setTimeout('ebayjs.dismissmessage()', 2000);
        
		    timeout = setTimeout(function() {
          
	        $('#message').fadeOut(800);
	        
	        clearTimeout(timeout);
	        
	        $.post('/node/json/dismissmessage',
			           null,
			           function(data) {
			           },
			           'json');
	        
	        return;
        }, 2000);
	    }
      
	    return;
    });
    
    Router.initialize();
    
  }
  
  return {
    initialize: initialize
  };
  
});
