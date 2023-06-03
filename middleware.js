import { NextResponse } from "next/server";

const logger = ["cf-connecting-ip"];

// This function can be marked `async` if using `await` inside
export function middleware(req) {
  logger.map(key => console.log(key, req.headers.get(key)));
  const accept = req.headers.get("Accept");
  if (accept && accept.includes("activity")) {
    const { pathname } = req.nextUrl;
    const blogId = pathname.split("/")[2];
    return NextResponse.rewrite(
      new URL(`/api/activitypub/blog/${blogId}`, req.url)
    );
  }
}

export const config = {
  matcher: "/blog/:blogId*",
};
