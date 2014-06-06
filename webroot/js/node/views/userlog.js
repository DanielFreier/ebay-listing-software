define([
  'jquery',
  'underscore',
  'backbone',
  'events',
  'ebay-amd',
  'node/models/userlog'
], function($, _, Backbone, Events, ebayjs, UserLogModel) {
  
  var UserLogView = Backbone.View.extend({
    
    el: '#userlog',
    
    template: _.template($('#userlogTemplate').html()),
    
    events: {
    },
    
    initialize: function() {
      
      this.model = new UserLogModel();
      
      Events.on('userlog:click', _.bind(function(message) {
        
        this.model.fetch({
          
          type: 'POST',
          
          success: _.bind(function() {
            
            this.render();
            
          }, this)
          
        });
        
      }, this));
      
    },
    
    render: function() {
      
      var userlogTemplate = this.template(this.model.toJSON());
      $('table', this.el).remove();
      $(this.el).append(userlogTemplate);
      
      return this;
    }
    
  });
  
  return UserLogView;
});
