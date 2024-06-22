---
title: "写在 2022 年末"
date: "2022-12-17"
description: "2022 回顾"
tags: review, 2022
---

## Tech

技术方面今年依旧学习了很多新的内容。

首先从 0 到 1 使用 Next.js 重构了此 lawrenceli.me 的整个站点。由原先基于 Notion 私有 REST API 的 hacking 方式换成基于纯 Markdown 文本的 SSG（静态页面生成）和 ISR （增量静态再生成）并完成了几乎没有太多压力的 [Next.js 13 升级](https://nextjs.org/docs/upgrading#upgrading-from-12-to-13)。所有文章内容均和代码共存，这样能在所有页面上自由发挥，甚至可以在纯 Markdown 文件中直接使用 React/JSX 组件（基于 HTML 抽象语法树 - AST）。依赖的版本也基于 GitHub 自动的 PR 保持了最新。 React/JSX 写的也比去年熟练多了。
另外简单研究了一下 TailWind CSS，上手很快，也在此站点上用上了。

[Node.js 模版项目](https://github.com/la3rence/node-express-example) 完工，一个快速使用 JavaScript 开发 REST API 的脚手架项目，各种测试、CI/CD、Code Coverage、日志、Open API (Swagger)、JWT 等基础设施都加上了。摒弃了古老的 CommonJS 而基于纯 ES Module。

<div>
  <github user="la3rence" repo="node-express-example"></github>
</div>

[WebSocket Cluster](https://github.com/la3rence/websocket-cluster) 项目在 GitHub 上也快到达 100 stars 了，每周都会看到一两个国人参考我那很久没维护但精妙绝伦的代码。

年底 Spring 6 和 [Spring Boot 3 的 GA](https://spring.io/blog/2022/11/24/spring-boot-3-0-goes-ga) 同样令人欣喜。我们终于可以基于 GraalVM 的 AOT 去做 Spring Native on Cloud Native 了。JDK 8 仍有接近 7 年的寿命。JDK 17 的 ZGC 是最值得研究学习的，另外下个 JDK LTS (JDK 21?) 应该会让协程 (虚拟线程) GA，目前仍在孵化阶段。学 JavaScript / TypeScript 就是玩玩，真正企业级大型项目还得看 Java。为什么这么说，你去看看 [Nest.js](https://docs.nestjs.com/controllers) 就知道了。

另外又用上了一个比较简单可靠的托管服务（关键是免费）：[fly.io](https://fly.io/)，除常规项目外，它可以部署 Docker 容器，并提供大概 3 GB 额度的免费磁盘挂载。大多静态页面和轻量 Serverless 都依赖 Vercel 或 Cloudflare Workers，一旦遇到需要更加复杂的场景（比如 WebSocket 或 SSE），我会选择使用 fly.io 来部署。

Solidot Robot 已稳定运行将近一千天了，目前依旧基于 Vercel Serverless Function。异常稳定。[Solidot](https://www.solidot.org/) 依旧是我每天都会逛的科技新闻源。

## Work

公司内的 OpenShift 今年并没有花太多时间研究，权限、开发环境问题无法在本地快速调试容器。当然我依旧对 Kubernetes 保持高昂的学习热情，并用半个工作日的时间完成公司对所有开发人员提供的 immersive training。

我对所在团队 (CVA Trading Desk[^1] in XVA) 的业务有了一定的认知：
CVA Trading Desk 其实是一家内部保险公司。负责保障 Business Line Trading 在 couterparty (交易对手) 有可能失信、违约的风险下，可以得到来自 CVA Trader 专门针对此 couterparty 的风险做 Hedge 交易而得到的利润补偿；当然 Business Line Trader 会向我们 CVA Desk 定期支付保险费用。

![CVA Desk](/images/2022-in-review/cva-desk.gif)

每天有数以百计的 Batch Job 去处理这些 Trade 数据。最累的还是作为一个开发去解决各种突如其来的 production issue。

## Life

### WFH & COVID

新冠瘟疫给我带来的除了处于长期封控下的 WFH，~~没有额外影响~~。我可能是相对幸运的一批了 —— 从未因此损失什么，反而得出了类似「[草台班子](/blog/makeshift-troupe/)」的观点。

经历上海的封控后，我现在已经会炒相对好吃一点的蛋炒饭了。还给前不久程序员做饭指南 How to Cook 出圈之前贡献了一份[可乐鸡翅的 PR](https://github.com/Anduin2017/HowToCook/pull/159)。我发现中国人花在食物烹饪的时间成本上有点高，我依然点了不少的外卖。等各方面条件具备后我会尽可能花少的时间做简单的西餐来替换现有的饮食方式、并持续减少盐分、高油脂的摄入。

2022-12-27 后续更新: 发布此文后一周，我感染了新冠病毒。多次高烧突破 40 度，目前仍有些许低烧、乏力、困倦、多汗，并几乎同时丧失了味觉和嗅觉。我的父母也几乎同步感染，尽管我目前和他们不生活在一起。和多数人一样，可能是有生之年最痛苦的一次发烧经历。

### Music

周杰伦的今年新专马马虎虎。力荐的那当然是今年 The 1975 的新专 [_Being Funny In A Foreign Language_](https://music.163.com/#/album?id=153050699)。另外附上 Matty 在 Apple Music 的真诚采访：

<div>
  <bilibili bv="BV1Xe41137fJ"></bilibili>
</div>

### Movie

毕业后的这几年看观影、观剧的时间不那么充裕了。今年相对好了一点，但在豆瓣也仅标记了 20 多部。漫威自从复联四结束后最近这两年口碑有点差了，《雷神 4》拍得稀烂，希望来年有新的精彩故事线。今年看的比较好的商业片里印象深刻的有：《瞬息全宇宙》《壮志凌云 2：独行侠》《投行风云》《西线无战事》以及三季《Barry / 巴瑞》，尤其是这部 HBO 的犯罪片，讲述退役兵逐梦演艺圈的故事，很久都没有两三天一口气刷完好几季的感觉了，现在无比期待 2023 年的第四季。

<div>
  <douban id="26707518"></douban>
  <douban id="3042261"></douban>
</div>

## Things

软件领域，我把我常用的《极光词典》换成了《欧路词典》，导入了 iOS 内置的 mdx 词库文件。理由是《极光词典》不具备单词本功能，复习新单词无任何操作入口，但我仍然保留了它，因为作为词典这种功能型应用，已然完全胜出市面 99% 的同类产品了。

效率工具方面接下来我会重点去使用 [Retool](https://retool.com/) 开发一套自己的 Workflow，类似于 IFTTT 的平台但复杂度比 IFTTT 高许多。搜索领域我开始用了 ChatGPT Chrome Extension 搭配 Google。

文本编辑器方面，我开始尝试使用 [Obsidian](https://obsidian.md/)。目前桌面端和移动端都有一些 bug，作为 Markdown 编辑器，它的使用门槛对小白来说很低 —— 单纯的码字工具而已，而它的上限对习惯折腾的玩家来说也很高 —— 丰富多元的社区第三方插件。

最后不得不提的便是 Cloudflare 的优秀网络工具 [WARP+](https://1.1.1.1/)。他们开会期间我完全依赖它才能正常上网。使用期间发现 WARP 有流量限制，利用 API 刷到了几十 TB 的额度后发现其下「零信任网络[^2]」是完全免费且不限流量的 —— 我果断切换成此模式，同时仍然续费另外一项网络协议工具互为备选方案来帮我维持突破网络封锁的高可用。

## Have fun, secretly

今年 10 月中下旬，我的网易云账号因在某天评论了一首歌被禁言 366 天。微博帐号也只因**点赞**评论某事件[^3]的微博而被永久封禁。对此我的态度只有：

> 😅

[^1]: [The Role of a CVA Desk - O'Reilly](https://www.oreilly.com/library/view/counterparty-credit-risk/9781118316665/c18anchor-2.html)

[^2]: [Cloudflare Zero Trust](https://www.cloudflare.com/zh-cn/products/zero-trust/)

[^3]: [现状不可描述](https://bit.ly/3V5V1NG)
