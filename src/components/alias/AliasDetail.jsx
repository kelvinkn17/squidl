import { Button, Skeleton, Spinner, Tooltip } from "@nextui-org/react";
import { Icons } from "../shared/Icons.jsx";
import TxItem from "./TxItem.jsx";
import toast from "react-hot-toast";
import {
  useLoaderData,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { isBackAtom } from "../../store/payment-card-store.js";
import { useUserWallets } from "@dynamic-labs/sdk-react-core";
import Nounsies from "../shared/Nounsies.jsx";
import useSWR from "swr";
import {
  AVAILABLE_CARDS_BG,
  CARDS_SCHEME,
} from "../home/dashboard/PaymentLinksDashboard.jsx";
import { cnm } from "../../utils/style.js";
import { formatCurrency, shortenId } from "../../utils/formatting-utils.js";
import SquidLogo from "../../assets/squidl-logo.svg?react";
import { shortenAddress } from "../../utils/string.js";
import { useWeb3 } from "../../providers/Web3Provider.jsx";
import { squidlAPI } from "../../api/squidl.js";

export default function AliasDetail() {
  const navigate = useNavigate();
  const setBack = useSetAtom(isBackAtom);
  const userWallets = useUserWallets();
  const { fullAlias, aliasId } = useLoaderData();
  const { alias, parent } = useParams();
  const [searchParams] = useSearchParams();
  const scheme = searchParams.get("scheme");

  const { contract } = useWeb3();

  console.log(fullAlias);

  const layoutId = `payment-card-${alias}-${parent}`;

  const onCopy = (text) => {
    toast.success("Copied to clipboard", {
      id: "copy",
      duration: 1000,
      position: "bottom-center",
    });
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: user, isLoading } = useSWR("/auth/me", async (url) => {
    const { data } = await squidlAPI.get(url);
    return data;
  });

  const [aliasAddress, setAliasAddress] = useState(null);
  const [metaAdd, setMetaAdd] = useState(null);
  const [isLoadingAlias, setLoading] = useState(false);
  const [assets, setAssets] = useState(null);
  const [isLoadingAssets, setLoadingAssets] = useState(false);

  async function generateStealthAddress() {
    setLoading(true);
    try {
      const auth = localStorage.getItem("auth_signer");
      if (!auth) {
        return toast.error("Signer not available");
      }
      const [metaAddress] = await contract.getMetaAddress.staticCall(
        JSON.parse(auth),
        0
      );
      const [address1, ePub1, tag1] =
        await contract.generateStealthAddress.staticCall(metaAddress, 0);

      console.log(address1);
      setAliasAddress(address1);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function getMetaadd(params) {
    const authSigner = localStorage.getItem("auth_signer");
    const [metaAddress, spendPub, viewingPub] =
      await contract.getMetaAddress.staticCall(JSON.parse(authSigner), 0);
    setMetaAdd(metaAddress);
  }

  async function getAssets() {
    setLoadingAssets(true);
    try {
      const res = await squidlAPI.get(`/user/wallet-assets/${aliasId}`);

      setAssets(res.data.data.tokenAssets);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingAssets(false);
    }
  }

  useEffect(() => {
    generateStealthAddress();
    getMetaadd();
    getAssets();
  }, []);

  return (
    <div
      className={
        "relative flex flex-col w-full max-w-md items-start justify-center overflow-hidden rounded-[32px] p-4 md:p-6 gap-6"
      }
    >
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
          transition: {
            duration: 0.6,
          },
        }}
        className="absolute inset-0 bg-[#F9F9FA] "
      />

      <motion.div
        initial={{
          y: "2rem",
          opacity: 0,
        }}
        animate={{
          y: "0",
          opacity: 1,
          transition: {
            duration: 0.6,
          },
        }}
        className="relative flex items-center justify-between w-full"
      >
        <Button
          onClick={() => {
            setBack({
              isBack: true,
              layoutId,
            });
            navigate(-1);
          }}
          className="flex items-center gap-1 bg-white rounded-[21px] h-10 pl-3 pr-4"
        >
          <Icons.back className="text-black" />
          <p className="font-bold text-sm text-[#19191B]">Back</p>
        </Button>

        <div className="size-10 p-2 bg-white rounded-full flex items-center justify-center">
          <Icons.allChain className="text-black" />
        </div>
      </motion.div>

      {/* Card */}

      <motion.div
        layout
        layoutId={layoutId}
        transition={{ duration: 0.4 }}
        className="relative w-full h-full"
      >
        <img
          src={AVAILABLE_CARDS_BG[CARDS_SCHEME[scheme]]}
          alt="card-placeholder"
          className="absolute w-full h-full object-cover rounded-2xl"
        />

        <div className="absolute right-5 top-5 size-12 rounded-full overflow-hidden">
          <Nounsies address={userWallets[0]?.address || ""} />
        </div>

        <div className="relative w-full h-52 md:h-60 flex flex-col items-center justify-start py-7 px-6">
          <div className="flex flex-row gap-2 items-center mr-auto">
            <h1
              className={cnm(
                "text-white font-bold",
                scheme === "1" && "text-black"
              )}
            >
              {fullAlias}
            </h1>

            <button
              onClick={async () => {
                onCopy(`http://localhost:5173/payment/${metaAdd}`);
              }}
            >
              <Icons.copy
                className={cnm(
                  "size-4",
                  scheme === "1" ? "text-[#848484]" : "text-white"
                )}
              />
            </button>
          </div>

          <h1
            className={cnm(
              "absolute top-1/2 -translate-y-1/2 text-white font-extrabold text-2xl",
              scheme === "1" && "text-black"
            )}
          >
            $0
          </h1>

          <div className="absolute left-5 bottom-6 flex items-center justify-between">
            <h1
              className={cnm(
                "font-bold text-2xl",
                scheme === "1" ? "text-[#484B4E]" : "text-white"
              )}
            >
              SQUIDL
            </h1>
          </div>

          <div className="absolute right-5 bottom-6 flex items-center justify-between">
            <SquidLogo
              className={cnm(
                "w-12 ",
                scheme === "1" ? "fill-black" : "fill-white"
              )}
            />
          </div>
        </div>
      </motion.div>

      {/* address */}

      <motion.div
        initial={{
          y: "2rem",
          opacity: 0,
        }}
        animate={{
          y: "0",
          opacity: 1,
          transition: {
            duration: 0.6,
          },
        }}
        className="relative bg-white rounded-[30.5px] p-2 flex items-center justify-between w-full"
      >
        {isLoadingAlias ? (
          <Skeleton className="flex rounded-full w-32 h-5 ml-4" />
        ) : (
          <Tooltip content={<p>{aliasAddress}</p>}>
            <p className="font-medium text-[#19191B] py-2 px-3">{`${shortenAddress(
              aliasAddress
            )}`}</p>
          </Tooltip>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              generateStealthAddress();
            }}
            className="bg-[#E9ECFC] rounded-full p-3"
          >
            <Icons.refresh className="text-[#563EEA] size-6" />
          </button>

          <button
            onClick={() => {
              onCopy(aliasAddress);
            }}
            className="bg-[#E9ECFC] rounded-full p-3"
          >
            <Icons.copy className="text-[#563EEA] size-6" />
          </button>
        </div>
      </motion.div>

      <motion.div
        className="relative flex flex-col gap-6 w-full"
        initial={{
          y: "2rem",
          opacity: 0,
        }}
        animate={{
          y: "0",
          opacity: 1,
          transition: {
            duration: 0.6,
          },
        }}
      >
        <div className="flex gap-4 items-center w-full">
          <Button className="h-14 bg-[#19191B] w-full rounded-[42px] font-bold text-white">
            Share
          </Button>
          <Button
            onClick={() => navigate("/alias/transfer")}
            className="h-14 bg-[#19191B] w-full rounded-[42px] font-bold text-white"
          >
            Transfer
          </Button>
        </div>

        {/* Assets */}
        <div className="flex flex-col w-full gap-3">
          <h1 className="font-bold text-[#19191B] text-lg">Assets</h1>

          {isLoadingAssets ? (
            <Spinner
              size="md"
              color="primary"
              className="flex items-center justify-center w-full h-40"
            />
          ) : (
            assets && (
              <div className="flex flex-col w-full">
                {assets.map((item, idx) => {
                  return (
                    <TxItem
                      key={idx}
                      tokenImg={item.logo}
                      chainImg={"/assets/eth-logo.png"}
                      title={item.name}
                      subtitle={"Ethereum"}
                      value={formatCurrency(item.amount, item.symbol)}
                      subValue={formatCurrency(item.amountUSD, "USD")}
                    />
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Transactions */}
        <div className="flex flex-col w-full gap-3">
          <h1 className="font-bold text-[#19191B] text-lg">Transactions</h1>
          <p className="text-[#A1A1A3] font-medium text-sm mt-1">09/20/2024</p>
          <div className="flex flex-col w-full">
            <TxItem
              tokenImg={"/assets/eth-logo.png"}
              chainImg={"/assets/line-logo.png"}
              title={"Receive"}
              subtitle={`from ${shortenId(
                "0x02919065a8Ef7A782Bb3D9f3DEFef2FA0a4d1f37"
              )}`}
              value={"0.0001"}
            />

            <TxItem
              tokenImg={"/assets/usdc-logo.png"}
              chainImg={"/assets/eth-logo.png"}
              title={"Receive"}
              subtitle={`from ${shortenId(
                "0x02919065a8Ef7A782Bb3D9f3DE5ef2FA0a4d1f47"
              )}`}
              value={"0.005"}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
