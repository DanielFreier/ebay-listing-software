<%@ page contentType="text/html; charset=UTF-8" %>
<%@ taglib uri="/struts-tags" prefix="s" %>
<!DOCTYPE html>
<html>
<head>
<script type="text/javascript" src="/js/jquery-1.9.1.min.js"></script>
<script language="javascript">
<!--
$(function() {
  $('#loginform').submit();
});
-->
</script>
</head>
<body>

<div style="text-align:center; margin:50px;">
  Please wait...
</div>

<form id="loginform" method="post" action="/node/login">
  <input type="hidden" name="email" value="${user.email}" />
  <input type="hidden" name="password" value="${user.password}" />
</form>

</body>
</html>
