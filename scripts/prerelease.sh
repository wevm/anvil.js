#!/usr/bin/env bash

# Check if the script was called with exactly one argument
if [ $# -ne 1 ]; then
    echo "Usage: $0 [package.json]"
    exit 1
fi

pkg=$1

# Check if the argument is a file that exists and is named package.json
if [ ! -f "$pkg" ] || [ $(basename "$pkg") != "package.json" ]; then
    echo "$pkg is not a valid package.json file."
    exit 1
fi

# Create a backup of the original package.json file.
mv "$pkg" "$pkg.bkp"

# Pick the desired properties and delete all null values.
jq '{ 
  "name": .name,
  "description": .description,
  "version": .version,
  "license": .license,
  "authors": .authors,
  "repository": .repository,
  "keywords": .keywords,
  "main": .main,
  "module": .module,
  "types": .types,
  "typings": .typings,
  "sideEffects": .sideEffects,
  "exports": .exports,
  "typesVersions": .typesVersions,
  "dependencies": .dependencies,
  "peerDependencies": .peerDependencies,
  "files": .files
} | del(..|nulls)' "$pkg.bkp" > "$pkg"
