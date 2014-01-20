define([
  'jquery',
  'underscore',
  'backbone',
  'events',
  'node/models/category',
], function($, _, Backbone, Events, CategoryModel) {
  
  var CategoryListView = Backbone.View.extend({
    
    //model: CategoryModel,
    
    initialize: function() {
      
      this.model = new CategoryModel({
        //itemid: this.itemid
      });
      
      var myself = this;
      
      Events.on('site:changed', function(message) {
        
        alert(myself.id +':'+ message.itemid + '-PrimaryCategory');
        if (myself.id != message.itemid + '-PrimaryCategory') return;
        
        myself.model.url = '/node/category/childcategories?site=' + message.site;
        
        myself.model.fetch({
          success: function() {
            console.log('fetchdone');
            myself.render();
          }
        });
        
      });
      
    },
    
    render: function() {
      
      alert('category render');
      $(this.el).html('hoge');
      
      return this;
    }
    
  }); 
  
  return CategoryListView;
});
