#!/bin/sh

/usr/bin/mongo --host 10.146.14.171 ebay /var/www/listers.in/sql/index.js       > /dev/null
/usr/bin/mongo --host 10.146.14.171 ebay /var/www/listers.in/sql/summary.js     > /dev/null
/usr/bin/mongo --host 10.146.14.171 ebay /var/www/listers.in/sql/listeditems.js > /dev/null
/usr/bin/mongo --host 10.146.14.171 ebay /var/www/listers.in/sql/unanswered.js  > /dev/null
