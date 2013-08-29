#!/bin/sh

/usr/bin/mongo --host 10.156.17.98 ebay /var/www/listers.in/sql/index.js
/usr/bin/mongo --host 10.156.17.98 ebay /var/www/listers.in/sql/summary.js
/usr/bin/mongo --host 10.156.17.98 ebay /var/www/listers.in/sql/listeditems.js
