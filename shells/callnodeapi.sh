#!/bin/sh

BASEDIR="$( dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" )"
BASENAME=${BASEDIR/*\//}

cd $BASEDIR/node

node api.js $@
