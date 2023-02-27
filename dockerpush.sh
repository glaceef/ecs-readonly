#!/bin/bash

set -e

export AWS_PROFILE=home

DOCKER_IMAGE_NAME=437307506719.dkr.ecr.ap-northeast-1.amazonaws.com/sample-task:latest

aws ecr get-login-password --region ap-northeast-1 | \
    docker login --username AWS --password-stdin 437307506719.dkr.ecr.ap-northeast-1.amazonaws.com

docker build -t $DOCKER_IMAGE_NAME - < Dockerfile

docker push $DOCKER_IMAGE_NAME
