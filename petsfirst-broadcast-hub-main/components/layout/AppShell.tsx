import React from "react";
import { Outlet } from "react-router-dom";
import Layout from "./Layout";

const AppShell: React.FC = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default AppShell;
