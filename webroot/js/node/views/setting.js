define([
  'jquery',
  'underscore',
  'backbone',
  'events',
  'ebay-amd',
  'node/models/setting'
], function($, _, Backbone, Events, ebayjs, SettingModel) {
  
  var SettingView = Backbone.View.extend({
    
    el: '#settings',
    
    template: _.template($('#settingTemplate').html()),
    
    events: {
      'click #cancelaccountlink': 'clickCancelAccount',
      'click .addebayaccount': 'clickAddeBayAccount',
      'click .removeaccount': 'clickRemoveAccount',
      'change select[name="TimeZone"]': 'changeTimeZone',
      'click #syncbutton': 'clickSyncButton',
      'click input.synctoggle': 'clickSyncToggle'
    },
    
    initialize: function() {
      
      this.model = new SettingModel();
      
      Events.on('settings:click', _.bind(function(message) {
        
        this.model.fetch({
          
          type: 'POST',
          
          success: _.bind(function() {
            
            $('.form-horizontal', this.el).remove();
            
            this.render();
            
            $('select[name="TimeZone"]', this.el).val(this.model.get('timezone'));
            
            console.dir(this.model);
            
          }, this)
          
        });
        
        $('#settings').show();
        $('#items').hide();
        $('#help').hide();
        
      }, this));
      
    },
    
    render: function() {
      
      var settingTemplate = this.template(this.model.toJSON());
      $(this.el).append(settingTemplate);
      
      var option = {
        format: "yyyy-mm-dd",
        autoclose: true,
        todayHighlight: true
      };
      
      $('input[name="datestart"]', this.el).datepicker(option);
      $('input[name="dateend"]',   this.el).datepicker(option);
      
			$('#csvfile').ace_file_input({
				no_file: 'No File ...',
				btn_choose: 'Choose',
				btn_change: 'Change',
				droppable: false,
				onchange: null,
				thumbnail: false //| true | large
				//whitelist:'gif|png|jpg|jpeg'
				//blacklist:'exe|php'
				//onchange:''
				//
			});
      
      return this;
    },
    
    clickCancelAccount: function() {
      
      if (ebayjs.checkdemoaccount()) return false;
      
		  if (confirm('Cancel your account?')) {
			  return true;
		  } else {
			  return false;
		  }
    },
    
    clickAddeBayAccount: function(e) {
      
      if (ebayjs.checkdemoaccount()) return;
      
      $('span.loading', $(e.currentTarget).parent()).show();
      
		  $.post('/node/json/addaccount',
			       null,
			       function(data) {
               if (data.message) {
                 $('span.loading', $(e.currentTarget).parent()).hide();
                 alert(data.message);
               } else {
				         window.location.href = data.json.url;
               }
			       },
			       'json');
      
    },
    
    clickRemoveAccount: function(e) {
      
      if (ebayjs.checkdemoaccount()) return;
      
		  var trtag = $(e.currentTarget).closest('tr');
      var userid = $(e.currentTarget).attr('data-userid');
      
		  if (!confirm('Remove ' + userid + ' from listers.in?')) {
			  return false;
		  }
      
		  $.post('/node/json/removeaccount',
			       'userid=' + userid,
			       function(data) {
				       $(trtag).remove();
               $('#nav-' + userid).remove();
			       });
      
    },
    
    changeTimeZone: function(e) {
      
      $.post('/node/json/settings',
             'timezone=' + encodeURIComponent($(e.currentTarget).val()),
             function (data) {
               alert('Time zone was changed.');
             },
             'json');
      
    },
    
    clickSyncButton: function() {
      
      if (ebayjs.checkdemoaccount()) return;
      
      var datestart = $('input[name="datestart"]', '#syncitemsform').val();
      var dateend   = $('input[name="dateend"]',   '#syncitemsform').val();
      
      var start_y = datestart.substr(0, 4);
      var start_m = datestart.substr(5, 2);
      var start_d = datestart.substr(8, 2);
      
      var end_y = dateend.substr(0, 4);
      var end_m = dateend.substr(5, 2);
      var end_d = dateend.substr(8, 2);
      
      var d1 = new Date(start_y, start_m-1, start_d);
      var d2 = new Date(end_y, end_m-1, end_d);
      
      var diffsec = d2.getTime() - d1.getTime();
      var diffday = (diffsec / 86400 / 1000) + 1;
      
      if (diffday > 120) {
        alert('Please input less than 120 days.');
        return false;
      }
      
		  if (!confirm('Sync items from eBay?')) return;
		  
      var postdata = $('select,input', '#syncitemsform').serialize();
      
		  $.post('/node/json/import',
			       postdata,
			       function(data) {
				       
			       });
      
    },
    
    clickSyncToggle: function(e) {
      
      var username = $(e.currentTarget).attr('name').replace(/^sync-/, '');
      var checked  = $(e.currentTarget).is(':checked');
      
      $.post('/node/json/updatesyncmode',
             'username=' + username + '&sync=' + checked,
             function(data) {
               
             },
             'json');
      
      return;
    }
    
  });
  
  return SettingView;
});
