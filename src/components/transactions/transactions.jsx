import useSWR from "swr";
import TxItem from "../alias/TxItem.jsx";
import { Icons } from "../shared/Icons.jsx";
import { squidlAPI } from "../../api/squidl.js";
import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import { formatCurrency, shortenId } from "../../utils/formatting-utils.js";
import { Spinner } from "@nextui-org/react";

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
      ? `/user/wallet-assets/${user.username}.squidl.me/transactions`
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
    <div
      className={
        "relative flex flex-col gap-2 w-full max-w-md items-start justify-center bg-[#F9F9FA] rounded-[32px] p-4 md:p-6"
      }
    >
      <div className="flex items-center justify-between w-full">
        <h1 className="font-bold text-lg text-[#19191B]">Transactions</h1>
        <div className="size-10 p-2 bg-white rounded-full flex items-center justify-center">
          <Icons.allChain className="text-black" />
        </div>
      </div>

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
                        ? "1"
                        : tx.stealthAddress.alias.alias
                    }
                    chainImg={
                      tx.chain.imageUrl
                        ? tx.chain.imageUrl
                        : "/assets/line-logo.png"
                    }
                    title={
                      tx.stealthAddress.alias.alias === "" ||
                      tx.stealthAddress.alias.alias === null
                        ? "Unknown"
                        : tx.stealthAddress.alias.alias
                    }
                    subtitle={`from ${shortenId(tx.fromAddress)}`}
                    value={formatCurrency(
                      tx.amount,
                      tx.isNative
                        ? tx.chain.nativeToken.symbol
                        : tx.token.symbol
                    )}
                    subValue={formatCurrency(
                      (tx.isNative
                        ? tx.chain.nativeToken.priceUSD
                        : tx.token.stats.priceUSD) * tx.amount,
                      "USD"
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
