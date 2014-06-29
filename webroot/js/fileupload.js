function addimage(id, divclass, files) {
    
	$.each(files, function(i, url) {
        
		var li = $('ul.pictures li.template', '#' + id + '-detail').clone();
        
		$(li).removeClass('template').addClass('pictureli');
        
		$('img', li)
            .attr('data-url', url)
            .attr('src', '/image/?url=' + encodeURIComponent(url));
        
		$('ul.' + divclass, '#' + id + '-detail').append(li);
        
	});
	
	return;
}

function csvuploadedmessage()
{
	$('#csvimportmessage').html('Imported. Please check "Saved" items on the left navigation');
}
