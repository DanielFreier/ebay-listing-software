define([
  'underscore',
  'backbone',
  'node/models/category'
], function(_, Backbone, CategoryModel) {
  
  var CategoryCollection = Backbone.Collection.extend({
    
    model: CategoryModel,
    
    url: '/node/category/childcategories',
    
    /*
    parse: function(response) {
      $('#pagercount').html(response.json.count);
      return response.json.items;
    }
    */
    
  });
  
  return CategoryCollection;
});

