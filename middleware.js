import { NextResponse } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(req) {
  const path = req.nextUrl.pathname;
  // ActivityPub Accept Rewrite
  const accept = req.headers.get("Accept");
  if (path.startsWith("/blog") && accept && accept.includes("activity")) {
    const blogId = path.split("/")[2];
    return NextResponse.rewrite(
      new URL(`/api/activitypub/blog/${blogId}`, req.url),
    );
  }
  if (path.endsWith("atom.xml")) {
    const locale = req.nextUrl.locale;
    return NextResponse.rewrite(new URL(`/atom.${locale}.xml`, req.url));
  }
}

// export const config = {
//   matcher: "/blog/:blogId*",
// };
