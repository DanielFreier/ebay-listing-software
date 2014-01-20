define([
  'jquery',
  'underscore',
  'backbone',
  'events',
  'node/collections/summaries'
], function($, _, Backbone, Events, SummaryCollection) {
  
  var SummaryListView = Backbone.View.extend({
    
    //el: '#summaries',
    el: '#sidebar',
    
    template: _.template($('#summaryTemplate').html()),
    
    initialize: function() {
      this.collection = new SummaryCollection();
      
      //$('a[data-userid="alluserids"][data-sellingstatus="allitems"]').click();
      //$('a[data-userid="alluserids"][data-sellingstatus="active"]').click();
    },
    
    render: function(eventName) {
      
      _.each(this.collection.models, function(summary) {
        var summaryTemplate = this.template(summary.toJSON());
        $('#summaries', this.el).append(summaryTemplate);
      }, this);
      
      return this;
    },
    
    events: {
      'click #summaries a': 'fetchlist',
      'click .newitem': 'clickNewItem',
      'mousedown a.dropdown-toggle': 'fetchlist2',
      'click #toggledebug': 'toggledebug'
    },
    
    fetchlist: function(e) {
      
      $('li.active', this.el).removeClass('active');
      $(e.currentTarget).closest('li').addClass('active');
      
      var userid = $(e.currentTarget).attr('data-userid');
      var status = $(e.currentTarget).attr('data-sellingstatus');
      
      Events.trigger('filter:click', {
        userid: userid,
        status: status
      });
      
      //return false;
    },
    
    fetchlist2: function(e) {
      
      var userid = $(e.currentTarget).attr('data-userid');
      var status = $(e.currentTarget).attr('data-sellingstatus');
      
      Events.trigger('filter:click', {
        userid: userid,
        status: status
      });
      
    },
    
    clickNewItem: function() {
      Events.trigger('newitem:click');
    },
    
    toggledebug: function() {
      Events.trigger('toggledebug:click');
    }
    
  });
  
  return SummaryListView;
});
