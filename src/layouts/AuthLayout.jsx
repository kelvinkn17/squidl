import { Navigate, Outlet, useLoaderData } from "react-router-dom";
import { DynamicEmbeddedWidget } from "@dynamic-labs/sdk-react-core";
import AuthProvider from "../providers/AuthProvider";
import { Toaster } from "react-hot-toast";
import Header from "../components/shared/Header";
import Navbar from "../components/shared/Navbar";
import CreateLinkDialog from "../components/dialogs/CreateLinkDialog.jsx";
import GetStartedDialog from "../components/dialogs/GetStartedDialog.jsx";
import { useSession } from "../hooks/use-session.js";
import Payment from "../components/payment/Payment.jsx";
import PaymentLayout from "./PaymentLayout.jsx";

export default function AuthLayout() {
  const { isSignedIn } = useSession();
  const { subdomain } = useLoaderData();

  if (subdomain) {
    return (
      <PaymentLayout>
        <div className="flex min-h-screen w-full items-center justify-center py-5 md:py-20 px-4 md:px-10">
          <Payment />
        </div>
      </PaymentLayout>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center px-5 md:px-10 bg-primary-50">
        <div className="w-full max-w-md">
          <DynamicEmbeddedWidget background="with-border" />
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <CreateLinkDialog />
      <GetStartedDialog />
      <Toaster />
      <Header />
      <Outlet />
      <Navbar />
    </AuthProvider>
  );
}
