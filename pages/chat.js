import { useRef, useState } from "react";
import Layout from "../components/layout";

const Message = ({ text }) => (
  <div className="text-lg p-6 bg-zinc-300 dark:bg-zinc-600 border border-spacing-1">
    {text}
  </div>
);

const greeting = `The following is a conversation with an AI assistant. 
The assistant is helpful, creative, clever, and very friendly. 
测试用，请勿分享页面给他人。`;

const Chat = () => {
  const [chat, setChat] = useState([greeting]);
  const inputRef = useRef();

  const send = async () => {
    const question = inputRef.current.value;
    if (question === "" || !question) {
      return;
    }
    chat.push("Human: " + question);
    setChat([...chat]);
    inputRef.current.value = "";
    await answer(question);
  };

  const answer = async question => {
    const res = await (await fetch(`/api/chat?question=${question}`)).json();
    chat.push(`AI: ${res.response}`);
    setChat([...chat]);
  };

  return (
    <Layout chat>
      <h2>OpenAI: ChatGPT</h2>
      <div>
        {chat.map((text, index) => {
          return <Message text={text} key={index} />;
        })}
      </div>
      <div id="input" className="mt-20">
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask AI..."
            className="h-12 p-3 bg-zinc-300 flex-1"
          />
          <button
            className="w-12 h-12 bg-zinc-400 text-2xl -rotate-90"
            onClick={send}
          >
            ▶️
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
