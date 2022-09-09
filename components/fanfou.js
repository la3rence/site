const Fanfou = ({ created_at, text, id }) => {
  return (
    <div id={id} className="w-full mb-4">
      <span className="pl-4 text-sm text-gray-600">
        {created_at.substring(4, 10)}, {created_at.substring(26, 30)}:
      </span>
      <p className="mt-0">{text}</p>
    </div>
  );
};

export default Fanfou;
