define([
  'jquery',
  'underscore',
  'backbone',
  'events',
  'ebay-amd',
  'node/collections/items',
  'node/views/itemdetail',
], function($, _, Backbone, Events, ebayjs, ItemCollection, ItemDetailView) {
  
  var ItemListView = Backbone.View.extend({
    
    el: '#page-content',
    
    template: _.template($('#itemTemplate').html()),
    
    totalcount: 0,
    
    strdiff: '',
    strprev: '',
    
    events: {
      'click a.Title': 'clickTitle',
      'click #searchbutton': 'search',
      'change #hiddenforms>select': 'search',
      'click #items>thead>tr>td>div': 'clickSort',
      'click #checkall': 'clickCheckAll',
      'keyup #nav-search-input': 'keyupSearch',
      'click input[name="id"]': 'togglebulkbuttons',
      'click #bulkbuttons button': 'clickBulkButton',
      'click .respondbutton': 'clickRespond'
    },
    
    initialize: function() {
      
      this.collection = new ItemCollection();
      
      Events.on('canceledit:click', _.bind(function(message) {
        
        $('thead', '#items').show();
        this.search();
        
      }, this)); // canceledit:click
      
      Events.on('newitemsaved', _.bind(function(message) {
        
        /*
        Events.trigger('filter:click', {
          userid: 'alluserids',
          status: 'saved'
        });
        */
        
      }, this)); // newitemsaved
      
      Events.on('filter:click', _.bind(function(message) {
        
        $('#items').show();
        $('#settings').hide();
        $('#help').hide();
        
        if (message.status.match(/^allitems|scheduled|active|sold|unsold|unanswered|saved|template$/)) {
          $('select[name="selling"]', '#hiddenforms').val(message.status);
          $('input[name="tag"]',      '#hiddenforms').val('');
        } else {
          $('select[name="selling"]', '#hiddenforms').val('allitems');
          $('input[name="tag"]',      '#hiddenforms').val(message.status);
        }
        $('select[name="UserID"]',  '#hiddenforms').val(message.userid);
			  $('input[name="offset"]',   '#hiddenforms').val(0);
        
        this.search();
        
      }, this)); // filter:click
      
      Events.on('body:scrollbottom', _.bind(function(message) {
        
		    if ($('#newitem0').length) return; // Don't auto paging when editing a new item.
        
			  var offset = parseInt($('input[name="offset"]', '#hiddenforms').val());
			  var limit  = parseInt($('input[name="limit"]',  '#hiddenforms').val());
			  var total  = parseInt($('input[name="total"]',  '#hiddenforms').val());
        
        if (offset + limit >= total) return;
        
        console.log('=== BOTTOM in ItemListView ===');
        
			  $('input[name="offset"]', '#hiddenforms').val(offset + limit - 0);
        
        this.search();
        
      }, this)); // body:scrollbottom
      
      Events.on('items:refresh', _.bind(function(message) {
        
		    $.post
		    ('/node/json/refresh',
		     $('input:checked[name="id"]', '#items').serialize(),
		     _.bind(function(data) {
           
           if (data.json.items) {
             
				     $.each(data.json.items, function(idx, item) {
               
               if (!item.mod) return;
               
               var rowtemplate = _.template($('#itemTemplate').html());
               var itemTemplate = rowtemplate(item);
               
               $('#' + item.id + '-row2').remove();
               $('#' + item.id).replaceWith(itemTemplate);
               
             });
             
           }
           
		     }, this));
        
      }, this));
      
      /*
      Events.on('settings:click', _.bind(function(message) {
        
        console.log('settings clicked');
        
        $('#settings').show();
        $('#items').hide();
        
      }, this));
      */
      
      Events.on('newitem:click', _.bind(function(message) {
        
			  var offset = parseInt($('input[name="offset"]', '#hiddenforms').val());
        
        if (offset == 0) {
          $('#items > .row1').remove();
          $('#items > .row2').remove();
        }
        
        var firstuserid = $('a.dropdown-toggle[data-userid!="alluserids"]', 
                            '#summaries').attr('data-userid');
        
        var item = {
          id: 'newitem0',
          mod: {
            Site: 'US',
            Currency: 'USD',
            Title: null,
            StartPrice: {
              '#text': 0.99
            },
            Quantity: 1,
            Country: 'US'
          },
          UserID: firstuserid,
          endtime: null
        };
        
        var templatejson;
        
        if (message.hasOwnProperty('templateid')) {
          
          $.ajax({
            url: '/node/json/items/' + message.templateid,
            success: function(data) {
              
              item = data.json.item;
              item.id = 'newitem0';
              item.opt.template = 'false';
              
              templatejson = data;
            },
            async: false,
            dataType: 'json'
          });  
          
        }
        
        this.collection.add([item]);
        
        var itemmodel = this.collection.at(this.collection.length-1);
        
        var itemTemplate = this.template(item);
        $('#items', this.el).append(itemTemplate);
        $('thead', '#items').hide();
        $('td', '#notfound').hide();
        $('.row1', this.el).hide();
        
        var detailView = new ItemDetailView({
          el: '#newitem0-detail',
          model: itemmodel
        });
        
        detailView.model.detailView = detailView;
        
        var site = item.mod.Site;
        
        if (message.hasOwnProperty('templateid')) {
          
          ebayjs.hash[site] = templatejson.json;
          ebayjs.setformelements(item);
		      ebayjs.fillformvalues(item);
          
          detailView.clickEdit();
          
        } else {
          
          detailView.HashModel.url = '/node/json/site?site=' + site;
          detailView.HashModel.fetch({
            success: _.bind(function() {
              
              ebayjs.hash[site] = detailView.HashModel.get('json');
		          ebayjs.hash[site].SecondaryCategories = $.extend({}, ebayjs.hash[site].Categories);
              
              ebayjs.setformelements(item);
		          ebayjs.fillformvalues(item);
              
              detailView.clickEdit();
              
            }, detailView)
          });
          
        }
        
      }, this)); // newitem:click
      
      Events.on('toggledebug:click', _.bind(function() {
        
        if ($('#debug').is(':visible')) {
          $('#items').show();
          $('#debug').hide();
        } else {
          $('#debug').show();
          $('#help').hide();
          $('#items').hide();
          $('#settings').hide();
        }        
        
      }, this)); // toggledebug:click
      
    }, // initialize()
    
    render: function(eventName) {
      
			var offset = parseInt($('input[name="offset"]', '#hiddenforms').val());
      
      if (offset == 0) {
        $('#items > .row1').remove();
        $('#items > .row2').remove();
		    $(window).scrollTop(0);
      }
      
      if (this.collection.models.length == 0) {
        $('td', '#notfound').show();
      } else {
        $('td', '#notfound').hide();
      }
      
      _.each(this.collection.models, function(item) {
        
        var itemTemplate = this.template(item.toJSON());
        $('#items', this.el).append(itemTemplate);
        
      }, this);
      
      /*
      var rowcount = $('.row1', '#items').length;
      console.log('rows: ' + rowcount);
      */
      
      /*
      $.each($('.row1', '#items'), function(idx, row) {
        $('a.Title', row).append(' [ ' + (idx+1) + ' ]');
      });
      */
      
      return this;
      
    }, // render()
    
    search: function() {
      
      //$('#message').html('Loading items...').show();
      ebayjs.showmessage('Loading items...');
      
			var offset = parseInt($('input[name="offset"]', '#hiddenforms').val());
      
      if (offset == 0) {
        this.collection.reset();
      }
      
      this.collection.fetch({
        
        data: {
          selling:   $('select[name="selling"]',   '#hiddenforms').val(),
          UserID:    $('select[name="UserID"]',    '#hiddenforms').val(),
          sortfield: $('select[name="sortfield"]', '#hiddenforms').val(),
          sortorder: $('select[name="sortorder"]', '#hiddenforms').val(),
          offset:    $('input[name="offset"]',     '#hiddenforms').val(),
          limit:     $('input[name="limit"]',      '#hiddenforms').val(),
          Title:     $('input[name="title"]',      '#hiddenforms').val(),
          tag:       $('input[name="tag"]',        '#hiddenforms').val(),
          'mod.ListingType': ''
        },
        
        type: 'POST',
        
        success: _.bind(function() {
          this.render();
        }, this),
        
        parse: true
        
      }); // fetch
      
    }, // search()
    
    clickTitle: function(e) {
      
      //var id = $(e.currentTarget).closest('.message-item').attr('id');
      var id = $(e.currentTarget).closest('tr').attr('id');
      
      if ($('.message-content', '#' + id + '-detail').length) {
        $($('.message-content', '#' + id + '-detail').remove());
        return;
      }
      
      ebayjs.showspinner(id);
      ebayjs.showmessage('Loading item...');
      
			//$('#'+id+'-loading').removeClass('hide');
			
      var detailView = new ItemDetailView({
        el: '#' + id + '-detail',
        model: this.collection.get(id)
      });
      
      detailView.model.detailView = detailView;
      
      detailView.model.fetch({
        success: function() {
          detailView.render();
					//$('#'+id+'-loading').addClass('hide');
        }
      });
      
    }, // clickTitle()
    
    clickSort: function(e) {
      
		  var sortfield = $(e.currentTarget).attr('data-field');
		  if (sortfield == undefined) return;
		  
		  var currentsortfield = $('select[name="sortfield"]', '#hiddenforms').val();
		  var currentsortorder = $('select[name="sortorder"]', '#hiddenforms').val();
		  
		  $('i', '#items > thead').attr('class', '');
		  
		  if (sortfield == currentsortfield) {
			  $('select[name="sortorder"]', '#hiddenforms').val(-1 * currentsortorder);
		  } else {
			  $('select[name="sortfield"]', '#hiddenforms').val(sortfield);
			  $('select[name="sortorder"]', '#hiddenforms').val(1);
		  }
		  
		  if ($('select[name="sortorder"]', '#hiddenforms').val() == 1) {
			  $('i', $(e.currentTarget)).attr('class', 'icon-chevron-up');
		  } else if ($('select[name=sortorder]', '#hiddenforms').val() == -1) {
			  $('i', $(e.currentTarget)).attr('class', 'icon-chevron-down');
		  }
		  
			$('input[name="offset"]', '#hiddenforms').val(0);
      /*
      $('#items > .row1').remove();
      $('#items > .row2').remove();
		  $(window).scrollTop(0);
      */
      
      this.search();
      
    }, // clickSort()
    
    clickCheckAll: function(e) {
      
		  $('input[name="id"]', '#items').prop('checked', $('#checkall').is(':checked'));
      
      if ($('#checkall').is(':checked')) {
		    $('button', '#bulkbuttons').removeClass('disabled');
      } else {
		    $('button', '#bulkbuttons').addClass('disabled');
      }
      
    }, // clickCheckAll()
    
    keyupSearch: function(e) {
      
      this.strprev = $(e.currentTarget).val();
      
		  setTimeout(_.bind(function() {
        
	      var str2 = $('#nav-search-input').val();
        
	      if (this.strprev == str2 && this.strprev != this.strdiff) {
			    $('input[name="title"]',  '#hiddenforms').val(str2);
			    $('input[name="offset"]', '#hiddenforms').val(0);
          this.search();
	      }
	      this.strdiff = this.strprev;
	      
	      return;
      }, this), 500);
      
    }, // keyupSearch()
    
    togglebulkbuttons: function() {
      
	    var checkeditems = $('input:checked[name="id"]', '#items');
	    
	    if (checkeditems.length == 0) {
		    $('button', '#bulkbuttons').addClass('disabled');
	    } else {
		    $('button', '#bulkbuttons').removeClass('disabled');
	    }
	    
	    return;
    }, // togglebulkbuttons()
    
    clickBulkButton: function(e) {
      
      var action = $(e.currentTarget).attr('data-action');
      
      if (action.match(/^add|relist|end$/)) {
        if (ebayjs.checkdemoaccount()) return;
			  if (!confirm($(this).html() + ' checked items?')) return;
      }
      
      $('input:checked[name="id"]', '#items').hide();
      $('input:checked[name="id"]', '#items').after('<i class="icon-spinner icon-spin"></i>');
      
		  $.post
		  ('/node/json/' + action,
		   $('input:checked[name="id"]').serialize(),
		   _.bind(function(data) {
			   
         $('#checkall').prop('checked', false);
         
			   if (action == 'copy' || action == 'delete') {
           $('i.icon-spinner', '#items').remove();
		       $('input[name="id"]', '#items').prop('checked', false);
         }
         
         if (action == 'delete') {
           this.search();
         }
			   
         ebayjs.togglebulkbuttons();
         
		   }, this));
      
    }, // clickBulkButton
    
    clickRespond: function(e) {
      
		  var div = $(e.currentTarget).closest('div.membermessage');
		  
      var body = $('textarea[name="body"]', div).val();
      
		  if (body == '') {
			  alert('Please input answer text.');
			  return false;
		  }
		  if (!confirm('Send answer?')) {
			  return false;
		  }
		  
      var id = $(e.currentTarget).attr('data-id');
      
      var postdata = 'id=' + id;
      postdata += '&userid=' + $(e.currentTarget).attr('data-userid');
      postdata += '&itemid=' + $(e.currentTarget).attr('data-itemid');
      postdata += '&parent=' + $(e.currentTarget).attr('data-parent');
      postdata += '&body=' + encodeURIComponent(body);
      
      ebayjs.showspinner(id);
      ebayjs.showmessage('Sending answer...');
		  
      $.post('/node/json/addmembermessagertq',
             postdata,
             function (data) {
						   $(div).fadeOut('slow', function() {
							   $(div).remove();
                 ebayjs.hidespinner(id);
						   });
             },
             'json');
      
    } // clickRespond
    
  }); 
  
  return ItemListView;
});
