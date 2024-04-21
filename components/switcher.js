import Link from "next/link";
import { Translation } from "./svg";

const LocalizationSwitch = props => {
  return (
    <span {...props}>
      {props.locales
        ?.filter(language => language !== props.currentlocale)
        ?.map(language => {
          return (
            <Link className="no-underline" key={language} href={props.targeturl} locale={language}>
              <Translation />
            </Link>
          );
        })}
    </span>
  );
};
export default LocalizationSwitch;
