---
title: "ActivityPub 协议的简单实现"
date: "2023-01-11"
description: "我把我的博客搬进了联邦宇宙 (Fediverse) 。"
tags: blog, activitypub, fediverse, guide, ssg, serverless, openweb
---

> [!WARNING]
> 这不是一篇严肃的 ActivityPub 教程，仅仅是一些基于个人实现时的简单概括。该网站并不支持所有 ActivityPub 协议要求。由于联邦宇宙实例众多而本人服务器资源有源，笔者可能会关闭本站 ActivityPub 服务。

[Aaron Swartz 于十年前的这个时候自杀了](https://www.nytimes.com/2013/01/13/technology/aaron-swartz-internet-activist-dies-at-26.html)。他起草的 [RSS (1.0) 协议](https://web.resource.org/rss/1.0/)、[和 John Gruber 一起设计、创造的 Markdown](https://daringfireball.net/projects/markdown/) 至今一直拥有大量互联网用户。这十年间互联网并没有因他的离世而产生 Open Web 原教旨主义者所期待的愿景。类似「剑桥分析公司」的事情你我都有耳闻。万维网的发明人 Tim Berners-Lee 博士后来提出了 [SoLiD 项目](https://solidproject.org/) —— 通过将用户数据和应用彻底分离，来实现用户对自身数据的完全掌控。ActivityPub 协议与之类似，但仅面向社交网站。如今，[ActivityPub 已经成为了 W3C 的推荐标准](https://www.w3.org/TR/activitypub/)；Elon Musk 收购 Twitter 公司之后，由于 "Hardcore Software Engineering" 所展露出的负外部性，Mastodon (长毛象)成为了最火热的分布式/去中心化社交网络平台，而 Mastodon 正是 ActivityPub 的实现之一。这个 [Implementation Report](https://activitypub.rocks/implementation-report/) 页面展示了一些实现了 ActivityPub 协议的网站列表。

折腾了几天，终于在百忙之中将这个小小的网站基本实现了 ActivityPub 最主要的接口。下面简单梳理一下大致实现的 Server to Server 接口，这些接口对于一个静态博客足矣。

本站点实现 ActivityPub 的所有 REST API 均系由 ▲ Vercel Serverless Function (JavaScript) 驱动。

## WebFinger

此 API 的定义参考 [RFC 7033](https://www.rfc-editor.org/rfc/rfc7033.html)。这个 WebFinger 协议目的是提供一种针对单个域名的**用户发现**方式。考虑到此 API 必须使用 `Content-Type: application/jrd+json` 作为 HTTP 的报文响应类型，因此不推荐直接使用静态文件托管 JSON，请使用 REST API 来构建此实现。

```plaintext
https://example.com/.well-known/webfinger?resource=acct:lawrence@example.com
```

`subject` 中的 URI 内容后半段和电子邮件非常像 —— ActivityPub 最终的实现效果也和电子邮件类似！

```json
{
  "subject": "acct:lawrence@lawrenceli.me",
  "aliases": [],
  "links": [
    {
      "rel": "http://webfinger.net/rel/profile-page",
      "type": "text/html",
      "href": "https://lawrenceli.me/about"
    },
    {
      "rel": "self",
      "type": "application/activity+json",
      "href": "https://lawrenceli.me/api/activitypub/actor"
    }
  ]
}
```

`links` 中会添加上我们即将要实现的 Actor API。

**_除此 WebFinger 之外，以下所有 API 都必须设置 `Content-Type: application/activity+json` 作为响应头。ActivityPub 服务端（比如一个 Mastodon 实例）都会在请求头使用 `Accept: application/activity+json` 类似的形式来要求我们的实例返回对应的报文格式。_**

## Actor

Actor 就是 Activity 的参与者。WebFinger 会暴露此用户信息 (Profile) 接口。通过此 API，可以告知 ActivityPub 所有关于此用户的其他 API Endpoint，比如用户的 Outbox、Inbox、Followers 等等。所以这些 API 的具体 URL 都可以由自己去定义，而非一成不变。

除此之外，需要提供用户的 PublicKey 来验明身份。我们只需要在自己本地生成一对密钥就可以了。服务端通信中，发往不同 ActivityPub 的实例 HTTPS 请求都需要经过密钥加密。

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

```json
{
  "@context": ["https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1"],
  "id": "https://lawrenceli.me/api/activitypub/actor",
  "type": "Person",
  "name": "Lawrence Li",
  "preferredUsername": "lawrence",
  "summary": "Blog",
  "inbox": "https://lawrenceli.me/api/activitypub/inbox",
  "outbox": "https://lawrenceli.me/api/activitypub/outbox",
  "followers": "https://lawrenceli.me/api/activitypub/followers",
  "icon": ["https://lawrenceli.me/images/author/Lawrence.png"],
  "publicKey": {
    "id": "https://lawrenceli.me/api/activitypub/actor#main-key",
    "owner": "https://lawrenceli.me/api/activitypub/actor",
    "publicKeyPem": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0RHqCKo3Zl+ZmwsyJUFe\niUBYdiWQe6C3W+d89DEzAEtigH8bI5lDWW0Q7rT60eppaSnoN3ykaWFFOrtUiVJT\nNqyMBz3aPbs6BpAE5lId9aPu6s9MFyZrK5QtuWfAGwv9VZPwUHrEJCFiY1G5IgK/\n+ZErSKYUTUYw2xSAZnLkalMFTRmLbmj8SlWp/5fryQd4jyRX/tBlsyFs/qvuwBtw\nuGSkWgTIMAYV71Wny9ns+Nwr4HYfF5eo2zInpwIYTCEbil79HcikUUTTO/vMMoqx\n46IiHcMj0SPlzDXxelZgqm0ojK2Z7BGudjvwSbWq/GtLoaXHeMUVpcOCtpyvtLr2\nYwIDAQAB\n-----END PUBLIC KEY-----"
  }
}
```

## Outbox

类似 RSS/JSON Feed, 类型为 `OrderedCollection`，必须按照时间顺序将最新内容放在 `orderedItems` 的最前。

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://lawrenceli.me/api/activitypub/outbox",
  "summary": "Blog",
  "type": "OrderedCollection",
  "totalItems": 1,
  "orderedItems": []
}
```

OrderedItems 数组中的单个 Item (一般为 Note) 可以是如下形式：

```json
{
  "@context": ["https://www.w3.org/ns/activitystreams"],
  "id": "https://lawrenceli.me/blog/ssg-ssr",
  "type": "Note",
  "published": "Thu, 20 Feb 2020 00:00:00 GMT",
  "attributedTo": "https://lawrenceli.me/api/activitypub/actor",
  "content": "<a href=\"https://lawrenceli.me/blog/ssg-ssr\">When to Use Static Generation v.s. Server-side Rendering</a><br>SSG & SSR",
  "url": "https://lawrenceli.me/blog/ssg-ssr",
  "to": ["https://www.w3.org/ns/activitystreams#Public"],
  "cc": ["https://lawrenceli.me/api/activitypub/followers"]
}
```

在 ActivityPub 中，所有的对象都必须要提供一个 `id` 来作为唯一的全局标识符。而且，这个 id 必须是公开可访问的 URI，即可以通过此 id 来访问到此资源对象本身。 例上述如 Outbox 中的一项 Note 可以通过如下 curl 请求得到：

```bash
curl https://lawrenceli.me/blog/ssg-ssr -H "Accept: application/activity+json"
```

而如果你用浏览器直接打开这个 URL，你将会看到的是一个网页。原因就在于 `Accept` 这个请求头。

## Inbox

本质是一个必须支持 POST 请求的 WebHook。当联邦宇宙中其他用户对你的内容作出了一些交互(比如关注、回复、收藏、转发、删除等操作)，会触发此 WebHook。你需要根据 Activity 的类型去处理这些 Payload。一般来说，我们会使用自己的数据库来配合 Inbox Message 做 CRUD。

数据存在自己的数据库之后，你就可以直接在自己的站点上去展示它们。要保持数据于联邦宇宙中的一致性，你需要处理好所有消息类型，并做到接口的幂等 —— 因为 Mastodon 实例会有重试机制。

## Followers

关注者列表 API。当 Inbox 接收到来自其他用户的关注请求时，可以获取用户账户后保存到数据库然后通过此 API 展示出来。类型为 `OrderedCollection`。也是最简单的一个接口。

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "id": "https://lawrenceli.me/api/activitypub/followers",
  "type": "OrderedCollection",
  "totalItems": 1,
  "orderedItems": ["https://mstdn.social/users/lawrence"]
}
```

## Note / Article

需要针对实现 Outbox 中的每一个 `orderedItem` 的 `id` 中的 URI 实现一个 JSON 输出。形式可以和 Outbox 中单个 Item 保持一致。
除了 `Note` 之外，ActivityPub 可以有其他类型的资源，比如长文章的 `Article`、视频资源 `Video`。不同 ActivityPub 的实现平台对不同资源的展示方式不尽相同。

我的博客页面地址和对应 Activity ID 的 URI 在 URL 形式上保持了一致。因此在实现此 API 后，用户可以在任何 Mastodon 实例的搜索栏中通过搜索我的博客文章页地址来发现它对应的 Mastodon 贴文(由 Outbox 生成)；在完全实现 Inbox 后，对贴文的交互数据就能够展示在我的网站上。比如文章页面最下方的 `Replies`。

## To Do

我的站点没有完全实现所有 ActivityPub 协议，比如 Inbox 消息目前仅处理了 Create Note 和 Accept Follower，还有许多消息类型亟待实现；大部分接受 GET 请求的接口也应当适当配置缓存；Inbox 要严格验证发送者的密钥。

## 社区实现

很巧合地发现 Cloudflare 也在同一时间段开发了兼容 Mastodon 的 ActivityPub 实现：[WildeBeest](https://github.com/cloudflare/wildebeest)，有兴趣可以直接用他们的商业化技术栈来部署一个小型实例，或者直接参考他们的代码，用自己擅长的服务端语言实现自己的 ActivityPub。

<div>
  <github user="cloudflare" repo="wildebeest"></github>
</div>

## Ref

- <https://www.w3.org/TR/activitypub/>
- <https://blog.joinmastodon.org/2018/06/how-to-implement-a-basic-activitypub-server/>
- <https://s3lph.me/activitypub-static-site.html>
- <https://paul.kinlan.me/adding-activity-pub-to-your-static-site/>
