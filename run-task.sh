#!/bin/bash

set -e

export AWS_PROFILE=home

aws ecs run-task \
    --cluster default \
    --task-definition sample-task-ecs-family \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-067f31670ebd5f779,subnet-083ee9b9bc0113293],securityGroups=[sg-023a56a1fc16e2846],assignPublicIp=ENABLED}" \
    --launch-type FARGATE \
    --overrides '{"containerOverrides":[{"name":"sample-task-ecs-container"}]}' |\
    cat
