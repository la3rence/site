import { Favicon } from "./svg";

const Logo = ({ title }) => (
  <span className="inline-flex items-center mt-1">
    <span className="mt-0">
      <Favicon />
    </span>
    <span className="px-2">{title}</span>
  </span>
);

export default Logo;
