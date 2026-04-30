FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends \
    bash-completion \
    bubblewrap \
    ca-certificates \
    curl \
    git \
    jq \
    less \
    make \
    openssh-client \
    procps \
    socat \
    unzip \
    wget \
    zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*