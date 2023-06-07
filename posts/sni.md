---
title: "SNI & ECH"
date: "2023-06-01"
description: "Make the secure https protocol even more secure"
tags: template, blog, wip
visible: false
---

## What's SNI

Server Name Indication.

WireShack applying filter: `ssl.handshake.extensions_server_name`.
Check out the field with name `Server Name`

## ESNI & ECH

<https://blog.cloudflare.com/encrypted-client-hello/>

<https://datatracker.ietf.org/doc/html/draft-ietf-tls-esni-16>

## Chrome flag and DevTool

Enable on client side: `chrome://flags/#encrypted-client-hello`.

## DNS issue

ECH should work with some encryption of DNS queries, e.g.: DoH.

## CloudFlare Trace Endpoint

- <https://crypto.cloudflare.com/cdn-cgi/trace>
- <https://lawrenceli.me/cdn-cgi/trace>
