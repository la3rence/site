import { Favicon } from "./svg";

const Logo = ({ title }) => (
  <span className="inline-flex items-center">
    <span>
      <Favicon />
    </span>
    <span className="px-2">{title}</span>
  </span>
);

export default Logo;
