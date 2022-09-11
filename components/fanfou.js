import Image from "next/image";

const Fanfou = ({ created_at, text, id, photo }) => {
  return (
    <div id={id} className="w-full mb-4 flex flex-wrap">
      <span className="pl-4 text-sm text-gray-600 w-full">
        {created_at.substring(4, 10)}, {created_at.substring(26, 30)}:
      </span>
      <p
        className="mt-0 self-center flex-1"
        dangerouslySetInnerHTML={{ __html: text }}
      ></p>
      {photo && (
        <div className="w-72">
          <Image
            src={photo.originurl}
            alt={text}
            width="100%"
            height="60%"
            layout="responsive"
            objectFit="contain"
          ></Image>
        </div>
      )}
    </div>
  );
};

export default Fanfou;
