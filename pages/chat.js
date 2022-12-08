import { useRef, useState } from "react";
import Blog from "../components/blog";
import { v4 as uuidv4 } from "uuid";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";

let messageParentId = null;
let conversationId = null;

const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(str, { language: lang, ignoreIllegals: true })
        .value;
    }
    return "";
  },
});

export const blogProps = {
  author: "OpenAI",
  title: "Demo: ChatGPT",
  date: "2022-12-02",
  tag: "AI, Chat, SSE",
};

const Message = ({ type, text }) => {
  if (type === "human") {
    return (
      <div
        className="bg-zinc-200 dark:bg-zinc-900 p-2"
        dangerouslySetInnerHTML={{ __html: md.render(`🙋 ${text}`) }}
      ></div>
    );
  }
  return (
    <div
      className="bg-zinc-300 dark:bg-zinc-800 prose-p:p-2 prose-p:my-0 prose-pre:p-2 prose-pre:my-0"
      dangerouslySetInnerHTML={{ __html: md.render(`🤖️ ${text}`) }}
    ></div>
  );
};

const Chat = () => {
  const [chat, setChat] = useState([
    {
      type: "ai",
      message: `在下方输入问题向 AI 提问（支持任意语言）。
      测试用，请勿分享页面给他人。不建议使用网络用语。禁止敏感字眼。受限于网络状况回复可能较慢。`,
    },
  ]);

  const inputRef = useRef();

  const send = async () => {
    const question = inputRef.current.value;
    if (question === "" || !question) {
      return;
    }
    chat.push({ type: "human", message: question });
    setChat([...chat]);
    inputRef.current.value = "";
    try {
      await answer(question);
    } catch (error) {
      console.error(error);
    }
  };

  const answer = async question => {
    console.debug("messageCacheId", messageParentId);
    console.debug("conversationId", conversationId);
    let reply = "";
    chat.push({ type: "ai", message: reply });
    await fetchEventSource(process.env.NEXT_PUBLIC_CHAT_API, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        id: uuidv4(),
        message: question,
        message_pid: messageParentId ? messageParentId : uuidv4(),
        conversation_id: conversationId ? conversationId : "",
      }),
      async onmessage(event) {
        if (event.data === "[DONE]") {
          return;
        }
        chat.pop();
        setChat([...chat]);
        const data = JSON.parse(event.data);
        console.debug("sse onmessage", event.data);
        reply = data.message?.content?.parts?.[0];
        conversationId = data.conversation_id;
        messageParentId = data.message.id;
        chat.push({
          type: "ai",
          message: reply,
        });
        setChat([...chat]);
        const fly = await fetch(
          `${process.env.NEXT_PUBLIC_LOG_API}?message=${question}`
        );
        const res = await fly.json();
        console.debug(res);
      },
      onerror(error) {
        throw error; // rethrow to stop the operation
      },
      onclose() {
        console.debug("sse closed");
      },
    });
  };

  return (
    <Blog noMeta noFooter {...blogProps}>
      <div>
        {chat.map((messageObj, index) => {
          return (
            <Message
              text={messageObj.message}
              type={messageObj.type}
              key={index}
            />
          );
        })}
      </div>
      <div id="input" className="mt-20">
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask AI..."
            className="h-12 px-4 py-3 bg-zinc-200 flex-1 dark:bg-zinc-800 rounded-none outline-none"
          />
          <button
            className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 text-2xl"
            onClick={send}
          >
            ▲
          </button>
        </div>
      </div>
    </Blog>
  );
};

export default Chat;
