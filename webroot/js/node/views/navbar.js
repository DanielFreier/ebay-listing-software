define([
  'jquery',
  'underscore',
  'backbone',
  'events'
], function($, _, Backbone, Events) {
  
  var NavbarView = Backbone.View.extend({
    
    el: '#navbar',
    
    events: {
      'click #settingslink': 'clickSettings',
      'click #showhelp': 'clickShowHelp'
    },
    
    clickSettings: function() {
      Events.trigger('settings:click', {});
    },
    
    clickShowHelp: function() {
      Events.trigger('help:click', {});
    }
    
  });
  
  return NavbarView;
});
