---
title: "如何简单实现 ActivityPub 协议"
date: "2023-01-11"
description: "是时候进驻联邦宇宙 (Fediverse) 了。"
tag: blog, activitypub, fediverse, guide, ssg, serverless, openweb
visible: false
---

[Aaron Swartz 于十年前的今天自杀了](https://www.nytimes.com/2013/01/13/technology/aaron-swartz-internet-activist-dies-at-26.html)。他起草的 [RSS (1.0) 协议](https://web.resource.org/rss/1.0/)、[和 John Gruber 一起设计、创造的 Markdown](https://daringfireball.net/projects/markdown/) 至今一直拥有大量互联网用户。这十年间互联网并没有因他的离世而产生任何 Open Web 原教旨主义者所期待的现状。类似「剑桥分析公司」的事情你我都有耳闻。万维网的发明人 Tim Berners-Lee 博士后来提出了 [SoLiD 项目](https://solidproject.org/) —— 通过将用户数据和应用彻底分离，来实现用户对自身数据的完全掌控。ActivityPub 协议与之类似，但仅面向社交网站。如今，[ActivityPub 已经成为了 W3C 的推荐标准](https://www.w3.org/TR/activitypub/)；Elon Musk 收购 Twitter 公司之后，由于 "Hardcore Software Engineering" 所展露出的负外部性，Mastodon (长毛象)成为了最火热的分布式社交网络平台，而 Mastodon 正是 ActivityPub 的实现之一。这个 [Implementation Report](https://activitypub.rocks/implementation-report/) 页面展示了一些实现了 ActivityPub 协议的网站列表。

折腾了两三天，终于在百忙之中将这个小小的网站基本实现了 ActivityPub。下面简单梳理一下大致实现的几个重要接口，这些接口对于一个静态博客足矣。
另外，本站点所有 REST API 均系由 Vercel Serverless Function 驱动。

## WebFinger

此 API 的定义参考 [RFC 7033](https://www.rfc-editor.org/rfc/rfc7033.html)。考虑到必须使用 `Content-Type: application/jrd+json` 作为 HTTP 的报文响应类型，因此不推荐直接使用静态文件托管此 API，请使用 REST API 来构建此实现。

```txt
https://example.com/.well-known/webfinger?resource=acct:lawrence@example.com
```

这个 WebFinger 协议目的是提供一种针对单个域名的**用户发现**方式。`subject` 中的 URI 内容后半段和电子邮件非常像 —— ActivityPub 最终的实现效果也和电子邮件类似！

```json
{
  "subject": "acct:lawrence@example.com",
  "links": [
    {
      "rel": "http://openid.net/specs/connect/1.0/issuer",
      "href": "https://openid.example.com"
    }
  ]
}
```

`links` 中会添加上我们即将要实现的 Actor API。

**_除此 WebFinger 之外，以下所有 API 都必须设置 `Content-Type: application/activity+json` 作为响应头。ActivityPub 服务端（比如一个 Mastodon 实例）都会在请求头使用 `Accept: application/activity+json` 类似的形式来要求我们的实例返回对应的报文格式。_**

## Actor

就是用户信息接口；因为大家都是演员。
通过此 API，可以告知 ActivitiPub 所有关于此用户的其他 API Endpoint。比如用户的 Outbox、Inbox 等等。所以这些 API 的 URL 都可以由自己去定义，而非一成不变。

## Outbox

类似 RSS/JSON Feed。需配合 Note 这类资源 API。

## Inbox

一个仅支持 POST 请求的 WebHook。当联邦宇宙中其他用户对你的内容作出了一些交互，会触发此 WebHook。你需要去处理这些 Payload。一般来说，我们会使用自己的数据库来配合 Inbox Message 做 CRUD。

## Followers

关注者列表 API。

## Note

贴文细节。

## To Do

- like
- reply
- delete
