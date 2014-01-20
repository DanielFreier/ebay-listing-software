define([
  'underscore', 
  'backbone'
], function (_, Backbone) {
  
  'use strict';
  
  var events = {};
  _.extend(events, Backbone.Events);
  
  events.thisflag = 'HERE LOOK';
  
  return events;
});
