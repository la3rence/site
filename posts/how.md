---
title: 这个网站是如何构建的
date: "2022-08-27"
modified: "2024-07-07"
description: 此文用于端到端测试 Markdown 样式
tags: markdown, example, guide, jamstack, ssg, vercel, nextjs, design
---

## 使用方式

本站源码完全公开：[GitHub - la3rence/site](https://github.com/la3rence/site).

<div>
  <github user="la3rence" repo="site"></github>
</div>

直接将 Markdown 文件 (.md) 存放在 `posts` 文件夹下即可渲染当前文件，使之成为静态页面([SSG](/blog/ssg-ssr))。
博客的首页索引目录也为同步生成，而无需手动维护。

**About** 页面也同理基于 `readme.md` 文件生成而来。

博客相关的信息配置，如标题、作者等可在 `lib/config.mjs` 文件中配置。

推荐使用 [pnpm](https://pnpm.io/zh/) 来作为 node.js 的依赖管理工具（相比官方 npm，pnpm 拥有非常大的优势: 速度更快，且节省空间）。

```shell
pnpm install
pnpm dev

# [Optional] install turbo via `pnpm i -g turbo`
# and you can try `turbo` for run any script in package.json like:
turbo dev
turbo build
```

本地访问 <http://localhost:3000> 即可。

通过 `pnpm build` 来打包，`pnpm start` 则用于生产环境的启动。
通过 `pnpm fmt` 来将所有代码和文本进行格式化。

这篇文章展示了此博客项目所能展示的一切媒体信息，比如代码引用、表格展示、图片、视频、豆瓣卡片等等。

2024/07 更新：

- 顶部导航栏启用毛玻璃动态悬浮
- 全新的 edge to edge 设计风格，充分利用屏幕区域展示代码和图片

## 技术细节

此站点由 Vercel 公司开源的 `Next.js` 框架和 `TailwindCSS` 样式构成。前者是一项基于 React 的 SSG/SSR 开源项目，后者是一个目前流行的原子化 CSS 库，让不太会写 CSS、基础薄弱的我也能快速的写出灵活的样式。

Next.js 会主动调用我们写好的一些函数 (`getStaticProps()`)，让组件得到数据的输入，从而**在构建阶段**将 React 组件提前渲染完成。`remark` 库可以将原生的 markdown 语法编译成 html 对应的 dom - 在此项目中，我们让它固定遍历 `posts` 文件夹下的 markdown 文件，依次编译，让其作为 `[id].js` 的动态路由页面的 `props`，从而渲染出博客文章:

```js caption="SSG in '[id].js': fetch data in build time" {3} showLineNumbers{38}
export const getStaticProps = async context => {
  const { id } = context.params;
  const mdData = await getMdContentById(id);
  return {
    props: mdData,
  };
};
```

这样做的好处很多:

- 适合被 CDN 缓存
- 优秀的 SEO 表现
- 节省网络带宽、流量
- O(1) 时间复杂度的 [TTFB](https://en.wikipedia.org/wiki/Time_to_first_byte)

总之一个字，快！如果你尝试关闭当前浏览器的 JavaScript 功能，这个网站也一样能正确渲染并展现。

不光如此，Next.js 也提供了**服务端渲染**的能力，同样也能带来较好的 SEO 体验，不展开说了。

上述这种技术被称之为 [JAMstack](#tables)：**J**avaScript, **A**PI & **M**arkup.

一种有趣的说法是，JAMstack 是 CDN 优先的应用程序。

> It's now possible, instead, to push content directly to the network and design frameworks that optimize for this capability. As a result, with optimizations like static asset hoisting, websites are now becoming faster and more reliable than ever before.

### Movie

你可以编写特定的 React 组件来让 Markdown 支持更丰富的页面内容，这种实现方式和 `MDX` 类似。
The source of this component is coded via react component in markdown!

Code:

```jsx
// filename: how.md
<div>
  <douban id="3042261"></douban>
<div>
```

Result:

<div>
  <douban id="3042261"></douban>
<div>

### Images

![Random Image](https://proxy.lawrenceli.me/picsum.photos/400/600?grayscale)

### Video

可以直接通过 `<bilibili />` 组件展示来自于 B 站视频，基于 iframe.

<div>
  <bilibili bv="BV1gR4y1u76v"></bilibili>
</div>

<!-- or:
<div class="embed">
  <iframe src="//player.bilibili.com/player.html?bvid=BV1i44y1N7kU&danmaku=0&high_quality=1"
  ></iframe>
</div> -->

### Tweet / 𝕏

`<tweet />` 组件展示推文：

<div>
  <tweet id="1138070453942009856" />
</div>

### Open Graph

Open Graph (OG, 开放图谱协议) 用于社交网络分享网页时展示特定的富媒体信息。

![Open Graph](https://lawrenceli.me/api/og?meta=This%20is%20Open%20Graph)

## Tables

JAMstack.

| ROLE |                                                  PROVIDED BY                                                   |
| :--: | :------------------------------------------------------------------------------------------------------------: |
|  J   |                   Client-side JS injected via React Hooks (state, event listeners, effects)                    |
|  A   |                                   API pages inside the pages/api directory.                                    |
|  M   | Pages with no data dependencies or pages with static data deps that trigger build-time static site generation. |

## GitHub Gist

`gist:darylwright/75332f27a6e9bff70bc0406114570829?file=gist-test.ts&highlights=1,3-5`

## And more to do

Markdown 目前采用 GitHub Flavored Markdown ([GFM](https://github.github.com/gfm/)) ，并尝试添加新的语法元素支持。

例如：<https://github.com/orgs/community/discussions/16925>

> [!NOTE]  
> Critical content demanding immediate user attention due to potential risks.

## Ref 参考链接

- <https://nextjs.org>
- <https://tailwindcss.com>
- <https://rauchg.com/2020/static-hoisting>
- <https://jamstack.org>
