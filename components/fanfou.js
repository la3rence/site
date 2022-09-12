import Image from "next/image";

const Fanfou = ({ createdAt, text, id, photo }) => {
  return (
    <div id={id} className="w-full mb-4 flex flex-wrap">
      <span className="pl-4 text-sm text-gray-600 w-full">
        {createdAt.substring(4, 10)}, {createdAt.substring(26, 30)}:
      </span>
      <p
        className="mt-0 self-center flex-1"
        dangerouslySetInnerHTML={{ __html: text }}
      />
      {photo && (
        <div className="w-72">
          <Image
            src={photo.largeurl}
            alt={text}
            width="100%"
            height="60%"
            layout="responsive"
            objectFit="contain"
          />
        </div>
      )}
    </div>
  );
};

export default Fanfou;
