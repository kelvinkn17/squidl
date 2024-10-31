import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { Button, Spinner } from "@nextui-org/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { QRCode } from "react-qrcode-logo";
import { useLoaderData, useParams } from "react-router-dom";
import useSWR from "swr";
import { squidlPublicAPI } from "../../api/squidl.js";
import { shortenAddress } from "../../utils/string.js";
import OnRampDialog from "../dialogs/OnrampDialog.jsx";
import SuccessDialog from "../dialogs/SuccessDialog.jsx";
import Chains from "../shared/Chains.jsx";
import { Icons } from "../shared/Icons.jsx";

export default function Payment() {
  const isLoggedIn = useIsLoggedIn();
  const loaderData = useLoaderData();

  const [openOnramp, setOpenOnramp] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const { setShowAuthFlow } = useDynamicContext();
  const { alias_url } = useParams();

  const alias = loaderData ? loaderData.subdomain : alias_url;

  console.log({ alias, loaderData });

  const [isAliasDataError, setAliasDataError] = useState(false);

  const { data: aliasData, isLoading: isLoadingAliasData } = useSWR(
    alias ? `/stealth-address/aliases/${alias}/detail` : null,
    async (url) => {
      try {
        const { data } = await squidlPublicAPI.get(url);
        console.log("aliasData", data);
        return data;
      } catch (error) {
        console.error("Error fetching alias data", error);
        setAliasDataError(true);
        return null;
      }
    }
  );

  const onCopy = (text) => {
    toast.success("Copied to clipboard", {
      id: "copy",
      duration: 1000,
      position: "bottom-center",
    });
    navigator.clipboard.writeText(text);
  };

  const sendTx = async () => {
    toast.loading("Processing transaction...", {
      id: "send",
      position: "bottom-center",
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success("Transaction completed successfully!", {
      id: "send",
      duration: 1000,
      position: "bottom-center",
    });

    setOpenSuccess(true);
  };

  return (
    <>
      <SuccessDialog
        open={openSuccess}
        setOpen={setOpenSuccess}
        botButtonHandler={() => {
          setOpenSuccess(false);
        }}
        botButtonTitle={"Done"}
        title={"Transaction Successful"}
        caption={"Your transaction has been submitted successfully."}
      />

      <OnRampDialog
        open={openOnramp}
        setOpen={setOpenOnramp}
        targetWallet={"0x02919065a8Ef7A782Bb3D9f3DEFef2FA0a4d1f37"}
        onSuccessOnramp={() => {
          sendTx();
        }}
      />

      <div
        className={
          "flex flex-col w-full max-w-md h-full max-h-screen items-center justify-center gap-5"
        }
      >
        <div className="w-36">
          <img
            src="/assets/squidl-logo.svg"
            alt="squidl-logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Content Rendering */}
        <div className="w-full h-full flex items-center justify-center">
          {/* Loading State */}
          {isLoadingAliasData && (
            <div className="my-10 flex flex-col items-center">
              <Spinner color="primary" />
              <div className="mt-5 animate-pulse">Fetching the address...</div>
            </div>
          )}

          {/* Error State */}
          {isAliasDataError && (
            <div className="text-center max-w-[16rem]">
              Failed to fetch the info, make sure to check the link and try
              again.
            </div>
          )}

          {/* Success State */}
          {!isLoadingAliasData && aliasData && !isAliasDataError && (
            <div className="bg-light-white rounded-[32px] py-9 px-10 md:px-20 flex flex-col items-center justify-center w-full h-full">
              <h1 className="font-medium text-xl">
                Send to{" "}
                <span className="font-semibold text-primary">
                  {aliasData.user.username}
                </span>
              </h1>

              <Chains />

              <div className="bg-primary rounded-3xl mt-7 p-5 flex flex-col items-center justify-center gap-4 w-full">
                <div className="w-full bg-white overflow-hidden p-1 rounded-xl">
                  <QRCode
                    value={aliasData.stealthAddress.address}
                    qrStyle="dots"
                    logoImage="/assets/nouns.png"
                    logoHeight={30}
                    logoWidth={30}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>

                <div className="flex flex-row items-center gap-2.5">
                  <h1 className="font-medium text-lg text-[#F4F4F4]">
                    {aliasData.stealthAddress.ens}
                  </h1>
                  <button onClick={() => onCopy(aliasData.stealthAddress.ens)}>
                    <Icons.copy className="text-primary-200" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4 mt-4 items-center justify-center w-full">
                <div className="flex bg-white rounded-[30.5px] gap-4 w-full items-center justify-between">
                  <h1 className="text-[#19191B] font-medium px-4 py-3">
                    {shortenAddress(aliasData.stealthAddress.address)}
                  </h1>
                  <button
                    onClick={() => onCopy(aliasData.stealthAddress.address)}
                    className="flex p-3 bg-light rounded-full m-1"
                  >
                    <Icons.copy className="text-primary size-6" />
                  </button>
                </div>

                <p className="text-[#A1A1A3]">or</p>

                {/* OnRamp */}
                {isLoggedIn ? (
                  <Button
                    onClick={() => setOpenOnramp(true)}
                    className="bg-primary text-[#F4F4F4] font-bold py-5 px-6 h-16 w-full rounded-[32px]"
                  >
                    Pay with Credit Card
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowAuthFlow(true)}
                    className="bg-primary text-[#F4F4F4] font-bold py-5 px-6 h-16 w-full rounded-[32px]"
                  >
                    Log in to pay with a credit card
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
