import { Toaster } from "react-hot-toast";
import { Outlet } from "react-router-dom";
import AuthProvider from "../providers/AuthProvider";
import CreateLinkDialog from "../components/dialogs/CreateLinkDialog";
import PaymentHeader from "../components/shared/PaymentHeader";

export default function PaymentLayout({ children }) {
  return (
    <AuthProvider>
      <CreateLinkDialog />
      <Toaster />
      <PaymentHeader />
      {children}
    </AuthProvider>
  );
}
