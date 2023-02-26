import { useRef, useState, useEffect } from "react";
import Blog from "../components/blog";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import withView from "../components/withView";

const md = new MarkdownIt({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(str, {
        language: lang,
        ignoreIllegals: true,
      }).value;
    }
    return "";
  },
});

const Message = ({ type, text }) => {
  if (type === "human") {
    return (
      <div
        className="bg-zinc-200 dark:bg-zinc-900 p-2"
        dangerouslySetInnerHTML={{
          __html: md.render(`🙋 ${text}`),
        }}
      ></div>
    );
  }
  return (
    <div
      className="bg-zinc-300 dark:bg-zinc-800 prose-p:p-2 prose-p:my-0 prose-pre:p-2 prose-pre:my-0"
      dangerouslySetInnerHTML={{
        __html: md.render(`🤖️ ${text}`),
      }}
    ></div>
  );
};

const Chat = props => {
  const { q } = props;

  const [chat, setChat] = useState([
    {
      type: "ai",
      message: `输入问题向 AI 提问`,
    },
  ]);

  const inputRef = useRef();
  const bottomRef = useRef(null);
  useEffect(() => {
    (async function sendQ() {
      await send();
    })();
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleKeyDown = event => {
    if (event.keyCode === 13) {
      send();
    }
  };

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
    let reply = "";
    chat.push({ type: "ai", message: reply });
    await fetchEventSource(process.env.NEXT_PUBLIC_CHAT_API, {
      method: "POST",
      mode: "cors",
      headers: {
        accept: "*/*",
      },
      body: JSON.stringify({
        question: `用中文回复: ${question}`,
        bingResults: {},
      }),
      onmessage(event) {
        chat.pop();
        setChat([...chat]);
        const data = JSON.parse(event.data);
        console.debug("sse onmessage", data.token);
        if (data.token) {
          reply += data.token;
        }
        chat.push({
          type: "ai",
          message: reply,
        });
        setChat([...chat]);
      },
      onerror(error) {
        throw error; // rethrow to stop the operation
      },
      async onclose() {
        console.debug("sse closed");
        const fly = await fetch(
          `${process.env.NEXT_PUBLIC_LOG_API}?message=${question}`
        );
        const res = await fly.json();
        console.debug(res);
      },
    });
  };

  return (
    <Blog noMeta noFooter title={`AI Search${q ? ": " + q : ""}`}>
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
      <div ref={bottomRef} id="input" className="mt-20">
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask AI..."
            defaultValue={q}
            onKeyDown={handleKeyDown}
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

export default withView(Chat);

export async function getServerSideProps(context) {
  const { q } = context.query;
  if (q) {
    return {
      props: {
        q,
      },
    };
  } else {
    return {
      props: {},
    };
  }
}
