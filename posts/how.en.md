---
title: How this website was built
date: "2022-08-27"
modified: "2024-12-07"
description: This article is used to test the Markdown style end-to-end
tags: markdown, example, guide, jamstack, ssg, vercel, nextjs, design
---

## Usage

The source code of this site is completely open: [GitHub - la3rence/site](https://github.com/la3rence/site).

<div>
<github user="la3rence" repo="site"></github>
</div>

Directly store the Markdown file (.md) in the `posts` folder to render the current file and make it a static page ([SSG](/blog/ssg-ssr)).

The homepage index directory of the blog is also generated synchronously without manual maintenance.

The **About** page is also generated based on the `readme.md` file.

Blog-related information configuration, such as title, author, etc., can be configured in the `lib/config.mjs` file.

It is recommended to use [pnpm](https://pnpm.io/) as a dependency management tool for node.js (compared to the official npm, pnpm has a great advantage: faster speed and space saving).

```shell
pnpm install
pnpm dev

# [Optional] install turbo via `pnpm i -g turbo`
# and you can try `turbo` for run any script in package.json like:
turbo dev
turbo build
```

Local preview: <http://localhost:3000>.

Use `pnpm build` to package, and `pnpm start` to start the production environment.
Use `pnpm fmt` to format all code and text.

This article shows all the media information that this blog project can display, such as code references, table displays, pictures, videos, Douban(Chinese IMDb) cards, etc.

2024/07 Update:

- The top navigation bar enables frosted glass dynamic suspension

- A new edge to edge design style that makes full use of the screen area to display code and images

## Technical details

This site is composed of the open source `Next.js` framework (from Vercel) and `TailwindCSS` style . The former is an open source SSG/SSR project based on React, and the latter is a popular atomic CSS library that allows me, who is not good at writing original CSS and has a weak foundation, to quickly write flexible styles.

Next.js will actively call some of the functions we have written (`getStaticProps()`) to allow the component to get data input, so that the React component can be rendered in advance **in the building phase**. `remark` library can compile native markdown syntax into DOM corresponding to HTML - In this project, we let it traverse the markdown files in the `posts` folder, compile them one by one, and use them as `props` of the dynamic routing page of `[id].js` to render blog posts:

```js caption="SSG in '[id].js': fetch data in build time" {3} showLineNumbers{38}
export const getStaticProps = async context => {
  const { id } = context.params;
  const mdData = await getMdContentById(id);
  return {
    props: mdData,
  };
};
```

There are many benefits to doing this:

- Suitable for CDN caching
- Excellent SEO performance
- Save network bandwidth and traffic
- O(1) time complexity [TTFB](https://en.wikipedia.org/wiki/Time_to_first_byte)

In a word, fast! If you try to turn off the JavaScript function of the current browser, bascially, this website can still render and display correctly.

Not only that, Next.js also provides **server-side rendering** capabilities, which can also bring a better SEO experience. I won’t go into details.

The above technology is called [JAMstack](#tables)：**J**avaScript, **A**PI & **M**arkup.

An interesting way to say it is that JAMstack is a CDN-first application.

> It's now possible, instead, to push content directly to the network and design frameworks that optimize for this capability. As a result, with optimizations like static asset hoisting, websites are now becoming faster and more reliable than ever before.

### Movie

You can write specific React components to make Markdown support richer page content, similar to `MDX`.
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

You can directly display videos from B station through `<bilibili />` component, based on iframe. And you can also make a tiny change to let it be `<youtube />`.

<div style="display: flex; justify-content: center;">
  <iframe width="900" height="480" src="https://www.youtube.com/embed/rR4n-0KYeKQ?si=gLjwn8rHDxYc4cUF"></iframe>
</div>

### Tweet / 𝕏

`<tweet />` component displays tweets:

<div>
<tweet id="20" />
</div>

### Open Graph

Open Graph (OG, Open Graph Protocol) is used to display specific rich media information when sharing web pages on social networks.

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

## WebSub for RSS

Powering WebSub based on GitHub Actions Standard, formerly PubSubHubbub. This allows RSS clients that support WebSub to not only get new articles immediately, but also reduce the number of polling and traffic between the client and the server. Details: [site/issue/324](https://github.com/la3rence/site/issues/324).

## ActivityPub

The website implements interaction with the federated universe through some basic ActivityPub and WebFinger protocols. [Implementation details](https://lawrenceli.me/blog/activitypub).

## I18n

The website supports internationalization through simple configuration. The middle suffix of the markdown file name and the Next.js native locale routing are used to distinguish between language types and display different texts.

## And more to do

Markdown currently uses GitHub Flavored Markdown ([GFM](https://github.github.com/gfm/)) and tries to add support for new syntax elements.

For example: <https://github.com/orgs/community/discussions/16925>

> [!NOTE]
> Critical content demanding immediate user attention due to potential risks.

## Ref Reference Links

- <https://nextjs.org>
- <https://tailwindcss.com>
- <https://rauchg.com/2020/static-hoisting>
- <https://jamstack.org>
