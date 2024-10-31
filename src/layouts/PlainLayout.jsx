import { Toaster } from "react-hot-toast";
import { Outlet } from "react-router-dom";
import AuthProvider from "../providers/AuthProvider.jsx";
import PaymentHeader from "../components/shared/PaymentHeader.jsx";
import CreateLinkDialog from "../components/dialogs/CreateLinkDialog.jsx";

export default function PlainLayout() {
  return (
    <AuthProvider>
      <CreateLinkDialog />
      <Toaster />
      <PaymentHeader />
      <Outlet />
    </AuthProvider>
  );
}
