import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "../hooks/use-session";
import { squidlAPI } from "../api/squidl";
import { useAuth } from "./AuthProvider";
import toast from "react-hot-toast";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useListenEvent } from "../hooks/use-event";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const UserContext = createContext({
  assets: {},
  address: "",
  userData: {},
  refetchAssets: () => {},
  isAssetsLoading: false,
});

export default function UserProvider({ children }) {
  const { isSignedIn } = useSession();
  const { userData } = useAuth();
  const [assets, setAssets] = useLocalStorage("user-assets", null);
  const [isAssetsLoading, setAssetsLoading] = useState(false);
  const [isAssetsRefetching, setAssetsRefetching] = useState(false);
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address;

  const handleFetchAssets = async () => {
    if (isAssetsLoading) return;
    setAssetsLoading(true);
    try {
      console.log(`Fetching assets for ${userData.username}.squidl.eth`, {
        userData,
      });

      const res = await squidlAPI.get(
        `/user/wallet-assets/${userData.username}/all-assets`
      );

      setAssets(res.data);
    } catch (error) {
      console.error("Error fetching user assets", error);
      toast.error("Error fetching user assets");
    } finally {
      setAssetsLoading(false);
    }
  };

  const refetchAssets = async () => {
    if (isAssetsRefetching) return;
    setAssetsRefetching(true);
    try {
      console.log(`Fetching assets for ${userData.username}.squidl.eth`, {
        userData,
      });

      const res = await squidlAPI.get(
        `/user/wallet-assets/${userData.username}/all-assets`
      );

      setAssets(res.data);
    } catch (error) {
      console.error("Error fetching user assets", error);
      toast.error("Error fetching user assets");
    } finally {
      setAssetsRefetching(false);
    }
  };

  useListenEvent("create-link-dialog", () => {
    refetchAssets();
  });

  useEffect(() => {
    if (isSignedIn && userData && userData?.username) {
      // Fetch assets every 10 seconds
      handleFetchAssets();

      const interval = setInterval(() => {
        // handleFetchAssets();
      }, 5_000);

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
        refetchAssets: refetchAssets,
        isAssetsLoading,
        address,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  return useContext(UserContext);
};
