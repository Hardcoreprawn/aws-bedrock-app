FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

ARG TERRAFORM_VERSION=1.8.5

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
        && ARCH="$(dpkg --print-architecture)" \
        && case "${ARCH}" in \
                amd64) TERRAFORM_ARCH="amd64" ;; \
                arm64) TERRAFORM_ARCH="arm64" ;; \
                *) echo "Unsupported architecture: ${ARCH}" && exit 1 ;; \
            esac \
        && curl -fsSL -o /tmp/terraform.zip "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_${TERRAFORM_ARCH}.zip" \
        && unzip -o /tmp/terraform.zip -d /usr/local/bin \
        && rm -f /tmp/terraform.zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*