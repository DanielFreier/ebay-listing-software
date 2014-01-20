define([
  'jquery',
  'underscore',
  'backbone',
  'events'
], function($, _, Backbone, Events) {
  
  var BodyView = Backbone.View.extend({
    
    el: 'body',
    
    events: {
      'scroll': 'scroll'
    },
    
    initialize: function() {
      _.bindAll(this, 'scroll');
      $(window).scroll(this.scroll);
    },
    
    scroll: function() {
      
		  var top = $(window).scrollTop();
      var window_h = $(window).height();
      var container_h = $('#main-container').height();
      var breadcrumbs_h = $('#breadcrumbs').height();
      var navi_h = $('#navbar').height();
      
      if (window_h >= navi_h + container_h) {
        return;
      }
      
      //console.log('scroll: ' + top + ' : ' + (navi_h + container_h + breadcrumbs_h + 1 - window_h));
      
      if (top >= navi_h + container_h + breadcrumbs_h + 1 - window_h) {
        Events.trigger('body:scrollbottom');
      }
    }
    
  });
  
  return BodyView;
});
