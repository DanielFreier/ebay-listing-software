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
  
  $('.enablenotification').click(function() {
    
    var postdata = {
      callname: 'SetNotificationPreferences',
      email: $(this).attr('data-email'),
      username: $(this).attr('data-username')
    }
    
    $.post('/node/admin/callapi',
           postdata,
           function() {
           },
           'json');
    
    return false;
    
  });
  
  $('.disablenotification').click(function() {
    
    var postdata = {
      callname: 'SetNotificationPreferences',
      email: $(this).attr('data-email'),
      username: $(this).attr('data-username'),
      disable: true
    }
    
    $.post('/node/admin/callapi',
           postdata,
           function() {
             
           },
           'json');
    
    return false;
    
  });
  
  $('.getnotificationpreferences').click(function() {
    
    console.dir('click');
    
    $.post('/node/admin/callapi',
           {
             callname: 'GetNotificationPreferences',
             email: $(this).attr('data-email'),
             username: $(this).attr('data-username')
           },
           function() {
             console.dir('resp');
           },
           'json');
    
    return false;
    
  });
  
});
