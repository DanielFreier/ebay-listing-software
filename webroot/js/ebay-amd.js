define(function() {
  
  var ebayjs = {
    
    hash: [],
    
    sitecur: {
      US             : ['USD'],
      Canada         : ['CAD', 'USD'],
      UK             : ['GBP'],
      Germany        : ['EUR'],
      Australia      : ['AUD'],
      France         : ['EUR'],
      eBayMotors     : ['USD'],
      Italy          : ['EUR'],
      Netherlands    : ['EUR'],
      Spain          : ['EUR'],
      India          : ['INR'],
      HongKong       : ['HKD'],
      Singapore      : ['SGD'],
      Malaysia       : ['MYR'],
      Philippines    : ['PHP'],
      CanadaFrench   : ['CAD', 'USD'],
      Poland         : ['PLN'],
      Belgium_Dutch  : ['EUR'],
      Belgium_French : ['EUR'],
      Austria        : ['EUR'],
      Switzerland    : ['CHF'],
      Ireland        : ['EUR']
    },
    
togglebulkbuttons: function() {
  
	var checkeditems = $('input:checked[name="id"]', '#items tbody[id!="rowtemplate"]');
	
	if (checkeditems.length == 0) {
		$('button.copy, button.delete, button.add, button.relist,'
			+ 'button.revise, button.verifyadditem, button.end', '#bulkbuttons')
			.attr('disabled', 'disabled')
			.addClass('disabled');
	} else {
		$('button.copy, button.delete, button.add, button.relist,'
			+ 'button.revise, button.verifyadditem, button.end', '#bulkbuttons')
			.removeAttr('disabled')
			.removeClass('disabled');
	}
	
	return;
},

checkdemoaccount: function() {
    
  var email = $('#user_email').attr('data-email');
	
  if (email == 'demo@listers.in') {
    alert('Sorry, this function is not available for demo account.');
    return true;
  }
  
  return false;
},

changeCurrency: function() {
	
	var id = $(this).closest('tbody.itemrow').attr('id');
	
	$('input[name$="@currencyID"]', '#'+id).val($(this).val());
	
	return;
},

findproducts: function(id, foundproducts) {
	
  var idstr = '#' + id + '-detail';
	var td = $('div.productsearchform', idstr).parent();
	
  var fpdiv = $('div.foundproducts', idstr);
	$(fpdiv).hide();
	$('li.suggestedcategory-template', td).nextAll().remove();
	$('li.product-template', td).nextAll().remove();
  
	var site   = $('select[name="mod.Site"]', idstr).val();
  var userid = $('select[name="UserID"]',   idstr).val();
  
	var keyword = $('input[name="ProductSearch.QueryKeywords"]', td).val();
  if (keyword == '') {
    $('div.productsearchmessage', td).html('Please input keyword.');
    return;
  }
  
  $('div.productsearchmessage', td).html('<img src="/img/indicator.gif"/> Searching...');
	
	$.post('/node/json/findproducts',
		     'userid=' + userid + '&site=' + site
         + '&findtype=QueryKeywords&keyword=' + encodeURIComponent(keyword),
		     function(data) {
           
           if (data.json.result.Ack == 'Failure') {
             $('div.productsearchmessage', td).html('No product found for "'+keyword+'".');
             return;
           }
           
           data.json.categories.SuggestedCategoryArray.SuggestedCategory
             = ebayjs.arrayize(data.json.categories.SuggestedCategoryArray.SuggestedCategory);
           
					 $.each(data.json.categories.SuggestedCategoryArray.SuggestedCategory, function(i, o) {
						 
						 var category = o.Category;
						 var categoryid = category.CategoryID;
						 
						 var idpath = new Array();
						 var parentid = ebayjs.arrayize(category.CategoryParentID);
						 $.each(parentid, function(j, p) {
							 idpath.push(p);
						 });
						 idpath.push(category.CategoryID);
						 
						 var pathname = '';
						 var parentname = ebayjs.arrayize(category.CategoryParentName);
						 $.each(parentname, function(j, p) {
							 pathname += p + ' > ';
						 });
						 pathname += category.CategoryName;
						 
						 var radioid = id + 'sc' + categoryid;
						 
						 var litag = $('li.suggestedcategory-template', fpdiv)
							 .clone()
							 .attr('class', 'suggestedcategory');
						 
						 $('input', litag)
							 .attr('id', radioid)
							 .val(categoryid)
							 .attr('data-idpath', idpath.join('.'));
						 
						 if (i == 0) {
							 $('input', litag).prop('checked', true);
						 }
						 
						 $('label', litag).html(pathname).attr('for', radioid);
						 
						 $('ul.suggestedcategories', fpdiv).append(litag);
					 });
					 
					 $.each(data.json.result.Product, function(i, o) {
				     
				     // todo: care Reference, UPC, ISBN, etc...
				     var productids = ebayjs.arrayize(o.ProductID);
				     var productid = productids[0]['#text'];
				     foundproducts['R'+productid] = o;
						 
             var ultag = $('li.product-template', fpdiv).closest('ul');
				     var litag = $('li.product-template', fpdiv).clone().attr('class', 'product');
             
             if (o.DisplayStockPhotos == 'true') {
               $('img', litag).attr('src', '/image/?url=' + encodeURIComponent(o.StockPhotoURL));
             } else {
               $('img', litag).attr('src', '/img/noimage.jpg');
             }
             $('div.product-title', litag).html(o.Title);
						 $('a.product-detail', litag).attr('href', o.DetailsURL);
             
						 
						 $('a.product-select', litag).attr('data-productid', productid);
						 
             $(ultag).append(litag);
			     });
					 
			     $(fpdiv).show();
           $('div.productsearchmessage', td).empty();
		     },
		     'json');
},

titlesearch_keyupdone: function() {
  
	var str2 = $('input.filter[name=Title]').val();
  
	if (strprev == str2 && strprev != strdiff) {
		$('input[name=offset]').val(0);
		items(true);
	}
	strdiff = strprev;
	
	return;
},


/* auto click for debug */
autoclick: function()
{
	itemid = '110089979385';
	
	$.ajaxSetup({async: false});
	//$('input[class=filter][name=ItemID]').val(itemid);
	//$('a.allitems').click();
	id = $('a.Title:lt(2):last').closest('tbody.itemrow').attr('id');
	$('a.Title', 'tbody#'+id).click();
	$('a.edit', 'tbody#'+id).click();
	$('input[name="ProductSearch.QueryKeywords"]', '#'+id).val('android');
	$('button.GetProductSearchResults', '#'+id).click();
	$('div.product:first').click();
	//$('a.save', 'tbody#'+id).click();
	
	return;
	
	if (id == 'rowtemplate') return;
	
	$('a.Title', 'tbody#'+id).click();
	//setTimeout("$('li > a:contains(Shipping)', '   tbody#'+id).click()", 2000);
	//setTimeout("$('ul.editbuttons > li > a.edit', 'tbody#'+id).click()", 2000);
	
	return;
},

/**
 * Convert form elements into json format.
 * http://stackoverflow.com/questions/2552836/convert-an-html-form-field-to-a-json-object-with-inner-objects 
 */
extractObject: function(formobj) {
	
	var accum = {};
	
	function add(accum, namev, value) {
		if (namev.length == 0) return;
		
		if (namev.length == 1) {
			
			if (namev[0] == '') return;
			
			if (accum[namev[0]] != undefined) {
        if ($.isArray(accum[namev[0]])) {
          accum[namev[0]].push(value);
          //accum[namev[0]].push(encodeURI(value));
        } else {
          var tmpvalue = accum[namev[0]];
          accum[namev[0]] = [tmpvalue];
          accum[namev[0]].push(value);
          //accum[namev[0]].push(encodeURI(value));
        }
      } else {
				accum[namev[0]] = value;
				//accum[namev[0]] = encodeURI(value);
			}
			
		} else {
			
			if (accum[namev[0]] == null) {
				if (namev[1].match(/^[0-9]+$/)) {
					accum[namev[0]] = [];
				} else {
					accum[namev[0]] = {};
				}
			}
			
			add(accum[namev[0]], namev.slice(1), value);
		}
	}; 
	
	$.each(formobj, function(idx, formelm) {
		if ($(formelm).attr('name') == undefined) return;
		if ($(formelm).val() == '') return;
		if ($(formelm).val() == null) return;
		
    //console.log('extract: ' + $(formelm).attr('name') + ' : ' + $(formelm).val());
    
		add(accum, $(formelm).attr('name').split('.'), $(formelm).val());
	});
	
	return accum;
},

summary: function(initflag) {
  
	var ulorg = $('ul.accounts').clone();
	
  // for java version debug
	$.getJSON
	('/json/summary',
	 function(data) {
     $.post('/node/json/savedebugjson',
            'filename=summary.java&json=' + encodeURIComponent(JSON.stringify(data)),
            function() {}, 'json');
   });
  
	$.getJSON('/node/json/summary', function(data) {
		
    $.post('/node/json/savedebugjson',
           'filename=summary.node&json=' + encodeURIComponent(JSON.stringify(data)),
           function() {}, 'json');

		if (!data.json.summary.alluserids) {
			showcontent('#help');
			return;
		}
		
		$('ul.accounts > li.allitems').append(' (<span>'+data.json.summary.alluserids.allitems+'</span>)');
		$('ul.accounts > li.itemstatuses:first').attr('id', 'euidstatuses_allitems');
		$.each(data.json.summary.alluserids, function(k, v) {
			$('ul.accounts > li > ul.accountaction li.'+k).append(' (<span>'+v+'</span>)');
		});
		
    if (initflag) {
			if ($('#user_email').html() == 'demo@listers.in') {
				$('li.saved', '#euidstatuses_allitems').click();
			} else {
				$('li.active', '#euidstatuses_allitems').click();
			}
    }
    
		/* each eBay UserIDs */
		$.each(data.json.summary, function(ebayuserid, o) {
			if (ebayuserid == 'alluserids') return;
			
			var ul = ulorg.clone();
			
			$('li.allitems', ul)
				.attr('id', 'euid_'+ebayuserid)
				.attr('class', ebayuserid)
				.html(ebayuserid+' (<span>'+o.allitems+'</span>)');

			$('li.itemstatuses', ul)
				.attr('id', 'euidstatuses_'+ebayuserid);
			
			$('ul.accountaction', ul)
				.attr('class', 'accountaction '+ebayuserid);
			
			$.each(o, function(j, v) {
				$('li.'+j, ul).append(' (<span>'+v+'</span>)');
			});
			
			$('ul.accounts').append(ul.html());
			
			var optiontag = $('<option />').val(ebayuserid).html(ebayuserid);
			$('select[name=UserID]', '#detailtemplate').append(optiontag);
      
			var optiontag = $('<option />').val(ebayuserid).html(ebayuserid);
			$('select[name=UserID]', '#hiddenforms').append(optiontag);
		});
		
		var licount = $('ul.accounts > li').length;
		if (licount == 2) {
			showcontent('#help');
		}
		
		return;
	});
	
	return;
},

// todo: skip some forms if selected category is not a leaf category.
setformelements: function(item)
{
  var hash    = this.hash;
  var sitecur = this.sitecur;
  
	var id = item.id;
  var idstr = '#' + item.id + '-detail';
	var site = item.mod.Site;
	
	/* Country */
	$('select[name="mod.Country"]', idstr).empty();
	$.each(hash[site].eBayDetails.CountryDetails, function(k, v) {
		var optiontag = $('<option/>').val(v.Country).text(v.Description);
		$('select[name="mod.Country"]', idstr).append(optiontag);
	});
  
	/* Currency */
	$('select[name="mod.Currency"]', idstr).empty();
	$.each(hash[site].eBayDetails.CurrencyDetails, function(k, v) {
		if ($.inArray(v.Currency, sitecur[site]) == -1) return;
		var optiontag = $('<option/>').val(v.Currency).text(v.Currency+' ('+v.Description+')');
		$('select[name="mod.Currency"]', idstr).append(optiontag);
	});
	//var tmpcurval = $('select[name="mod.Currency"]', idstr).val();
	//$('input[name$="@currencyID"]', idstr).val(tmpcurval);
  
	/* Categories */
	if (item.categorypath) {
	} else {
		item.categorypath = [];
	}
	
	var tmppath = item.categorypath.slice(0); // just copy?
	tmppath.unshift(0);
	
	var pds = this.getcategorypulldowns(site, tmppath);
	$('div[data-form="primarycategory"]', idstr).html(pds);
	
	/* Secondary Category */
	if (item.secondarycategorypath) {
		
	} else {
		item.secondarycategorypath = [];
	}
	
	var tmppath = item.secondarycategorypath.slice(0); // just copy?
	tmppath.unshift(0);
	
	var pds = this.getsecondarycategorypulldowns(site, tmppath);
	$('div[data-form="secondarycategory"]', idstr).html(pds);
	
	var tmppc = hash[site].Categories;
	if (item.categorypath.length >= 2) {
		tmppc = tmppc['c'+item.categorypath[item.categorypath.length-2]];
	}
	
	$('select[name="mod.ConditionID"]', idstr).empty();
	var category;
	if (item.mod.PrimaryCategory) {
		var category = tmppc['c'+item.mod.PrimaryCategory.CategoryID];
		
		if (category.CategoryFeatures) {
      
		  /* Condition */
			if (category.CategoryFeatures.ConditionEnabled == 'Disabled') {
				
				var optiontag = $('<option/>').val('').html('(disabled)');
				$('select[name="mod.ConditionID"]', idstr).append(optiontag);
				
			} else {
				
				var optiontag = $('<option/>').val('').html('(not selected)');
				$('select[name="mod.ConditionID"]', idstr).append(optiontag);
				
				var conditions = category.CategoryFeatures.ConditionValues.Condition;
				for (i in conditions) {
					var value = conditions[i].ID;
					var label = conditions[i].DisplayName;
					var optiontag = $('<option/>').val(value).html(label);
					$('select[name="mod.ConditionID"]', idstr).append(optiontag);
				}
				
			}
      
      /* Variations */
      if (category.CategoryFeatures.VariationsEnabled == 'true') {
        $('div.variations-disabled', idstr).hide();
        $('div.variations-enabled',  idstr).show();
      } else {
        $('div.variations-enabled',  idstr).hide();
        $('div.variations-disabled', idstr).show();
      }
			
		} else {
			
			var optiontag = $('<option/>').val('').html('(Please select category)');
			$('select[name="mod.ConditionID"]', idstr).append(optiontag);
			
		}
		
		/* BestOffer */
		//log('BestOffer:'+category.CategoryFeatures.BestOfferEnabled);
		
	} else {
		
		var optiontag = $('<option/>').val('').html('(Please select category)');
		$('select[name="mod.ConditionID"]', idstr).append(optiontag);
		
	}
	
	/* Variations */
	this.setformelements_variations(item);
	
	/* ItemSpecifics */
	this.setformelements_itemspecifics(item);
	
	/* ListingDuration (depends on Site, PrimaryCategory, ListingType) */
  this.setformelements_listingduration(item);
	
	/* ShippingPackage */
	var _sdcsr = 'ShippingDetails.CalculatedShippingRate';
	$('select[name="mod.'+_sdcsr+'.ShippingPackage"]', idstr).empty();
	var optiontag = $('<option/>').val('').html('');
	$('select[name="mod.'+_sdcsr+'.ShippingPackage"]', idstr).append(optiontag);
	if (hash[site].eBayDetails.ShippingPackageDetails) {
		$.each(hash[site].eBayDetails.ShippingPackageDetails, function(i, o) {
			var optiontag = $('<option/>').val(o.ShippingPackage).html(o.Description);
			$('select[name="mod.'+_sdcsr+'.ShippingPackage"]', idstr).append(optiontag);
		});
	}
	
	/* ShippingService */
	this.setformelements_shipping(item);
	
	/* DispatchTimeMax */
	$('select[name="mod.DispatchTimeMax"]', idstr).empty();
	var optiontag = $('<option/>').val('').html('Select a handling time');
	$('select[name="mod.DispatchTimeMax"]', idstr).append(optiontag);
	$.each(hash[site].eBayDetails.DispatchTimeMaxDetails, function(i, o) {
		var optiontag = $('<option/>').val(o.DispatchTimeMax).html(o.Description);
		$('select[name="mod.DispatchTimeMax"]', idstr).append(optiontag);
	});
	
	/* PaymentMethods */
	// Do not use GeteBayDetails to discover the valid payment methods for a site.
	$('div[data-form="paymentmethod"]', idstr).empty();
	$.each(hash[site].CategoryFeatures.SiteDefaults.PaymentMethod, function(i, o) {
    
    var divtag = $('<div/>').addClass('checkbox');
    
    var labeltag = $('<label/>');
    
		var checkboxtag = $('<input/>')
			.attr('type', 'checkbox')
			.attr('name', 'mod.PaymentMethods')
			.addClass('ace')
			.val(o);
		
    var spantag = $('<span/>').addClass('lbl').html(' ' + o);
    
    $(labeltag).append(checkboxtag);
    $(labeltag).append(spantag);
    
    $(divtag).append(labeltag);
    
		$('div[data-form="paymentmethod"]', idstr).append(divtag);
    
		if (o == 'PayPal') {
      
      var div2 = $('<div/>')
        .attr('style', 'margin-left:20px;');
      
			var inputtag = $('<input/>')
				.attr('type', 'text')
				.attr('name', 'mod.PayPalEmailAddress');
			$(div2).append('PayPal email address : ');
			$(div2).append(inputtag);
      
      $(div2).append(
        $('<div/>')
          .addClass('checkbox')
          .append(
            $('<label/>')
              .append(
                $('<input/>')
				          .attr('type', 'checkbox')
				          .attr('name', 'mod.AutoPay')
				          .attr('value', 'true')
                  .addClass('ace')
              )
              .append(
                $('<span/>')
                  .addClass('lbl')
                  .append('Require immediate payment when buyer uses Buy It Now')
              )
          )
      );
      
		  $('div[data-form="paymentmethod"]', idstr).append(div2);
		}
		
	});
	
	/* ReturnPolicy */
	var rparr = ['ReturnsAccepted', 'ReturnsWithin', 'Refund', 'ShippingCostPaidBy'];
	for (i in rparr) {
		var rpname = rparr[i];
		var optiontag = $('<option/>').val('').text('');
		$('select[name="mod.ReturnPolicy.'+rpname+'Option"]', idstr).empty();
		$('select[name="mod.ReturnPolicy.'+rpname+'Option"]', idstr).append(optiontag);
		
		if (hash[site].eBayDetails.ReturnPolicyDetails[rpname]) {
			$.each(hash[site].eBayDetails.ReturnPolicyDetails[rpname], function(i, o) {
				var optiontag = $('<option/>').val(o[rpname+'Option']).text(o.Description);
				$('select[name="mod.ReturnPolicy.'+rpname+'Option"]', idstr).append(optiontag);
			});
		}
	}
	
	/* ThemeGroup */
	var optiontag = $('<option/>').val('').text('(not selected)');
	$('select[name="ListingDesigner.GroupID"]', idstr).empty();
	$('select[name="ListingDesigner.GroupID"]', idstr).append(optiontag);
	if (hash[site].ThemeGroup) {
		$.each(hash[site].ThemeGroup, function(i, o) {
			var optiontag = $('<option/>').val(o.GroupID).text(o.GroupName);
			$('select[name="ListingDesigner.GroupID"]', idstr).append(optiontag);
		});
	}
	
	var optiontag = $('<option/>').val('').text('(not selected)');
	$('select[name="mod.ListingDesigner.ThemeID"]', idstr).empty();
	$('select[name="mod.ListingDesigner.ThemeID"]', idstr).append(optiontag);
  
	if (hash[site].DescriptionTemplate) {
		$.each(hash[site].DescriptionTemplate, function(i, o) {
			var optiontag = $('<option/>').val(o.ID).text(o.Name);
			$('select[name="mod.ListingDesigner.ThemeID"]', idstr).append(optiontag);
		});
	}	
	
	/* checkbox,radio and label */
	$('input[type=checkbox][id^=_id]', idstr).each(function (i, o) {
		var newid = $(o).attr('id').replace(/^_id/, id);
		$(o).attr('id', newid);
	});
	$('input[type=radio][id^=_id]', idstr).each(function (i, o) {
		var newid = $(o).attr('id').replace(/^_id/, id);
		$(o).attr('id', newid);
	});
	$('label[for^=_id]', idstr).each(function (i, o) {
		var newid = $(o).attr('for').replace(/^_id/, id);
		$(o).attr('for', newid);
	});
	
	return;
},

setformelements_listingduration: function(item) {
  
  var hash = this.hash;
	var id = item.id;
  var idstr = '#' + item.id + '-detail';
	var site = item.mod.Site;
  
	if (item.mod.PrimaryCategory == undefined) {
	  $('select[name="mod.ListingDuration"]', idstr).empty();
		var optiontag = $('<option/>').val('').html('(Please select category)');
		$('select[name="mod.ListingDuration"]', idstr).append(optiontag);
    return;
  }
  
  var categoryid = item.mod.PrimaryCategory.CategoryID;
  
  var parentid = $('select[name^="categorypath."]:last', idstr).val();
  
  if (item.categorypath[item.categorypath.length-1] != categoryid) {
    item.categorypath.push(categoryid);
  }
  
	var tmppc = hash[site].Categories;
	if (item.categorypath.length >= 2) {
		tmppc = tmppc['c'+item.categorypath[item.categorypath.length-2]];
	} else if (parentid) {
		tmppc = tmppc['c'+parentid];
  }
  
	var category = tmppc['c' + categoryid];
  
	if (category == undefined) return;
  
  /* Empty */
	$('select[name="mod.ListingDuration"]', idstr).empty();
  
  /* 1 day */
	if ($('select[name="mod.ListingType"]').val() == 'Chinese') {
		var optiontag = $('<option/>').val('Days_1').html('1 day');
		$('select[name="mod.ListingDuration"]', idstr).append(optiontag);
	}
  
  /* durationSetID */
	var durationsetid = null;
	if (category.CategoryFeatures) {
		for (i in category.CategoryFeatures.ListingDuration) {
			if (category.CategoryFeatures.ListingDuration[i]['@type'] == item.mod.ListingType) {
				durationsetid = category.CategoryFeatures.ListingDuration[i]['#text'];
				break;
			}
		}
	}
  
  /* ListingDurations */
	var listingdurations =
    hash[site].CategoryFeatures.FeatureDefinitions.ListingDurations.ListingDuration;
	for (i in listingdurations) {
		if (listingdurations[i]['@durationSetID'] == durationsetid) {
      
			for (j in listingdurations[i].Duration) {
        
				var value = listingdurations[i].Duration[j];
        
				var optiontag = $('<option/>').val(value).html(this.getListingDurationLabel(value));
        
				$('select[name="mod.ListingDuration"]', idstr).append(optiontag);
			}
			break;
		}
	}
  
  return;
},

setformelements_variations: function(item) {
  
  var idstr = '#' + item.id + '-detail';
  var hash = this.hash;
  
	// reset form elements
	//$('table.Variations tbody tr:gt(0)', '#'+item.id).remove();
	
	// todo: hide forms
	if (item.mod.PrimaryCategory == undefined) {
		return;
	}
	
	var categoryid = item.mod.PrimaryCategory.CategoryID;
	var parentid = item.categorypath[item.categorypath.length-2];
  if (parentid == undefined) return;
	var category = hash[item.mod.Site]['Categories']['c'+parentid]['c'+categoryid];
	
	/* Recommended names */
  if (category.CategorySpecifics && category.CategorySpecifics.NameRecommendation) {
		
		var recomm = ebayjs.arrayize(category.CategorySpecifics.NameRecommendation);
    
		var recommkey = new Array();
		for (i in recomm) {
			recommkey[recomm[i].Name] = i;
		}
		
		/* parent-child pair */
		var names = {};
		$.each(recomm, function(i, o) {
			if (o.ValidationRules.VariationSpecifics == 'Disabled') return;
			if (o.ValidationRules.Relationship) {
				
				// todo: why same multiple parent name? is xml broken?
				if ($.isArray(o.ValidationRules.Relationship)) {
					names[o.ValidationRules.Relationship[0].ParentName] += ' / ' + o.Name;
				} else {
					names[o.ValidationRules.Relationship.ParentName] += ' / ' + o.Name;
				}
				
			} else {
				names[o.Name] = o.Name;
			}
		});
		
		/* name selector */
		$('ul.VariationSpecificsSet', idstr).empty();
		$.each(names, function(k, v) {
			$('ul.VariationSpecificsSet', idstr).append($('<li />').html(v));
		});
	}
	
	/* If variations are already defined, then copy columns and rows */
  if (item.mod.Variations) {
		
		/* each rows */
		$.each(item.mod.Variations.Variation, function(rowidx, variation) {
			
      if (variation.VariationSpecifics == undefined) return;
      
			if (rowidx == 0) {
				
				/* each columns */
				var nvl = ebayjs.arrayize(variation.VariationSpecifics.NameValueList);
				$.each(nvl, function(colidx, nv) {
					ebayjs.addvariationnames(item.id, [nv.Name], item);
				});
				
			} else {
				
				/* Copy input form row */
				ebayjs.addvariationrow(item.id);
			}
			
    });
		
		ebayjs.renumbervariations(item.id);
    
    /* VariationPictures */
		if (item.mod.Variations.Pictures) {
			
			$.each(item.mod.Variations.Pictures.VariationSpecificPictureSet, function(i, o) {
				if (i == 0) return;
				ebayjs.addvariationpicturerow(item.id, i);
				// don't show images here. show in showformvalues / fillformvalues
			});
			
			$('div.VariationSpecificPictureSet div[class^="VariationPictures"]', idstr).show();
		}
    
  }
	
	return;
},

setformelements_shipping: function(item) {
  this.setformelements_shipping_domestic(item);
  this.setformelements_shipping_international(item);
},

setformelements_shipping_domestic: function(item) {
  
  var hash = this.hash;
  
	var id = item.id;
  var idstr = '#' + item.id + '-detail';
	var site = item.mod.Site;
	
  // No shipping
	if (item.mod.ShippingDetails == undefined
      || item.mod.ShippingDetails.ShippingType == undefined
      || item.mod.ShippingDetails.ShippingType.domestic == undefined
      || item.mod.ShippingDetails.ShippingType.domestic == '') {
    
		// todo: remove 2>=
		$('select[name="mod.ShippingDetails.ShippingType.domestic"]', idstr).val('');
		$('.shippingmainrows', idstr).hide();
    
		$('select[name="mod.ShippingDetails.ShippingType.international"]', idstr).val('');
		$('.internationalshippingmainrows', idstr).hide();
		
		return;
  }

  if (item.mod.ShippingDetails.ShippingType.domestic == 'FreightFlat') {
		$('select[name="mod.ShippingDetails.ShippingType.international"]', idstr).val('');
		$('.internationalshippingmainrows', idstr).hide();
  }
  
	$('.shippingmainrows', idstr).show();
	ebayjs.renumbersso(id, 'shippingservices');
	
	var _dsso = 'ShippingDetails.ShippingServiceOptions';
	var _isso = 'ShippingDetails.InternationalShippingServiceOption';
	var dmsttype = item.mod.ShippingDetails.ShippingType.domestic;
  
  // todo: With Opera: pulldown keeps open when run here.
  //return;
	
	if (dmsttype == 'Calculated') {
		$('tr.packagetype, tr.dimensions, tr.weight', idstr).show();
	} else {
		$('tr.packagetype, tr.dimensions, tr.weight', idstr).hide();
	}
	
	var packagetype = '';
	if (item.mod.ShippingDetails.CalculatedShippingRate) {
		packagetype = item.mod.ShippingDetails.CalculatedShippingRate.ShippingPackage;
	}
	
	// set <option> tags
  // todo: don't set option tags here, set when site is changed.
	$('select[name="mod.'+_dsso+'.0.ShippingService"]', idstr).empty();
	$('select[name="mod.'+_dsso+'.0.ShippingService"]', idstr)
		.append($('<option/>').val('').text('(not selected)'));
	
	$.each(hash[site].eBayDetails.ShippingServiceDetails, function(i, o) {
		
		if (dmsttype == 'FreightFlat') {
			if (o.ShippingService == 'FreightShipping' || o.ShippingService == 'Freight') {
				$('select[name="mod.'+_dsso+'.0.ShippingService"]', idstr)
					.append($('<option/>').val(o.ShippingService).html(o.Description));
			}
    }
		
		if (o.ValidForSellingFlow != 'true') return;
		if (parseInt(o.ShippingServiceID) >= 50000) return;
		
		var arrservicetype = ebayjs.arrayize(o.ServiceType)
		
		if ($.inArray(dmsttype, arrservicetype) >= 0) {
      
			if (dmsttype == 'Calculated') {
				var packages = ebayjs.arrayize(o.ShippingServicePackageDetails);
				
				for (i in packages) {
					if (packages[i].Name == packagetype) {
						$('select[name="mod.'+_dsso+'.0.ShippingService"]', idstr)
							.append($('<option/>').val(o.ShippingService).html(o.Description));
					}
				}
			} else {
				$('select[name="mod.'+_dsso+'.0.ShippingService"]', idstr)
					.append($('<option/>').val(o.ShippingService).html(o.Description));
			}
      
		}
		
	});
	
	// ShippingLocation
	$('div.ShipToLocation', idstr).empty();
	$.each(hash[site].eBayDetails.ShippingLocationDetails, function(i, o) {
		var idforlabel = id+'.'+_isso+'.0.ShipToLocation.'+o.ShippingLocation;
		
		var checkbox = $('<input/>')
			.attr('type', 'checkbox')
			.attr('id', idforlabel)
			.attr('name', 'mod.'+_isso+'.0.ShipToLocation')
			.val(o.ShippingLocation);
		
		var label = $('<label/>')
			.attr('for', idforlabel)
			.html(o.Description);
		
		var li = $('<li/>').append(checkbox).append(label);
		
		$('ul.ShipToLocation', idstr).append(li);
	});
	
	// copy 2,3,4,...
	// todo: don't copy when already 2, 3, ... is shown.
	if ($.isArray(item.mod.ShippingDetails.ShippingServiceOptions)
			&& item.mod.ShippingDetails.ShippingServiceOptions.length > 1) {
		
		$.each(item.mod.ShippingDetails.ShippingServiceOptions, function(k, v) {
			if (v.ShippingServicePriority == 1) return;
			ebayjs.addsso(id, 'shippingservices');
		});
	}
	
	return;
},

setformelements_shipping_international: function(item) {
  
  var hash = this.hash;
  
	var id = item.id;
  var idstr = '#' + item.id + '-detail';
	var site = item.mod.Site;
  
  // No shipping
	if (item.mod.ShippingDetails == undefined
      || item.mod.ShippingDetails.ShippingType == undefined
      || item.mod.ShippingDetails.ShippingType.international == undefined
      || item.mod.ShippingDetails.ShippingType.international == ''
      || item.mod.ShippingDetails.ShippingType.domestic == 'FreightFlat') {
    
		// todo: remove 2>=
		$('select[name="mod.ShippingDetails.ShippingType.international"]', idstr).val('');
		$('.internationalshippingmainrows', idstr).hide();
		
		return;
  }
  
	$('.internationalshippingmainrows', idstr).show();
	ebayjs.renumbersso(id, 'internationalshippingservices');
  
	var _isso = 'ShippingDetails.InternationalShippingServiceOption';
  var intltype = item.mod.ShippingDetails.ShippingType.international;
  
	// Set <option> tags
	$('select[name="mod.'+_isso+'.0.ShippingService"]', idstr).empty();
	$('select[name="mod.'+_isso+'.0.ShippingService"]', idstr)
		.append($('<option/>').val('').text('(not selected)'));
  
	$.each(hash[site].eBayDetails.ShippingServiceDetails, function(i, o) {
		if (o.ValidForSellingFlow != 'true') return;
		if (parseInt(o.ShippingServiceID) < 50000) return;
		
		var arrservicetype = ebayjs.arrayize(o.ServiceType)
		
		if ($.inArray(intltype, arrservicetype) >= 0) {
			$('select[name="mod.'+_isso+'.0.ShippingService"]', idstr)
				.append($('<option/>').val(o.ShippingService).html(o.Description));
		}
	});
  
	if ($.isArray(item.mod.ShippingDetails.InternationalShippingServiceOption)
			&& item.mod.ShippingDetails.InternationalShippingServiceOption.length > 1) {
		
		$.each(item.mod.ShippingDetails.InternationalShippingServiceOption, function(k, v) {
			if (v.ShippingServicePriority == 1) return;
			ebayjs.addsso(id, 'internationalshippingservices');
		});
	}
  
	// ShipToLocations
  // todo: check this td tag. exists?
	$('td.ShipToLocations', idstr).empty();
	$.each(hash[site].eBayDetails.ShippingLocationDetails, function(i, o) {
		var idforlabel = id + '.ShipToLocations.' + o.ShippingLocation;
		
		var checkbox = $('<input/>')
			.attr('type', 'checkbox')
			.attr('id', idforlabel)
			.attr('name', 'mod.ShipToLocations')
			.val(o.ShippingLocation);
		
		var label = $('<label/>')
			.attr('for', idforlabel)
			.html(o.Description);
		
		var li = $('<li/>').append(checkbox).append(label);
		
		$('ul.ShipToLocations', idstr).append(li);
	});
  
  return;
},

addsso: function(id, classname) {
  
	var pdiv = $('div[data-form="' + classname + '"]', '#' + id + '-detail');
	
	var divs = $('div[class^="ShippingService"]', pdiv);
	
	if (classname == 'shippingservices') {
		if (divs.length >= 4) return;
	} else if (classname == 'internationalshippingservices') {
		if (divs.length >= 5) return;
	}
	
	var sscopy = $(divs[0]).clone();
  
  $('select,input[type!="checkbox"]', sscopy).val('');
	
	if (classname == 'shippingservices') {
		$('input[name$="FreeShipping"]', sscopy).remove();
		$('label[for$="FreeShipping"]', sscopy).remove();
	}
	
	$('div[class^=ShippingService]:last', pdiv).after(sscopy);
	
	ebayjs.renumbersso(id, classname);
	
	// Hide "Offer additional service" link.
	if (classname == 'shippingservices' && divs.length >= 3) {
		$('a.addsso', pdiv).hide();
	} else if (classname == 'internationalshippingservices' && divs.length >= 4) {
		$('a.addsso', pdiv).hide();
	}
	
	return false;
},

renumbersso: function(id, classname) {
  
	var pdiv = $('div[data-form="' + classname + '"]', '#' + id + '-detail');
	
	$.each($('div[class^="ShippingService"]', pdiv), function(i, div) {
		
		$(div).attr('class', 'ShippingService' + i);
		
		// todo: different number for Freight?
		$('input[name$=ShippingServicePriority]', div).val(i+1);
		
		$.each($('select, input', div), function(j, o) {
			var orgname = $(o).attr('name');
			$(o).attr('name', orgname.replace(/\.[0-9]\./, '.' + i + '.'));
		});
    
		if (classname == 'shippingservices') return;
		
		$.each($('input[type=checkbox]', div), function(j, o) {
			var orgid = $(o).attr('id');
			$(o).attr('id', orgid.replace(/\.[0-9]\./, '.' + i + '.'));
		});
		
		$.each($('label', div), function(j, o) {
			var orgid = $(o).attr('for');
			$(o).attr('for', orgid.replace(/\.[0-9]\./, '.' + i + '.'));
		});
		
	});
	
	return;
},

addvariationnames: function(id, nvnames, item) {
  
  var hash = this.hash;
  
  var idstr = '#' + id + '-detail';
  
	var colcount = $('table.Variations thead th', idstr).length;
	if (colcount >= 9) {
		alert('You can add maximum 5 variation details.');
		return false;
	}
		
	var site;
	var categoryid;
	var parentid;
	
	if (item) {
		
		site       = item.mod.Site;
		categoryid = item.mod.PrimaryCategory.CategoryID;
		parentid   = item.categorypath[item.categorypath.length-2];
		
	} else {
		
		site       = $('select[name="mod.Site"]', idstr).val();
		categoryid = $('select[name="mod.PrimaryCategory.CategoryID"]', idstr).val();
		parentid   = $('select[name="mod.PrimaryCategory.CategoryID"]', idstr).prev().val();
		
	}
	
	var category = hash[site]['Categories']['c'+parentid]['c'+categoryid];
	
	/* Recommended names */
	var recommkey = new Array();
  if (category.CategorySpecifics) {
		var recomm = ebayjs.arrayize(category.CategorySpecifics.NameRecommendation);
		for (i in recomm) {
			recommkey[recomm[i].Name] = i;
		}
	}
	
	/* each name value names */
	$.each(nvnames, function(idx, nvname) {
		
		var colcount = $('table.Variations thead th', idstr).length;
		
		/* <th> */
		var a = $('<a/>').attr('href', '#').addClass('removevariationname').html('X');
		var th = $('<th/>').append($('<div/>')).append(a);
		$('div', th).html(nvname);
    
    // use eq() here
		$('table.Variations thead th:eq('+(colcount-4)+')', idstr).after(th);
		
		/* <td> */
    var hidden = $('<input/>')
      .attr('type', 'hidden')
      .attr('name', 'mod.Variations.Variation.0.VariationSpecifics.NameValueList.0.Name')
      .val(nvname);
		
    var td = $('<td/>').append(hidden);
		
		if (recommkey[nvname] && recomm[recommkey[nvname]]) {
			
			var selectionmode = recomm[recommkey[nvname]].ValidationRules.SelectionMode;
			if (selectionmode == 'FreeText') {
			
				var input = $('<input/>')
					.attr('type', 'text')
					.addClass('selectorparent')
					.attr('name', 'mod.Variations.Variation.0.VariationSpecifics.NameValueList.0.Value');
				
				var selecttag = $('<select/>')
					.addClass('selector')
					.attr('name', 
								'mod.Variations.Variation.0.VariationSpecifics.NameValueList.0.Value.selector');
				
				$.each(recomm[recommkey[nvname]].ValueRecommendation, function(k, o) {
					var optiontag = $('<option/>').val(o.Value).html(o.Value);
					$(selecttag).append(optiontag);
				});
				
				$(td).append(input).append(selecttag);
				
			} else if (selectionmode == 'SelectionOnly') {
				
				var selecttag = $('<select/>')
					.attr('name', 'mod.Variations.Variation.0.VariationSpecifics.NameValueList.0.Value');
				
				$.each(recomm[recommkey[nvname]].ValueRecommendation, function(k, o) {
					var optiontag = $('<option/>').val(o.Value).html(o.Value);
					$(selecttag).append(optiontag);
				});
				
				$(td).append(selecttag);
			}
			
		} else {
			
			/* Not recommended name, custom detail */
			var input = $('<input/>')
				.attr('type', 'text')
				.attr('name', 'mod.Variations.Variation.0.VariationSpecifics.NameValueList.0.Value');
			
			$(td).append(input);
			
		}
		
    // use nth-child() for add to each row
		$('table.Variations tbody td:nth-child('+(colcount-3)+')', idstr).after(td);
		
	});
	
	ebayjs.renumbervariations(id);
	ebayjs.setvpvsn_options(id);
	
	return;
},

addvariationrow: function(id) {
  
  var idstr = '#' + id + '-detail';
  
	var tr = $('table.Variations tbody tr:first', idstr).clone()
	$('table.Variations tbody', idstr).append(tr);
  
	ebayjs.renumbervariations(id);
	
	return;
},

addvariationpicturerow: function(id, idx) {
  
  var idstr = '#' + id + '-detail';
  
	var div = $('div.VariationPictures0', idstr).clone();
	
	$(div).attr('class', 'VariationPictures' + idx);
  
	$('ul.variationpictures', div)
    .removeClass('variationpictures0')
    .addClass('variationpictures' + idx);
  
	$('input[name="divclass"]', div).val('variationpictures' + idx);
	$('ul.variationpictures li:gt(0)', div).remove();
	
	$('input[type="hidden"][name^="mod.Variations.Pictures.VariationSpecificPictureSet"]', div)
		.attr('name', 
					'mod.Variations.Pictures.VariationSpecificPictureSet.' + idx + '.VariationSpecificValue');
	
	$('div.VariationSpecificPictureSet', idstr).append(div);
	
	return;
},

renumbervariations: function(id) {
  
  var idstr = '#' + id + '-detail';

	$.each($('table.Variations th input', idstr), function(i, th) {
		var name = $(this).attr('name');
		if (name == undefined) return;
		$(this).attr('name', name.replace(/[0-9]+\.Name$/, i + '.Name'));
	});
	
	/* each rows */
	$.each($('table.Variations tbody tr', idstr), function(rowidx, tr) {
		/* each columns */
		$.each($('td', tr), function(colidx, td) {
			/* each elements */
			$.each($('input,select', td), function(i) {
				
				var name = $(this).attr('name');
				if (name == undefined) return;
				
				name = name.replace(/Variation.[0-9]+/, 'Variation.'+rowidx);
				name = name.replace(/[0-9]+.Value/, (colidx-1)+'.Value');
				name = name.replace(/[0-9]+.Name/, (colidx-1)+'.Name');
				
				$(this).attr('name', name);
			});;
		});
	});
},
/* <select name="mod.Variations.Pictures.VariationSpecificName"> */

setvpvsn_options: function(id) {
  
  var idstr = '#' + id + '-detail';
  
	// todo: preserve selected value
	
  var select = $('select[name="mod.Variations.Pictures.VariationSpecificName"]', idstr);
  $(select).empty();
  $(select).append($('<option/>').val('').html('(not selected)'));
  
	var colcount = $('table.Variations thead th', idstr).length;
	for (var i=1; i<=(colcount-4); i++) {
		var str = $('table.Variations thead th:eq('+i+') div', idstr).html();
    $(select).append($('<option/>').val(str).html(str));
	}
  
  return;
},

resizediv: function() {
  
	var windowh = $(window).height();
  
  var headerh = $('#header').height();
  headerh += $('#header').css('margin-top').replace('px', '') - 0;
  headerh += $('#header').css('margin-bottom').replace('px', '') - 0;
  
  var contentmargin = $('#content').css('margin-top').replace('px', '');
  
  $('#content').height(windowh - headerh - contentmargin);
	$('#toolbar').height(windowh - headerh - contentmargin);
  
  var windoww = $(window).width();
  var leftw = $('#leftpane').width();
  leftw += $('#leftpane').css('margin-right').replace('px', '') - 0;
  leftw += $('#leftpane').css('margin-left').replace('px', '') - 0;
  
  $('#rightpane').width(windoww - leftw);
  //$('#content').width(windoww - leftw);
  //$('#items').width(windoww - leftw);
	//$('#items').width(windoww - leftw - 30);
  
	$('#message')
    .width($('#container').width() - 300)
    .css('margin', '0 150px');
	
	var theadh = $('thead', '#items').height();
	
	$('#rowloading td').height(windowh - headerh - contentmargin - theadh - 4);
	
  return;
},

changeCategory: function() {
	
	var id = $(this).closest('tbody.itemrow').attr('id');
  var idstr = '#' + id + '-detail';
  
	var site = $('select[name="mod.Site"]', idstr).val();
  var td = $(this).closest('td');
	var tdclass = $(td).attr('class');
	
	$(this).nextAll().remove();
	if (tdclass == 'secondarycategory') {
		$('select:last', td).attr('name', 'mod.SecondaryCategory.CategoryID');
	} else {
		$('select:last', td).attr('name', 'mod.PrimaryCategory.CategoryID');
	}
	
	var primarycategorypulldowns = $('td.primarycategory select', idstr).get();
	var primarycategorypath = new Array();
	for (node in primarycategorypulldowns) {
		primarycategorypath.push(primarycategorypulldowns[node].value);
	}
	
	var secondarycategorypulldowns = $('td.secondarycategory select', idstr).get();
	var secondarycategorypath = new Array();
	for (node in secondarycategorypulldowns) {
		secondarycategorypath.push(secondarycategorypulldowns[node].value);
	}
	
	var joined;
	if (tdclass == 'secondarycategory') {
		joined = secondarycategorypath.join('.');
	} else {
		joined = primarycategorypath.join('.');
	}
	
	$.getJSON
	('/node/json/gc2?site='+site+'&path=0.'+joined,
	 function(data) {
		 
		 if (tdclass == 'secondarycategory') {
			 hash[site].SecondaryCategories = data.json.gc2.Categories;
		 } else {
			 hash[site].Categories = data.json.gc2.Categories;
		 }
		 
		 var item_modifing =
			 $('input[type="text"][name^="mod"], input:checked, input[type="hidden"], select[name^="mod"], textarea', idstr)
			 .extractObject();
		 
		 item_modifing.id = id;
		 item_modifing.categorypath = primarycategorypath;
		 item_modifing.secondarycategorypath = secondarycategorypath;
		 
		 setformelements(item_modifing);
		 fillformvalues(item_modifing);
		 
		 return;
	 });
	
	return;
},

checkformvalues: function(id) {

	if ($('select[name="mod.PrimaryCategory.CategoryID"]', '#'+id).val() == '') {
		alert('category error');
		return false;
	}
	
	return true;
},

changeSite: function() {
  
	var id   = $(this).closest('tbody.itemrow').attr('id');
	var site = $(this).val();
	
	$.getJSON
	('/node/json/site?site=' + site,
	 function(data) {
		 
		 hash[site] = new Object;
		 hash[site].eBayDetails      = data.json.eBayDetails;
		 hash[site].Categories       = data.json.Categories;
		 hash[site].CategoryFeatures = data.json.CategoryFeatures;
		 hash[site].SecondaryCategories = $.extend({}, data.json.Categories);
		 
		 var item_modifing =
			 $('input[type=text], input:checked, input[type=hidden], select, textarea', '#'+id)
			 .extractObject();
		 
		 item_modifing.id = id;
		 item_modifing.categorypath = [];
		 
		 setformelements(item_modifing);
		 fillformvalues(item_modifing);
		 
		 return;
	 });
	
	return;
},

setmembermessageform: function(id, item) {
  
  if (item.membermessages == null) return;
  
  $.each(item.membermessages, function(idx, mme) {
    
    if (mme.MessageStatus != 'Unanswered') return;
		
    var div = $('#membermessagetemplate').clone().attr('id', '');
    
		$(div).attr('data-messageid', mme.Question.MessageID);
		
		var body = mme.Question.Body;
		body = body.replace(/\r\n/g, '<br/>');
		body = body.replace(/[\n\r]/g, '<br/>');
		
    $('div.body',  div).html(body);
    $('li.status', div).html(mme.MessageStatus);
    $('li.sender', div).html(mme.Question.SenderID);
    $('li.date',   div).html(mme.CreationDate);
    
    if (mme.MessageStatus == 'Unanswered') {
      $('li.status', div).css('color', '#f00');
    } else if (mme.MessageStatus == 'Answered') {
      $('li.status', div).css('color', '#090');
      $('div.form', div).empty();
    }
    
    //$('div.detail', '#'+id).before(div);
    $('tr.row2 td', '#'+id).append(div);
  });
  
  return;
},

getcategorypulldowns: function(site, path) {
  
  var hash = this.hash;
	var wrapper = $('<div/>');
	
	for (i in path) {
		
		var categoryid = path[i];
		if (hash[site].Categories['c'+categoryid] == undefined) break;
		
		var selecttag = $('<select class="primarycategory"/>').attr('name', 'categorypath.'+i);
		var optiontag = $('<option/>').val('').text('');
		selecttag.append(optiontag);		
		
		for (childid in hash[site]['Categories']['c'+categoryid]) {
			var child = hash[site]['Categories']['c'+categoryid][childid];
			var value = childid.replace(/^c/, '');
			var label = child.name;
			if (child.children > 0) label += ' &gt;';
			optiontag = $('<option/>').val(value).html(label);
			selecttag.append(optiontag);		
		}
		
		wrapper.append(selecttag);
	}
	
	$.each($('select', wrapper), function(i, form) {
		$(form).val(path[i+1]);
	});
	
	$('select:last', wrapper).attr('name', 'mod.PrimaryCategory.CategoryID');
	
	return wrapper.children();
},

getsecondarycategorypulldowns: function(site, path) {
  
  var hash = this.hash;
	var wrapper = $('<div/>');
	
	for (i in path) {
		
		var categoryid = path[i];
		if (hash[site].SecondaryCategories['c'+categoryid] == undefined) break;
		
		var selecttag = $('<select class="secondarycategory"/>')
			.attr('name', 'secondarycategorypath.'+i);
		var optiontag = $('<option/>').val('').text('');
		selecttag.append(optiontag);		
		
		for (childid in hash[site]['SecondaryCategories']['c'+categoryid]) {
			var child = hash[site]['SecondaryCategories']['c'+categoryid][childid];
			var value = childid.replace(/^c/, '');
			var label = child.name;
			if (child.children > 0) label += ' &gt;';
			optiontag = $('<option/>').val(value).html(label);
			selecttag.append(optiontag);		
		}
		
		wrapper.append(selecttag);
	}
	
	$.each($('select', wrapper), function(i, form) {
		$(form).val(path[i+1]);
	});
	
	$('select:last', wrapper).attr('name', 'mod.SecondaryCategory.CategoryID');
	
	return wrapper.children();
},

refresh: function() {
  
	var postdata = '';
	
	$.post
	('/node/json/refresh',
	 $('input:checked[name="id"]').serialize(),
	 function(data) {
		 
		 /* summary */
     /*
		 if (data.json.summary) {
			 
			 $('ul.accounts > li.allitems > span').html(data.json.summary.alluserids.allitems);
			 $.each(data.json.summary.alluserids, function(k, v) {
				 $('ul.accounts > li > ul[class=accountaction] > li.'+k+' > span').html(v);
			 });
			 
			 $.each(data.json.summary, function(k, o) {
				 if (k == 'alluserids') return;
				 
				 $('ul.accounts > li.'+k+' > span').html(o.allitems);
				 $.each(data.json.summary.alluserids, function(j, v) {
					 $('ul.accounts > li > ul[class="accountaction '+k+'"] > li.'+j+' > span').html(v);
				 });
			 });
		 }
		 */
     
		 /* items */
		 if (data.json.items) {
			 if (postdata != '') {
         
				 $.each(data.json.items, function(idx, row) {
					 dom = getrow(row.id, row);
					 $('#'+row.id).replaceWith(dom);
					 if (typeof(row.status) == 'string' && row.status != '') {
						 //
					 } else {
						 //$('input:checkbox', dom).css('visibility', '').removeAttr('checked');
						 $('input:checkbox', dom).parent().removeClass('loading');
					 }
					 rowsdata[row.id] = row;
				 });
				 
			 } else {
				 
				 /*
				 $('tbody:gt(1)', '#items').remove();
				 $('#content').scrollTop(0);
				 
				 $('tbody#rowloading').hide();
				 
				 var offset = parseInt($('input.filter[name=offset]').val());
				 var limit  = parseInt($('input.filter[name=limit]' ).val());
				 
				 var loaded = offset + limit;
				 if (loaded > data.json.cnt) {
					 loaded = data.json.cnt;
				 }
				 $('#paging').html(loaded + ' of ' + data.json.cnt);
				 
				 if (data.json.cnt > offset + limit) {
					 hasmore = true;
				 } else {
					 hasmore = false;
				 }
				 
				 $.each(data.json.items, function(idx, row) {
					 rowsdata[idx] = row;
					 var dom = getrow(idx, row);
					 $('#items').append(dom);
				 });
				 */
				 
			 }
		 }
	 },
	 'json');
	
	return;
},

showmessage: function(message) {
  
	$('#message').show();
	$('#message').html(message);
	
	return;
},

dismissmessage: function() {
  
  console.log('ebay-amd dismissmessage called');
  
	$('#message').fadeOut();
	
	clearTimeout(timeout);
	
	$.post('/node/json/dismissmessage',
			   null,
			   function(data) {
			   },
			   'json');
	
	return;
},

filter: function() {
	$('input[name=offset]').val(0);
	items(true);
	return;
},

showbuttons: function(detail, buttons) {
  
	var buttons = 'button.'+buttons.replace(/,/g, ',button.');
	
	var ulbtn = $('div.editbuttons', detail);
	$('div.editbuttons button', detail).hide();
	$(buttons, ulbtn).show();
	
	return;
},

showcontent: function(contentid){
  
	$('#items').hide();
	$('#content > div').hide();
	$(contentid).show();
	
	return;
},

msg: function(o) {
	$('div#msg').prepend(o+'<br>');
},

dump: function(o) {
	var htmlencoded = $('<div/>').text($.dump(o)).html();
	$('div#debug').html('<pre>'+htmlencoded+'</pre>');
},

log: function(str) {
	$('#log').prepend(str+'<br/>');
},

htmlencode: function(str) {
	return $('<div/>').text(str).html();
},

csvuploadedmessage: function()
{
	$('#csvimportmessage').html('Imported. Please check "Saved" items on the left navigation');
},

updateduration: function(id) {
  
	var site = $('select[name="mod.Site"]', '#'+id).val();
	var listingtype = $('select[name="mod.ListingType"]', '#'+id).val();
  var categoryid = $('select[name="mod.PrimaryCategory.CategoryID"]', '#'+id).val();
	var tmpo = hash[site]['category']['features'][categoryid]['ListingDuration'];
	
	var sel = $('<select/>').attr('name', 'ListingDuration');
	$.each(rowsdata[id]['categoryfeatures']['ListingDuration'][listingtype], function(k, v) {
		var opt = $('<option/>').val(k).text(v);
		sel.append(opt);
	});
	$('select[name=ListingDuration]', '#'+id).replaceWith(sel);
	
	return;
},

getListingDurationLabel: function(str) {
  
	if (str == 'Days_1') {
		str = "1 Day";
	} else if (str == 'GTC') {
		str = "Good 'Til Cancelled";
	} else if (str.match(/^Days_([\d]+)$/)) {
		str = str.replace(/^Days_([\d]+)$/, "$1 Days");
	}
    
	return str;
},

/* Arrayize */
arrayize: function(object) {
  
  var result = null;
  
	if ($.isArray(object)) {
		result = object;
	} else {
		result = new Array();
		result.push(object);
	}
	
	return result;
},

/* Show form values */
showformvalues: function(item) {
  
	/* Arrayize */
	if (item.mod.PictureDetails && item.mod.PictureDetails.PictureURL) {
		item.mod.PictureDetails.PictureURL
			= ebayjs.arrayize(item.mod.PictureDetails.PictureURL);
	}
	
	if (item.mod.ShippingDetails) {
		if (item.mod.ShippingDetails.ShippingServiceOptions) {
			item.mod.ShippingDetails.ShippingServiceOptions
				= ebayjs.arrayize(item.mod.ShippingDetails.ShippingServiceOptions);
		}
		if (item.mod.ShippingDetails.InternationalShippingServiceOption) {
			item.mod.ShippingDetails.InternationalShippingServiceOption
				= ebayjs.arrayize(item.mod.ShippingDetails.InternationalShippingServiceOption);
		}
	}
	
	if (item.mod.ItemSpecifics) {
		item.mod.ItemSpecifics.NameValueList
			= ebayjs.arrayize(item.mod.ItemSpecifics.NameValueList);
	}
	
	if (item.mod.Variations) {
    item.mod.Variations.Variation = ebayjs.arrayize(item.mod.Variations.Variation);
		$.each(item.mod.Variations.Variation, function(idx, variation) {
			item.mod.Variations.Variation[idx].VariationSpecifics.NameValueList
				= ebayjs.arrayize(item.mod.Variations.Variation[idx].VariationSpecifics.NameValueList);
		});
	}
	
	//var detail = $('div.detail', '#' + item.id);
	var detail = '#' + item.id + '-detail';
  
	/* text */
	$.each($('input[type="text"][name^="mod"]', detail), function(i, form) {
		var formname = $(form).attr('name');
		formname = "['" + formname.replace(/\./g, "']['") + "']";
		try {
			eval('tmpvalue = item' + formname);
			
			if (tmpvalue == null) tmpvalue = '';
			//tmpvalue = this.htmlencode(tmpvalue);
			tmpvalue = $('<div/>').text(tmpvalue).html();
      
      if (tmpvalue != '') {
        
        $(form).parent()
          .css('padding-top', '4px')
          .css('font-size', '14px')
          .css('font-weight', 'bold');
        
			  $(form).replaceWith(tmpvalue);
      } else {
			  $(form).remove();
      }
		} catch (err) {
			$(form).remove();
		}
	});
	
	/* select */
	$.each($('select', detail), function(i, form) {
		var formname = $(form).attr('name');
		if (formname == null) return;
		formname = "['" + formname.replace(/\./g, "']['") + "']";
    
		try {
			eval('tmpvalue = item' + formname);
			if (tmpvalue == null) tmpvalue = '';
			var label = $('option[value="' + tmpvalue + '"]', form).html();
      
      if (label != '') {
        
        $(form).parent()
          .css('padding-top', '4px')
          .css('font-size', '14px')
          .css('font-weight', 'bold');
        
			  $(form).replaceWith(label);
      } else {
			  $(form).remove();
      }
		} catch (err) {
			$(form).remove();
		}
	});
	
	/* Description (before replacing textarea)*/
	//$('textarea[name="mod.Description"]', detail).wysiwyg('clear');
	var iframe = $('<iframe/>')
		.attr('id', 'iframe'+item.id)
		.attr('class', 'description')
		.attr('src', '/blank.html');
	
	iframe.load(function() {
		$(this).get(0).contentWindow.document.write(item.mod.Description);
		$(this).contents().find('body').css('margin', '0');
    
    setTimeout(function() {
		  $('#iframe'+item.id)
        .css('height', ($('#iframe'+item.id).contents().find('body').height()+20) + 'px');
    }, 2000);
	});
	/*
	$('textarea[name="mod.Description"]', detail)
		.before($('<div/>').attr('id', 'isize'+item.id).html('CLICK'));
	
	$('#isize'+item.id).click(function() {
		var id = $(this).closest('tbody').attr('id');
		$('#iframe'+id).css('height', ($('#iframe'+id).contents().find('body').height()+16)+'px');
	});
	*/
	$('textarea[name="mod.Description"]', detail).replaceWith(iframe);
	
	/* textarea */
	$.each($('textarea', detail), function(i, form) {
		var formname = $(form).attr('name');
		if (formname == null) return;
		formname = "['" + formname.replace(/\./g, "']['") + "']";
    
		try {
			eval("tmpvalue = item"+formname);
			
			if (tmpvalue == null) tmpvalue = '';
			
      var div =　$('<div/>')
        .css('padding', '10px')
        .css('border', '1px dotted #999')
        .html(tmpvalue);
      
      if ($(form).attr('name') == 'mod.Description') {
        $('div.description', detail).html(div);
      } else {
        if (tmpvalue == '') {
			    $(form).remove();
        } else {
			    $(form).replaceWith(div);
        }
      }
			
		} catch (err) {
			$(form).remove();
		}
	});
	
	/* checkbox */
	$.each($('input[type="checkbox"]', detail), function(i, form) {
		var formname = $(form).attr('name');
		if (formname == null) return;
		formname = "['" + formname.replace(/\./g, "']['") + "']";
		try {
			eval("var tmpvalue = item"+formname);
			
			if (typeof(tmpvalue) == 'object') {
				for (i in tmpvalue) {
					if (tmpvalue[i] == $(form).val()) {
						$(form).replaceWith('<i class="icon-ok green"></i>');
					}
				}
			} else {
				if (tmpvalue == $(form).val()) {
					$(form).replaceWith('<i class="icon-ok green"></i>');
				}
			}
			
		} catch (err) {
			var idforlabel = $(form).attr('id');
			$(form).replaceWith('<i class="icon-remove gray"></i>');
			$('label[for="'+idforlabel+'"]').addClass('unchecked');
		}
	});
	$.each($('input[type=checkbox]', detail), function(i, form) {
		var idforlabel = $(form).attr('id');
		$(form).replaceWith('<i class="icon-remove gray"></i>');
		$('label[for="'+idforlabel+'"]').addClass('unchecked');
	});
	
	/* PictureDetails */
	$('ul.pictures div.tools', detail).remove();
	$('div.picturesforms', detail).remove();
	$('input[type="file"]', detail).remove();
	
	$('ul.pictures li:gt(0)', detail).remove();
	if (item.mod.PictureDetails) {
		$.each($(item.mod.PictureDetails.PictureURL), function (i, url) {
			var lidiv = $('ul.pictures li.template', detail).clone();
			$(lidiv).removeClass('template').addClass('pictureli');
      
			$('img', lidiv)
        .attr('data-url', url)
        .attr('src', '/image/?url=' + encodeURIComponent(url));
      
			$('img', lidiv).parent()
        .attr('href', '/image/?url=' + encodeURIComponent(url));
			
			$('a.deletepicture', lidiv).remove();
      
			$('ul.pictures', detail).append(lidiv);
		});
	}
	
  /* Variations.Pictures */
  if (item.mod.Variations && item.mod.Variations.Pictures) {
    $.each(item.mod.Variations.Pictures.VariationSpecificPictureSet, function(i, o) {
      
			$('div.VariationPictures'+i+' div.variationspecificvalue', detail)
				.html(item.mod.Variations.Pictures.VariationSpecificName + ':' + o.VariationSpecificValue);
			
			o.PictureURL = ebayjs.arrayize(o.PictureURL);
      $.each(o.PictureURL, function(j, url) {
			  var lidiv = $('div.VariationPictures'+i+' li.template', detail).clone();
			  $(lidiv).removeClass('template').addClass('pictureli');
			  $('img', lidiv).attr('src', url);
			  $('div.VariationPictures'+i+' ul.variationpictures', detail).append(lidiv);
      });
      
    });
  }

	/* hide links */
	$('a.addis',      detail).remove();
	$('a.removeispc', detail).remove();
	$('a.addsso',     detail).remove();
	$('a.removesso',  detail).remove();
	$('a.removevariationname', detail).remove();
	$('a.removevariationrow',  detail).remove();
	$('a.addvariationrow',     detail).remove();
	
	$('div.VariationSpecificPictureSet span', detail).remove();
	$('div.variationaddforms', detail).remove();
	
	/* buyers information if exists */
	/*
	if (item.transactions) {
		$.each(item.transactions, function(i, o) {
            
			var divtag = $('div.buyer-template', detail).clone();
            
			$(divtag).removeClass('buyer-template').css('display', 'block');
			
			$('div.buyer-userid', divtag).append(o.Buyer.UserID);
			$('div.buyer-information', divtag).append('Quantity:'+o.QuantityPurchased);
			
			$('div.buyer-template', detail).parent().append(divtag);
		});
	}
	*/
	
	return;
},

fillformvalues: function(item) {
  
	var id = item.id
  var idstr = '#' + item.id + '-detail';
	
	if (item.mod.ShippingDetails) {
		if (item.mod.ShippingDetails.ShippingServiceOptions) {
			item.mod.ShippingDetails.ShippingServiceOptions
				= ebayjs.arrayize(item.mod.ShippingDetails.ShippingServiceOptions);
		}
	}
	
	if (item.mod.ItemSpecifics) {
		item.mod.ItemSpecifics.NameValueList = ebayjs.arrayize(item.mod.ItemSpecifics.NameValueList);
	}
	
  /*
	$('textarea[name="mod.Description"]', idstr).redactor({
		convertDivs: false,
		convertLinks: false,
    deniedTags: ['html', 'head'],
    iframe: false,
    initCallback: function() {
      //$('.description iframe', idstr).get(0).contentWindow.document.write(item.mod.Description);
      //this.insertHtml(item.mod.Description);
    }
	});
  */
  
	// input, text, textarea
	$.each($('input[type="text"][name^="mod"], input[type="hidden"][name^="mod"], select, textarea[name^="mod"]', idstr), function(i, form) {
    
		var formname = $(form).attr('name');
		formname = "['" + formname.replace(/\./g, "']['") + "']";
		
		try {
			eval("var tmpvalue = item"+formname);
			
			if (formname == 'mod.Description') {
				//return;
			}

			$(form).val(tmpvalue);
		} catch (err) {
			//$(detail).prepend('ERR: '+err.description+'<br />');
		}
	});
	
	// label
	$.each($('table.Variations input[type="hidden"]'), function() {
		$('div', $(this).closest('th')).html($(this).val());
	});
	
	// checkbox
	$.each($('input[type=checkbox]', '#' + id + '-detail'), function(i, form) {
		var formname = $(form).attr('name');
		formname = "['" + formname.replace(/\./g, "']['") + "']";
		try {
			eval("var tmpvalue = item"+formname);
			
			if (typeof(tmpvalue) == 'object') {
				for (i in tmpvalue) {
					if (tmpvalue[i] == $(form).val()) {
						$(form).attr('checked', 'checked');
					}
				}
			} else {
				if (tmpvalue == $(form).val()) {
					$(form).attr('checked', 'checked');
				}
			}
			
		} catch (err) {
			//log('ERR:'+err.description+'<br/>'+formname+'<br/>'+typeof(tmpvalue));
		}
	});
	
	// CurrencyID
	$('input[name$="@currencyID"]', idstr).each(function(i, o) {
		var currency = $('select[name="mod.Currency"]', idstr).val();
		if ($(o).val() == '') {
			$(o).val(currency);
		}
	});
	$('div.currencyID').html($('select[name="mod.Currency"]', idstr).val());
	
	/* ItemSpecifics Name */
	$('th input[name^="mod.ItemSpecifics.NameValueList"]', idstr).each(function(i, o) {
		$(o).hide();
		$(o).after($(o).val());
	});
	
	/* Pictures (duplicate code with showformvalues().) */
	if (item.mod.PictureDetails && item.mod.PictureDetails.PictureURL) {
		item.mod.PictureDetails.PictureURL = ebayjs.arrayize(item.mod.PictureDetails.PictureURL);
		
		$.each($(item.mod.PictureDetails.PictureURL), function (i, url) {
			var lidiv = $('ul.pictures li:first', idstr).clone();
			$(lidiv).removeClass('template').addClass('pictureli');
      
			$('img', lidiv)
        .attr('data-url', url)
        .attr('src', '/image/?url=' + encodeURIComponent(url));
      
			$('img', lidiv).parent()
        .attr('href', '/image/?url=' + encodeURIComponent(url));
      
			$('ul.pictures', idstr).append(lidiv);
		});
    
    // todo: enable sortable
		//$('ul.pictures', idstr).sortable({items: 'li.pictureli'});
	}
  
  /* VariationPictures */
  if (item.mod.Variations && item.mod.Variations.Pictures) {
		$.each(item.mod.Variations.Pictures.VariationSpecificPictureSet, function(i, o) {
			
			$('div.VariationPictures' + i + ' div.variationspecificvalue', idstr)
				.html(item.mod.Variations.Pictures.VariationSpecificName + ':' + o.VariationSpecificValue);
			
			o.PictureURL = ebayjs.arrayize(o.PictureURL);
			$.each(o.PictureURL, function(j, url) {
				var lidiv = $('div.VariationPictures'+i+' li.template', idstr).clone();
				$(lidiv).removeClass('template').addClass('pictureli');
				
				$('img', lidiv)
					.attr('data-url', url)
					.attr('src', '/image/?url=' + encodeURIComponent(url));
				
				$('div.VariationPictures'+i+' ul.variationpictures', idstr).append(lidiv);
			});
			
		});
		
		$('ul.variationpictures', idstr).sortable({items: 'li.pictureli'});
  }
	
  //$('input[name="setting.schedule_local"]', idstr).datetimepicker({dateFormat: 'yy-mm-dd'});
	
	return;
},

/* ItemSpecifics */
setformelements_itemspecifics: function(item) {
  
  var hash = this.hash;
  
  var idstr = '#' + item.id + '-detail';
  
	if (item.mod.PrimaryCategory == undefined) {
		// todo: hide forms
		return;
	}
	
	// todo: not return when undefined. (show empty forms)
	//if (item.mod.ItemSpecifics == undefined) return;
	
	$('table.ItemSpecifics', idstr).empty();
	
	var categoryid = item.mod.PrimaryCategory.CategoryID;
	var parentid = item.categorypath[item.categorypath.length-2];
  if (parentid == undefined) return;
	var category = hash[item.mod.Site]['Categories']['c'+parentid]['c'+categoryid];
	
	var specifics = new Array();
	if (item.mod.ItemSpecifics != undefined) {
		specifics = ebayjs.arrayize(item.mod.ItemSpecifics.NameValueList);
	}
	
  if (category.CategorySpecifics == undefined) return;
  if (category.CategorySpecifics.NameRecommendation == undefined) return;
  
	var recomm = ebayjs.arrayize(category.CategorySpecifics.NameRecommendation);
	
	var specificskey = new Array();
	for (i in specifics) {
		if (specifics[i] == null) continue;
		specificskey[specifics[i].Name] = i;
	}
	
	var recommkey = new Array();
	for (i in recomm) {
		recommkey[recomm[i].Name] = i;
	}
	
	/* First, show existing selected specifics */
	for (i in specifics) {
		if (specifics[i] == null) continue;
		var trtag = this.setformelements_itemspecifics_values(item.id,
																										      i,
																										      recomm[recommkey[specifics[i].Name]],
																										      specifics[i]);
		$('table.ItemSpecifics', idstr).append(trtag);
	}
	
	/* Next, show remaining recommended specifics */
	var addspidx = specifics.length;
	for (i in recomm) {
		if (specificskey[recomm[i].Name] != null) continue;
		//if (recomm[i].ValidationRules.VariationSpecifics == 'Disabled') continue;
		
		var trtag = this.setformelements_itemspecifics_values(item.id,
																										      addspidx,
																										      recomm[i],
																										      null);
		
		$('table.ItemSpecifics', idstr).append(trtag);
		
		addspidx++;
	}
	
	return;
  
}, // function setformelements_itemspecifics()

setformelements_itemspecifics_values: function(id, i, recomm, specific) {
  
	var trtag = $('<tr />');
	
	/* Name */
	var thtag = $('<th />');
	var inputtag = $('<input />')
		.attr('type', 'text')
		.attr('name', 'mod.ItemSpecifics.NameValueList.'+i+'.Name');
	$(thtag).append(inputtag);
	if (specific == null && recomm != null) {
		$(inputtag).val(recomm.Name)
	}
	$(trtag).append(thtag);
	
	/* Value */
	/* SelectionMode: one of FreeText, Prefilled, SelectionOnly */
	var tdtag = $('<td/>');
	
	if (recomm == null) {
		
		var inputtag = $('<input/>')
			.attr('type', 'text')
			.attr('name', 'mod.ItemSpecifics.NameValueList.'+i+'.Value');
		var tdtag = $('<td/>').append(inputtag);
		
		$(trtag).append(tdtag);
		
	} else if (recomm.ValidationRules.SelectionMode == 'FreeText'
			   && recomm.ValidationRules.MaxValues == '1') {
		
		var inputtag = $('<input/>')
			.attr('type', 'text')
			.attr('Name', 'mod.ItemSpecifics.NameValueList.'+i+'.Value');
		$(tdtag).append(inputtag);
		
		if (recomm.ValueRecommendation != null) {
			var selecttag = $('<select/>')
				.attr('Name', 'mod.ItemSpecifics.NameValueList.'+i+'.Value.selector')
				.addClass('remove')
				.append($('<option/>').val('').html('(select from list)'));
			
			var arrvr = ebayjs.arrayize(recomm.ValueRecommendation);
			for (j in arrvr) {
				var optiontag = $('<option/>').val(arrvr[j].Value).html(arrvr[j].Value);
				$(selecttag).append(optiontag);
			}
			
			$(tdtag).append(selecttag);
		}
		
	} else if (recomm.ValidationRules.SelectionMode == 'FreeText'
						 && recomm.ValidationRules.MaxValues != '1') {
		
		var tabletag = $('<table />');
		
		var checkboxidx = 0;
		
		if (specific != null) {
			for (j in specific.Value) {
				var value = specific.Value[j];
				
				// skip if exists in ValueRecommendation
				var existinrecomm = false;
				for (k in recomm.ValueRecommendation) {
					if (recomm.ValueRecommendation[k].Value == value) {
						existinrecomm = true;
						break;
					}
				}
				if (existinrecomm == true) continue;
				
				if (checkboxidx % 3 == 0) {
					$(tabletag).append($('<tr />'));
				}
				
				// add custom value checkbox
				var idforlabel = id+'.ItemSpecifics.NameValueList.'+i+'.Value.'+checkboxidx;
				
				var checkboxtag = $('<input/>')
					.attr('id', idforlabel)
					.attr('name', 'mod.ItemSpecifics.NameValueList.'+i+'.Value')
					.attr('type', 'checkbox')
					.val(value);
				
				var labeltag = $('<label/>')
					.attr('for', idforlabel)
					.html(value);
				
				var tdtagv = $('<td />')
					.append(checkboxtag)
					.append(labeltag);
				
				$('tr:last', $(tabletag)).append(tdtagv);
				
				checkboxidx++;
			}
		}
		
		for (j in recomm.ValueRecommendation) {
			
			if (checkboxidx % 3 == 0) {
				$(tabletag).append($('<tr />'));
			}
			
			var idforlabel = id+'.ItemSpecifics.NameValueList.'+i+'.Value.'+checkboxidx;
			
			var checkboxtag = $('<input/>')
				.attr('id', idforlabel)
				.attr('name', 'mod.ItemSpecifics.NameValueList.'+i+'.Value')
				.attr('type', 'checkbox')
				.val(recomm.ValueRecommendation[j].Value);
			
			var labeltag = $('<label/>')
				.attr('for', idforlabel)
				.html(recomm.ValueRecommendation[j].Value);
			
			var tdtagv = $('<td />')
				.append(checkboxtag)
				.append(labeltag);
			
			$('tr:last', $(tabletag)).append(tdtagv);
			
			checkboxidx++;
		}
		
		$(tdtag).append(tabletag);
		
	} else if (recomm.ValidationRules.SelectionMode == 'SelectionOnly'
						 && recomm.ValidationRules.MaxValues == '1') {
		
		var selecttag = $('<select/>')
			.attr('name', 'mod.ItemSpecifics.NameValueList.'+i+'.Value')
			.append($('<option/>').val('').html('(select from list)'));
		
		for (j in recomm.ValueRecommendation) {
			var optiontag = $('<option/>')
				.val(recomm.ValueRecommendation[j].Value)
				.html(recomm.ValueRecommendation[j].Value);
			$(selecttag).append(optiontag);
		}
		
		$(tdtag).append(selecttag);
		
		
	} else {
		
		//$(tdtag).append('<pre>'+$.dump(recomm)+'</pre>');
		
	}
	//$(tdtag).append('<pre>'+$.dump(recomm)+'</pre>');
	
	// Help URL
	if (recomm != null) {
		if (recomm.HelpURL) {
			var atag = $('<a/>')
				.attr('href', recomm.HelpURL)
				.attr('target', '_blank')
				.html('help');
			$(tdtag).append(atag);
		}
	}
	
	$(trtag).append(tdtag);
	
	var tdtag = $('<td />').attr('class', 'removeispc');
	var removelink = $('<a />').attr('href', '#').attr('class', 'removeispc').text('Remove');
	$(tdtag).append(removelink);
	$(trtag).append(tdtag);
	
	return trtag;
  
}, // function setformelements_itemspecifics_values()

addimage: function(id, divclass, files) {
  
	$.each(files, function(i, url) {
    
		var li = $('ul.pictures li.template', '#'+id).clone();
    
		$(li).removeClass('template').addClass('pictureli');
    
		$('img', li)
      .attr('data-url', url)
      .attr('src', '/image/?url=' + encodeURIComponent(url));
    
		$('div.'+divclass+' ul', '#'+id).append(li);
    
	});
	
	$('div.'+divclass+' ul', '#'+id).sortable({items: 'li.pictureli'});
	
	return;
},

extract_shippingtype: function(item) {
  
  if (item.mod.ShippingDetails == undefined) return item;
  
	var shippingtype = item.mod.ShippingDetails.ShippingType;
  
  var dmsttype = '';
  var intltype = '';
  
	if (shippingtype == 'Flat') {
		dmsttype = 'Flat';
		intltype = 'Flat';
	} else if (shippingtype == 'FlatDomesticCalculatedInternational') {
		dmsttype = 'Flat';
		intltype = 'Calculated';
	} else if (shippingtype == 'Calculated') {
		dmsttype = 'Calculated';
		intltype = 'Calculated';
	} else if (shippingtype == 'CalculatedDomesticFlatInternational') {
		dmsttype = 'Calculated';
		intltype = 'Flat';
	} else if (shippingtype == 'FreightFlat') {
		dmsttype = 'FreightFlat';
		intltype = '';
	}
	if (item.mod.ShippingDetails.InternationalShippingServiceOption == undefined) {
		intltype = '';
	}
  
  item.mod.ShippingDetails.ShippingType = {'domestic': dmsttype, 'international': intltype};
  
  return item;
},
    
    showspinner: function(id) {
      $('input[name="id"]', '#' + id).hide();
      $('input[name="id"]', '#' + id).after('<i class="icon-spinner icon-spin"></i>');
    },
    
    hidespinner: function(id) {
      $('i.icon-spin', '#' + id).fadeOut(800, function() {
        $(this).remove();
      });
      $('input[name="id"]', '#' + id).show();
    }
    
  } // ebayjs
  
  return ebayjs;
  
});
