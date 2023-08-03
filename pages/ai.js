import { useEffect } from "react";
import Layout from "../components/layout";

const NotFound = () => {
  useEffect(() => {
    setTimeout(() => {
      window.location.href = process.env.NEXT_PUBLIC_AI_PAGE;
    }, 3000);
  }, []);

  return (
    <Layout>
      <p>Redirecting...</p>
    </Layout>
  );
};

export default NotFound;
