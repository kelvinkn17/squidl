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
import { useEffect, useMemo, useState } from "react";
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
import { shortenId } from "../../utils/formatting-utils.js";
import SquidLogo from "../../assets/squidl-logo.svg?react";
import { shortenAddress } from "../../utils/string.js";
import { useWeb3 } from "../../providers/Web3Provider.jsx";
import { squidlAPI } from "../../api/squidl.js";
import AssetItem from "./AssetItem.jsx";
import { format } from "date-fns";
import { formatCurrency } from "@coingecko/cryptoformat";

export default function AliasDetail() {
  const navigate = useNavigate();
  const setBack = useSetAtom(isBackAtom);
  const userWallets = useUserWallets();
  const { fullAlias } = useLoaderData();
  const { alias, parent } = useParams();
  const [searchParams] = useSearchParams();
  const scheme = searchParams.get("scheme");

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

  const [assets, setAssets] = useState(null);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState(0);
  const [isLoadingAssets, setLoadingAssets] = useState(false);

  const {
    data: aliasDetailData,
    isLoading: isLoadingAlias,
    mutate: mutateAliasData,
  } = useSWR(`/stealth-address/aliases/${alias}/detail`, async (url) => {
    const { data } = await squidlAPI.get(url);
    console.log("aliasData", data);
    return data;
  });

  const {
    data: transactionsData,
    isLoading: isLoadingTransactionsData,
    mutate: mutateTransactionsData,
  } = useSWR(`/user/wallet-assets/${fullAlias}/transactions`, async (url) => {
    const { data } = await squidlAPI.get(url);
    return data;
  });

  async function getAssets() {
    setLoadingAssets(true);
    try {
      const { data } = await squidlAPI.get(
        `/user/wallet-assets/${fullAlias}/assets`
      );
      console.log({ assets: data });
      setAssets([
        ...data.aggregatedBalances.native,
        ...data.aggregatedBalances.erc20,
      ]);
      setTotalBalanceUSD(data.totalBalanceUSD);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingAssets(false);
    }
  }

  const groupedTransactions = useMemo(() => {
    return transactionsData?.reduce((acc, tx) => {
      const dateKey = format(new Date(tx.createdAt), "MM/dd/yyyy");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(tx);
      return acc;
    }, {});
  }, [transactionsData]);

  useEffect(() => {
    mutateAliasData();
    getAssets();
  }, []);

  useEffect(() => {
    const interval = setInterval(mutateTransactionsData, 10000);

    return () => clearInterval(interval);
  }, [mutateTransactionsData]);

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
        className="absolute inset-0 bg-light-white "
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
          <Nounsies address={fullAlias} />
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
                onCopy(`${fullAlias}`);
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

          {isLoadingAssets ? (
            <Skeleton className="rounded-lg w-14 h-8 absolute top-1/2 -translate-y-1/2" />
          ) : (
            <h1
              className={cnm(
                "absolute top-1/2 -translate-y-1/2 text-white font-extrabold text-2xl",
                scheme === "1" && "text-black"
              )}
            >
              {formatCurrency(totalBalanceUSD, "USD", "en", false, {
                significantFigures: 5,
              })}
            </h1>
          )}

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
          <Tooltip content={<p>{aliasDetailData?.stealthAddress?.address}</p>}>
            <p className="font-medium text-[#19191B] py-2 px-3">{`${shortenAddress(
              aliasDetailData?.stealthAddress?.address
            )}`}</p>
          </Tooltip>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              mutateAliasData();
            }}
            className="bg-light rounded-full p-3"
          >
            <Icons.refresh className="text-primary size-6" />
          </button>

          <button
            onClick={() => {
              onCopy(aliasDetailData?.stealthAddress?.address);
            }}
            className="bg-light rounded-full p-3"
          >
            <Icons.copy className="text-primary size-6" />
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
          ) : assets && assets.length > 0 ? (
            <div className="flex flex-col w-full">
              {assets.map((item, idx) => {
                return (
                  <AssetItem
                    key={idx}
                    logoImg={
                      item?.nativeToken
                        ? item.nativeToken.logo
                        : item.token.logo
                    }
                    balance={`${formatCurrency(
                      item.balance,
                      item?.nativeToken
                        ? item.nativeToken.symbol
                        : item.token.symbol,
                      "de",
                      true,
                      {
                        significantFigures: 5,
                      }
                    )}`}
                    chainName={item.chainName}
                    chainLogo={item.chainLogo}
                    priceUSD={formatCurrency(
                      item.priceUSD,
                      "USD",
                      "en",
                      false,
                      { significantFigures: 5 }
                    )}
                    tokenSymbol={
                      item?.nativeToken
                        ? item.nativeToken.symbol
                        : item.token.symbol
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center h-48">
              No assets found
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="flex flex-col w-full gap-3">
          <h1 className="font-bold text-[#19191B] text-lg">Transactions</h1>
          {isLoadingTransactionsData ? (
            <Spinner
              size="md"
              color="primary"
              className="flex items-center justify-center w-full h-40"
            />
          ) : transactionsData && transactionsData.length > 0 ? (
            <div className="flex flex-col w-full">
              {Object.keys(groupedTransactions).map((date) => (
                <div key={date} className="mb-4">
                  <p className="text-[#A1A1A3] font-medium text-sm mt-1">
                    {date}
                  </p>
                  {groupedTransactions[date].map((tx, idx) => {
                    return (
                      <TxItem
                        key={idx}
                        tokenImg={
                          tx.isNative
                            ? tx.chain.nativeToken.logo
                            : tx.token.logo
                        }
                        chainImg={
                          tx.chain.imageUrl
                            ? tx.chain.imageUrl
                            : "/assets/line-logo.png"
                        }
                        title={"Receive"}
                        subtitle={`from ${shortenId(tx.fromAddress)}`}
                        value={`+${formatCurrency(
                          tx.amount,
                          tx.isNative
                            ? tx.chain.nativeToken.symbol
                            : tx.token.symbol,
                          "de",
                          false,
                          { significantFigures: 5 }
                        )}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center h-48">
              No transactions found
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
