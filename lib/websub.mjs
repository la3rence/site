import config from "./config.mjs";
import { getMdPostsData } from "./ssg.mjs";

const { websubHub, baseURL, feedFile } = config;
const URL = baseURL + "/" + feedFile;

/**
 * Determine if we need to publish the websub.
 * Currently we check the latest post date if is the date of build.
 *
 * @returns boolean
 */
const needWebSub = () => {
  const latestPost = getMdPostsData().map(post => ({
    date: post.date,
  }))[0];
  const latestDate = new Date(latestPost.date).toDateString();
  console.log(`[WebSub] The latest post date is ${latestDate}`);
  const currentDate = new Date().toDateString();
  return latestDate === currentDate;
};

/**
 * Call WebSub API to notify the Hub.
 *
 * @returns log message
 */
const websub = async () => {
  const response = await fetch(websubHub, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `hub.mode=publish&hub.topic=${URL}`,
  });
  if (response.status === 204) {
    return `[WebSub] Successfully notified WebSub Hub ${websubHub}`;
  } else {
    return `[WebSub] Failed with ${response.status}. Hub: ${websubHub} RSS: ${URL}`;
  }
};

if (needWebSub()) {
  websub()
    .then(console.log)
    .catch(error => console.error(error));
} else {
  console.log("[WebSub] No new feed item. Skipping.");
}
