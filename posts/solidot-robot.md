---
title: "Solidot 机器人"
date: "2020-09-05"
description: "饭否机器人🤖️ Solidot Serverless Robot with MongoDB"
---

## 奇客的资讯，重要的东西 🤖️

这是中国社交网络[饭否上的一个机器人](https://fanfou.com/jayonit)。它是一个基于 [Vercel](https://now.sh) 、mongoDB
的免费数据库、以及 [GitHub Action 提供的声明式定时任务](https://docs.github.com/en/free-pro-team@latest/actions/reference/workflow-syntax-for-github-actions#onschedule)一起运行来实现的 Serverless 实践。[作者](https://lawrenceli.me/about)充分利用互联网免费基础设施 ~~(白嫖)~~，让它每隔一段时间（大概 30 分钟）爬取 solidot.org
网站的 [RSS](https://www.solidot.org/index.rss)，比较新旧的数据后，将新的内容通过 [饭否 Node SDK](https://github.com/fanfoujs/fanfou-sdk-node) 发布。

![solidot](images/solidot-robot/solidot.png)

[源代码](https://github.com/Lonor/SolidotRobot)以 MIT 协议开放，写的很简陋，凑合着能用。

你也可以帮我调用[这个 REST API](https://post-solidot-news-to-fanfou.now.sh/api/start) 来帮助触发机器人行动：

```bash
curl -XGET -L https://post-solidot-news-to-fanfou.now.sh/api/start
```

若返回空数组则对应时间段内没有新的内容，反之若抓取到新的内容后，直接返回饭否发布此内容后的 API 响应。

## Todo

- Refactor with ESM
