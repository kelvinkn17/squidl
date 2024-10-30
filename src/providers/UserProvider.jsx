import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "../hooks/use-session";
import { squidlAPI } from "../api/squidl";
import useSWR from "swr";
import { useAuth } from "./AuthProvider";
import toast from "react-hot-toast";


const UserContext = createContext({
  assets: {}
})

export default function UserProvider({ children }) {
  const { isSignedIn } = useSession()
  const { userData } = useAuth()
  const [assets, setAssets] = useState({})

  const handleFetchAssets = async () => {
    try {
      console.log(`Fetching assets for ${userData.username}.squidl.eth`)

      const res = await squidlAPI.get(
        `/user/wallet-assets/${userData.username}.squidl.eth/assets`
      )

      console.log('User assets', res.data)
      setAssets(res.data)
    } catch (error) {
      console.error('Error fetching user assets', error)
      toast.error('Error fetching user assets')
    }
  }

  useEffect(() => {
    if (isSignedIn && userData) {
      // Fetch assets every 10 seconds
      handleFetchAssets()

      const interval = setInterval(() => {
        handleFetchAssets()
      }, 10000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [isSignedIn, userData])

  return (
    <UserContext.Provider
      value={{
        assets: assets
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  return useContext(UserContext)
}