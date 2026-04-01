# Custom Domain Setup (Cloudflare + GitHub Pages)

Domain target:

- Apex: goldenseallifesciences.com
- Subdomain: www.goldenseallifesciences.com

## What is already configured in this repository

1. Root CNAME file exists with:

- goldenseallifesciences.com

2. GitHub Pages workflow is configured to build with base href `/` whenever CNAME exists.

3. Canonical + OG URL in `src/index.html` are set to apex domain.

## Cloudflare DNS records to add

Set all records to **DNS only** during setup.

### Required

- Type: A
  - Name: @
  - IPv4 address: 185.199.108.153

- Type: A
  - Name: @
  - IPv4 address: 185.199.109.153

- Type: A
  - Name: @
  - IPv4 address: 185.199.110.153

- Type: A
  - Name: @
  - IPv4 address: 185.199.111.153

- Type: CNAME
  - Name: www
  - Target: Mr-Jerry-Haxor.github.io

### Optional IPv6

- Type: AAAA
  - Name: @
  - IPv6 address: 2606:50c0:8000::153

- Type: AAAA
  - Name: @
  - IPv6 address: 2606:50c0:8001::153

- Type: AAAA
  - Name: @
  - IPv6 address: 2606:50c0:8002::153

- Type: AAAA
  - Name: @
  - IPv6 address: 2606:50c0:8003::153

## GitHub Pages settings

In repository Settings -> Pages:

1. Custom domain: goldenseallifesciences.com
2. Enable Enforce HTTPS after domain verifies.

## Validation checklist

1. Push the latest commit to master/main and wait for Pages workflow completion.
2. Confirm `https://goldenseallifesciences.com` loads.
3. Confirm `https://www.goldenseallifesciences.com` resolves and redirects/serves correctly.
4. Keep Cloudflare records as DNS only until SSL and redirects are stable.

## Recommended redirect strategy

Use apex as canonical host:

- Canonical URL: https://goldenseallifesciences.com

If needed later, add Cloudflare Redirect Rule:

- If host equals www.goldenseallifesciences.com
- Forwarding URL 301 to https://goldenseallifesciences.com/$1
