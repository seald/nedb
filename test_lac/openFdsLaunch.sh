#!/bin/sh
ulimit -n 128
ts-node ./test_lac/openFds.test.ts
