#!/bin/sh

/usr/local/mongodb/bin/mongo --host 10.156.17.98 ebay /var/www/listers.in/sql/index.js

/usr/local/mongodb/bin/mongo --host 10.156.17.98 ebay /var/www/listers.in/sql/summary.js

/usr/local/mongodb/bin/mongo --host 10.156.17.98 ebay /var/www/listers.in/sql/listeditems.js
