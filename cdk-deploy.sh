#!/bin/bash

set -e

cd cdk/

AWS_PROFILE=home cdk deploy \
    --require-approval never
