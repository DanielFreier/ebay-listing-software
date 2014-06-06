define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  
  var UserLog = Backbone.Model.extend({
    
    url: '/node/json/userlog',
    
  });
  
  return UserLog;
});
