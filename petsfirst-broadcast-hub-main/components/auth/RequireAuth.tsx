import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

type RequireAuthProps = {
  isAuthed: boolean;
};

const RequireAuth: React.FC<RequireAuthProps> = ({ isAuthed }) => {
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
