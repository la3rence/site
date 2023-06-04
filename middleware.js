import { NextResponse } from "next/server";

const headerArr = ["cf-connecting-ip", "cf-ipcity"];

// This function can be marked `async` if using `await` inside
export function middleware(req) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api")) {
    const headers = headerArr
      .map(key => `${key}: ${req.headers.get(key)}`)
      .join(", ");
    console.log(req.method, path, headers);
  }

  // ActivityPub Accept Rewrite
  const accept = req.headers.get("Accept");
  if (path.startsWith("/blog") && accept && accept.includes("activity")) {
    const blogId = path.split("/")[2];
    return NextResponse.rewrite(
      new URL(`/api/activitypub/blog/${blogId}`, req.url)
    );
  }
}

// export const config = {
//   matcher: "/blog/:blogId*",
// };
