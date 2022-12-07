import { useRef, useState } from "react";
import Blog from "../components/blog";
import { v4 as uuidv4 } from "uuid";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const Message = ({ type, text }) => {
  if (type === "human") {
    return (
      <div className="bg-zinc-200 dark:bg-zinc-900 px-4 py-2">{`Human: ${text}`}</div>
    );
  }
  return (
    <div className="bg-zinc-300 dark:bg-zinc-800 whitespace-pre-wrap px-4">{`ChatGPT: ${text}`}</div>
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
    let reply = "";
    chat.push({ type: "ai", message: reply, waiting: false });
    await fetchEventSource(process.env.NEXT_PUBLIC_CHAT_API, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        id: uuidv4(),
        message: question,
        message_pid: uuidv4(),
      }),
      onmessage(event) {
        if (event.data === "[DONE]") {
          console.log("sse done");
          return;
        }
        chat.pop();
        setChat([...chat]);
        const data = JSON.parse(event.data);
        // console.log("sse onmessage", event.data);
        reply = data.message.content.parts[0];
        chat.push({ type: "ai", message: reply, waiting: false });
        setChat([...chat]);
      },
      onerror(err) {
        setChat([...chat]);
        console.log("There was an error from server", err);
      },
      onclose() {
        console.log("Connection closed by the server");
      },
    });
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
