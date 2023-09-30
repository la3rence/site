---
title: "CloudFlare"
themeColor: "#f88100"
date: "2023-06-11"
description: "一家免费提供 DDoS 防护的 CDN 厂商。"
tags: cloudflare, network, cdn, company, ddos, tls
---

CloudFlare 是一家在业内比较知名的 CDN 服务商，提供包含 DNS 解析、WAF 防火墙、CDN 加速、DDoS 防护，后续推出了一系列比较方便开发人员的许多功能：CloudFlare Workers、KV、Zero Trust Tunnel、WARP... 一切都是为了提供一个安全、快速的互联网环境。如果说 Vercel 给前端开发人员提供了基础设施，那 CloudFlare 则为数千万网站后端流量提供了基础设施。

今年年初，[Cloudflare 缓解了破纪录的 7100 万个请求/秒的 DDoS 攻击](https://blog.cloudflare.com/zh-cn/cloudflare-mitigates-record-breaking-71-million-request-per-second-ddos-attack-zh-cn/)。

## Vercel & CDN

三年前，我把我的博客从 WordPress 迁移到了 [Vercel](https://vercel.com)，老用户们或许都记得，那时候的域名可还都是 `*.now.sh`。初次使用 Vercel 的感受可以说是如获至宝，在今天看来可能显得很幼稚了——如果不是自己知道如何从 0 到 1 申请域名去部署一个全栈的 Web 项目的话，很难理解 Vercel 这种平台背后做了哪些复杂工作。这是我所理解的美国公司的一贯作法 —— 他们总是把庞大、精密、复杂的技术或基础设施掩盖在简约、优雅的产品外观之下。而我每次都会保持警惕和观察力，如果换我做，我怎么来实现？后来我便学习起了 Kubernetes。

说回 CloudFlare。从我第一次买域名（2015 年）一直到现在，我全部把解析权安排在 CloudFlare 上。归因于 [Vercel 的一次网络问题](https://isdown.app/integrations/vercel/incidents/50745-errors-accessing-from-china)，国内的网络受某种不可抗力在 2021 年的时候突然无法访问 Vercel 的部分域名了，尽管我的博客每天仅有为数不多的访客，但作为一个以中文为主的博客，还是有必要保持国内网络访问的畅通。根据官方提供的新的 CNAME 值，我在 CloudFlare 上更换了解析记录，也算顺利解决。也就在当时，我才注意到 DNS Records 控制台之前一个一直忽视的选项：

<figure>
  <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDQgMzkuNSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiM5OTk7fS5jbHMtMntmaWxsOiNmNjhhMWQ7fS5jbHMtM3tmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5Bc3NldCAxPC90aXRsZT48ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIj48ZyBpZD0iTGF5ZXJfMS0yIiBkYXRhLW5hbWU9IkxheWVyIDEiPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMDQgMjAuMTIgOTQgMTAuNjIgOTQgMTYuMTIgMCAxNi4xMiAwIDI0LjEyIDk0IDI0LjEyIDk0IDI5LjYyIDEwNCAyMC4xMiIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTc0LjUsMzljLTIuMDgsMC0xNS40My0uMTMtMjguMzQtLjI1LTEyLjYyLS4xMi0yNS42OC0uMjUtMjcuNjYtLjI1YTgsOCwwLDAsMS0xLTE1LjkzYzAtLjE5LDAtLjM4LDAtLjU3YTkuNDksOS40OSwwLDAsMSwxNC45LTcuODEsMTkuNDgsMTkuNDgsMCwwLDEsMzguMDUsNC42M0ExMC41LDEwLjUsMCwxLDEsNzQuNSwzOVoiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik01MSwxQTE5LDE5LDAsMCwxLDcwLDE5LjU5LDEwLDEwLDAsMSwxLDc0LjUsMzguNWMtNC4xMSwwLTUyLS41LTU2LS41YTcuNSw3LjUsMCwwLDEtLjQ0LTE1QTguNDcsOC40NywwLDAsMSwxOCwyMmE5LDksMCwwLDEsMTQuNjgtN0ExOSwxOSwwLDAsMSw1MSwxbTAtMUEyMCwyMCwwLDAsMCwzMi4xMywxMy40MiwxMCwxMCwwLDAsMCwxNywyMnYuMTRBOC41LDguNSwwLDAsMCwxOC41LDM5YzIsMCwxNSwuMTMsMjcuNjYuMjUsMTIuOTEuMTIsMjYuMjYuMjUsMjguMzQuMjVhMTEsMTEsMCwxLDAtMy42MS0yMS4zOUEyMC4xLDIwLjEsMCwwLDAsNTEsMFoiLz48L2c+PC9nPjwvc3ZnPg==" width="48px" height="48px"></img>
  <figcaption style="text-align: center">Proxied</figcaption>
</figure>

我好奇地把它启用了，即从灰色 `DNS only` 换成了这个橙色的 `Proxied`，那时我还没意识到，其实 CloudFlare 从那刻起已经完全接管了我的网站的全部流量并进行任播 (Anycast)；换句话说，我在现有的 Vercel CDN 之上，又套了一层 CloudFlare CDN。是的，这迎来了两个问题：

1. Vercel 后台警告 CNAME 解析异常
2. 缓存时间问题
3. 客户端 IP 全部被识别 CloudFlare IP，所有发往 Vercel 的请求都会从 CloudFlare 数据中心发出

不可能没人像我这样做吧？事实上，[Vercel 并不推荐在其基础上使用另一层 CDN](https://vercel.com/guides/why-running-another-cdn-on-top-of-vercel-is-not-recommended)。后续我也依次找寻到了解决方案：对于 CNAME 来说，Vercel 会定时访问网站跟路径下的 `.well-known` 路径下的资源来识别包括 CNAME、HTTPS 证书这类配置验证网站控制权信息，因此我们可以直接在 CloudFlare 的 WAF 中，把这类路径作为白名单让 WAF 跳过其他安全规则直接放行。对于客户端 IP，可以参考 [Available Managed Transforms](https://developers.cloudflare.com/rules/transform/managed-transforms/reference/)，将一些客户端原始信息置于请求头中。缓存时间方面，还是要熟悉 MDN 上的一些标准 HTTP 协商协议，细粒度地对不同资源设置不同的 TTL，尽可能发挥 CloudFlare CDN 和浏览器自身缓存的优势 - 一个博客而已，是不是有点大炮打蚊子了？

CloudFlare 的整体防御从 L3 到 L7，遍布了所有能覆盖的防御范围。一个请求进入 CloudFlare 所代理的网站流量会经历顺序由上到下：

| Traffic Sequence in CloudFlare |
| :----------------------------: |
|              DDoS              |
|          URL Rewrites          |
|           Page Rules           |
|          Origin Rules          |
|          Cache Rules           |
|      Configuration Rules       |
|         Redirect Rules         |
|        IP Access Rules         |
|              Bots              |
|              WAF               |
|      Header Modification       |
|             Access             |
|            Workers             |

这些流量经过内部的层层筛选，以及我们自己定义的一些 Rule，最终反代到源站。因此，在决定使用任何 CDN 产品的时候，有必要将服务端源站 IP 妥善隐藏，尽可能不暴露任何历史解析值，否则一切防御都是徒劳。如果源站 IP 已经暴露，只能及时更换新的地址。在新的规则录入好后，CloudFlare 的全球网络会立刻应用规则并实时生效，这里或多或少要归功于大佬 [agentzh 章亦春](https://mp.weixin.qq.com/s/xfphy67PTbtjeggo7LpjSA) 开源的高性能网关 [OpenResty](https://openresty.org/cn/)。

## CloudFlare Workers & Serverless

我们可以将一个个「函数」部署在公有云的「边缘计算节点」之上，并暴露 Socket 给这些节点上的函数，来实现无需忽略底层服务器，直接部署可随意伸缩的 HTTP 服务的能力。当然，这要求这些函数尽可能无状态。在没有任何请求，闲置一定时间时，这些函数进程会直接消失以腾出计算资源，直到下次事件驱动它们迅速重新启动并继续提供服务。这便是老生常谈的 Serverless。

初次了解 Serverless 也是非常惊讶。AWS Lambda 竟能将 function 如此商业化 (FaaS)，Vercel 在此之上也做到了开箱即用。借助 CloudFlare 现有的数据中心，CloudFlare 也推出他们的 Serverless 解决方案 - [CloudFlare Workers](https://blog.cloudflare.com/introducing-cloudflare-workers/)。不同的是，CloudFlare Workers 相比原始的 Vercel Serverless Function 而言能够做 Server Sent Event、WebSocket 这类支持长连接的请求。尽管后续 Vercel Edge Function 也能实现，但是它能支持的 Node.js Module 实在太少了。（作者注：后来我才了解到 Vercel Edge Function 其实构建于 CloudFlare Workers 之上）

前不久，CloudFlare [开源了 Workers 运行时 workerd](https://blog.cloudflare.com/workerd-open-source-workers-runtime/)。

<div>
  <github user="cloudflare" repo="workerd"></github>
</div>

CloudFlare Workers 有许多应用场景。比如实现一个简单的[短 URL 重定向服务](https://lucjan.medium.com/free-url-shortener-with-cloudflare-workers-125eaf87b1ec)、[GitHub Proxy](https://github.com/hunshcn/gh-proxy)、以及一大堆各自实现的 ChatGPT API Proxy...方便了太多国内用户。

Node.js 作者 Ryan Dahl 这几年给 JavaScript 写的另一个全新运行时 [Deno 也有类似的 Serverless 服务](https://dash.deno.com)，体验也很友好，同样[支持 Web Standard API](https://twitter.com/lawrenceli75/status/1642798082294251520)。

为了实现 Serverless 的更多数据持久化功能，他们也各自推出了自家的 KV 存储实现服务，或者说是 Serverless 数据库。

## CloudFlare 在 TLS 协议上的努力

### Client Hello - SNI

再来谈谈技术方面的一些进展。很多读者都知道 Server Name Indication（服务器名称指示，SNI）的存在，它是 TLS/SSL 协议在最初的 Client Hello 阶段由客户端发往服务端的一个字段，内容是网站的主机名或域名。引用 CloudFlare 的形象解释：

> SNI 有点像邮寄包裹到公寓楼而不是独栋房子。将邮件邮寄到某人的独栋房子时，仅街道地址就足以将包裹发送给收件人。但是，当包裹进入公寓楼时，除了街道地址外，还需要公寓号码。否则，包裹可能无法送达收件人或根本无法交付。许多 Web 服务器更像是公寓大楼而不是独栋房子：它们承载多个域名，因此仅 IP 地址不足以指示用户尝试访问哪个域名.....当多个网站托管在一台服务器上并共享一个 IP 地址，并且每个网站都有自己的 SSL 证书，在客户端设备尝试安全地连接到其中一个网站时，服务器可能不知道显示哪个 SSL 证书。这是因为 SSL/TLS 握手发生在客户端设备通过 HTTP 指示连接到某个网站之前。

有点类似于 HTTP 协议中的 `Host` 请求头（如果在同一台服务器上用 Nginx 配置过多个虚拟主机应该都熟悉），但是 SNI 是作用在 L4，而且在 TCP 握手前完成。起初它并不是 TLS 协议的一部分，最早在 2003 年作为扩展字段增加到 TLS 协议中 ([RFC 6066](https://datatracker.ietf.org/doc/html/rfc6066#section-3))。现代浏览器等客户端都早已支持这个字段。我们会发现一个细节问题，对基于同一 CDN 的网站的 HTTPS 请求，我们传入的 TLS `SNI` 和 HTTP Header `Host` 会有不一致的情况，在不严格校验 SNI 的情况下，这类请求有可能被路由到 `Host` 所定义的主机上，本质也就无视了 `SNI`，因此对于某些防火墙来说，由于它们能通过 SNI 来侦测到用户所请求的 HTTPS 站点，它们无法得到后续 TLS 握手后的 HTTP 报文内容，在客户端更换了 Header `Host` 后，实际返回的 HTTP 报文内容其实已被调包 —— 这种攻击方式，或者说叫伪装方式被称为[域前置(Domain Fronting)](https://zh.wikipedia.org/zh-cn/%E5%9F%9F%E5%89%8D%E7%BD%AE)技术。CloudFlare、CloudFront 都会校验二者的一致性返回 403，但依然有部分 CDN 对这一做法采取保留，比如 Fastly。

我们可以用 WireShack 抓包获取到 `SNI` 字段。应用这个过滤条件 `ssl.handshake.extensions_server_name`，尝试抓包发送一次 TLS 请求

```sh
openssl s_client -connect lawrenceli.me:443 -servername lawrenceli.me -state -debug < /dev/null
```

![SNI](/images/cloudflare/sni-field.png)

可以从结果看出，SNI 确实使用了明文进行传输，这就导致了前文提到的一个问题 - 就算经过 TLS/HTTPS 加密的流量，仍然明文地暴露了我们在访问的域名。「这又如何？DNS 不也暴露了嘛？」好问题 - DoH 解决了 DNS 请求的明文风险 ([RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484))。因此，实际上 TLS 目前唯一在数据上有泄密风险的就只有这个字段了。CloudFlare 先后搬出了两个解决方案：[ESNI](https://www.cloudflare-cn.com/learning/ssl/what-is-encrypted-sni/) 以及 [ECH](https://blog.cloudflare.com/encrypted-client-hello/)。

我们可以使用 Chrome 的开关 `chrome://flags/#encrypted-client-hello` 来开启浏览器 ECH 的客户端支持。通过 Chrome DevTool 的 Security Tab 能够查看 HTTPS 流量的安全性信息。我们可以通过[这个链接](https://crypto.cloudflare.com/cdn-cgi/trace)来测试客户端对这个方案的支持情况，当然，这些需要服务端做相应的配置才能完全启用。话题就此结束，我不能再细说了。

Updated：[2023 年 9 月底，Cloudflare 宣布向所有基于 TLS 1.3 的代理站点启用 ECH](https://blog.cloudflare.com/announcing-encrypted-client-hello/)，目前默认全部启用且改选项不可关闭。

### Client Hello - JA3

利用 Client Hello 来做安全保护的另一个实践是 TLS 客户端指纹: JA3 & JA3S。这一设计灵感来源于信息安全专家 Lee Brotherston 的研究 [TLS fingerprinting](https://blog.squarelemon.com/tls-fingerprinting/)。

具体的工程实践可以参考 [Salesforce 开源的 JA3](https://github.com/salesforce/ja3).

<div>
  <github user="salesforce" repo="ja3"></github>
</div>

简而言之，TLS 握手过程中客户端发送的字节数组，也就是 Client Hello 阶段的一些字段和扩展名，通过固定方式拼接，基于摘要 MD5 来生成一个唯一的字符串，称为 JA3 指纹。不同的浏览器或 TLS 客户端有不同指纹。在大量的数据采样中，CloudFlare 就能够基于此数据 (JA3 & JA3S，后者包含了 Server Hello 阶段的服务端指纹) 统计出哪些请求来自于僵尸网络、机器人爬虫、Python 库还是正常用户的浏览器、或者手机访问。这也就解释了很多同学写爬虫时，利用 HTTP 协议更换 `User-Agent` 这一请求头无效的情况，因为 CloudFlare 的防御处在更底层的 L4 TLS 阶段。ChatGPT 的 Web 端也部署了 [CloudFlare 的 TLS JA3 指纹鉴定 WAF (仅限 Enterprise 账户)](https://developers.cloudflare.com/bots/concepts/ja3-fingerprint/)；GitHub 上我也找到了相关的代码实现通过更换 TLS Client 的方式来绕过这一防御。对于多数人来说，这已经有很大的防爬门槛了；而且 CloudFlare 可以随时更换 WAF 策略让旧的指纹失效。

JA3 由来自 salesforce 的三位工程师共同实现：John Althouse, Jeff Atkinson & Josh Atkins。看到这里，想必你也知道为什么 JA3 叫 `JA3` 了。

## 盈利模式

和 Vercel，Netlify 如出一辙，Cloudflare 采用「免费试用，付费增值」的商业模式。CloudFlare CEO Matthew Prince 曾在 StackOverflow 上回答过这个问题：「[How can CloudFlare offer a free CDN with unlimited bandwidth?](https://webmasters.stackexchange.com/questions/88659/how-can-cloudflare-offer-a-free-cdn-with-unlimited-bandwidth)」：

- 更多的免费用户意味着更多的数据，这些数据能更好地帮助保护付费用户
- 很多大客户的来源正是由于这些公司的员工是 CloudFlare 的免费用户，他们在工作中向公司推荐了 CloudFlare
- 免费这一举措就是在做宣传，可以减少招聘成本，能雇到全球最厉害的工程师
- 免费用户体验新功能的同时也能就帮助了这个新功能的测试，缩短了迭代周期
- 带宽成本的鸡生蛋、蛋生鸡问题：用户数量庞大才能在面对全球各地的电信营运商时有议价权

2019 年，CloudFlare 在纽交所上市，股票代码：NET。发行价 US $15，目前 US $63，上涨了 320%。画外音：现在买它还来得及吗？

在中国目前和京东云合作，仅限企业用户。500 强企业中目前有三分之一使用 CloudFlare，还有很多上升空间。OpenAI 的 [ChatGPT](https://chat.openai.com) 上线后，CloudFlare 获得了大量曝光，防御了大量滥用用户和潜在威胁请求。

## 价值观

CloudFlare 因坚持网络中立原则受到了一些批评。

比较典型的一件事是 CloudFlare 因舆论和法律的压力[终止对 8chan 的服务](https://blog.cloudflare.com/zh-cn/terminating-service-for-8chan-zh-cn)。CloudFlare 声称自己是一家私营公司，并且 CloudFlare 半数营收来自于美国之外的地区，可以不受美国宪法第一修正案的约束，其服务的客户对象是整个互联网市场。由于业务量大，有些包含恐怖主义、仇恨言论的网站也免不了会使用其服务。这也是大多数大型互联网公司所面临的问题。和快播王欣事件类似，他们都不愿扮演内容仲裁者。互联网诞生至今，法律的步伐总是跟不上技术的发展。

## 尾声

OpenAI 的 ChatGPT 对 CloudFlare 作了一次很好的展示，我向读者推荐 CloudFlare。一方面是因为它一直提供永久的个人免费服务，另一方面是它的易用性以及全球视野。我也用过国内某厂商的 WAF 产品，界面纷繁错乱，一看账单都不知道为什么收费，套路太深，价格高昂（可能怪我太穷）。
