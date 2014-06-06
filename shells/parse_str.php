<?php
require_once('MimeMailParser.class.php');

$file = '/var/www/listers.in/logs/apicall/downloadFile/admin@listers.in_US.raw';

parse_str(file_get_contents($file), $params);

echo print_r($params, true);

