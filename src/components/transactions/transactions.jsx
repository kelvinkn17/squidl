import useSWR from "swr";
import TxItem from "../alias/TxItem.jsx";
import { Icons } from "../shared/Icons.jsx";
import { squidlAPI } from "../../api/squidl.js";
import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import { shortenId } from "../../utils/formatting-utils.js";
import { Spinner } from "@nextui-org/react";
import { formatCurrency } from "@coingecko/cryptoformat";

export default function Transactions() {
  const { data: user, isLoading } = useSWR("/auth/me", async (url) => {
    const { data } = await squidlAPI.get(url);
    return data;
  });

  const shouldFetchTransactions = user?.username ? true : false;

  const {
    data: transactionsData,
    isLoading: isLoadingTransactionsData,
    mutate: mutateTransactionsData,
  } = useSWR(
    shouldFetchTransactions
      ? `/user/wallet-assets/${user?.username}.squidl.me/aggregated-transactions`
      : null,
    async (url) => {
      const { data } = await squidlAPI.get(url);
      return data;
    }
  );

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
    if (!mutateTransactionsData) return;

    const interval = setInterval(() => {
      mutateTransactionsData();
    }, 10000);

    return () => clearInterval(interval);
  }, [mutateTransactionsData]);

  return (
    <div className={"relative flex h-full w-full"}>
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
              <p className="text-[#A1A1A3] font-medium text-sm mt-1">{date}</p>
              {groupedTransactions[date].map((tx, idx) => {
                return (
                  <TxItem
                    key={idx}
                    isNounsies
                    addressNounsies={
                      tx.stealthAddress.alias.alias === "" ||
                      tx.stealthAddress.alias.alias === null
                        ? `${user?.username}.squidl.me`
                        : `${tx.stealthAddress.alias.alias}.${user?.username}.squidl.me`
                    }
                    chainImg={
                      tx.chain.imageUrl
                        ? tx.chain.imageUrl
                        : "/assets/line-logo.png"
                    }
                    title={
                      tx.stealthAddress.alias.alias === "" ||
                      tx.stealthAddress.alias.alias === null
                        ? `${user?.username}.squidl.me`
                        : `${tx.stealthAddress.alias.alias}.${user?.username}.squidl.me`
                    }
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
                    subValue={formatCurrency(
                      parseFloat(
                        tx.isNative
                          ? tx.chain.nativeToken.priceUSD
                          : tx.token.stats.priceUSD
                      ) * parseFloat(tx.amount),
                      "USD",
                      "en",
                      false,
                      { significantFigures: 5 }
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full flex items-center justify-center min-h-64">
          No transactions found
        </div>
      )}
    </div>
  );
}
