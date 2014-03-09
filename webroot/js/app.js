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
	    
      if (data.user) {
        if (data.user.expired) {
          $('#expired').removeClass('hide');
        }
      }
      
      /* Update left navigation bar item count */
      if (data.summary) {
        
        var tagtemplate = _.template($('#tagTemplate').html());
        
        _.each(data.summary, function(summary) {
          
          var username = summary.username;
          
          for (var key in summary.summary) {
            $('a[data-userid="' + username + '"][data-sellingstatus="' + key + '"] span.badge',
              '#summaries').html(summary.summary[key]);
          }
          
          for (var tag in summary.tags) {
            
            if ($('a[data-userid="' + username + '"][data-sellingstatus="' + tag + '"]').length) {
              
              $('a[data-userid="' + username + '"][data-sellingstatus="' + tag + '"] span.badge',
                '#summaries').html(summary.tags[tag]);
              
              continue;
            }
            
            var tagTemplate = tagtemplate({
              username: username,
              tag: tag,
              count: summary.tags[tag]
            });
            
            $('ul.submenu', '#nav-' + username).append(tagTemplate);
          }
          
          $.each($('li.tag', '#nav-' + username), function(idx, li) {
            
            var tmptag = $('a', li).attr('data-sellingstatus');
            if (summary.tags[tmptag]) return;
            
            $(li).remove();
          });
          
        }, this);
        
      }
      
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
        }, 5000);
	    }
      
	    return;
    });
    
    Router.initialize();
    
  }
  
  return {
    initialize: initialize
  };
  
});
