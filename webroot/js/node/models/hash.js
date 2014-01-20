define([
  'underscore',
  'backbone',
  'events'
], function(_, Backbone, Events) {
  
  var Hash = Backbone.Model.extend({
    
    //idAttribute: 'CategoryID',
    
    initialize: function() {
      
      /*
      console.log('category model initialized');
      
      Events.on('site:changed', function(message) {
        console.dir(message);
        console.log('itemid' + this.itemid);
      });
      */
      
    }
    
  });
  
  return Hash;
});
