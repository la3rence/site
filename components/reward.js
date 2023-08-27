import Image from "next/image";

export default function RewardImages({ text }) {
  return (
    <div className="text-center filter grayscale-[50%] contrast-200">
      <div>
        <Image
          className="inline-block dark:invert mx-5 my-0"
          src="/images/alipay.svg"
          width={120}
          height={120}
          alt="qrcode-alipay"
        ></Image>
        <Image
          className="inline-block dark:invert mx-5 mt-0 mb-0"
          src="/images/wechat-reward.png"
          width={100}
          height={100}
          alt="qrcode-alipay"
        ></Image>
      </div>
      <small>{text}</small>
    </div>
  );
}
