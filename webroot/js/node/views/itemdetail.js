define([
  'jquery',
  'underscore',
  'backbone',
  'events',
  'node/models/hash',
  'ebay-amd',
  'redactor'
], function($, _, Backbone, Events, HashModel, ebayjs) {
  
  var ItemDetailView = Backbone.View.extend({
    
    template: _.template($('#detailTemplate').html()),
    
    foundproducts: {},
    
    // http://stackoverflow.com/questions/9337927/how-to-handle-initializing-and-rendering-subviews-in-backbone-js
    
    initialize: function() {
      
      this.HashModel = new HashModel({});
      
      //console.log('ItemDetailView init: site: ' + this.model.get('mod').Site);
    },
    
    render: function(eventName) {
      
      var detailTemplate = this.template(this.model.toJSON());
      $(this.el).empty().append(detailTemplate);
      
      $('button.edit',   this.el).show();
      $('button.save',   this.el).hide();
      $('button.cancel', this.el).hide();
      
      var site = this.model.get('mod').Site;
      
      ebayjs.hash[site] = this.HashModel.get('json');
      
      var item = this.model.attributes;
      
      item = ebayjs.extract_shippingtype(item);
      
      ebayjs.setformelements(item);
      ebayjs.showformvalues(item);
      
		  $('div.productsearchform', this.el).remove();
      
      ebayjs.hidespinner(this.model.get('id'));
      
      return this;
    },
    
    events: {
      'click #newitem': 'newItem',
      'click button.edit': 'clickEdit',
      'click button.save': 'clickSave',
      'click button.cancel': 'clickCancel',
      'change select[name="mod.Site"]': 'changeSite',
      'click a.tab-all': 'clickAllTab',
      'click a.addis': 'addItemSpecifics',
      'change input:file': 'changeFile',
      'change select.primarycategory': 'changeCategory',
      'change select.secondarycategory': 'changeCategory',
      'click button.GetProductSearchResults': 'findproducts',
      'click a.product-select': 'clickProductSelect',
      'change select[name="mod.ShippingDetails.ShippingType.domestic"]': 'changeDomesticShipping',
      'change select[name="mod.ShippingDetails.ShippingType.international"]': 'changeInternationalShipping',
      'click a.addsso': 'clickAddSso',
      'click a.removesso': 'clickRemoveSso',
      'click a.closefoundproducts': 'clickCloseFoundProduts',
      'click a.addis': 'clickAddIs',
      'click a.removeispc': 'clickRemoveIspc',
      'change select[name^="mod.ItemSpecifics.NameValueList"][name$="Value.selector"]': 'changeISNV',
      'click ul.VariationSpecificsSet>li': 'clickAddVariationName',
      'click button.addownbutton': 'clickAddOwnVariationName',
      'focus input.selectorparent': 'focusSelectOrParent',
      'click a.removevariationname': 'clickRemoveVariationName',
      'click a.removevariationrow': 'clickRemoveVariationRow',
      'click a.addvariationrow': 'clickAddVariationRow',
      'change select[name^="mod.Variations.Variation"][name$="Value.selector"]': 'changeSelectSelector',
      'change select[name="mod.Variations.Pictures.VariationSpecificName"]': 'changeVPVSN',
      'click a.deletepicture': 'clickDeletePicture'
    },
    
    newItem: function() {
      
		  var id = 'newitem0';
      
    },
    
    clickEdit: function() {
      
      var item = this.model.attributes;
      
      var activehref = $('ul.nav-tabs li.active a', this.el).attr('href');
      
      var detailTemplate = this.template(this.model.toJSON());
      $(this.el).empty().append(detailTemplate);
      
      $('ul.nav-tabs a[href="' + activehref + '"]', this.el).click();
      
      $('button.edit',   this.el).hide();
      $('button.save',   this.el).show();
      $('button.cancel', this.el).show();
      
      ebayjs.setformelements(item);
      ebayjs.fillformvalues(item);
      
		  $('ul.pictures', this.el).sortable({
        items: '> li.pictureli',
        cursor: 'move',
        
        sort: function(event, ui) {                   
          ui.helper.css({'top' : ui.position.top + $(window).scrollTop() + 'px'});
        }
        
      });
      
	    // todo: compare to CKEditor
	    $('textarea[name="mod.Description"]', this.el).redactor({
		    convertDivs: false,
		    convertLinks: false,
        deniedTags: ['html', 'head'],
        iframe: true,
        autoresize: true
	    });
      
      if (this.model.get('id') == 'newitem0') {
        $('a.tab-all', this.el).click();
      }
      
      $('input[name="opt.tags"]', this.el).tag();
      
      return this;
    },
    
    clickCancel: function() {
      
	    // cancel add new item
	    if (this.model.get('id') == 'newitem0') {
        
        Events.trigger('canceledit:click', {
          id: this.model.get('id')
        });
        
		    return false;
	    }
      
      var activehref = $('ul.nav-tabs li.active a', this.el).attr('href');
      
      var detailTemplate = this.template(this.model.toJSON());
      $(this.el).empty().append(detailTemplate);
      
      $('ul.nav-tabs a[href="' + activehref + '"]', this.el).click();
      
      $('button.edit',   this.el).show();
      $('button.save',   this.el).hide();
      $('button.cancel', this.el).hide();
      
      var item = this.model.attributes;
      
      ebayjs.setformelements(item);
      ebayjs.showformvalues(item);
      
      return this;
    },
    
    clickSave: function() {
      
      var id = this.model.get('id');
      
      ebayjs.showspinner(id);
      ebayjs.showmessage('Saving item data...');
      
      //$('#' + id + '-detail').hide();
      
      $('button.edit',   this.el).show();
      $('button.save',   this.el).hide();
      $('button.cancel', this.el).hide();
      
	    /* PictureURL */
	    $.each($('ul.pictures li', this.el), function (i, li) {
		    if ($(li).attr('class') == 'template') return;
		    
		    var url = $('img', li).attr('data-url');
		    
		    var input = $('<input />')
			    .attr('type', 'hidden')
			    .attr('name', 'mod.PictureDetails.PictureURL')
			    .val(url);
		    
		    $('ul.pictures', this.el).parent().append(input);
	    });
      
	    /* VariationPictures */
	    $.each($('div[class^="VariationPictures"]'), function(i, div) {
		    $.each($('ul.variationpictures li', div), function(j, li) {
			    if ($(li).attr('class') == 'template') return;
			    
			    var url = $('img', li).attr('data-url');
			    
			    var input = $('<input />')
				    .attr('type', 'hidden')
				    .attr('name', 'mod.Variations.Pictures.VariationSpecificPictureSet.'+i+'.PictureURL')
				    .val(url);
			    
			    $(div).append(input);
		    });
	    });
      
	    // remove empty value forms
	    var _dsso = 'mod.ShippingDetails.ShippingServiceOptions';
	    var _isso = 'mod.ShippingDetails.InternationalShippingServiceOption';
	    for (i = 0; i <= 3; i++) {
		    if ($('select[name="'+_dsso+'.'+i+'.ShippingService"]', this.el).val() == '') {
			    $('input[name="'+_dsso+'.'+i+'.ShippingServicePriority"]', this.el).val('');
		    } else if ($('select[name="'+_dsso+'.'+i+'.ShippingService"]', this.el).val() == null) {
			    $('input[name="'+_dsso+'.'+i+'.ShippingServicePriority"]', this.el).val('');
		    }
	    }
	    for (i = 0; i <= 4; i++) {
		    if ($('select[name="'+_isso+'.'+i+'.ShippingService"]', this.el).val() == '') {
			    $('input[name="'+_isso+'.'+i+'.ShippingServicePriority"]', this.el).val('');
		    } else if ($('select[name="'+_isso+'.'+i+'.ShippingService"]', this.el).val() == null) {
			    $('input[name="'+_isso+'.'+i+'.ShippingServicePriority"]', this.el).val('');
		    }
	    }
      
	    // remove empty currency symbols
	    $('input[name$="@currencyID"]', this.el).each(function(i, o) {
		    var cname = $(o).attr('name').replace('@currencyID', '#text');
		    if ($('input[name="' + cname + '"]', this.el).val() == '') {
			    $(o).val('');
		    }
	    });
      
	    // todo: remove empty ItemSpecifics
      /*
	    $('input[name^="mod.ItemSpecifics.NameValueList"][type=checkbox]', this.el).each(
        function (i, o){
		      var fvalue = $(o).val();
		      if ($(o).attr('checked') != 'checked') $(o).remove();
	      }
      );
      */
      
	    $('input[name^="mod.ItemSpecifics.NameValueList"][name$="Name"]', this.el).each(
        function (i, o) {
          
		      var fname = $(o).attr('name');
          var tr = $(o).closest('tr');
          
          if ($('input[type="checkbox"]', tr).length > 0) {
            if ($('input[type="checkbox"]:checked', tr).length > 0) return;
          } else if ($('select[name$="Value"]', tr).length > 0) {
            if ($('select[name$="Value"]', tr).val() != '') return;
          } else {
		        var fvalue = $('input[name="' + fname.replace(/Name$/, 'Value') + '"]', this.el).val();
            if (fvalue != '') return;
          }
          
		      $(o).closest('tr').remove();
		      
          // todo: remove empty itemspecifics
          /*
		      $.each($('table.ItemSpecifics tr', this.el), function(k, v) {
			      $.each($('select, input', v), function(j, obj) {
				      var orgname = $(obj).attr('name');
				      $(obj).attr('name', orgname.replace(/\.[0-9]+\./, '.' + k + '.'));
			      });
		      });
          */
        }
      );
      
      /*
      var arr = this.$el.find('form').serializeArray();
      
      var data = _(arr).reduce(function(acc, field) {
        acc[field.name] = field.value;
        return acc;
      }, {});
      
      this.model.save({form: data});
      */
      
      var formarr = 
        $('input[type="text"], input:checked, input[type="hidden"], select, textarea', this.el);
      
			var item_modifing = ebayjs.extractObject(formarr);
	    var postdata = item_modifing;
      
      // merge shippingtype domestic and international
      var dmsttype = '';
      var intltype = '';
      if (postdata.mod.ShippingDetails && postdata.mod.ShippingDetails.ShippingType) {
        
        dmsttype = postdata.mod.ShippingDetails.ShippingType.domestic;
        
        if (postdata.mod.ShippingDetails.ShippingType.international) {
          
          intltype = postdata.mod.ShippingDetails.ShippingType.international;
          
          if (dmsttype == 'FreightFlat') {
            
            postdata.mod.ShippingDetails.ShippingType = dmsttype;
            
          } else if (dmsttype == intltype) {
            
            postdata.mod.ShippingDetails.ShippingType = dmsttype;
            
          } else if (dmsttype != intltype) {
            
            postdata.mod.ShippingDetails.ShippingType =
              dmsttype + 'Domestic' + intltype + 'International';
          }
          
        } else {
          
          postdata.mod.ShippingDetails.ShippingType = dmsttype;
          
        }
      }
      
	    /* VariationSpecificsSet */
	    if (postdata.mod.Variations) {
		    
		    var vssnvl = {};
		    $.each(postdata.mod.Variations.Variation, function(i, variation) {
			    $.each(variation.VariationSpecifics.NameValueList, function(j, nvl) {
            
            console.dir('NVL:' + i + '-' + j);
            console.log(nvl);
            
				    if (vssnvl[nvl.Name]) {
					    if (!$.isArray(vssnvl[nvl.Name])) {
						    var tmpvalue = vssnvl[nvl.Name];
						    vssnvl[nvl.Name] = [tmpvalue];
					    }
					    if (vssnvl[nvl.Name].indexOf(nvl.Value) == -1) {
						    vssnvl[nvl.Name].push(nvl.Value);
					    }
				    } else {
					    vssnvl[nvl.Name] = nvl.Value;
				    }
			    });
		    });
		    
		    /* Pictures */
		    if (postdata.mod.Variations.Pictures) {
			    var vsn = postdata.mod.Variations.Pictures.VariationSpecificName;
			    $.each(postdata.mod.Variations.Pictures.VariationSpecificPictureSet, function(i, vsps) {
				    if (vssnvl[vsn]) {
					    if (!$.isArray(vssnvl[vsn])) {
						    var tmpvalue = vssnvl[vsn];
						    vssnvl[vsn] = [tmpvalue];
					    }
					    if (vssnvl[vsn].indexOf(vsps.VariationSpecificValue) == -1) {
						    vssnvl[vsn].push(vsps.VariationSpecificValue);
					    }
				    } else {
					    vssnvl[vsn] = vsps.VariationSpecificValue;
				    }
			    });
		    }
		    
		    postdata.mod.Variations.VariationSpecificsSet = {}
		    postdata.mod.Variations.VariationSpecificsSet.NameValueList = [];
		    
		    $.each(vssnvl, function(nvname, nvvals) {
			    var tmpelm = {};
			    tmpelm['Name'] = nvname;
			    if (nvvals.length == 1) {
				    tmpelm['Value'] = nvvals[0];
			    } else {
				    tmpelm['Value'] = nvvals;
			    }
			    
			    postdata.mod.Variations.VariationSpecificsSet.NameValueList.push(tmpelm);
		    });
	    }
      
	    var postdata = JSON.stringify(postdata);
      
      // http://backbonefu.com/2011/11/working-with-api-responses-in-backbone-js-using-parse/
      this.model.save(
        {
          save: true,
          id: this.model.id,
          json: postdata
        },
        {
          success: _.bind(function(model, response) {
            
            ebayjs.hidespinner(id);
            
            if (id == 'newitem0') {
              
              $('#newitem0-row2').remove();
              
              var rowtemplate = _.template($('#itemTemplate').html());
              var itemTemplate = rowtemplate(response.json.item);
              $('#newitem0').replaceWith(itemTemplate);
              $('#newitem0').show();
              $('thead', '#items').show();
              
              //$('a[data-userid="alluserids"][data-sellingstatus="allitems"]').click();
              //$('a[data-userid="alluserids"][data-sellingstatus="saved"]').click();
              
              //$('a.Title', '#' + this.model.id).click();
              var detailView = new ItemDetailView({
                el: '#' + this.model.id + '-detail',
                model: this.model
              });
              
              detailView.HashModel.set({
                json: response.json
              });
              
              detailView.model.detailView = detailView;
              detailView.render();
              
              $('a.tab-all', '#' + this.model.id + '-detail').click();
              
            } else {
              
              $('#' + id + '-row2').remove();
              
              var rowtemplate = _.template($('#itemTemplate').html());
              var itemTemplate = rowtemplate(response.json.item);
              $('#' + id).replaceWith(itemTemplate);
              
            }
            
          }, this)
        }
      );
      
      /*
      var formdata = JSON.stringify(this.$el.find('form').serializeArray());
      
      console.dir(formdata);
      
      this.model.save(
        formdata
      );
      */
      var item = this.model.attributes;
      
      ebayjs.setformelements(item);
      ebayjs.showformvalues(item);
      
      return this;
    },
    
    // http://stackoverflow.com/questions/7468299/scope-issue-within-backbone-model-fetch-callback-calling-settimeout
    
    changeSite: function(e) {
      
      var site = $('select[name="mod.Site"]', this.el).val();
      
      if (site == undefined) {
        site = this.model.get('mod').Site;
      }
      
      this.HashModel.url = '/node/json/site?site=' + site;
      this.HashModel.fetch({
        success: _.bind(function() {
          
          ebayjs.hash[site] = this.HashModel.get('json');
		      ebayjs.hash[site].SecondaryCategories = $.extend({}, ebayjs.hash[site].Categories);
          
          var formarr = 
            $('input[type="text"], input:checked, input[type="hidden"], select, textarea',
              '#' + this.model.get('id') + '-detail');
          
			    var item_modifing = ebayjs.extractObject(formarr);
          
          console.log('===MODIFYNG===');
          console.dir(item_modifing);
          
          item_modifing.id = this.model.get('id');
		      item_modifing.categorypath = [];
          
          ebayjs.setformelements(item_modifing);
		      ebayjs.fillformvalues(item_modifing);
          
        }, this)
      });
      
    },
    
    changeCategory: function(e) {
      
      var id = this.model.get('id');
	    var site = $('select[name="mod.Site"]', this.el).val();
      var div = $(e.currentTarget).closest('div');
	    var divclass = $(div).attr('data-form');
      
	    $(e.currentTarget).nextAll().remove();
	    if (divclass == 'secondarycategory') {
		    $('select:last', div).attr('name', 'mod.SecondaryCategory.CategoryID');
	    } else {
		    $('select:last', div).attr('name', 'mod.PrimaryCategory.CategoryID');
	    }
      
	    var primarycategorypulldowns = 
        $('div[data-form="primarycategory"] select', this.el).get();
	    var primarycategorypath = new Array();
	    for (node in primarycategorypulldowns) {
		    primarycategorypath.push(primarycategorypulldowns[node].value);
	    }
	    
	    var secondarycategorypulldowns = 
        $('div[data-form="secondarycategory"] select', this.el).get();
	    var secondarycategorypath = new Array();
	    for (node in secondarycategorypulldowns) {
		    secondarycategorypath.push(secondarycategorypulldowns[node].value);
	    }
	    
	    var joined;
	    if (divclass == 'secondarycategory') {
		    joined = secondarycategorypath.join('.');
	    } else {
		    joined = primarycategorypath.join('.');
	    }
      
	    $.getJSON
	    ('/node/json/gc2?site=' + site + '&path=0.' + joined,
	     function(data) {
		     
		     if (divclass == 'secondarycategory') {
			     ebayjs.hash[site].SecondaryCategories = data.json.gc2.Categories;
		     } else {
			     ebayjs.hash[site].Categories = data.json.gc2.Categories;
		     }
		     
		     var formarr =
			     $('input[type="text"], input:checked, input[type="hidden"], select, textarea', this.el);
         
			   var item_modifing = ebayjs.extractObject(formarr);
		     
		     item_modifing.id = id;
		     item_modifing.categorypath = primarycategorypath;
		     item_modifing.secondarycategorypath = secondarycategorypath;
		     
		     ebayjs.setformelements(item_modifing);
		     ebayjs.fillformvalues(item_modifing);
		     
		     return;
	     });
      
    },
    
    clickAllTab: function(e) {
      $('.tab-pane', this.el).addClass('active');
    },
    
    addItemSpecifics: function() {
      
		  var id = this.model.id;
		  var iscnt = $('table.ItemSpecifics tr', '#'+id).length;
		  var trtag = ebayjs.setformelements_itemspecifics_values(id, iscnt, null, null);
		  $('table.ItemSpecifics', '#'+id).append(trtag);
		  
		  return false;
    },
    
    changeFile: function(e) {
      
      var div = $(e.currentTarget).closest('.message-content');
      var id = $(div).closest('td').attr('id').replace('-detail', '');
      var form = $(e.currentTarget).closest('form');
      
      var userid = $('select[name="UserID"]', '#' + id + '-detail').val();
      $('input[name="userid"]', form).val(userid);
      
		  $(form).submit();
      
      return;
    },
    
    findproducts: function(e) {
      ebayjs.findproducts(this.model.get('id'), this.foundproducts);
    },
    
	  /* Select product from found products */
    clickProductSelect: function(e) {
      
		  var id = this.model.get('id');
      var idstr = '#' + id + '-detail';
		  
		  var site = $('select[name="mod.Site"]', idstr).val();
		  
		  var categoryid = $('ul.suggestedcategories input:checked', idstr).val();
		  var idpath     = $('ul.suggestedcategories input:checked', idstr).attr('data-idpath');
		  var categorypath = idpath.split('.');
		  var tmppath = ('0.'+idpath).split('.');
		  
      $.getJSON
		  ('/node/json/gc2?site=' + site + '&path=0.' + categorypath.join('.'),
		   function(data) {
			   
			   ebayjs.hash[site].Categories = data.json.gc2.Categories;
			   
			   var pds = ebayjs.getcategorypulldowns(site, tmppath);
			   $('select[name="mod.PrimaryCategory.CategoryID"]', idstr).parent().html(pds);
			   
		     var formarr =
			     $('input[type="text"], input:checked, input[type="hidden"], select, textarea', idstr);
         
			   var item_modifing = ebayjs.extractObject(formarr);
			   
			   item_modifing.id = id;
			   item_modifing.categorypath = categorypath;
			   
			   ebayjs.setformelements(item_modifing);
			   ebayjs.fillformvalues(item_modifing);
			   
			   return;
		   });
		  
      console.log('===PRODUCT SELECT===');
      console.dir(this.foundproducts);
		  
		  var productid = $(e.currentTarget).attr('data-productid');
		  var product = this.foundproducts['R'+productid];
		  
		  $('input[name="mod.ProductListingDetails.ProductID"]', idstr).val('');
		  $('input[name="mod.ProductListingDetails.ProductReferenceID"]', idstr).val(productid);
		  $('input[name="mod.Title"]', idstr).val(product.Title);
      
      // todo: set StockPhotoURL to 1st image.
      // call addimage() in webroot/js/fileupload.js
      var files = new Array();
      files.push(product.StockPhotoURL);
      addimage(id, 'pictures', files);
		  
		  $(e.currentTarget).closest('div.foundproducts').hide();
		  
		  return;
      
    }, // clickProductSelect
    
    changeDomesticShipping: function() {

		  var id = this.model.get('id');
      var idstr = '#' + id + '-detail';
      
		  var formarr =
			  $('input[type="text"], input:checked, input[type="hidden"], select, textarea', idstr);
      
			var item_modifing = ebayjs.extractObject(formarr);
			
			item_modifing.id = id;
		  ebayjs.setformelements_shipping_domestic(item_modifing);
      
		  return;
    },

    changeInternationalShipping: function() {
      
		  var id = this.model.get('id');
      var idstr = '#' + id + '-detail';
      
		  var formarr =
			  $('input[type="text"], input:checked, input[type="hidden"], select, textarea', idstr);
      
			var item_modifing = ebayjs.extractObject(formarr);
			
			item_modifing.id = id;
		  ebayjs.setformelements_shipping_international(item_modifing);
      
		  return;
    },
    
    clickAddSso: function(e) {
      
		  var id = this.model.get('id');
      var divclass = $(e.currentTarget).closest('div').attr('data-form');
      
      ebayjs.addsso(id, divclass);
      
      return false;
    },
    
    clickRemoveSso: function(e) {
      
		  var id = this.model.get('id');
      var divclass = $(e.currentTarget).parent().parent().attr('data-form');
      
		  var pdiv = $(e.currentTarget).closest('div[class^="ShippingService"]').parent();
      
		  $(e.currentTarget).closest('div[class^="ShippingService"]').remove();
      
      ebayjs.renumbersso(id, divclass);
      
		  $('a.addsso', $(pdiv)).show();
      
      return false;
    },
    
    clickCloseFoundProduts: function(e) {
      
      $(e.currentTarget).closest('div.foundproducts').hide();
      
      return false;
    },
    
	  /* Add ItemSpecifics */
    clickAddIs: function(e) {
		  var id = this.model.get('id');
		  var iscnt = $('table.ItemSpecifics tr', '#' + id + '-detail').length;
		  var trtag = ebayjs.setformelements_itemspecifics_values(id, iscnt, null, null);
		  $('table.ItemSpecifics', '#' + id + '-detail').append(trtag);
      
      return false;
    },
    
	  /* Remove ItemSpecifics */
    clickRemoveIspc: function(e) {
		  var id = this.model.get('id');
      
		  $(e.currentTarget).closest('tr').remove();
		  
		  $.each($('table.ItemSpecifics tr', '#' + id + '-detail'), function(k, v) {
			  $.each($('select, input', v), function(j, o) {
				  var orgname = $(o).attr('name');
				  $(o).attr('name', orgname.replace(/\.[0-9]+\./, '.'+k+'.'));
			  });
		  });
		  
		  return false;
    },
    
    changeISNV: function(e) {
		  var id = this.model.get('id');
		  var name = $(e.currentTarget).attr('name').replace('.selector', '');
		  
		  $('input[name="' + name + '"]', '#' + id + '-detail').val($(e.currentTarget).val());
    },
    
    focusSelectOrParent: function(e) {
		  $('select.selector').hide();
		  $('select', $(e.currentTarget).closest('td')).show();
    },
    
    clickRemoveVariationName: function(e) {
		  // todo: check whether picture is selected before remove
		  var id = this.model.get('id');
		  var num = $(e.currentTarget).closest('th').prevAll().length;
		  $(e.currentTarget).closest('th').remove();
		  $('table.Variations td:nth-child(' + (num+1) + ')', '#'+id+'-detail').remove();
		  ebayjs.renumbervariations(id);
		  return false;
    },
    
    clickRemoveVariationRow: function(e) {
		  var id = this.model.get('id');
		  $(e.currentTarget).closest('tr').remove();
		  ebayjs.renumbervariations(id);
		  return false;
    },
    
	  /* Add a variation name */
    clickAddVariationName: function(e) {
		  var id = this.model.get('id');
      var nvnames = $(e.currentTarget).html().split(' / ');
		  ebayjs.addvariationnames(id, nvnames);
		  return;
    },
    
	  /* Add own variation name */
    clickAddOwnVariationName: function(e) {
		  var id = this.model.get('id');
		  var nvname = $('input', $(e.currentTarget).closest('div')).val();
		  ebayjs.addvariationnames(id, [nvname]);
		  return;
	  },
    
	  /* Add a variation row */
    clickAddVariationRow: function(e) {
		  var id = this.model.get('id');
		  ebayjs.addvariationrow(id);
      return false;
    },
    
	  /* Select variation value from selection */
    changeSelectSelector: function(e) {
		  var name = $(e.currentTarget).attr('name');
		  $('input[name="' + name.replace(/.selector$/, '') + '"]', this.el)
        .val($(e.currentTarget).val());
      $(e.currentTarget).hide();
    },
    
	  /* Variation specific picture set */
    changeVPVSN: function(e) {
      
		  var id = this.model.get('id');
      var idstr = '#' + id + '-detail';
      
		  // todo: alert before delete images
		  
		  $('div[class^="VariationPictures"][class!="VariationPictures0"]', idstr).remove();
		  
      var val = $(e.currentTarget).val();
      
      var nvvals = [];
      
      var td = $('table.Variations tbody td', idstr);
      $.each($('input[name$="Name"]', td), function(i, elm) {
        if ($(elm).val() != val) return;
        
        var nvname = $(elm).attr('name');
        var nvval = $('[name="'+nvname.replace(/Name$/, 'Value')+'"]', td).val();
			  
			  if (nvval == '') return;
        
        if (nvvals.indexOf(nvval) == -1) {
          nvvals.push(nvval);
        }
      });
      
      // todo: loop and add picture upload form
      $.each(nvvals, function(idx, nvval) {
			  
        console.log(idx + ' = ' + nvval);
			  
			  if (idx > 0) {
				  ebayjs.addvariationpicturerow(id, idx);
			  }
        
			  $('div.VariationPictures' + idx
				  + ' input[name="mod.Variations.Pictures.VariationSpecificPictureSet.'
          + idx + '.VariationSpecificValue"]', idstr).val(nvval);
			  
			  $('div.VariationPictures' + idx
          + ' div.variationspecificvalue', idstr).html(val + ': ' + nvval);
			  
      });
		  
		  $('div.VariationSpecificPictureSet div[class^="VariationPictures"]', idstr).show();
      
    }, // changeVPVSN
    
    clickDeletePicture: function(e) {
      $(e.currentTarget).closest('li').remove();
      return false;
    }
    
  });
  
  return ItemDetailView;
});
