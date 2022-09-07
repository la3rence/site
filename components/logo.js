const Logo = ({ title }) => (
  <span className="inline-flex mt-1 items-center">
    <svg
      className="mr-4"
      viewBox="0 0 20 20"
      width="20"
      height="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="20" height="20" fill="#888888"></rect>
      <rect x="10" y="0" width="10" height="10" fill="#CCCCCC"></rect>
      <animateTransform
        attributeName="transform"
        type="rotate"
        form="0 "
        to="360"
        dur="360s"
        repeatCount="indefinite"
      />
    </svg>
    {title}
  </span>
);

export default Logo;