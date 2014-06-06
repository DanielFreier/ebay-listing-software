#!/bin/sh

YYYYMMDD=`date --utc '+%Y-%m-%d'`

node /var/www/listers.in/node/addscheduleditems.js \
    | grep -v '=' \
    >> /var/www/listers.in/logs/scheduled.$YYYYMMDD

exit
