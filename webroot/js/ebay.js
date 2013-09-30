/* store rows data */
var rowsdata = new Array();
var hasmore  = false;
var strdiff  = '';
var strprev  = '';
var timeout  = null;
var foundproducts = new Array();

var sitecur = new Array();
sitecur['US']             = ['USD'];
sitecur['Canada']         = ['CAD', 'USD'];
sitecur['UK']             = ['GBP'];
sitecur['Germany']        = ['EUR'];
sitecur['Australia']      = ['AUD'];
sitecur['France']         = ['EUR'];
sitecur['eBayMotors']     = ['USD'];
sitecur['Italy']          = ['EUR'];
sitecur['Netherlands']    = ['EUR'];
sitecur['Spain']          = ['EUR'];
sitecur['India']          = ['INR'];
sitecur['HongKong']       = ['HKD'];
sitecur['Singapore']      = ['SGD'];
sitecur['Malaysia']       = ['MYR'];
sitecur['Philippines']    = ['PHP'];
sitecur['CanadaFrench']   = ['CAD', 'USD'];
sitecur['Poland']         = ['PLN'];
sitecur['Belgium_Dutch']  = ['EUR'];
sitecur['Belgium_French'] = ['EUR'];
sitecur['Austria']        = ['EUR'];
sitecur['Switzerland']    = ['CHF'];
sitecur['Ireland']        = ['EUR'];

/* global hook */
$(document).ajaxComplete(function(event, xhr, settings) {
	
	if (xhr.responseText.match(/<html>/)) {
		showmessage('Server error.');
		$('div#debug').html(xhr.responseText);
		return;
	}
	
  // todo: global hook for basic hash data.
  
	var data = $.parseJSON(xhr.responseText);
	
	if (data.json.message == null
			|| data.json.message.message == null
			|| data.json.message.message == '') {
		showmessage('');
		return;
	}
	
	showmessage(data.json.message.message);
	
	if (data.json.message.hasnext) {
		timeout = setTimeout('refresh()', 1000);
	} else {
		timeout = setTimeout('dismissmessage()', 2000);
	}
	
	return;
});

/* initialize */
$(function() {
	
	/* for sandbox environment */
	if (!location.href.match(/sandbox/)) {
		$('#calletsy').remove();
		$('#setting_etsy_accounts').closest('tr').remove();
  }
	
	$('select[name=sortfield]', '#hiddenforms').val('org.ListingDetails.EndTime');
	$('div.EndTime span.arrow', '#items > thead').html('<img src="/icon/03/10/34.png" />');
	$('input[name=limit]', '#toolbar').val(30);
	
	resizediv();
	
	bindevents();
	
	summary(true);
	
  $('#bulkbuttons').tooltip();
	
	// todo: same code
	$.each(hash, function(k, v) {
		var optiontag = $('<option />').val(k).html(k);
		$('select[name="mod.Site"]', '#detailtemplate').append(optiontag);
	});
	
	$('input[name="datestart"]', '#syncitemsform').val(mischash.datestart);
	$('input[name="dateend"]', '#syncitemsform').val(mischash.dateend);
	
	return;
});

function bindevents()
{
	$(window).resize(resizediv);
	
	/* Add eBay account */
	$('button.addebayaccount').click(function() {
    
    if (checkdemoaccount()) return;
		
		var loadingtext = $('<span/>')
			.css('color', '#f00')
			.css('margin-left', '10px')
			.html('<img src="/img/indicator.gif"/> please wait, redirecting to eBay site...');
		$(this).after(loadingtext);
    
		$.post('/node/json/addaccount',
			     null,
			     function(data) {
				     window.location.href = data.json.url;
			     },
			     'json');
	});
	
	/* Add Etsy account */
	$('button.addetsyaccount').click(function() {
    
    if (checkdemoaccount()) return;
		
		var loadingtext = $('<span/>')
			.css('color', '#f00')
			.css('margin-left', '10px')
			.html('<img src="/img/indicator.gif"/> please wait, redirecting to Etsy site...');
		$(this).after(loadingtext);
    
		$.post('/etsy/addaccount',
			     null,
			     function(data) {
				     window.location.href = data.json.url;
			     },
			     'json');
	});
  
  $('button.send-etsy-verification-code').click(function() {
    
    var postdata = 'verification_code=' + $('#etsy_verification_code').val();
    $.post('/etsy/accesstoken',
           postdata,
           function(data) {
             
           },
           'json');
  });
	
	$('#content').scroll(function() {
		
		if (hasmore == false) return;
		if ($('#newitem0').length) return; // Don't auto paging when editing a new item.
		if (!$('#items').is(':visible')) return;
		
		var top = $('#content').scrollTop();
		
		var headerh  = $('#header').height();
		headerh += $('#header').css('margin-top').replace('px', '') - 0;
		headerh += $('#header').css('margin-bottom').replace('px', '') - 0;
		headerh += $('#content').css('margin-top').replace('px', '') - 0;

		var c = $('#items').height() + headerh - $(window).height() - 0;

		if (top >= c) {
			
			var offset = parseInt($('input.filter[name=offset]').val());
			var limit  = parseInt($('input.filter[name=limit]' ).val());
			
			// todo: check offset number after calling refresh(). ex: after 3 items listed.
			$('input.filter[name=offset]').val(offset+limit-0);
			items(false);
		}
		
		return;
	});
	
	$('#items').on('click', 'tr.row1', clickTitle);
	
	$('#items').on('click', 'tr.row1 input[type=checkbox]', function(event) {
		event.stopPropagation();
		togglebulkbuttons();
		return;
	});
	
	$('#items').on('click', 'a.ItemID', function(event) {
		event.stopPropagation();
	});
	
	$('#items').on('change', 'select[name="mod.Site"]',  changeSite);
	$('#items').on('change', 'select.primarycategory',   changeCategory);
	$('#items').on('change', 'select.secondarycategory', changeCategory);
	
	$('#items').on('click', 'div.editbuttons button.edit',   clickEdit);
	$('#items').on('click', 'div.editbuttons button.save',   save);
	$('#items').on('click', 'div.editbuttons button.cancel', clickCancel);
	$('#items').on('click', 'div.editbuttons button.delete', clickDelete);
	$('#items').on('click', 'div.editbuttons button.copy',   clickCopy);
	
	/* Bulk Buttons */
	$('#bulkbuttons').on('click', 'button', function() {
    
		if ($(this).attr('id') == 'settingsbutton') return;
        
		var action = $(this).attr('class').replace(/ .+$/, '');
    
    if (action.match(/^delete|add|relist|revise|verifyadditem|end$/)) {
      if (checkdemoaccount()) return;
			if (!confirm($(this).html() + ' checked items?')) return;
    }
		
		if (action == 'checkall') {
			
			$("input[name='id'][value!=on]").attr('checked', 'checked');
			//$("input[name='allpages']").attr('checked', '');
			$("input[name='allpages']").removeAttr('checked');
			togglebulkbuttons();
			
			return;
			
		} else if (action == 'checkallpage') {
			
			$("input[name='id'][value!=on]").attr('checked', 'checked');
			$("input[name='allpages']").attr('checked', 'checked');
			return;
			
		} else if (action == 'uncheckall') {
			
			//$("input[name='id'][value!=on]").attr('checked', '');
			//$("input[name='allpages']").attr('checked', '');
			$("input[name='id'][value!=on]").removeAttr('checked');
			$("input[name='allpages']").removeAttr('checked');
			togglebulkbuttons();
			
			return;
		}
		
		var postdata = "";
		if ($("input[name='allpages']").attr('checked')) {
			alert('apply to all pages?');
			postdata = $('input.filter, select.filter').serialize();
		} else {
			postdata = $('input[name="id"][id!="rowtemplate"]:checked').serialize();
		}
		
		$('input:checked[name="id"][id!="rowtemplate"]').each(function() {
			$(this).css('visibility', 'hidden');
			$(this).parent().addClass('loading');
      
			if (action == 'delete') {
        $('#'+$(this).val()).remove();
      }
		});
		
    var postpath = '/json/' + action;
    if (action == 'delete'
        || action == 'copy'
        || action == 'end'
        || action == 'add'
        || action == 'relist'
        || action == 'verifyadditem'
        || action == 'revise') {
      
      postpath = '/node/json/' + action;
    }
    
		$.post
		(postpath,
		 postdata,
		 function(data) {
			 
			 if (action == 'copy' || action == 'delete') {
				 $("td.loading").removeClass('loading');
				 $('input:checked[name="id"][id!="rowtemplate"]')
					 .css('visibility', '')
					 .attr('checked', '');
			 }
			 
			 if (action == 'delete') {
         items(true);
       }
			 
		 });
		
		return;
	});
	
  /* Check all items */
	$('#checkall').click(function() {
		$('input[name="id"]', '#items tbody[id!="rowtemplate"]')
			.prop('checked', $(this).is(':checked'));
		togglebulkbuttons();
		return;
	});
	
	/* Left Navi (eBay account name click) */
	$('#toolbar').on('click', 'ul.accounts > li', function() {
		
		if ($(this).attr('class') == undefined) {
			return;
		}
		
		showcontent('#items');
		
		if ($(this).attr('class') == 'allitems'
			&& $('ul', $(this).next()).css('display') == 'block') {
			// don't collapse navi
		} else {
			$('ul', $(this).next()).slideToggle('fast');
		}
		
		userid = $(this).attr('class')
			.replace('tabselected', '')
			.replace('allitems', '')
			.replace(' ', '');
		
		$('select[name=UserID]').val(userid);
		$('select[name=selling]').val('allitems');
		$('input[name=offset]').val(0);
		/*$('table#items tbody:gt(1)').remove();*/
		items(true);
		
		$('ul.accounts li').removeClass('tabselected');
		$(this).closest('li').addClass('tabselected');
		
		return false;
	});
	
	/* Left navi (item status click) */
	$('#toolbar').on('click', 'ul.accountaction > li', function() {
		
		var v = $(this).attr('class').replace('tabselected', '').replace(' ', '');
		
		var userid = $(this).parent().attr('class')
			.replace(/^accountaction/, '')
			.replace(' ', '');
		
		showcontent('#items');
			
		$('select[name=UserID]').val(userid);
		$('select[name=selling]').val(v);
		$('input[name=offset]').val(0);
		if (v == 'unsold' || v == 'sold' || v == 'allitems') {
			$('input[name=sort]').val('ListingDetails_EndTime DESC');
		} else {
			$('input[name=sort]').val('ListingDetails_EndTime');
		}
		/*$('table#items tbody:gt(1)').remove();*/
		items(true);
		
		$('ul.accounts li').removeClass('tabselected');
		$(this).closest('li').addClass('tabselected');
		
		return false;
	});
	
	/* Picture */
  $('#items').on('change', 'input:file', function() {
		
    if ($(this).attr('id') == 'csvfile') {
      return;
    }
    
		var id = $(this).closest('tbody.itemrow').attr('id');
    var userid = $('select[name=UserID]', '#'+id).val();
    var divclass = $(this).closest('div').attr('class');
    log(divclass);
    
		var idform = $('<input/>').attr('name', 'id').val(id);
		$(this).closest('form').append(idform);
    
		var useridform = $('<input/>').attr('name', 'userid').val(userid);
		$(this).closest('form').append(useridform);
    
		var divclassform = $('<input/>').attr('name', 'divclass').val(divclass);
		$(this).closest('form').append(divclassform);
    
		//$('ul.pictures', '#'+id).sortable('destroy');
		
		$(this).attr('name', 'fileUpload')
		$(this).closest('form').submit();
		$(this).closest('form')[0].reset();
		
		$(idform).remove();
		$(useridform).remove();
		$(divclassform).remove();
    
    return;
  });
  
  $('#items').on('click', 'button.webimageformbutton', function() {
    
		var id = $(this).closest('tbody.itemrow').attr('id');
    var form = $(this).closest('form');
    var imageurl = $('input[name="webimageurl"]', form).val();
    var divclass = $(this).closest('div').attr('class');
    
    addimage(id, divclass, [imageurl]);
    
    $('input[name="webimageurl"]', form).val('');
    
    return false;
  });
  
  /* ListingType -> update duration set */
	$('#items').on('change', 'select[name="mod.ListingType"]', function() {
    
		var id = $(this).closest('tbody.itemrow').attr('id');
    
		var item_modifing =
			$('input[type="text"], input:checked, input[type="hidden"], select, textarea', '#'+id)
			.extractObject();
    
		item_modifing.id = id;
    
		setformelements_listingduration(item_modifing);
    
    return;
	});
	
  /* Tab */
	$('#items').on('click', 'ul.tabNav li', function() {
		var id = $(this).closest('tbody').attr('id');
		var curIdx = $(this).prevAll().length + 1;
		
		$(this).parent().children('.current').removeClass('current');
		$(this).addClass('current');
		
		if ($(this).html() == 'All') {
			$('div.tabContainer', '#'+id).children().show();
		} else {
			$('div.tabContainer', '#'+id).children().hide();
			$('div.tabContainer', '#'+id).children('.current').removeClass('current');
			$('div.tabContainer', '#'+id).children('div:nth-child('+curIdx+')').show();
			$('div.tabContainer', '#'+id).children('div:nth-child('+curIdx+')').addClass('current');
		}
		
    _gaq.push(['_trackEvent', 'Item', $(this).html()]);
    
		return false;
	});
	
  /* Editor */
	$('#items').on('click', 'a.wysiwyg', function() {
		$('textarea[name=description]', '#'+id).wysiwyg('destroy');
		return false;
	});
	
	/* ShippingType.domestic */
	$('#items').on('change', 'select[name="mod.ShippingDetails.ShippingType.domestic"]', function() {
		var id = $(this).closest('tbody.itemrow').attr('id');
		var item_modifing =
			$('input[type=text], input:checked, input[type=hidden], select, textarea', '#'+id)
			.extractObject();
		item_modifing.id = id;
		setformelements_shipping_domestic(item_modifing);
    
		return;
	});
  
  /* ShippingType.international */
	$('#items').on('change', 'select[name="mod.ShippingDetails.ShippingType.international"]',
								 function() {
		var id = $(this).closest('tbody.itemrow').attr('id');
		var item_modifing =
			$('input[type=text], input:checked, input[type=hidden], select, textarea', '#'+id)
			.extractObject();
		item_modifing.id = id;
		setformelements_shipping_international(item_modifing);
    
		return;
	});

	/* ShippingPackage */
	var _sdcsr = 'ShippingDetails.CalculatedShippingRate';
	$('#items').on('change', 'select[name="mod.'+_sdcsr+'.ShippingPackage"]', function() {
		var id = $(this).closest('tbody.itemrow').attr('id');
		var item_modifing =
			$('input[type=text], input:checked, input[type=hidden], select, textarea', '#'+id)
			.extractObject();
		item_modifing.id = id;
		setformelements_shipping_domestic(item_modifing);
    
		return;
	});
	
	/* Offer additional service */
	$('#items').on('click', 'a.addsso', function() {
		
		var id = $(this).closest('tbody.itemrow').attr('id');
		var tdclass = $(this).closest('td').attr('class');
		
		addsso(id, tdclass);
		
		return false;
	});

	/* Remove service */
	$('#items').on('click', 'a.removesso', function() {
		
		var id = $(this).closest('tbody.itemrow').attr('id');
		var tdclass = $(this).closest('td').attr('class');
		
		var pdiv = $(this).closest('div[class^=ShippingService]').parent();
		
		$(this).closest('div[class^=ShippingService]').remove();
		
		renumbersso(id, tdclass);
		
		$('a.addsso', $(pdiv)).show();
		
		return false;
	});
	
	/* Add ItemSpecifics */
	$('#items').on('click', 'a.addis', function() {
		var id = $(this).closest('tbody.itemrow').attr('id');
		var iscnt = $('table.ItemSpecifics tr', '#'+id).length;
		var trtag = setformelements_itemspecifics_values(id, iscnt, null, null);
		$('table.ItemSpecifics', '#'+id).append(trtag);
		
		return false;
	});
	
	/* Remove ItemSpecifics */
	$('#items').on('click', 'a.removeispc', function() {
		var id = $(this).closest('tbody.itemrow').attr('id');
		
		$(this).closest('tr').remove();
		
		$.each($('table.ItemSpecifics tr', '#'+id), function(k, v) {
			$.each($('select, input', v), function(j, o) {
				var orgname = $(o).attr('name');
				$(o).attr('name', orgname.replace(/\.[0-9]+\./, '.'+k+'.'));
			});
		});
		
		return false;
	});
	
	/* Sync items from eBay */
  $('#syncbutton').click(function() {
    
    if (checkdemoaccount()) return;
		
    var datestart = $('input[name=datestart]', '#syncitemsform').val();
    var dateend   = $('input[name=dateend]',   '#syncitemsform').val();

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
		
		showmessage('Syncing items from eBay...');
		
    var postdata = $('select,input', '#syncitemsform').serialize();
    
		$.post('/node/json/import_java',
			     postdata,
			     function(data) {
				     
			     });
  });
  
	/* RemoveAccount */
	$('#settings').on('click', 'button[class^=removeaccount]', function() {
    
    if (checkdemoaccount()) return;
		
		var trtag = $(this).closest('tr');
		
    var userid = $(this).attr('class').replace(/^removeaccount-/, '');
    
		if (!confirm('Remove ' + userid + ' from ListersIn?')) {
			return false;
		}
		
		var postdata = 'userid=' + userid;
		
		$.post('/node/json/removeaccount',
			     postdata,
			     function(data) {
				     $(trtag).remove();
			     });
    
    return;
	});
	
	$('#cancelaccountlink').click(function() {
    if (checkdemoaccount()) return false;
		
		if (confirm('Cancel your account?')) {
			return true;
		} else {
			return false;
		}
	});
	
	$('#items').on('click', 'button.GetProductSearchResults', findproducts);
	
	/* Select product from found products */
	$('#items').on('click', 'div.foundproducts a.product-select', function() {
		
		var id = $(this).closest('tbody.itemrow').attr('id');
		
		var site = $('select[name="mod.Site"]', '#'+id).val();
		
		var categoryid = $('ul.suggestedcategories input:checked', '#'+id).val();
		var idpath     = $('ul.suggestedcategories input:checked', '#'+id).attr('data-idpath');
		var categorypath = idpath.split('.');
		var tmppath = ('0.'+idpath).split('.');
		
		$.getJSON
		('/node/json/gc2?site=' + site + '&path=0.' + categorypath.join('.'),
		 function(data) {
			 
			 dump(data);
			 hash[site].Categories = data.json.gc2.Categories;
			 
			 var pds = getcategorypulldowns(site, tmppath);
			 $('select[name="mod.PrimaryCategory.CategoryID"]', '#'+id).parent().html(pds);
			 
			 var item_modifing =
				 $('input[type=text], input:checked, input[type=hidden], select, textarea', '#'+id)
				 .extractObject();
			 
			 item_modifing.id = id;
			 item_modifing.categorypath = categorypath;
			 
			 setformelements(item_modifing);
			 fillformvalues(item_modifing);
			 
			 return;
		 });
		
		
		var productid = $(this).attr('data-productid');
		var product = foundproducts['R'+productid];
		
		/*
		$.post('/json/findproducts',
					 'findtype=ProductID&keyword=' + encodeURIComponent(productid),
					 function(data) {
						 
					 },
					 'json');
		*/
		
		$('input[name="mod.ProductListingDetails.ProductID"]', '#'+id).val('');
		$('input[name="mod.ProductListingDetails.ProductReferenceID"]', '#'+id).val(productid);
		$('input[name="mod.Title"]', '#'+id).val(product.Title);
    
    // todo: set StockPhotoURL to 1st image.
    var files = new Array();
    files.push(product.StockPhotoURL);
    addimage(id, 'pictures', files);
		
		$(this).closest('div.foundproducts').hide();
		
		return;
	});

  $('#items').on('click', 'div.foundproducts div.close button', function() {
		$(this).closest('div.foundproducts').hide();
		return;
  });
	
	$('#toggledebug').click(function() {
		if ($('div#debug').css('display') == 'none') {
			showcontent('#debug');
		} else {
			$('div#debug').hide();
			$('table#items').show();
		}
		return false;
	});
	
	// Title Search
	$('input.filter[name=Title]').keyup(function() {
    strprev = $(this).val();
		setTimeout('titlesearch_keyupdone()', 500);
	});
	
	// Settings button
	$('#settingsbutton').click(function() {
    
		$.post('/node/json/settings',
			     null,
			     function(data) {
				     
             $('#settings-email').html(data.json.settings.email);
             $('#settings-status').html(data.json.settings.status);
             //$('#settings-expiration').html(data.json.settings.expiration);
             //$('#settings-itemlimit').html(data.json.settings.itemlimit);
				     $('select[name=TimeZone]', '#settings').val(data.json.settings.timezone);
             
				     $('table#setting_ebay_accounts').empty();
						 $('#csvform select[name=userid]').empty();
						 
				     if (data.json.settings.userids2) {
					     $.each(data.json.settings.userids2, function(i, o) {
                 
						     var trtag = $('<tr/>');
						     
						     $(trtag).append($('<td/>').html(o.username));
						     
								 /*
						     $(trtag).append($('<td/>').html($('<button/>')
                                                 .attr('class', 'updatetoken-' + o.username)
                                                 .html('Update token')));
						     */
								 
						     $(trtag).append($('<td/>').html($('<button/>')
                                                 .attr('class', 'removeaccount-' + o.username)
                                                 .html('Delete from ListersIn')));
                 
						     //$(trtag).append($('<td/>').html(o.Timestamp));
                 
						     //$(trtag).append($('<td/>').html(o.HardExpirationTime));
						     
						     $('table#setting_ebay_accounts').append(trtag);
                 
								 var optiontag = $('<option/>').val(o.username).text(o.username);
								 $('#csvform select[name=userid]').append(optiontag);
								 
								 var optiontag2 = $('<option/>').val(o.username).text(o.username);
								 $('#syncitemsform select[name=userid]').append(optiontag2);
					     });
				     }
				     
				     dump(data.json.settings);
			     },
			     'json');
		
		showcontent('#settings');
    
		$('input[name=datestart],input[name=dateend]', '#settings')
      .datepicker({dateFormat: 'yy-mm-dd'});
	});
	
	$('#showhelp').click(function() {
		showcontent('#help');
	});
  
  $('select[name=TimeZone]', '#settings').click(function() {
    
    var postdata = 'timezone='+encodeURIComponent($(this).val());
    
    $.post('/node/json/settings',
           postdata,
           function (data) {
           },
           'json');
    
    return;
  });
	
	// Theme select
	$('#items').on('change', 'select[name="ListingDesigner.GroupID"]', function() {
		var id = $(this).closest('tbody.itemrow').attr('id');
		var site = $('select[name="mod.Site"]', '#'+id).val();
		if ($(this).val() == '') {
			// todo: unset layout pulldown
			return;
		}
		
		$.getJSON
		('/node/json/descriptiontemplate?site='+site+'&groupid='+$(this).val(),
		 function(data) {
       
       $.post('/node/json/savedebugjson',
              'filename=descriptiontemplate.'+site+'.node'
              + '&json=' + encodeURIComponent(JSON.stringify(data)),
              function() {}, 'json');
			 
			 $('select[name="mod.ListingDesigner.ThemeID"]', '#'+id).empty();
			 var emptyoptiontag = $('<option/>').val('').text('(not selected)');
			 $.each(data.json, function(i, o) {
				 var optiontag = $('<option/>').val(o.ID).text(o.Name);
				 $('select[name="mod.ListingDesigner.ThemeID"]', '#'+id).append(optiontag);
			 });
		 });
	});
	
	// Add New Item
	$('button.newitem').click(function() {
		
		if ($('select[name="UserID"] option', '#detailtemplate').length == 0) {
			alert('Please add your eBay account to ListersIn.');
			return false;
		}
		
		showcontent('#items');
		
		var id = 'newitem0';
		
		var dom = $('#rowtemplate').clone().attr('id', id);
		$('tr.row1', dom).hide();
		$('#rowloading').hide();
		$('tbody:gt(1)', '#items').remove();
		$('#items').append(dom);
		
		var detail = $('div.detail', 'div#detailtemplate').clone().css('display', 'block');
		
		$('tr.row2 td', '#'+id).html(detail);
		
		$('div.tabContainer', '#'+id).children().show();
		
		// todo: compare to CKEditor
		$('textarea[name="mod.Description"]', '#'+id).redactor({
			convertDivs: false,
			convertLinks: false
		});
		
		showbuttons(dom, 'save,cancel');
		
		// same as changeSite function
		// todo: don't hard code 'US'
		var site = 'US';
		
    // for java version debug
		$.getJSON
		('/json/site?site=' + site,
	   function(data) {
       $.post('/node/json/savedebugjson',
              'filename=site.'+site+'.java&json=' + encodeURIComponent(JSON.stringify(data)),
              function() {}, 'json');
     });
    
		$.getJSON
		('/node/json/site?site=' + site,
		 function(data) {
			 
       $.post('/node/json/savedebugjson',
              'filename=site.'+site+'.node&json=' + encodeURIComponent(JSON.stringify(data)),
              function() {}, 'json');
       
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
			 
			 dump(item_modifing);
			 
			 setformelements(item_modifing);
			 
			 // todo: fillformvalues_newitem, currency, shippingpriority
			 var tmpcurval = $('select[name="mod.Currency"]', '#'+id).val();
			 $('input[name$="@currencyID"]',         '#'+id).val(tmpcurval);
			 $('input[name="mod.StartPrice.#text"]', '#'+id).val('0.99');
			 $('input[name="mod.Quantity"]',         '#'+id).val('1');
			 $('select[name="mod.Country"]',         '#'+id).val('US');
			 
			 $('input[name="mod.ScheduleTime"]', '#'+id).datetimepicker({dateFormat: 'yy-mm-dd'});
			 
			 return;
		 });
		
		_gaq.push(['_trackEvent', 'Left', 'AddNewItem']);
		
		return false;
	});
	
	$('#items').on('change', 'select[name="mod.Currency"]', changeCurrency);
	
	$('#checkduplicateitems').click(function() {
		
		$('select[name=UserID]').val('');
		$('select[name=selling]').val('allitems');
		$('input[name=offset]').val(0);
		$('input[name=option]').val('checkduplicateitems');
		/*$('table#items tbody:gt(1)').remove();*/
		items(true);
		
		return false;
	});
	
	// Delete Picture
	$('#items').on('click', 'a.deletepicture', function() {
		$(this).closest('li').remove();
		return false;
	});
  
	// Send a message to buyer
  $('#items').on('click', 'div.buyer-sendmessage button', function() {
    
		var id = $(this).closest('tbody.itemrow').attr('id');
    var selleruserid = rowsdata[id].org.Seller.UserID;
    var itemid = rowsdata[id].org.ItemID;
    var message = $('textarea', $(this).parent()).val();
    var buyeruserid = $('div.buyer-userid', $(this).parent().parent()).text();
    
    var postdata = 'id='+id;
    postdata += '&userid='+selleruserid;
    postdata += '&itemid='+itemid;
    postdata += '&buyer='+buyeruserid;
    postdata += '&body='+encodeURIComponent(message);
    
    $.post('/json/sendmessage',
           postdata,
           function (data) {
             
           },
           'json');
  });
	
	/* AddMemberMessageRTQ */
  $('#items').on('click', 'div.membermessage button', function() {
		
		var div = $(this).closest('div.membermessage');
		
		var id     = $(this).closest('tbody.itemrow').attr('id');
    var userid = rowsdata[id].org.Seller.UserID;
    var itemid = rowsdata[id].org.ItemID;
		var parent = $(div).attr('data-messageid');
    var body   = $('textarea[name="body"]', div).val();
		var sender = $('li.sender', div).html();
    
		if (body == '') {
			alert('Please input answer text.');
			return false;
		}
		if (!confirm('Send answer?')) {
			return false;
		}
		
    var postdata = 'id='+id;
    postdata += '&userid='+userid;
    postdata += '&itemid='+itemid;
    postdata += '&parent='+parent;
    postdata += '&body='+encodeURIComponent(body);
    
		showmessage('Sending answer to ' + sender + '...');
		
    $.post('/node/json/addmembermessagertq',
           postdata,
           function (data) {
						 $(div).fadeOut('slow', function() {
							 $(div).remove();
						 });
           },
           'json');
  });
  
  $('#calletsy').click(function() {
    
    var postdata = '';
    
    //postdata += '&uri=/payments/templates';
    //postdata += '&zip=1910042';
    
    //postdata = 'method=GET&uri=/countries';
    
    //postdata = 'method=GET&uri=/taxonomy/categories';
    //postdata = 'method=GET&uri=/shops/6100611';
    //postdata = 'method=GET&uri=/shops/6100611/shipping/profiles&shop_id=6100611';
    
    postdata  = 'method=GET&uri=/shipping/profiles/184';
    
    postdata  = 'method=POST&uri=/shipping/templates';
    postdata += '&title=ShippingTemplateA1';
    postdata += '&origin_country_id=131';
    postdata += '&destination_country_id=131';
    postdata += '&primary_cost=10.0';
    postdata += '&secondary_cost=15.0';
    
    postdata  = 'method=POST&uri=/shipping/profiles';
    postdata += '&name=ShippingProfileJPN4';
    postdata += '&origin_country_id=131';
    postdata += '&processing_min=1';
    postdata += '&processing_max=3';
    
    postdata  = 'method=GET&uri=/listings/111849386';
		
    postdata  = 'method=GET&uri=/shipping/profiles/115060096';
		
    postdata  = 'method=GET&uri=/users/__SELF__';
    
    postdata  = 'method=POST&uri=/listings';
    postdata += '&quantity=1';
    postdata += '&title=createviaapi';
    postdata += '&description=testitem';
    postdata += '&price=10.0';
    postdata += '&shipping_profile_id=184';
    postdata += '&category_id=69150353';
    postdata += '&who_made=i_did';
    postdata += '&is_supply=0';
    postdata += '&when_made=2010_2012';
    postdata += '&payment_template_id=92';
    //postdata += '&state=active';
    
    postdata  = 'method=GET&uri=/listings/active';
    
    $.post('/etsy/call',
           postdata,
           function(data) {
             
           },
           'json');
    
    return false;
  });
  
	$('#csvform').submit(function() {
		if ($('#csvfile').val() == '') {
		$('#csvimportmessage').html('Please select CSV file.');
			return false;
		}
		
		$('#csvimportmessage').html('Importing items from CSV file...');
		
		return true;
	});

	$('#items').on('change',
								 'select[name^="mod.ItemSpecifics.NameValueList"][name$="Value.selector"]',
								 function() {

			var id   = $(this).closest('tbody.itemrow').attr('id');
			var name = $(this).attr('name').replace('.selector', '');
			
			$('input[name="'+name+'"]', '#'+id).val($(this).val());
		});
	
  //$('#checkduplicateitems').qtip({
	/*
  $('#bulkbuttons button[title]').qtip({
    position: {
      my: 'top center',
      at: 'bottom center'
    },
    style: {
      classes: 'ui-tooltip-dark'
    }
  });
  */
	
  $('select[name="mod.ListingType"]', '#headersearchform').change(function() {
		items(true);
  });
	
	$('#items').on('click', 'thead td > div', function() {
		
		var sortfield = $(this).attr('data-field');
		if (sortfield == undefined) return;
		
		var currentsortfield = $('select[name=sortfield]', '#hiddenforms').val();
		var currentsortorder = $('select[name=sortorder]', '#hiddenforms').val();
		
		$('span.arrow', '#items > thead').empty();
		
		if (sortfield == currentsortfield) {
			$('select[name=sortorder]', '#hiddenforms').val(-1*currentsortorder);
		} else {
			$('select[name=sortfield]', '#hiddenforms').val(sortfield);
			$('select[name=sortorder]', '#hiddenforms').val(1);
		}
		
		if ($('select[name=sortorder]', '#hiddenforms').val() == 1) {
			$('span.arrow', $(this)).html('<img src="/icon/03/10/34.png" />');
		} else if ($('select[name=sortorder]', '#hiddenforms').val() == -1) {
			$('span.arrow', $(this)).html('<img src="/icon/03/10/33.png" />');
		}
		
		items(true);
	});
	
	$('#items').on('focus', 'input.selectorparent', function() {
		$('select.selector').hide();
		$('select', $(this).closest('td')).show();
	});
	
	$('#items').on('click', 'a.removevariationname', function() {
		// todo: check whether picture is selected before remove
		var id = $(this).closest('tbody.itemrow').attr('id');
		var num = $(this).closest('th').prevAll().length;
		$(this).closest('th').remove();
		$('table.Variations td:nth-child(' + (num+1) + ')', '#'+id).remove();
		renumbervariations(id);
		return false;
	});
	
	$('#items').on('click', 'a.removevariationrow', function() {
		var id = $(this).closest('tbody.itemrow').attr('id');
		$(this).closest('tr').remove();
		renumbervariations(id);
		return false;
	})
	
	/* Add a variation name */
	$('#items').on('click', 'ul.VariationSpecificsSet li', function() {
		var id = $(this).closest('tbody.itemrow').attr('id');
		var nvnames = $(this).html().split(' / ');
		addvariationnames(id, nvnames);
		return;
	});
	
	/* Add own variation name */
	$('#items').on('click', 'button.addownbutton', function() {
		var id = $(this).closest('tbody.itemrow').attr('id');
		var nvname = $('input', $(this).closest('div')).val();
		addvariationnames(id, [nvname]);
		return;
	});
	
	/* Add a variation row */
	$('#items').on('click', 'a.addvariationrow', function() {
		var id = $(this).closest('tbody.itemrow').attr('id');
		addvariationrow(id);
	});
	
	/* Select variation value from selection */
	$('#items').on
	('change', 'select[name^="mod.Variations.Variation"][name$="Value.selector"]', 
	 function() {
		 var name = $(this).attr('name');
		 $('input[name="'+name.replace(/.selector$/, '')+'"]').val($(this).val());
	 })
	
	/* Variation specific picture set */
  $('#items').on
  ('change', 
   'select[name="mod.Variations.Pictures.VariationSpecificName"]', function() {
		 var id = $(this).closest('tbody.itemrow').attr('id');
     
		 // todo: alert before delete images
		 
		 $('div[class^="VariationPictures"][class!="VariationPictures0"]', '#'+id).remove();
		 
     var val = $(this).val();
     
     var nvvals = [];
     
     var td = $('table.Variations tbody td', '#'+id);
     $.each($('input[name$="Name"]', td), function() {
       if ($(this).val() != val) return;
       
       var nvname = $(this).attr('name');
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
				 addvariationpicturerow(id, idx);
			 }
       
			 $('div.VariationPictures'+idx
				 + ' input[name="mod.Variations.Pictures.VariationSpecificPictureSet.'+idx+'.VariationSpecificValue"]', '#'+id).val(nvval);
			 
			 $('div.VariationPictures' + idx + ' div.variationspecificvalue', '#'+id)
				 .html(val + ': ' + nvval);
			 
     });
		 
		 $('div.VariationSpecificPictureSet div[class^="VariationPictures"]', '#'+id).show();
		 
   });
	
	/* popup control */
	$('html').click(function() {
		$('.selector').hide();
	});
	
	$('#items').on('click', 'input.selectorparent', function(event) {
		event.stopPropagation();
	});
	
  $('#items').on('keyup', 'input[name="mod.Title"]', function() {
	  var id = $(this).closest('tbody.itemrow').attr('id');
    console.log('keyup:' + id);
    $('span.title-character-count', '#'+id).html('(' + $(this).val().length + ' characters)');
  });
  
  /* Orders */
  $('#showorders').click(function() {
    
		showcontent('#orders');
    
    $.post('/json/orders', 
           '',
           function(data) {
             dump(data.json.orders);
             $.each(data.json.orders, function(idx, order) {
               
               var tr = $('#orderrowtemplate').clone().attr('id', order.org.OrderID);
               
               $('td.OrderStatus', tr).html(order.org.OrderStatus);
               $('div.UserID',     tr).html(order.UserID);
               $('td.Total',       tr).html(order.org.Total['#text']);
               $('td.CreatedTime', tr).html(order.org.CreatedTime);
               $('td.BuyerUserID', tr).html(order.org.BuyerUserID);
               
               /* TransactionArray */
               order.org.TransactionArray = arrayize(order.org.TransactionArray);
               $.each(order.org.TransactionArray, function(j, t) {
                 $('td.Title', tr).append(t.Transaction.Item.Title + '<br/>');
                 $('a.ItemID', tr).append(t.Transaction.Item.ItemID + '<br/>');
                 $('td.QuantityPurchased', tr).append(t.Transaction.QuantityPurchased + '<br/>');
               });
               
               $('tbody', '#orders').append(tr);
               
             });
           },
           'json');
  });
  
} // end of bindevents

function togglebulkbuttons() {
  
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
}

function checkdemoaccount() {
    
  var email = $('#user_email').html();
	
  if (email == 'demo@listers.in') {
    alert('Sorry, this function is not available for demo account.');
    return true;
  }
  
  return false;
}

var changeCurrency = function() {
	
	var id = $(this).closest('tbody.itemrow').attr('id');
	
	$('input[name$="@currencyID"]', '#'+id).val($(this).val());
	
	return;
}

var findproducts = function() {
	
	var id = $(this).closest('tbody.itemrow').attr('id');
	var td = $(this).parent();
	
	$('div.foundproducts',      td).hide();
	$('li.suggestedcategory-template', td).nextAll().remove();
	$('li.product-template',    td).nextAll().remove();
  
	var site   = $('select[name="mod.Site"]', '#'+id).val();
  var userid = $('select[name="UserID"]',   '#'+id).val();
  
	var keyword = $('input[name="ProductSearch.QueryKeywords"]', td).val();
  if (keyword == '') {
    $('div.productsearchmessage', td).html('Please input keyword.');
    return;
  }
  
  $('div.productsearchmessage', td).html('<img src="/img/indicator.gif"/> Searching...');
	
  // for java version debug
	$.post
  ('/json/findproducts',
	 'site=' + site + '&findtype=QueryKeywords&keyword=' + encodeURIComponent(keyword),
   function(data) {
     $.post('/node/json/savedebugjson',
            'filename=findproducts.'+keyword+'.java'
            + '&json=' + encodeURIComponent(JSON.stringify(data)),
            function() {}, 'json');
   }, 'json');
  
	$.post('/node/json/findproducts',
		     'userid=' + userid + '&site=' + site
         + '&findtype=QueryKeywords&keyword=' + encodeURIComponent(keyword),
		     function(data) {
           
           $.post('/node/json/savedebugjson',
                  'filename=findproducts.'+keyword+'.node'
                  + '&json=' + encodeURIComponent(JSON.stringify(data)),
                  function() {}, 'json');
           
           if (data.json.result.Ack == 'Failure') {
             $('div.productsearchmessage', td).html('No product found for "'+keyword+'".');
             return;
           }
           
           data.json.categories.SuggestedCategoryArray.SuggestedCategory
             = arrayize(data.json.categories.SuggestedCategoryArray.SuggestedCategory);
           
					 $.each(data.json.categories.SuggestedCategoryArray.SuggestedCategory, function(i, o) {
						 
						 var category = o.Category;
						 var categoryid = category.CategoryID;
						 
						 var idpath = new Array();
						 var parentid = arrayize(category.CategoryParentID);
						 $.each(parentid, function(j, p) {
							 idpath.push(p);
						 });
						 idpath.push(category.CategoryID);
						 
						 var pathname = '';
						 var parentname = arrayize(category.CategoryParentName);
						 $.each(parentname, function(j, p) {
							 pathname += p + ' > ';
						 });
						 pathname += category.CategoryName;
						 
						 var radioid = id + 'sc' + categoryid;
						 
						 var litag = $('li.suggestedcategory-template', td)
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
						 
						 $('ul.suggestedcategories', td).append(litag);
					 });
					 
					 $.each(data.json.result.Product, function(i, o) {
				     
				     // todo: care Reference, UPC, ISBN, etc...
				     var productids = arrayize(o.ProductID);
				     var productid = productids[0]['#text'];
				     foundproducts['R'+productid] = o;
						 
             var ultag = $('li.product-template', td).closest('ul');
				     var litag = $('li.product-template', td).clone().attr('class', 'product');
             
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
					 
			     $('div.foundproducts', td).show();
           $('div.productsearchmessage', td).empty();
		     },
		     'json');
}

function titlesearch_keyupdone()
{
	var str2 = $('input.filter[name=Title]').val();
	if (strprev == str2 && strprev != strdiff) {
		$('input[name=offset]').val(0);
		items(true);
	}
	strdiff = strprev;
	
	return;
}


/* auto click for debug */
function autoclick()
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
}

/**
 * Convert form elements into json format.
 * http://stackoverflow.com/questions/2552836/convert-an-html-form-field-to-a-json-object-with-inner-objects 
 */
$.fn.extractObject = function() {
	
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
	
	this.each(function() {
		if ($(this).attr('name') == undefined) return;
		if ($(this).val() == '') return;
		if ($(this).val() == null) return;
		
		add(accum, $(this).attr('name').split('.'), $(this).val());
	});
	
	return accum;
};

function summary(initflag)
{
	var ulorg = $('ul.accounts').clone();
	
  // for java version debug
  /*
	$.getJSON
	('/json/summary',
	 function(data) {
     $.post('/node/json/savedebugjson',
            'filename=summary.java&json=' + encodeURIComponent(JSON.stringify(data)),
            function() {}, 'json');
   });
  */
  
	$.getJSON('/node/json/summary', function(data) {
		
    /*
    $.post('/node/json/savedebugjson',
           'filename=summary.node&json=' + encodeURIComponent(JSON.stringify(data)),
           function() {}, 'json');
    */
    
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
}

/* show item list */
function items(clearitems)
{
	//showmessage('Loading items...');
  
  var postjson = $('input.filter').extractObject();
	postjson = JSON.stringify(postjson);
	postjson = encodeURIComponent(postjson);
	
	var postdata = $('input.filter, select.filter').serialize();
	
	//postdata = postdata.replace('&mod.ListingType=', '');
	if ($('select[name="mod.ListingType"]', '#headersearchform').val() == '') {
	}
	
  // for java version debug
  /*
	$.post
	('/json/items',
	 postdata + '&json=' +　postjson,
	 function(data) {
     $.post('/node/json/savedebugjson',
            'filename=items.java&json=' + encodeURIComponent(JSON.stringify(data)),
            function() {}, 'json');
   },
   'json');
  */
  
	$.post
	('/node/json/items',
	 postdata + '&json=' +　postjson,
	 function(data) {
		 
     /*
     $.post('/node/json/savedebugjson',
            'filename=items.node&json=' + encodeURIComponent(JSON.stringify(data)),
            function() {}, 'json');
     */
     
		 if (clearitems) {
			 $('tbody:gt(1)', '#items').remove();
		   $('#content').scrollTop(0);
		 }
		 
		 if (data.json.cnt == 0) {
			 $('tbody#rowloading > tr > td').html('No item data found.');
			 $('tbody#rowloading').show();
			 return;
		 }
		 $('tbody#rowloading').hide();
		 
		 dump(data.json);
		 
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
       
			 rowsdata[row.id] = row;
       
			 var dom = getrow(row.id, row);
			 
			 $('#items').append(dom);
       
       setmembermessageform(row.id, row);
		 });
	 },
	 'json');
	
	return;
}

function getrow(idx, row)
{
	var id = idx;
	var dom = $('#rowtemplate').clone().attr('id', id);
    
	if (row.mod == null) {
		$('td.Title', dom).html('ERROR!!! MOD DOES NOT EXISTS.');
		return dom;
	}
	
	if (row.mod.ListingType) {
		if (row.mod.ListingType.match('Fixed')) {
			$('td.ListingType', dom).html('<img src="/img/currency_dollar.png" width="12"/>');
		} else {
			$('td.ListingType', dom).html('<img src="/img/auction_hammer_gavel.png" width="12"/>');
		}
	}
  
  if (row.mod.Title) {
	  $('td.Title', dom).html(htmlencode(row.mod.Title));
  } else {
	  $('td.Title', dom).html('(empty title)');
  }
	
	$('td.Quantity', dom).html(row.mod.Quantity);
	
	if (row.schedule_local) {
		$('div.StartTime', dom).html('<img src="/icon/02/10/37.png"/> ' + row.schedule_local);
	}
	if (row.org) {
		
		$('a.ItemID', dom).attr('href', row.org.ListingDetails.ViewItemURL).html(row.org.ItemID);
		$('div.EndTime', dom).html(row.endtime);
		
		if (row.org.WatchCount != undefined) {
			$('div.WatchCount', dom).html(row.org.WatchCount);
		}
		if (row.org.HitCount != undefined) {
			$('div.HitCount', dom).html(row.org.HitCount);
		}
		if (row.org.SellingStatus.BidCount != undefined) {
			$('div.BidCount', dom).html(row.org.SellingStatus.BidCount);
		}
		if (row.org.SellingStatus.QuantitySold > 0) {
			$('div.SoldCount', dom).html(row.org.SellingStatus.QuantitySold);
		}
		
	} else {
		
		$('a.ItemID', dom).replaceWith('-');
		
	}
  
	$('div.StartPrice', dom).html(row.price);
	if (row.price != row.currentprice) {
		$('div.CurrentPrice', dom).html(row.currentprice);
	}
	
	/* status(loading icon) */
	if (typeof(row.status) == 'string' && row.status != '') {
		$('input:checkbox', dom).css('visibility', 'hidden');
		$('input:checkbox', dom).parent().addClass('loading');
	}
	$('input:checkbox', dom).val(id);
	
	/* Picture */
	var pictstr = '';
	if (row.mod.PictureDetails) {
		if (typeof(row.mod.PictureDetails.PictureURL) == 'string') {
			pictstr = row.mod.PictureDetails.PictureURL;
		} else if (typeof(row.mod.PictureDetails.PictureURL) == 'object') {
			pictstr = row.mod.PictureDetails.PictureURL[0];
		} else if (typeof(row.mod.PictureDetails.GalleryURL) == 'string') {
			pictstr = row.mod.PictureDetails.GalleryURL;
		} else if (typeof(row.mod.PictureDetails.GalleryURL) == 'object') {
			pictstr = row.mod.PictureDetails.GalleryURL[0];
		}
	}
  
	if (pictstr != '') {
		pictstr = '/image/?url=' + encodeURIComponent(pictstr);
		$('img.PictureURL', dom).attr('src', pictstr);
	} else {
		$('img.PictureURL', dom).remove();
	}

	/* Labels */
	if (typeof(row.labels) == 'object') {
		$.each(row.labels, function(k, v) {
			$('div.labelwrap', dom).append($('<div>').attr('class', 'label').text(v));
		});
	}
	
	/*
	if (row.status == 'listing') {
		$('input:checkbox', dom).css('visibility', 'hidden');
		$('input:checkbox', dom).parent().addClass('loading');
	}
	$('input:checkbox', dom).val(id);
	*/
	
	$('div.UserID', dom).html(row.UserID);
	
	/* status icon */
	var src = '/icon/04/10/10.png';
	if (row.org) {
		if (row.schedule_local) {
			src = '/icon/02/10/37.png';
		} else if (row.org.SellingStatus.ListingStatus == 'Active') {
			src = '/icon/04/10/02.png';
		} else if (row.org.SellingStatus.ListingStatus == 'Completed') {
			src = '/icon/04/10/10.png';
		}
	}
	$('img.status', dom).attr('src', src);
	
	if (row.status) {
		$('td.Title', dom).append('<br/><span class="status">'+row.status+'</span>');
	}
	if (row.error) {
		$.each(row.error, function(k, v) {
			if (v != '') {
				if (v.SeverityCode == 'Warning') {
					//$('td.Title', dom).append('<br/>');
					//var spantag = $('<span/>').text(v.LongMessage);
					//$(spantag).addClass('warning');
					//$('td.Title', dom).append(spantag);
				} else {
					$('td.Title', dom).append('<br/>');
					var spantag = $('<span/>').text(v.ShortMessage + ' ' + v.LongMessage);
					$(spantag).addClass('error');
					$('td.Title', dom).append(spantag);
				}
			}
		});
	}
	if (row.message) {
		//$('td.Title', dom).append(row.message);
	}
  
	/* Opt */
  if (row.opt) {
    /* Auto Relist Label */
    if (row.opt.AutoRelist && row.opt.AutoRelist == 'true') {
		  if (row.opt.AutoRelistAddBestOffer) {
	      var label = $('<div/>').addClass('normallabel').html('Auto Relist With Best Offer');
      } else {
	      var label = $('<div/>').addClass('normallabel').html('Auto Relist');
      }
			$('td.Title', dom).append(label);
    }
  }
	
	return dom;
}

var clickTitle = function() {
	
	var id = $(this).closest('tbody').attr('id');
	
	if ($('tr.row2 td', '#'+id).html().match(/<div class="detail"/i)) {
		$('div.detail', '#'+id).toggle();
		return false;
	}
	
	var detail = $('div.detail', 'div#detailtemplate').clone();
	$('table.detail > tbody > tr > td', detail).hide();
	$('tr.row2 td', '#'+id).append(detail);
	$('div.detail', '#'+id).toggle();
	
	if (id == 'newitem0') {
		return false;
	}
	
	showmessage('Loading item data...');
	
  // for java version debug
  /*
	$.post
	('/json/item',
	 'id=' + id,
	 function(data) {
     $.post('/node/json/savedebugjson',
            'filename=' + id + '.java&json=' + encodeURIComponent(JSON.stringify(data)),
            function() {}, 'json');
   },
   'json');
  */
  
	$.post
	('/node/json/item',
	 'id=' + id,
	 function(data) {
     
     /*
     $.post('/node/json/savedebugjson',
            'filename=' + id + '.node&json=' + encodeURIComponent(JSON.stringify(data)),
            function() {}, 'json');
     */
     
		 var item = data.json.item;
     
     item = extract_shippingtype(item);
     
		 dump(item);
		 //return;
		 
		 /* Remove unsafe javascript in description */
		 if (item.mod.Description != undefined) {
			 var tmpdesc = item.mod.Description;
			 tmpdesc = tmpdesc.replace(/<!--ASW-->[\s\S]+<!--ASW-->/, '');
			 tmpdesc = tmpdesc.replace(/<!--STARTFROOGALLERY-->.+<!--ENDFROOGALLERY-->/, '');
			 tmpdesc = 
				 tmpdesc.replace(/<!-- VENDBASCTCTCTVENDBASCT -->.+<!-- VENDBASCTCTCTVENDBASCT -->/, '');
			 item.mod.Description = tmpdesc;
		 }
     
		 //dumpvalue(item.mod.Description);
		 //return;
		 
		 rowsdata[id] = item;
		 
		 var site = item.mod.Site;
		 
		 hash[site] = new Object;
		 hash[site].eBayDetails         = data.json.eBayDetails;
		 hash[site].Categories          = data.json.Categories;
		 hash[site].CategoryFeatures    = data.json.CategoryFeatures;
		 hash[site].ThemeGroup          = data.json.ThemeGroup;
		 hash[site].DescriptionTemplate = data.json.DescriptionTemplate;
		 hash[site].SecondaryCategories = data.json.SecondaryCategories;
		 
     //setmembermessageform(item);
     
		 setformelements(item);
		 showformvalues(item);
		 $('div.productsearchform', '#' + id).remove();
		 
		 $('table.detail > tbody > tr > td', detail).show();
		 //$('td:nth-child(2)', '#'+id).show();
		 
		 //$('div.pictures', '#'+id).append('<pre>'+$.dump(item.mod.PictureDetails)+'</pre>');
		 //$.scrollTo('#'+id, {axis:'y', offset:0});
	 },
	 'json');
	
	return false;
}

// todo: skip some forms if selected category is not a leaf category.
function setformelements(item)
{
	var id = item.id;
	var site = item.mod.Site;
	
	/* Country */
	$('select[name="mod.Country"]', '#'+id).empty();
	$.each(hash[site].eBayDetails.CountryDetails, function(k, v) {
		var optiontag = $('<option/>').val(v.Country).text(v.Description);
		$('select[name="mod.Country"]', '#'+id).append(optiontag);
	});
	
	/* Currency */
	$('select[name="mod.Currency"]', '#'+id).empty();
	$.each(hash[site].eBayDetails.CurrencyDetails, function(k, v) {
		if ($.inArray(v.Currency, sitecur[site]) == -1) return;
		var optiontag = $('<option/>').val(v.Currency).text(v.Currency+' ('+v.Description+')');
		$('select[name="mod.Currency"]', '#'+id).append(optiontag);
	});
	//var tmpcurval = $('select[name="mod.Currency"]', '#'+id).val();
	//$('input[name$="@currencyID"]', '#'+id).val(tmpcurval);
	
	/* Categories */
	if (item.categorypath) {
	} else {
		item.categorypath = [];
	}
	
	var tmppath = item.categorypath.slice(0); // just copy?
	tmppath.unshift(0);
	
	var pds = getcategorypulldowns(site, tmppath);
	$('td.primarycategory', '#'+id).html(pds);
	
	/* Secondary Category */
	if (item.secondarycategorypath) {
		
	} else {
		item.secondarycategorypath = [];
	}
	
	var tmppath = item.secondarycategorypath.slice(0); // just copy?
	tmppath.unshift(0);
	
	var pds = getsecondarycategorypulldowns(site, tmppath);
	$('td.secondarycategory', '#'+id).html(pds);
	
	var tmppc = hash[site].Categories;
	if (item.categorypath.length >= 2) {
		tmppc = tmppc['c'+item.categorypath[item.categorypath.length-2]];
	}
	
	$('select[name="mod.ConditionID"]', '#'+id).empty();
	var category;
	if (item.mod.PrimaryCategory) {
		var category = tmppc['c'+item.mod.PrimaryCategory.CategoryID];
		
		if (category.CategoryFeatures) {
      
		  /* Condition */
			if (category.CategoryFeatures.ConditionEnabled == 'Disabled') {
				
				var optiontag = $('<option/>').val('').html('(disabled)');
				$('select[name="mod.ConditionID"]', '#'+id).append(optiontag);
				
			} else {
				
				var optiontag = $('<option/>').val('').html('(not selected)');
				$('select[name="mod.ConditionID"]', '#'+id).append(optiontag);
				
				var conditions = category.CategoryFeatures.ConditionValues.Condition;
				for (i in conditions) {
					var value = conditions[i].ID;
					var label = conditions[i].DisplayName;
					var optiontag = $('<option/>').val(value).html(label);
					$('select[name="mod.ConditionID"]', '#'+id).append(optiontag);
				}
				
			}
      
      /* Variations */
      if (category.CategoryFeatures.VariationsEnabled == 'true') {
        $('div.variations-disabled', '#'+id).hide();
        $('div.variations-enabled',  '#'+id).show();
      } else {
        $('div.variations-enabled',  '#'+id).hide();
        $('div.variations-disabled', '#'+id).show();
      }
			
		} else {
			
			var optiontag = $('<option/>').val('').html('(Please select category)');
			$('select[name="mod.ConditionID"]', '#'+id).append(optiontag);
			
		}
		
		/* BestOffer */
		//log('BestOffer:'+category.CategoryFeatures.BestOfferEnabled);
		
	} else {
		
		var optiontag = $('<option/>').val('').html('(Please select category)');
		$('select[name="mod.ConditionID"]', '#'+id).append(optiontag);
		
	}
	
	/* Variations */
	setformelements_variations(item);
	
	/* ItemSpecifics */
	setformelements_itemspecifics(item);
	
	/* ListingDuration (depends on Site, PrimaryCategory, ListingType) */
  setformelements_listingduration(item);
	
	/* ShippingPackage */
	var _sdcsr = 'ShippingDetails.CalculatedShippingRate';
	$('select[name="mod.'+_sdcsr+'.ShippingPackage"]', '#'+id).empty();
	var optiontag = $('<option/>').val('').html('');
	$('select[name="mod.'+_sdcsr+'.ShippingPackage"]', '#'+id).append(optiontag);
	if (hash[site].eBayDetails.ShippingPackageDetails) {
		$.each(hash[site].eBayDetails.ShippingPackageDetails, function(i, o) {
			var optiontag = $('<option/>').val(o.ShippingPackage).html(o.Description);
			$('select[name="mod.'+_sdcsr+'.ShippingPackage"]', '#'+id).append(optiontag);
		});
	}
	
	/* ShippingService */
	setformelements_shipping(item);
	
	/* DispatchTimeMax */
	$('select[name="mod.DispatchTimeMax"]', '#'+id).empty();
	var optiontag = $('<option/>').val('').html('Select a handling time');
	$('select[name="mod.DispatchTimeMax"]', '#'+id).append(optiontag);
	$.each(hash[site].eBayDetails.DispatchTimeMaxDetails, function(i, o) {
		var optiontag = $('<option/>').val(o.DispatchTimeMax).html(o.Description);
		$('select[name="mod.DispatchTimeMax"]', '#'+id).append(optiontag);
	});
	
	/* PaymentMethods */
	// Do not use GeteBayDetails to discover the valid payment methods for a site.
	$('td.paymentmethod', '#'+id).empty();
	$.each(hash[site].CategoryFeatures.SiteDefaults.PaymentMethod, function(i, o) {
		var idforlabel = id+'.PaymentMethods.'+i;
		
		var checkboxtag = $('<input/>')
			.attr('type', 'checkbox')
			.attr('id', idforlabel)
			.attr('name', 'mod.PaymentMethods')
			.val(o);
		
		var labeltag = $('<label/>')
			.attr('for', idforlabel)
			.html(o);
		
		var divtag2 = $('<div/>');
		$(divtag2).append(checkboxtag);
		$(divtag2).append(labeltag);

		if (o == 'PayPal') {
			var inputtag = $('<input/>')
				.attr('type', 'text')
				.attr('name', 'mod.PayPalEmailAddress');
			$(divtag2).append('<br/>&nbsp;&nbsp;&nbsp;&nbsp;PayPal email address : ');
			$(divtag2).append(inputtag);

			var checkbox = $('<input/>')
				.attr('type', 'checkbox')
				.attr('name', 'mod.AutoPay')
				.attr('value', 'true');
			$(divtag2).append('<br/>&nbsp;&nbsp;&nbsp;&nbsp;');
			$(divtag2).append(checkbox);
			$(divtag2).append('Require immediate payment when buyer uses Buy It Now');
		}
		
		$('td.paymentmethod', '#'+id).append(divtag2);
	});
	
	/* ReturnPolicy */
	var rparr = ['ReturnsAccepted', 'ReturnsWithin', 'Refund', 'ShippingCostPaidBy'];
	for (i in rparr) {
		var rpname = rparr[i];
		var optiontag = $('<option/>').val('').text('');
		$('select[name="mod.ReturnPolicy.'+rpname+'Option"]', '#'+id).empty();
		$('select[name="mod.ReturnPolicy.'+rpname+'Option"]', '#'+id).append(optiontag);
		
		if (hash[site].eBayDetails.ReturnPolicyDetails[rpname]) {
			$.each(hash[site].eBayDetails.ReturnPolicyDetails[rpname], function(i, o) {
				var optiontag = $('<option/>').val(o[rpname+'Option']).text(o.Description);
				$('select[name="mod.ReturnPolicy.'+rpname+'Option"]', '#'+id).append(optiontag);
			});
		}
	}
	
	/* ThemeGroup */
	var optiontag = $('<option/>').val('').text('(not selected)');
	$('select[name="ListingDesigner.GroupID"]', '#'+id).empty();
	$('select[name="ListingDesigner.GroupID"]', '#'+id).append(optiontag);
	if (hash[site].ThemeGroup) {
		$.each(hash[site].ThemeGroup, function(i, o) {
			var optiontag = $('<option/>').val(o.GroupID).text(o.GroupName);
			$('select[name="ListingDesigner.GroupID"]', '#'+id).append(optiontag);
		});
	}
	
	var optiontag = $('<option/>').val('').text('(not selected)');
	$('select[name="mod.ListingDesigner.ThemeID"]', '#'+id).empty();
	$('select[name="mod.ListingDesigner.ThemeID"]', '#'+id).append(optiontag);
	if (hash[site].DescriptionTemplate) {
		$.each(hash[site].DescriptionTemplate, function(i, o) {
			var optiontag = $('<option/>').val(o.ID).text(o.Name);
			$('select[name="mod.ListingDesigner.ThemeID"]', '#'+id).append(optiontag);
		});
	}	
	
	/* checkbox,radio and label */
	$('input[type=checkbox][id^=_id]', '#'+id).each(function (i, o) {
		var newid = $(o).attr('id').replace(/^_id/, id);
		$(o).attr('id', newid);
	});
	$('input[type=radio][id^=_id]', '#'+id).each(function (i, o) {
		var newid = $(o).attr('id').replace(/^_id/, id);
		$(o).attr('id', newid);
	});
	$('label[for^=_id]', '#'+id).each(function (i, o) {
		var newid = $(o).attr('for').replace(/^_id/, id);
		$(o).attr('for', newid);
	});
	
	return;
}

function setformelements_listingduration(item)
{
	var id = item.id;
	var site = item.mod.Site;
  
	if (item.mod.PrimaryCategory == undefined) {
	  $('select[name="mod.ListingDuration"]', '#'+id).empty();
		var optiontag = $('<option/>').val('').html('(Please select category)');
		$('select[name="mod.ListingDuration"]', '#'+id).append(optiontag);
    return;
  }
  
  var categoryid = item.mod.PrimaryCategory.CategoryID;
  
  var parentid = $('select[name^="categorypath."]:last', '#'+id).val();
  
  if (item.categorypath[item.categorypath.length-1] != categoryid) {
    item.categorypath.push(categoryid);
  }
  
	var tmppc = hash[site].Categories;
	if (item.categorypath.length >= 2) {
		tmppc = tmppc['c'+item.categorypath[item.categorypath.length-2]];
    console.log('A:' + item.categorypath[item.categorypath.length-2]);
	} else if (parentid) {
		tmppc = tmppc['c'+parentid];
    console.log('B:' + parentid);
  }
  
	var category = tmppc['c' + categoryid];
  
	if (category == undefined) return;
  
  /* Empty */
	$('select[name="mod.ListingDuration"]', '#'+id).empty();
  
  /* 1 day */
	if ($('select[name="mod.ListingType"]').val() == 'Chinese') {
		var optiontag = $('<option/>').val('Days_1').html('1 day');
		$('select[name="mod.ListingDuration"]', '#'+id).append(optiontag);
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
      console.log('durationsetid: ' + durationsetid);
      
			for (j in listingdurations[i].Duration) {
        
				var value = listingdurations[i].Duration[j];
        
				var optiontag = $('<option/>').val(value).html(getListingDurationLabel(value));
        
				$('select[name="mod.ListingDuration"]', '#'+id).append(optiontag);
			}
			break;
		}
	}
  
  return;
}

function setformelements_variations(item)
{
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
		
		var recomm = arrayize(category.CategorySpecifics.NameRecommendation);
    
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
		$('ul.VariationSpecificsSet', '#'+item.id).empty();
		$.each(names, function(k, v) {
			$('ul.VariationSpecificsSet', '#'+item.id).append($('<li />').html(v));
		});
	}
	
	/* If variations are already defined, then copy columns and rows */
  if (item.mod.Variations) {
		
		/* each rows */
		$.each(item.mod.Variations.Variation, function(rowidx, variation) {
			
      if (variation.VariationSpecifics == undefined) return;
      
			if (rowidx == 0) {
				
				/* each columns */
				var nvl = arrayize(variation.VariationSpecifics.NameValueList);
				$.each(nvl, function(colidx, nv) {
					addvariationnames(item.id, [nv.Name]);
				});
				
			} else {
				
				/* Copy input form row */
				addvariationrow(item.id);
			}
			
    });
		
		renumbervariations(item.id);
    
    /* VariationPictures */
		if (item.mod.Variations.Pictures) {
			
			$.each(item.mod.Variations.Pictures.VariationSpecificPictureSet, function(i, o) {
				if (i == 0) return;
				addvariationpicturerow(item.id, i);
				// don't show images here. show in showformvalues / fillformvalues
			});
			
			$('div.VariationSpecificPictureSet div[class^="VariationPictures"]', '#'+item.id).show();
		}
    
  }
	
	return;
}

function setformelements_shipping(item)
{
  setformelements_shipping_domestic(item);
  setformelements_shipping_international(item);
}

function setformelements_shipping_domestic(item)
{
	var id = item.id;
	var site = item.mod.Site;
	
  // No shipping
	if (item.mod.ShippingDetails == undefined
      || item.mod.ShippingDetails.ShippingType == undefined
      || item.mod.ShippingDetails.ShippingType.domestic == undefined
      || item.mod.ShippingDetails.ShippingType.domestic == '') {
    
		// todo: remove 2>=
		$('select[name="mod.ShippingDetails.ShippingType.domestic"]', '#'+id).val('');
		$('tbody.shippingmainrows', '#'+id).hide();
    
		$('select[name="mod.ShippingDetails.ShippingType.international"]', '#'+id).val('');
		$('tbody.internationalshippingmainrows', '#'+id).hide();
		
		return;
  }

  if (item.mod.ShippingDetails.ShippingType.domestic == 'FreightFlat') {
		$('select[name="mod.ShippingDetails.ShippingType.international"]', '#'+id).val('');
		$('tbody.internationalshippingmainrows', '#'+id).hide();
  }
  
	$('tbody.shippingmainrows', '#'+id).show();
	renumbersso(id, 'shippingservices');
	
	var _dsso = 'ShippingDetails.ShippingServiceOptions';
	var _isso = 'ShippingDetails.InternationalShippingServiceOption';
	var dmsttype = item.mod.ShippingDetails.ShippingType.domestic;
  
  // todo: With Opera: pulldown keeps open when run here.
  //return;
	
	if (dmsttype == 'Calculated') {
		$('tr.packagetype, tr.dimensions, tr.weight', '#'+id).show();
	} else {
		$('tr.packagetype, tr.dimensions, tr.weight', '#'+id).hide();
	}
	
	var packagetype = '';
	if (item.mod.ShippingDetails.CalculatedShippingRate) {
		packagetype = item.mod.ShippingDetails.CalculatedShippingRate.ShippingPackage;
	}
	
	// set <option> tags
  // todo: don't set option tags here, set when site is changed.
	$('select[name="mod.'+_dsso+'.0.ShippingService"]', '#'+id).empty();
	$('select[name="mod.'+_dsso+'.0.ShippingService"]', '#'+id)
		.append($('<option/>').val('').text('(not selected)'));
	
	$.each(hash[site].eBayDetails.ShippingServiceDetails, function(i, o) {
		
		if (dmsttype == 'FreightFlat') {
			if (o.ShippingService == 'FreightShipping' || o.ShippingService == 'Freight') {
				$('select[name="mod.'+_dsso+'.0.ShippingService"]', '#'+id)
					.append($('<option/>').val(o.ShippingService).html(o.Description));
			}
    }
		
		if (o.ValidForSellingFlow != 'true') return;
		if (parseInt(o.ShippingServiceID) >= 50000) return;
		
		var arrservicetype = arrayize(o.ServiceType)
		
		if ($.inArray(dmsttype, arrservicetype) >= 0) {
      
			if (dmsttype == 'Calculated') {
				var packages = arrayize(o.ShippingServicePackageDetails);
				
				for (i in packages) {
					if (packages[i].Name == packagetype) {
						$('select[name="mod.'+_dsso+'.0.ShippingService"]', '#'+id)
							.append($('<option/>').val(o.ShippingService).html(o.Description));
					}
				}
			} else {
				$('select[name="mod.'+_dsso+'.0.ShippingService"]', '#'+id)
					.append($('<option/>').val(o.ShippingService).html(o.Description));
			}
      
		}
		
	});
	
	// ShippingLocation
	$('div.ShipToLocation', '#'+id).empty();
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
		
		$('ul.ShipToLocation', '#'+id).append(li);
	});
	
	// copy 2,3,4,...
	// todo: don't copy when already 2, 3, ... is shown.
	if ($.isArray(item.mod.ShippingDetails.ShippingServiceOptions)
			&& item.mod.ShippingDetails.ShippingServiceOptions.length > 1) {
		
		$.each(item.mod.ShippingDetails.ShippingServiceOptions, function(k, v) {
			if (v.ShippingServicePriority == 1) return;
			addsso(id, 'shippingservices');
		});
	}
	
	return;
}

function setformelements_shipping_international(item)
{
	var id = item.id;
	var site = item.mod.Site;
  
  // No shipping
	if (item.mod.ShippingDetails == undefined
      || item.mod.ShippingDetails.ShippingType == undefined
      || item.mod.ShippingDetails.ShippingType.international == undefined
      || item.mod.ShippingDetails.ShippingType.international == ''
      || item.mod.ShippingDetails.ShippingType.domestic == 'FreightFlat') {
    
		// todo: remove 2>=
		$('select[name="mod.ShippingDetails.ShippingType.international"]', '#'+id).val('');
		$('tbody.internationalshippingmainrows', '#'+id).hide();
		
		return;
  }
  
	$('tbody.internationalshippingmainrows', '#'+id).show();
	renumbersso(id, 'internationalshippingservices');
  
	var _isso = 'ShippingDetails.InternationalShippingServiceOption';
  var intltype = item.mod.ShippingDetails.ShippingType.international;
  
	// Set <option> tags
	$('select[name="mod.'+_isso+'.0.ShippingService"]', '#'+id).empty();
	$('select[name="mod.'+_isso+'.0.ShippingService"]', '#'+id)
		.append($('<option/>').val('').text('(not selected)'));
  
	$.each(hash[site].eBayDetails.ShippingServiceDetails, function(i, o) {
		if (o.ValidForSellingFlow != 'true') return;
		if (parseInt(o.ShippingServiceID) < 50000) return;
		
		var arrservicetype = arrayize(o.ServiceType)
		
		if ($.inArray(intltype, arrservicetype) >= 0) {
			$('select[name="mod.'+_isso+'.0.ShippingService"]', '#'+id)
				.append($('<option/>').val(o.ShippingService).html(o.Description));
		}
	});
  
	if ($.isArray(item.mod.ShippingDetails.InternationalShippingServiceOption)
			&& item.mod.ShippingDetails.InternationalShippingServiceOption.length > 1) {
		
		$.each(item.mod.ShippingDetails.InternationalShippingServiceOption, function(k, v) {
			if (v.ShippingServicePriority == 1) return;
			addsso(id, 'internationalshippingservices');
		});
	}
  
	// ShipToLocations
	$('td.ShipToLocations', '#'+id).empty();
	$.each(hash[site].eBayDetails.ShippingLocationDetails, function(i, o) {
		var idforlabel = id+'.ShipToLocations.'+o.ShippingLocation;
		
		var checkbox = $('<input/>')
			.attr('type', 'checkbox')
			.attr('id', idforlabel)
			.attr('name', 'mod.ShipToLocations')
			.val(o.ShippingLocation);
		
		var label = $('<label/>')
			.attr('for', idforlabel)
			.html(o.Description);
		
		var li = $('<li/>').append(checkbox).append(label);
		
		$('ul.ShipToLocations', '#'+id).append(li);
	});
  
  return;
}


function addsso(id, classname)
{
	var pdiv = $('#' + id + ' td.' + classname);
	
	var divs = $('div[class^=ShippingService]', pdiv);
	
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
	
	renumbersso(id, classname);
	
	// Hide "Offer additional service" link.
	if (classname == 'shippingservices' && divs.length >= 3) {
		$('a.addsso', pdiv).hide();
	} else if (classname == 'internationalshippingservices' && divs.length >= 4) {
		$('a.addsso', pdiv).hide();
	}
	
	return false;
}

function renumbersso(id, classname)
{
	var pdiv = $('#' + id + ' td.' + classname);
	
	$.each($('div[class^=ShippingService]', pdiv), function(i, div) {
		
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
}


function addvariationnames(id, nvnames)
{
	var colcount = $('table.Variations thead th', '#'+id).length;
	if (colcount >= 9) {
		alert('You can add maximum 5 variation details.');
		return false;
	}
		
	var site;
	var categoryid;
	var parentid;
	
	if (rowsdata[id]) {
		
		var item = rowsdata[id];
		site       = item.mod.Site;
		categoryid = item.mod.PrimaryCategory.CategoryID;
		parentid   = item.categorypath[item.categorypath.length-2];
		
	} else {
		
		site       = $('select[name="mod.Site"]', '#'+id).val();
		categoryid = $('select[name="mod.PrimaryCategory.CategoryID"]', '#'+id).val();
		parentid   = $('select[name="mod.PrimaryCategory.CategoryID"]', '#'+id).prev().val();
		
	}
	
	var category = hash[site]['Categories']['c'+parentid]['c'+categoryid];
	
	/* Recommended names */
	var recommkey = new Array();
  if (category.CategorySpecifics) {
		var recomm = arrayize(category.CategorySpecifics.NameRecommendation);
		for (i in recomm) {
			recommkey[recomm[i].Name] = i;
		}
	}
	
	/* each name value names */
	$.each(nvnames, function(idx, nvname) {
		
		var colcount = $('table.Variations thead th', '#'+id).length;
		
		/* <th> */
		var a = $('<a/>').attr('href', '#').addClass('removevariationname').html('X');
		var th = $('<th/>').append($('<div/>')).append(a);
		$('div', th).html(nvname);
    
    // use eq() here
		$('table.Variations thead th:eq('+(colcount-4)+')', '#'+id).after(th);
		
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
		$('table.Variations tbody td:nth-child('+(colcount-3)+')', '#'+id).after(td);
		
	});
	
	renumbervariations(id);
	setvpvsn_options(id);
	
	return;
}

function addvariationrow(id)
{
	var tr = $('table.Variations tbody tr:first', '#'+id).clone()
	$('table.Variations tbody', '#'+id).append(tr);
  
	renumbervariations(id);
	
	return;
}

function addvariationpicturerow(id, idx)
{
	var div = $('div.VariationPictures0', '#'+id).clone();
	
	$(div).attr('class', 'VariationPictures' + idx);
	$('ul.variationpictures li:gt(0)', div).remove();
	
	$('input[type="hidden"]', div)
		.attr('name', 
					'mod.Variations.Pictures.VariationSpecificPictureSet.' + idx + '.VariationSpecificValue');
	
	//$('div.variationspecificvalue', div).html(nvname + ': ' + nvval);
	
	$('div.VariationSpecificPictureSet', '#'+id).append(div);
	
	return;
}


function renumbervariations(id)
{
	$.each($('table.Variations th input', '#'+id), function(i, th) {
		var name = $(this).attr('name');
		if (name == undefined) return;
		$(this).attr('name', name.replace(/[0-9]+\.Name$/, i + '.Name'));
	});
	
	/* each rows */
	$.each($('table.Variations tbody tr', '#'+id), function(rowidx, tr) {
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
}

/* <select name="mod.Variations.Pictures.VariationSpecificName"> */
function setvpvsn_options(id)
{
	// todo: preserve selected value
	
  var select = $('select[name="mod.Variations.Pictures.VariationSpecificName"]', '#'+id);
  $(select).empty();
  $(select).append($('<option/>').val('').html('(not selected)'));
  
	var colcount = $('table.Variations thead th', '#'+id).length;
	for (var i=1; i<=(colcount-4); i++) {
		var str = $('table.Variations thead th:eq('+i+') div', '#'+id).html();
    $(select).append($('<option/>').val(str).html(str));
	}
  
  return;
}

function resizediv()
{
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
  
	$('#message').width($('#container').width());
	
	var theadh = $('thead', '#items').height();
	
	$('#rowloading td').height(windowh - headerh - contentmargin - theadh - 4);
	
  return;
}

var changeCategory = function() {
	
	var id = $(this).closest('tbody.itemrow').attr('id');
	var site = $('select[name="mod.Site"]', '#'+id).val();
  var td = $(this).closest('td');
	var tdclass = $(td).attr('class');
	
	$(this).nextAll().remove();
	if (tdclass == 'secondarycategory') {
		$('select:last', td).attr('name', 'mod.SecondaryCategory.CategoryID');
	} else {
		$('select:last', td).attr('name', 'mod.PrimaryCategory.CategoryID');
	}
	
	var primarycategorypulldowns = $('td.primarycategory select', '#'+id).get();
	var primarycategorypath = new Array();
	for (node in primarycategorypulldowns) {
		primarycategorypath.push(primarycategorypulldowns[node].value);
	}
	
	var secondarycategorypulldowns = $('td.secondarycategory select', '#'+id).get();
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
		 
     //dump(data);
     
		 if (tdclass == 'secondarycategory') {
			 hash[site].SecondaryCategories = data.json.gc2.Categories;
		 } else {
			 hash[site].Categories = data.json.gc2.Categories;
		 }
		 
		 var item_modifing =
			 $('input[type="text"][name^="mod"], input:checked, input[type="hidden"], select[name^="mod"], textarea', '#'+id)
			 .extractObject();
		 
		 item_modifing.id = id;
		 item_modifing.categorypath = primarycategorypath;
		 item_modifing.secondarycategorypath = secondarycategorypath;
		 
		 setformelements(item_modifing);
		 fillformvalues(item_modifing);
		 
		 return;
	 });
	
	return;
}

var clickEdit = function() {
	
	var id = $(this).closest('tbody.itemrow').attr('id');
	var item = rowsdata[id];
	var dom = $('div.detail', 'div#detailtemplate').clone().css('display', 'block');
	
	/* preserve selected tab */
	var tab = $('ul.tabNav > li.current', 'tbody#'+id);
	var tabnum = tab.prevAll().length + 1;
	$('.tabNav',       dom).children('.current').removeClass('current');
	$('.tabContainer', dom).children('.current').hide();
	$('.tabContainer', dom).children('.current').removeClass('current');
	$('.tabNav',       dom).children('li:nth-child('+tabnum+')').addClass('current');
	$('.tabContainer', dom).children('div:nth-child('+tabnum+')').show();
	$('.tabContainer', dom).children('div:nth-child('+tabnum+')').addClass('current');
	
	$('div.detail', 'tbody#'+id).replaceWith(dom);
	
	// todo: disable modifying some fields when the item is active. (UserID, Site, etc...)
	
	setformelements(item);
	fillformvalues(item);
	
	// todo: compare to CKEditor
	$('textarea[name="mod.Description"]', '#'+id).redactor({
		convertDivs: false,
		convertLinks: false
	});
	
	//$('input[name="mod.ScheduleTime"]', '#'+id).datetimepicker({dateFormat: 'yy-mm-dd'});
	$('input[name="mod.ScheduleTime"]', '#'+id).datetimepicker({dateFormat: 'yy-mm-dd'});
	
	showbuttons(dom, 'save,cancel');
	
	return;
}

var save = function() {
	
	var id     = $(this).closest('tbody.itemrow').attr('id');
	var detail = $(this).closest('div.detail');
	
	// temp remove
	$('input.remove',  detail).remove();
	$('select.remove', detail).remove();
	
	// todo: varidation check
	//if (!checkformvalues(id)) return false;
	
	/* PictureURL */
	$.each($('ul.pictures li', '#'+id), function (i, li) {
		if ($(li).attr('class') == 'template') return;
		
		var url = $('img', li).attr('data-url');
		
		var input = $('<input />')
			.attr('type', 'hidden')
			.attr('name', 'mod.PictureDetails.PictureURL')
			.val(url);
		
		$('div.pictures', '#'+id).append(input);
	});
	
	/* VariationPictures */
	$.each($('div[class^=VariationPictures]'), function(i, div) {
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
	
	// todo: Why Opera can't include <select> tags?
	// todo: Don't use numeric keys that causes "NCNames cannot start with...." javascript error.
	
	// remove empty value forms
	var _dsso = 'mod.ShippingDetails.ShippingServiceOptions';
	var _isso = 'mod.ShippingDetails.InternationalShippingServiceOption';
	for (i = 0; i <= 3; i++) {
		if ($('select[name="'+_dsso+'.'+i+'.ShippingService"]', '#'+id).val() == '') {
			$('input[name="'+_dsso+'.'+i+'.ShippingServicePriority"]', '#'+id).val('');
		} else if ($('select[name="'+_dsso+'.'+i+'.ShippingService"]', '#'+id).val() == null) {
			$('input[name="'+_dsso+'.'+i+'.ShippingServicePriority"]', '#'+id).val('');
		}
	}
	for (i = 0; i <= 4; i++) {
		if ($('select[name="'+_isso+'.'+i+'.ShippingService"]', '#'+id).val() == '') {
			$('input[name="'+_isso+'.'+i+'.ShippingServicePriority"]', '#'+id).val('');
		} else if ($('select[name="'+_isso+'.'+i+'.ShippingService"]', '#'+id).val() == null) {
			$('input[name="'+_isso+'.'+i+'.ShippingServicePriority"]', '#'+id).val('');
		}
	}
	
	// remove empty currency symbols
	$('input[name$="@currencyID"]', '#'+id).each(function(i, o) {
		var cname = $(o).attr('name').replace('@currencyID', '#text');
		if ($('input[name="'+cname+'"]', '#'+id).val() == '') {
			$(o).val('');
		}
	});
	
	// todo: remove empty ItemSpecifics
	$('input[name^="mod.ItemSpecifics.NameValueList"][type=checkbox]', '#'+id).each(function (i, o){
		var fvalue = $(o).val();
		if ($(o).attr('checked') != 'checked') $(o).remove();
	});
	$('input[name^="mod.ItemSpecifics.NameValueList"]', '#'+id).each(function (i, o){
		var fname = $(o).attr('name');
		if (!fname.match(/Name$/)) return;
		
		var fvalue = $('input[name="'+fname.replace(/Name$/, 'Value')+'"]', '#'+id).val();
		if (fvalue == '') $(o).remove();
	});
  
	var postdata = $('input[type=text], input:checked, input[type=hidden], select, textarea', '#'+id).extractObject();
  
  // merge shippingtype domestic and international
  var dmsttype = '';
  var intltype = '';
  if (postdata.mod.ShippingDetails) {
    
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
	
	if (postdata.mod.ShippingDetails) {
		if (postdata.mod.ShippingDetails.CalculatedShippingRate) {
			if (postdata.mod.ShippingDetails.CalculatedShippingRate.WeightMajor['#text'] == 0) {
				delete postdata.mod.ShippingDetails.CalculatedShippingRate;
			}
		}
	}
  
	/* VariationSpecificsSet */
	if (postdata.mod.Variations) {
		
		var vssnvl = {};
		$.each(postdata.mod.Variations.Variation, function(i, variation) {
			$.each(variation.VariationSpecifics.NameValueList, function(j, nvl) {
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
	
	postdata = JSON.stringify(postdata);
	postdata = encodeURIComponent(postdata);
	
	showmessage('Saving and verifing the item...');
	
	$.post('/node/json/save',
		     'id='+id+'&json='+postdata,
		     function(data) {
			     var item = data.json.item;
           
           item = extract_shippingtype(item);
           
					 if (id == 'newitem0') {
						 id = item.id
						 $('#newitem0').attr('id', id);
					 }
           
					 rowsdata[id] = item;
					 
			     var site = item.mod.Site;
			     
			     hash[site] = new Object;
			     hash[site].eBayDetails         = data.json.eBayDetails;
			     hash[site].Categories          = data.json.Categories;
			     hash[site].CategoryFeatures    = data.json.CategoryFeatures;
			     hash[site].ThemeGroup          = data.json.ThemeGroup;
			     hash[site].DescriptionTemplate = data.json.DescriptionTemplate;
					 hash[site].SecondaryCategories = $.extend({}, data.json.Categories);
			     
           
					 var detail = $('div.detail', 'div#detailtemplate').clone();
					 
					 /* preserve selected tab */
					 var tab = $('ul.tabNav > li.current', '#'+id);
					 var tabnum = tab.prevAll().length + 1;
					 $('.tabNav',       detail).children('.current').removeClass('current');
					 $('.tabContainer', detail).children('.current').hide();
					 $('.tabContainer', detail).children('.current').removeClass('current');
					 $('.tabNav',       detail).children('li:nth-child('+tabnum+')').addClass('current');
					 $('.tabContainer', detail).children('div:nth-child('+tabnum+')').show();
					 $('.tabContainer', detail).children('div:nth-child('+tabnum+')').addClass('current');
					 
					 $('tr.row2 td div.detail', '#'+id).replaceWith(detail);
					 $('tr.row2 td div.detail', '#'+id).show();
					 
			     setformelements(item);
			     showformvalues(item);
			     showbuttons(detail, 'edit,copy,delete');
			     $('div.productsearchform', '#'+id).remove();

			     var rowdom = getrow(id, item);
					 var row1 = $('tr.row1', rowdom);
					 $('tr.row1', '#'+id).replaceWith(row1);
					 $('tr.row1', '#'+id).show();
					 
		     },
		     'json');
	
	return false;
}

function checkformvalues(id) {

	if ($('select[name="mod.PrimaryCategory.CategoryID"]', '#'+id).val() == '') {
		alert('category error');
		return false;
	}
	
	return true;
}


var clickCancel = function() {
	
	var id = $(this).closest('tbody.itemrow').attr('id');
	
	// cancel add new item
	if (id == 'newitem0') {
		items(true);
		$('#newitem0').remove();
		return false;
	}
	
	var detail = $('div.detail', 'div#detailtemplate').clone();
	
	/* preserve selected tab */
	var tab = $('ul.tabNav > li.current', '#'+id);
	var tabnum = tab.prevAll().length + 1;
	$('.tabNav',       detail).children('.current').removeClass('current');
	$('.tabContainer', detail).children('.current').hide();
	$('.tabContainer', detail).children('.current').removeClass('current');
	$('.tabNav',       detail).children('li:nth-child('+tabnum+')').addClass('current');
	$('.tabContainer', detail).children('div:nth-child('+tabnum+')').show();
	$('.tabContainer', detail).children('div:nth-child('+tabnum+')').addClass('current');
	
	$('tr.row2 td div.detail', '#'+id).replaceWith(detail);
	$('tr.row2 td div.detail', '#'+id).show();
	
	setformelements(rowsdata[id]);
	showformvalues(rowsdata[id]);
	showbuttons('#'+id, 'edit');
	$('div.productsearchform', '#'+id).remove();
	
	return false;
}

var clickDelete = function() {
	return false;
}

var clickCopy = function() {
	return false;
}


var changeSite = function() {
  
	var id   = $(this).closest('tbody.itemrow').attr('id');
	var site = $(this).val();
	
  // for java version debug
  /*
	$.getJSON
	('/json/site?site=' + site,
	 function(data) {
     $.post('/node/json/savedebugjson',
            'filename=site.' + site + '.java&json=' + encodeURIComponent(JSON.stringify(data)),
            function() {}, 'json');
   });
  */
  
	$.getJSON
	('/node/json/site?site=' + site,
	 function(data) {
		 
     /*
     $.post('/node/json/savedebugjson',
            'filename=site.' + site + '.node&json=' + encodeURIComponent(JSON.stringify(data)),
            function() {}, 'json');
     */
     
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
}

function setmembermessageform(id, item)
{
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
}

function getcategorypulldowns(site, path)
{
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
}

function getsecondarycategorypulldowns(site, path)
{
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
}



function refresh()
{
	var postdata = '';
	
	var loadings = $('td.loading > input:checkbox[name="id"]');
	if (loadings.length > 0) {
		$.each($('td.loading > input:checkbox[name="id"]'), function(k, v) {
			postdata += '&id='+$(v).attr('value');
		});
	}
	
	$.post
	('/node/json/refresh',
	 postdata,
	 function(data) {
		 
		 dump(data.json);
		 
		 /* summary */
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
}

function showmessage(message)
{
	$('#message').show();
	$('#message').html(message);
	
	return;
}

function dismissmessage()
{
	$('#message').fadeOut();
	
	clearTimeout(timeout);
	
	$.post('/node/json/dismissmessage',
			   null,
			   function(data) {
					 
			   },
			   'json');
	
	return;
}

function filter()
{
	$('input[name=offset]').val(0);
	items(true);
	return;
}

function showbuttons(detail, buttons)
{
	var buttons = 'button.'+buttons.replace(/,/g, ',button.');
	
	var ulbtn = $('div.editbuttons', detail);
	$('div.editbuttons button', detail).hide();
	$(buttons, ulbtn).show();
	
	return;
}

function showcontent(contentid)
{
	$('#items').hide();
	$('#content > div').hide();
	$(contentid).show();
	
	return;
}

function msg(o)
{
	$('div#msg').prepend(o+'<br>');
}

function dump(o)
{
	var htmlencoded = $('<div/>').text($.dump(o)).html();
	$('div#debug').html('<pre>'+htmlencoded+'</pre>');
}

function log(str)
{
	$('#log').prepend(str+'<br/>');
}

function htmlencode(str)
{
	return $('<div/>').text(str).html();
}

function csvuploadedmessage()
{
	$('#csvimportmessage').html('Imported. Please check "Saved" items on the left navigation');
}


function updateduration(id)
{
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
}

function getListingDurationLabel(str)
{
	if (str == 'Days_1') {
		str = "1 Day";
	} else if (str == 'GTC') {
		str = "Good 'Til Cancelled";
	} else if (str.match(/^Days_([\d]+)$/)) {
		str = str.replace(/^Days_([\d]+)$/, "$1 Days");
	}
    
	return str;
}

/* Arrayize */
function arrayize(object)
{
  var result = null;
  
	if ($.isArray(object)) {
		result = object;
	} else {
		result = new Array();
		result.push(object);
	}
	
	return result;
}

/* Show form values */
function showformvalues(item)
{
	/* Arrayize */
	if (item.mod.PictureDetails && item.mod.PictureDetails.PictureURL) {
		item.mod.PictureDetails.PictureURL
			= arrayize(item.mod.PictureDetails.PictureURL);
	}
	
	if (item.mod.ShippingDetails) {
		if (item.mod.ShippingDetails.ShippingServiceOptions) {
			item.mod.ShippingDetails.ShippingServiceOptions
				= arrayize(item.mod.ShippingDetails.ShippingServiceOptions);
		}
		if (item.mod.ShippingDetails.InternationalShippingServiceOption) {
			item.mod.ShippingDetails.InternationalShippingServiceOption
				= arrayize(item.mod.ShippingDetails.InternationalShippingServiceOption);
		}
	}
	
	if (item.mod.ItemSpecifics) {
		item.mod.ItemSpecifics.NameValueList
			= arrayize(item.mod.ItemSpecifics.NameValueList);
	}
	
	if (item.mod.Variations) {
		$.each(item.mod.Variations.Variation, function(idx, variation) {
			item.mod.Variations.Variation[idx].VariationSpecifics.NameValueList
				= arrayize(item.mod.Variations.Variation[idx].VariationSpecifics.NameValueList);
		});
	}
	
	var detail = $('div.detail', '#' + item.id);
	
	/* text */
	$.each($('input[type="text"][name^="mod"]', detail), function(i, form) {
		var formname = $(form).attr('name');
		formname = "['" + formname.replace(/\./g, "']['") + "']";
		try {
			eval('tmpvalue = item' + formname);
			if (tmpvalue == null) tmpvalue = '';
			tmpvalue = htmlencode(tmpvalue);
      
      if (tmpvalue != '') {
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
        .css('border', '1px solid #999')
        .html(tmpvalue);
      
      if ($(form).attr('name') == 'mod.Description') {
        $('div.description', detail).html(div);
      } else {
			  $(form).replaceWith(div);
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
						$(form).replaceWith('<img src="/icon/03/10/02.png"/>');
					}
				}
			} else {
				if (tmpvalue == $(form).val()) {
					$(form).replaceWith('<img src="/icon/03/10/02.png"/>');
				}
			}
			
		} catch (err) {
			var idforlabel = $(form).attr('id');
			$(form).replaceWith('<img src="/icon/03/10/04.png"/>');
			$('label[for="'+idforlabel+'"]').addClass('unchecked');
		}
	});
	$.each($('input[type=checkbox]', detail), function(i, form) {
		var idforlabel = $(form).attr('id');
		$(form).replaceWith('<img src="/icon/03/10/04.png"/>');
		$('label[for="'+idforlabel+'"]').addClass('unchecked');
	});
	
	/* PictureDetails */
	$('div.pictures form', detail).remove();
	$('input[type=file]', detail).remove();
	
	$('ul.pictures li:gt(0)', detail).remove();
	if (item.mod.PictureDetails) {
		$.each($(item.mod.PictureDetails.PictureURL), function (i, url) {
			var lidiv = $('ul.pictures li.template', detail).clone();
			$(lidiv).removeClass('template').addClass('pictureli');
      
			$('img', lidiv)
        .attr('data-url', url)
        .attr('src', '/image/?url=' + encodeURIComponent(url));
			
			$('a.deletepicture', lidiv).remove();
      
			$('ul.pictures', detail).append(lidiv);
		});
	}
	
  /* Variations.Pictures */
  if (item.mod.Variations && item.mod.Variations.Pictures) {
    $.each(item.mod.Variations.Pictures.VariationSpecificPictureSet, function(i, o) {
      
			$('div.VariationPictures'+i+' div.variationspecificvalue', detail)
				.html(item.mod.Variations.Pictures.VariationSpecificName + ':' + o.VariationSpecificValue);
			
			o.PictureURL = arrayize(o.PictureURL);
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
}

function fillformvalues(item)
{
	var id = item.id
	
	if (item.mod.ShippingDetails) {
		if (item.mod.ShippingDetails.ShippingServiceOptions) {
			item.mod.ShippingDetails.ShippingServiceOptions
				= arrayize(item.mod.ShippingDetails.ShippingServiceOptions);
		}
	}
	
	if (item.mod.ItemSpecifics) {
		item.mod.ItemSpecifics.NameValueList = arrayize(item.mod.ItemSpecifics.NameValueList);
	}
	
	// input, text, textarea
	$.each($('input[type="text"][name^="mod"], input[type="hidden"][name^="mod"], select, textarea[name^="mod"]', '#'+id), function(i, form) {
		var formname = $(form).attr('name');
		formname = "['" + formname.replace(/\./g, "']['") + "']";
		
		try {
			eval("var tmpvalue = item"+formname);
			
			if (formname == 'mod.Description') {
				console.log(tmpvalue);
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
	$.each($('input[type=checkbox]', '#'+id), function(i, form) {
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
	$('input[name$="@currencyID"]', '#'+id).each(function(i, o) {
		var currency = $('select[name="mod.Currency"]', '#'+id).val();
		if ($(o).val() == '') {
			$(o).val(currency);
		}
	});
	$('div.currencyID').html($('select[name="mod.Currency"]', '#'+id).val());
	
	/* ItemSpecifics Name */
	$('th input[name^="mod.ItemSpecifics.NameValueList"]', '#'+id).each(function(i, o) {
		$(o).hide();
		$(o).after($(o).val());
	});
	
	/* Pictures (duplicate code with showformvalues().) */
	if (item.mod.PictureDetails && item.mod.PictureDetails.PictureURL) {
		item.mod.PictureDetails.PictureURL = arrayize(item.mod.PictureDetails.PictureURL);
		
		$.each($(item.mod.PictureDetails.PictureURL), function (i, url) {
			var lidiv = $('ul.pictures li:first', '#'+id).clone();
			$(lidiv).removeClass('template').addClass('pictureli');
      
			$('img', lidiv)
        .attr('data-url', url)
        .attr('src', '/image/?url=' + encodeURIComponent(url));
      
			$('ul.pictures', '#'+id).append(lidiv);
		});
		$('ul.pictures', '#'+id).sortable({items: 'li.pictureli'});
	}
  
  /* VariationPictures */
  if (item.mod.Variations && item.mod.Variations.Pictures) {
		$.each(item.mod.Variations.Pictures.VariationSpecificPictureSet, function(i, o) {
			
			$('div.VariationPictures' + i + ' div.variationspecificvalue', '#'+id)
				.html(item.mod.Variations.Pictures.VariationSpecificName + ':' + o.VariationSpecificValue);
			
			o.PictureURL = arrayize(o.PictureURL);
			$.each(o.PictureURL, function(j, url) {
				var lidiv = $('div.VariationPictures'+i+' li.template', '#'+id).clone();
				$(lidiv).removeClass('template').addClass('pictureli');
				
				$('img', lidiv)
					.attr('data-url', url)
					.attr('src', '/image/?url=' + encodeURIComponent(url));
				
				$('div.VariationPictures'+i+' ul.variationpictures', '#'+id).append(lidiv);
			});
			
		});
		
		$('ul.variationpictures', '#'+id).sortable({items: 'li.pictureli'});
  }
	
  //$('input[name="setting.schedule_local"]', '#'+id).datetimepicker({dateFormat: 'yy-mm-dd'});
	
	return;
}

/* ItemSpecifics */
function setformelements_itemspecifics(item)
{
	if (item.mod.PrimaryCategory == undefined) {
		// todo: hide forms
		return;
	}
	
	// todo: not return when undefined. (show empty forms)
	//if (item.mod.ItemSpecifics == undefined) return;
	
	var detail = $('div.detail', '#'+item.id);
	$('table.ItemSpecifics', '#'+item.id).empty();
	
	var categoryid = item.mod.PrimaryCategory.CategoryID;
	var parentid = item.categorypath[item.categorypath.length-2];
  if (parentid == undefined) return;
	var category = hash[item.mod.Site]['Categories']['c'+parentid]['c'+categoryid];
	
	var specifics = new Array();
	if (item.mod.ItemSpecifics != undefined) {
		specifics = arrayize(item.mod.ItemSpecifics.NameValueList);
	}
	
  if (category.CategorySpecifics == undefined) return;
  if (category.CategorySpecifics.NameRecommendation == undefined) return;
  
	var recomm = arrayize(category.CategorySpecifics.NameRecommendation);
	
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
		var trtag = setformelements_itemspecifics_values(item.id,
																										 i,
																										 recomm[recommkey[specifics[i].Name]],
																										 specifics[i]);
		$('table.ItemSpecifics', detail).append(trtag);
	}
	
	/* Next, show remaining recommended specifics */
	var addspidx = specifics.length;
	for (i in recomm) {
		if (specificskey[recomm[i].Name] != null) continue;
		//if (recomm[i].ValidationRules.VariationSpecifics == 'Disabled') continue;
		
		var trtag = setformelements_itemspecifics_values(item.id,
																										 addspidx,
																										 recomm[i],
																										 null);
		
		$('table.ItemSpecifics', detail).append(trtag);
		
		addspidx++;
	}
	
	return;
  
} // function setformelements_itemspecifics()

function setformelements_itemspecifics_values(id, i, recomm, specific)
{
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
			
			var arrvr = arrayize(recomm.ValueRecommendation);
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
		
		$(tdtag).append('<pre>'+$.dump(recomm)+'</pre>');
		
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
  
} // function setformelements_itemspecifics_values()

function addimage(id, divclass, files) {
  
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
}

function extract_shippingtype(item)
{
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
}
