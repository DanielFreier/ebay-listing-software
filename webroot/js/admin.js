$(function() {
  
  $('a.delete').bind('click', function() {
    
    if (!confirm('delete?')) return false;
    
    var id = $(this).attr('data-id');
    
    $.post('/admin/deleteuser',
           'id='+id,
           function(data) {
             
           },
          'json');
    
    return false;
  });
  
  $('button', '#apicallbuttons').click(function() {
    
    var postdata = 'callname=' + $(this).html();
    
    $.post('/node/admin/callapi',
           postdata,
           function() {
             
           },
           'json');
    
    return false;
  });
  
  $('#notify').click(function() {
    
    var postdata = 'callname=test';
    
    $.post('/page/receivenotify',
           postdata,
           function() {
             
           },
           'json');
    
  });
  
});
