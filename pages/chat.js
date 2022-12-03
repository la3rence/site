import { useRef, useState } from "react";
import Blog from "../components/blog";
import Logo from "../components/logo";

const Message = ({ type, text, waiting }) => {
  if (type === "human") {
    return (
      <div className="bg-zinc-200 dark:bg-zinc-900 px-4 py-2">{`Human: ${text}`}</div>
    );
  }
  return (
    <div className="bg-zinc-300 dark:bg-zinc-800 whitespace-pre-wrap px-4">
      {waiting ? (
        <>
          <Logo duration="3s"></Logo>
          <span>Waiting...</span>
        </>
      ) : (
        `AI: ${text}`
      )}
    </div>
  );
};

const greeting = `在下方输入问题向 AI 提问（支持任意语言）。临时测试用，请勿分享页面给他人。不建议使用网络用语。禁止敏感字眼。不定时停服。`;

const Chat = () => {
  const [chat, setChat] = useState([
    { type: "human", message: greeting, waiting: false },
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
    await answer(question);
  };

  const answer = async question => {
    chat.push({ type: "ai", message: "Waiting...", waiting: true });
    setChat([...chat]);
    const res = await (
      await fetch(`${process.env.NEXT_PUBLIC_CHAT_API}?question=${question}`, {
        method: "POST",
      })
    ).json();
    chat.pop();
    chat.push({ type: "ai", message: res.response, waiting: false });
    setChat([...chat]);
  };

  return (
    <Blog chat title="OpenAI: ChatGPT" noMeta>
      <div>
        {chat.map((messageObj, index) => {
          return (
            <Message
              text={messageObj.message}
              type={messageObj.type}
              key={index}
              waiting={messageObj.waiting}
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
            className="h-12 p-3 bg-zinc-200 flex-1 dark:bg-zinc-800 rounded-none outline-none"
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
