#!/bin/sh

BASEDIR="$( dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" )"

cd $BASEDIR/logs/apicall/downloadFile

for filename in `ls *xml`
do
  count_a=`grep -c "<Recommendations>" $filename`

  site=${filename#*_}
  site=${site%.xml}
  
  count_b=`/usr/bin/mongo --quiet --host 10.146.14.171 ebay --eval="db.$site.CategorySpecifics.ready.count()"`
  
  echo "$site : $count_b / $count_a"
  
done
