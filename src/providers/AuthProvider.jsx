import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { createContext, useContext, useEffect, useState } from "react";
import { squidlAPI, squidlPublicAPI } from "../api/squidl";
import { isGetStartedDialogAtom } from "../store/dialog-store";
import { useAtom } from "jotai";
import { useWeb3 } from "./Web3Provider";
import { CONTRACT_ADDRESS } from "../config";
import { signAuthToken } from "../lib/ethers";
import { isSignedInAtom } from "../store/auth-store";
import { useSession } from "../hooks/use-session";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import useSWR from "swr";

const AuthContext = createContext({
  userData: {},
});

export default function AuthProvider({ children }) {
  const { isLoaded, provider, signer } = useWeb3();
  const { handleLogOut, user, primaryWallet } = useDynamicContext();
  const [isReadyToSign, setIsReadyToSign] = useState(false);
  const [isSigningIn, setSigningIn] = useState(false);
  const [, setOpen] = useAtom(isGetStartedDialogAtom);
  const [, setSignedIn] = useAtom(isSignedInAtom);
  const { isSignedIn, isLoading } = useSession();

  const { data: userData } = useSWR(
    isSignedIn ? "/auth/me" : null,
    async (url) => {
      const { data } = await squidlAPI.get(url);
      return data;
    }
  );

  // console.log({ primaryWallet, user });

  const login = async (user) => {
    if (isSigningIn || !user || !primaryWallet) return;

    setSigningIn(true);

    try {
      toast.loading("Please sign the request to continue", {
        id: "signing",
      });

      const network = await provider.getNetwork();
      const chainId = network.chainId;

      const auth = await signAuthToken(signer, CONTRACT_ADDRESS, chainId);

      toast.loading("Verifying data, please wait...", {
        id: "signing",
      });

      const { data } = await squidlPublicAPI.post("/auth/login", {
        address: primaryWallet.address,
        username: "",
        walletType: primaryWallet.key !== "turnkeyhd" ? "EOA" : "SOCIAL",
      });

      localStorage.setItem("auth_signer", JSON.stringify(auth));
      Cookies.set("access_token", data.access_token, {
        expires: 4,
      });

      if (!data.user?.username) {
        setOpen(true);
      }

      toast.success("Signed in successfully", {
        id: "signing",
      });
    } catch (e) {
      toast.error("Error signing in", {
        id: "signing",
      });
      setSignedIn(false);
      localStorage.removeItem("auth_signer");
      Cookies.remove("access_token");
      if (user) {
        console.log("Error while logging in and user is present", e);
        handleLogOut();
      }
      console.error("Error logging in", e);
    } finally {
      toast.dismiss("signing");
      setSigningIn(false);
    }
  };

  useEffect(() => {
    if (isSignedIn || isLoading) return;
    if (isReadyToSign && user) {
      login(user);
    }
  }, [isReadyToSign, isSignedIn, isLoading, user]);

  useEffect(() => {
    if (user && isLoaded) {
      console.log("is ready to sign");
      setIsReadyToSign(true);
    }
  }, [user, isLoaded]);

  useEffect(() => {
    if (userData) {
      if (userData.username === "") {
        setOpen(true);
      }
    }
  }, [userData]);

  return (
    <AuthContext.Provider
      value={{
        userData: userData || {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
