import { useRef, useState, useEffect } from "react";
import Blog from "../components/blog";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import { Lines } from "../components/loading";

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

const Message = ({ role, content, isLoading }) => {
  if (role === "user") {
    return (
      <div
        className="p-2"
        dangerouslySetInnerHTML={{
          __html: md.render(`○ ${content}`),
        }}
      ></div>
    );
  }
  if (isLoading) {
    return <Lines />;
  }
  return (
    <div
      className="py-4 prose-p:p-2 prose-p:my-0 prose-pre:px-6 prose-pre:my-0 prose-pre:break-words"
      dangerouslySetInnerHTML={{
        __html: md.render(`● ${content}`),
      }}
    ></div>
  );
};

const Chat = props => {
  const { q } = props;
  const [chat, setChat] = useState([]);
  const inputRef = useRef();
  const bottomRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    inputRef.current.focus();
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
    chat.push({ role: "user", content: question });
    setChat([...chat]);
    inputRef.current.value = "";
    try {
      setIsLoading(true);
      await answer(question);
    } catch (error) {
      console.error(error);
    }
  };

  const answer = async question => {
    setChat([...chat]);
    const res = await fetch(process.env.NEXT_PUBLIC_CHAT_API, {
      method: "POST",
      body: JSON.stringify({
        messages: chat,
      }),
    });
    const result = await (await res.text()).trim();
    setIsLoading(false);
    chat.push({ role: "assistant", content: result });
    setChat([...chat]);
    inputRef.current.focus();
    if (question) {
      const fly = await fetch(
        `${process.env.NEXT_PUBLIC_LOG_API}?message=${question}`
      );
      await fly.json();
    }
  };

  const clear = () => {
    setChat([]);
  };

  const regenerate = async () => {
    setIsLoading(true);
    chat.pop();
    await answer();
  };

  return (
    <Blog
      noMeta
      noFooter
      title={`GPT Turbo ${q ? ": " + q : ""}`}
      description="Get instant answers, explanations, and examples for all of your questions."
    >
      {chat.map((messageObj, index) => {
        return (
          <Message
            content={messageObj.content}
            role={messageObj.role}
            key={index}
          />
        );
      })}
      {chat.length > 1 && !isLoading && (
        <div className="flex">
          <div className="flex-1"></div>
          <div className="p-1 h-6 w-6 mr-4 cursor-pointer" onClick={regenerate}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 32 32"
            >
              <path
                d="M25.95 7.65l.005-.004c-.092-.11-.197-.206-.293-.312c-.184-.205-.367-.41-.563-.603c-.139-.136-.286-.262-.43-.391c-.183-.165-.366-.329-.558-.482c-.16-.128-.325-.247-.49-.367c-.192-.14-.385-.277-.585-.406a13.513 13.513 0 0 0-.533-.324q-.308-.179-.625-.341c-.184-.094-.37-.185-.56-.27c-.222-.1-.449-.191-.678-.28c-.19-.072-.378-.145-.571-.208c-.246-.082-.498-.15-.75-.217c-.186-.049-.368-.102-.556-.143c-.29-.063-.587-.107-.883-.15c-.16-.023-.315-.056-.476-.073A12.933 12.933 0 0 0 6 7.703V4H4v8h8v-2H6.811A10.961 10.961 0 0 1 16 5a11.111 11.111 0 0 1 1.189.067c.136.015.268.042.403.061c.25.037.501.075.746.128c.16.035.315.08.472.121c.213.057.425.114.633.183c.164.054.325.116.486.178c.193.074.384.15.57.235c.162.072.32.15.477.23q.268.136.526.286c.153.09.305.18.453.276c.168.11.33.224.492.342c.14.102.282.203.417.312c.162.13.316.268.47.406c.123.11.248.217.365.332c.167.164.323.338.479.512A10.993 10.993 0 1 1 5 16H3a13 13 0 1 0 22.95-8.35z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
        </div>
      )}
      {isLoading && <Message role={"assistant"} isLoading={true} />}
      <div ref={bottomRef} id="input" className="mt-20">
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            placeholder=""
            defaultValue={q}
            onKeyDown={handleKeyDown}
            className="h-12 pl-4 py-3 bg-zinc-100 flex-1 dark:bg-zinc-800 rounded-none outline-none"
          />
          <button
            className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 text-2xl"
            onClick={send}
          >
            ▲
          </button>
          {chat.length > 0 && (
            <button
              className="w-12 bg-zinc-100 dark:bg-zinc-800 text-2xl"
              onClick={clear}
            >
              ○
            </button>
          )}
        </div>
      </div>
    </Blog>
  );
};

export default Chat;

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
