FROM alpine:latest

RUN apk upgrade \
  && apk update \
  && apk add binutils git

RUN git clone https://github.com/aws/efs-utils

RUN mkdir /app

WORKDIR /app

# Dockerfileのビルド前の書き込みは可能
RUN echo hello > hello.txt

# AWS ECSタスクとして実行する際の書き込みは不可
# https://ap-northeast-1.console.aws.amazon.com/ecs/home?region=ap-northeast-1#/clusters/default/tasks/80889c889f8f451ab280964a60bfa7db/details
# ENTRYPOINT ["ash", "-c", "echo hello > hello.txt && cat hello.txt"]

# efs を使用
# ENTRYPOINT ["ash", "-c", "echo hello > /mnt/efs/hello.txt"]

ENTRYPOINT ["ls", "/mnt/efs"]
