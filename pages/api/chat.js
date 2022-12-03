import { Configuration, OpenAIApi } from "openai";
import env from "../../lib/env";

const configuration = new Configuration({
  apiKey: env.CHAT_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function chat(req, res) {
  const { question } = req.query;
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: question,
    max_tokens: 2000,
    temperature: 0,
  });
  console.log(response.data.choices[0]);
  res.json({ response: response.data.choices[0].text });
  // res.json({ response: "Sorry. Service Not Available :(" });
}
