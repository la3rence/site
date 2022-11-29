---
title: 这个网站是如何构建的
date: "2022-08-27"
vertical: false
image: https://reflare.lawrenceli.me/file/1662688541295.png
description: 此文用于端到端测试 Markdown 样式
someKey: someValue # available in props of <Header />
tag: 网站, MarkDown, Example
---

## 使用方式

本站源码完全公开：[GitHub - Lonor/site](https://github.com/Lonor/site).

直接将 Markdown 文件 (.md) 存放在 `posts` 文件夹下即可渲染当前文件，使之成为静态页面([SSG](/blog/ssg-ssr))。
博客的首页索引目录也为同步生成，而无需手动维护。

**About** 页面也同理基于 `readme.md` 文件生成而来。

博客相关的信息配置，如标题、作者等可在 `lib/config.json` 文件中配置。

推荐使用 [pnpm](https://pnpm.io/zh/) 来作为 node.js 的依赖管理工具。

```shell
pnpm install
pnpm run dev
```

本地访问 <http://localhost:3000> 即可。

通过 `npm run build` 来打包，`npm run start` 则用于生产环境的启动。

## 技术细节

此站点由 `Next.js` 框架和 `TailWindCSS` 样式构成。前者是一项基于 React 的 SSG/SSR 开源项目，后者是一个目前流行的原子化 CSS 库，让不太会写 CSS、基础薄弱的我也能快速的写出灵活的样式。

Next.js 会主动调用我们写好的一些函数 (`getStaticProps()`)，让组件得到数据的输入，从而**在构建阶段**将 React 组件提前渲染完成。`remark` 库可以将原生的 markdown 语法编译成 html 对应的 dom - 在此项目中，我们让它固定遍历 `posts` 文件夹下的 markdown 文件，依次编译，让其作为 `[id].js` 的动态路由页面的 `props`，从而渲染出博客文章:

```JavaScript
// [id].js
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

### Images

![Random Image](https://reflare.lawrenceli.me/file/1662549316419.jpg)

~~我被横线划过。~~

### Video

<div class="embed">
  <iframe src="//player.bilibili.com/player.html?bvid=BV1i44y1N7kU&danmaku=0&high_quality=1"
  ></iframe>
</div>

## Tables

JAMstack.

| ROLE | PROVIDED BY                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------- |
| J    | Client-side JS injected via React Hooks (state, event listeners, effects)                                      |
| A    | API pages inside the pages/api directory.                                                                      |
| M    | Pages with no data dependencies or pages with static data deps that trigger build-time static site generation. |

## Ref 参考链接

- <https://nextjs.org>
- <https://tailwindcss.com>
- <https://rauchg.com/2020/static-hoisting>
- <https://jamstack.org>
