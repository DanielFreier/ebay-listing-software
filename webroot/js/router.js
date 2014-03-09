define([
  'jquery',
  'underscore',
  'backbone',
  'events',
  'ebay-amd',
  'node/views/summaries',
  'node/views/items',
  'node/views/body',
  'node/views/navbar',
  'node/views/setting',
  'node/views/help'
], function($, _, Backbone, Events, ebayjs,
            SummaryListView, ItemListView, BodyView, NavbarView, SettingView, HelpView) {
  
  var AppRouter = Backbone.Router.extend({
    routes: {
      '': 'index',
      'settings': 'settings',
      'help': 'help'
    }
  });
  
  var initialize = function() {
    
    var summaryListView = new SummaryListView();
    
    var app_router = new AppRouter;
    
    app_router.on('route:settings', function() {
      Events.trigger('settings:click', {});
    });
    
    app_router.on('route:help', function() {
      Events.trigger('help:click', {});
    });
    
    app_router.on('route:index', function(actions) {
      
      $('#summaries > li:first > a').click();
      $('a[data-userid="alluserids"][data-sellingstatus="active"]', '#summaries').click();
      
      summaryListView.collection.fetch({
        success: function(collection, response, options) {
          summaryListView.render();
        }
      });
      
      //ebayjs.showmessage('Loading items...');
      
          /*
      summaryListView.collection.fetch({
        success: function(collection, response, options) {
          
          if (collection.length == 0) {
            Events.trigger('help:click', {});
            return;
          }
          
          var summarylis = $('li', '#summaries').length;
          if (summarylis == 0) {
            summaryListView.render();
          }
          
            $('a[data-userid="alluserids"][data-sellingstatus="allitems"]').click();
            
            var lis = ['active', 'unsold', 'unanswered', 'sold', 'saved', 'template'];
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
          */
      
    })
    
    
    
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
