import React from "react";
import Header from "../_components/Header/Header";
import Footer from "../_components/Footer";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Header />
      {children}
      <Footer />
    </div>
  );
};

export default layout;
