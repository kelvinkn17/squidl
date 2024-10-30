import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "../hooks/use-session";
import { squidlAPI } from "../api/squidl";
import useSWR from "swr";
import { useAuth } from "./AuthProvider";
import toast from "react-hot-toast";
import { useLocalStorage } from "@uidotdev/usehooks";

const UserContext = createContext({
  assets: {},
  userData: {},
});

export default function UserProvider({ children }) {
  const { isSignedIn } = useSession();
  const { userData } = useAuth();
  const [assets, setAssets] = useLocalStorage("user-assets", null);

  const handleFetchAssets = async () => {
    try {
      console.log(`Fetching assets for ${userData.username}.squidl.eth`, {
        userData,
      });

      const res = await squidlAPI.get(
        `/user/wallet-assets/${userData.username}.squidl.eth/assets`
      );

      console.log("User assets", res.data);
      setAssets(res.data);
    } catch (error) {
      console.error("Error fetching user assets", error);
      toast.error("Error fetching user assets");
    }
  };

  useEffect(() => {
    console.log("assets", assets);
  }, [assets]);

  useEffect(() => {
    if (isSignedIn && userData && userData?.username) {
      // Fetch assets every 10 seconds
      handleFetchAssets();

      const interval = setInterval(() => {
        handleFetchAssets();
      }, 20000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [isSignedIn, userData]);

  return (
    <UserContext.Provider
      value={{
        assets: assets,
        userData: userData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  return useContext(UserContext);
};
