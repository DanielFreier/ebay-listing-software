#!/bin/sh

NOW=`date --utc '+%Y-%m-%d %H:%M:00'`

BASEDIR="$( dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" )"
DAEMONPORT=`grep daemonport $BASEDIR/config/config.xml | sed 's/[^0-9]//g'`

echo -e "AddScheduledItems\n2014-03-14 23:00:00\n2014-03-14 23:10:00" | nc localhost $DAEMONPORT
