import Image from "next/image";

export default function RewardImages() {
  return (
    <div className="text-center">
      <div>
        <Image
          className="inline-block dark:invert mx-5 mt-0"
          src="/images/alipay.svg"
          width={120}
          height={120}
          alt="qrcode-alipay"
        ></Image>
        <Image
          className="inline-block dark:invert mx-5 mt-0"
          src="/images/wechat-reward.png"
          width={100}
          height={100}
          alt="qrcode-alipay"
        ></Image>
      </div>
      <small>
        作为一名博主，我需要不断努力才能够带给读者更多有价值的内容。
        <br />
        如果您愿意支持我的努力，我将不胜感激。
      </small>
    </div>
  );
}
