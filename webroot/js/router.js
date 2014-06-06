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
  'node/views/help',
  'node/views/userlog'
], function($, _, Backbone, Events, ebayjs,
            SummaryListView, ItemListView, BodyView, NavbarView,
            SettingView, HelpView, UserLogView) {
  
  var AppRouter = Backbone.Router.extend({
    routes: {
      '': 'index',
      'settings': 'settings',
      'history':  'userlog',
      'help':     'help',
      'items/:userid/:status': 'list'
    }
  });
  
  var initialize = function() {
    
    var summaryListView = new SummaryListView();
    
    var app_router = new AppRouter;
    
    app_router.on('route:settings', function() {
      $('#page-content > .row > div').children().hide();
      $('#settings').show();
      Events.trigger('settings:click', {});
    });
    
    app_router.on('route:help', function() {
      $('#page-content > .row > div').children().hide();
      $('#help').show();
    });
    
    app_router.on('route:userlog', function() {
      $('#page-content > .row > div').children().hide();
      $('#userlog').show();
      Events.trigger('userlog:click', {});
    });
    
    app_router.on('route:index', function(actions) {
      
      $('#nav-alluserids').addClass('open')
      $('#nav-alluserids > ul').css('display', 'block');
      
      var status = 'active';
      
      if ($('#user_email').attr('data-email') == 'demo@listers.in') {
        status = 'saved';
      }
      
      $('#nav-alluserids-' + status).addClass('active');
      
      Events.trigger('filter:click', {
        userid: 'alluserids',
        status: status
      });
      
      var submenus = $('ul.submenu', '#summaries').length;
      if (submenus == 1) {
        app_router.navigate('/settings', {trigger: true});
      }
      
    });
    
    app_router.on('route:list', function(userid, status) {
      
      if (!$('#nav-' + userid).hasClass('open')) {
        $('#nav-' + userid).addClass('open')
        $('#nav-' + userid + ' > ul').css('display', 'block');
      } 
      
      $('li.active').removeClass('active');
      if (!$('#nav-' + userid + '-' + status).hasClass('active')) {
        $('#nav-' + userid + '-' + status).addClass('active');
      }
      
      Events.trigger('filter:click', {
        userid: userid,
        status: status
      });
      
    })
    
    var itemListView = new ItemListView();
    
    var bodyView = new BodyView();
    
    var navbarView = new NavbarView();
    
    var settingView = new SettingView();
    
    var helpView = new HelpView();
    
    var userlogView = new UserLogView();
    
    Backbone.history.start();
  };
  
  return {
    initialize: initialize
  };
  
});
