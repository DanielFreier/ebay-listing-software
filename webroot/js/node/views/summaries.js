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
      
	    //var theadh = $('thead', '#items').height();
      
	    var windowh = $(window).height();
      
      /*
      var headerh = $('#header').height();
      headerh += $('#header').css('margin-top').replace('px', '') - 0;
      headerh += $('#header').css('margin-bottom').replace('px', '') - 0;
      */
      
      //var contentmargin = $('#content').css('margin-top').replace('px', '');
      
	    //var height = windowh - headerh - contentmargin - theadh - 4;
      var navbar_height = $('#navbar').height();
      var sidebar_shortcuts_height = $('#sidebar-shortcuts').height();
	    var height = windowh;
      var top1 = $('#main-container').position().top;
      var top2 = $('#summaries').position().top;
      console.log('height: ' + height);
      console.log('top: ' + (top1 - 0 + top2 - 0));
      
			$('#summaries').slimScroll({
				height: (windowh - navbar_height - sidebar_shortcuts_height),
        size: 10,
				railVisible: true
			});
    },
    
    render: function(eventName) {
      
      /*
      var tagtemplate = _.template($('#tagTemplate').html());
      
      _.each(this.collection.models, function(model) {
        
        var summary = model.attributes;
        var username = summary.username;
        
        console.dir(summary);
        
        for (var key in summary.summary) {
          $('a[data-userid="' + username + '"][data-sellingstatus="' + key + '"] span.badge',
            '#summaries').html(summary.summary[key]);
        }
        
        for (var tag in summary.tags) {
          
          var tagTemplate = tagtemplate({
            username: username,
            tag: tag,
            count: summary.tags[tag]
          });
          
          $('ul.submenu', '#nav-' + username).append(tagTemplate);
        }
        
      }, this);
      */
      
      return this;
    },
    
    events: {
      'click #summaries ul.submenu a': function(e) {},
      'click .newitem': 'clickNewItem',
      'click a.newitemwithtemplate': 'clickNewItemWithTemplate',
      'click #toggledebug': 'toggledebug'
    },
    
    pclick: function(e) {
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
      Events.trigger('newitem:click', {});
    },
    
    clickNewItemWithTemplate: function(e) {
      Events.trigger('newitem:click', {
        templateid: $(e.currentTarget).attr('data-templateid')
      });
    },
    
    toggledebug: function() {
      Events.trigger('toggledebug:click');
    }
    
  });
  
  return SummaryListView;
});
