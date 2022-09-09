const Fanfou = ({ created_at, text, id }) => {
  return (
    <div id={id} className="p-2 mb-2 w-full bg-transparent rounded-sm">
      <span className="text-sm text-gray-600">
        {created_at.substring(4, 10)}, {created_at.substring(26, 30)}
      </span>
      <div>{text}</div>
    </div>
  );
};

export default Fanfou;
