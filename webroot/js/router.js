define([
  'jquery',
  'underscore',
  'backbone',
  'events',
  'node/views/summaries',
  'node/views/items',
  'node/views/body',
  'node/views/navbar',
  'node/views/setting',
  'node/views/help'
], function($, _, Backbone, Events, SummaryListView, ItemListView, BodyView, NavbarView,
            SettingView, HelpView) {
  
  var AppRouter = Backbone.Router.extend({
    routes: {
      '*actions': 'defaultRoute'
    }
  });
  
  var initialize = function() {
    
    var app_router = new AppRouter;
    
    app_router.on('route:defaultRoute', function(actions) {
    })
    
    var summaryListView = new SummaryListView();
    
    summaryListView.collection.fetch({
      success: function(collection, response, options) {
        
        if (collection.length == 0) {
          Events.trigger('help:click', {});
          return;
        }
        
        summaryListView.render();
        
        $('a[data-userid="alluserids"][data-sellingstatus="allitems"]').click();
        
        var lis = ['active', 'unsold', 'unanswered', 'sold', 'saved'];
        $.each(lis, function(i, status) {
          var atag = $('a[data-userid="alluserids"][data-sellingstatus="' + status + '"]');
          var cnt = $('span.badge', atag).html();
          if (cnt > 0) {
            $(atag).click();
            return false;
          }
        });
        
      }
    });
    
    var itemListView = new ItemListView();
    
    var bodyView = new BodyView();
    
    var navbarView = new NavbarView();
    
    var settingView = new SettingView();
    
    var helpView = new HelpView();
    
    Backbone.history.start();
  };
  
  return {
    initialize: initialize
  };
  
});
