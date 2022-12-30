# deno

This is TypeScript Proxy, using deno.land

# Quick start

First step just install the deno binary

## Install

    curl -fsSL https://deno.land/x/install/install.sh | sh
    npm install -g localtunnel
    
<!-- ## Install 

    npm install --save-dev cookie
    npm install --save-dev set-cookie-parser -->

## Run 

Running with https tunnel from localtunnel

### CLI 1

    deno run --allow-all  main.ts

### CLI 2

    lt -p 8000


# Deploy

## Download deployctl

    deno install --allow-read --allow-write --allow-env --allow-net --allow-run --no-check -r -f https://deno.land/x/deploy/deployctl.ts

## Generate Token

Generate `DENO_DEPLOY_TOKEN` in https://dash.deno.com/account#access-tokens

## Go deploy

    export DENO_DEPLOY_TOKEN=ddp_JzCA4G55zqdcKVSnEyh4uCqZNFZjGB1DH8Px
    export PATH=$PATH:/home/codespace/.deno/bin
    deployctl deploy --project=whole-robin-81 main.ts
    
# Useful Reference 

    https://deno.land/manual@v1.29.1/node/cdns
    https://deno.com/deploy/docs/deployments
    https://examples.deno.land/
    https://deno.land/manual@v1.29.1/examples
    https://deno.land/x/wcookie@deno-pub-init
    https://deno.land/x/cookie_driver@0.2.0
