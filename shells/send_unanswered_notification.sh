#!/bin/sh

BASEDIR="$( dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" )"

cd $BASEDIR/node

node request.js
