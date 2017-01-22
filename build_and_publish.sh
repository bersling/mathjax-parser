#!/usr/bin/env bash
python build.py
git add --all
git commit -m 'fix'
git tag -a ${1} -m "${1}"
git push --tags
git push