import Link from "next/link";
import { Translation } from "./svg";

const LocalizationSwitch = props => {
  return (
    <span {...props}>
      {props.locales
        ?.filter(language => language !== props.currentLocale)
        ?.map(language => {
          return (
            <Link
              className="no-underline"
              key={language}
              href={props.targetURL}
              locale={language}
            >
              <Translation />
            </Link>
          );
        })}
    </span>
  );
};
export default LocalizationSwitch;
