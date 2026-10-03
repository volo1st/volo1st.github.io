#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $0 EMXX SIGNALSMITH_SOURCE OUTPUT_DIRECTORY" >&2
  exit 2
fi

emxx=$1
signalsmith_source=$2
output_directory=$3
wrapper_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$output_directory"

build_module() {
  local output_name=$1
  local export_name=$2
  shift 2

  "$emxx" "$wrapper_directory/offline-wrapper.cpp" \
    -o "$output_directory/$output_name.mjs" \
    -sEXPORT_NAME="$export_name" -DEXPORT_NAME="$export_name" \
    -I "$signalsmith_source" \
    -std=c++11 -O3 -ffast-math -fno-exceptions -fno-rtti \
    --pre-js "$wrapper_directory/pre.js" --closure 0 \
    -Wall -Wextra -Wfatal-errors -Wpedantic -pedantic-errors \
    -sSINGLE_FILE=1 -sMODULARIZE -sEXPORT_ES6=1 \
    -sENVIRONMENT=web,worker,shell -sNO_EXIT_RUNTIME=1 \
    -sFILESYSTEM=0 -sEXPORTED_RUNTIME_METHODS=HEAP8,UTF8ToString \
    -sINITIAL_MEMORY=512kb -sALLOW_MEMORY_GROWTH=1 \
    -sMEMORY_GROWTH_GEOMETRIC_STEP=0.5 -sABORTING_MALLOC=1 \
    -sSTRICT=1 -sDYNAMIC_EXECUTION=0 \
    "$@"
}

build_module SignalsmithStretchScalar SignalsmithStretchScalar
build_module SignalsmithStretchSimd SignalsmithStretchSimd -msimd128
