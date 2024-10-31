import useSWR from "swr";
import { squidlAPI } from "../../api/squidl.js";
import { useEffect } from "react";
import { Spinner } from "@nextui-org/react";
import AssetItem from "../alias/AssetItem.jsx";
import { formatCurrency } from "@coingecko/cryptoformat";
import { useUser } from "../../providers/UserProvider.jsx";

export default function Assets() {
  const { assets } = useUser();

  const mergedAssets = assets?.aggregatedBalances
    ? [
      ...(assets.aggregatedBalances.native || []),
      ...(assets.aggregatedBalances.erc20 || []),
    ]
    : [];

  return (
    <div className={"relative flex w-full h-full"}>
      {!assets ? (
        <Spinner
          size="md"
          color="primary"
          className="flex items-center justify-center w-full h-40"
        />
      ) : mergedAssets.length > 0 ? (
        <div className="flex flex-col w-full">
          {mergedAssets.map((item, idx) => (
            <AssetItem
              key={idx}
              logoImg={
                item?.nativeToken ? item.nativeToken.logo : item.token.logo
              }
              balance={`${formatCurrency(
                item.balance,
                item?.nativeToken ? item.nativeToken.symbol : item.token.symbol,
                "de",
                true,
                {
                  significantFigures: 5,
                }
              )}`}
              chainName={item.chainName}
              chainLogo={item.chainLogo}
              priceUSD={formatCurrency(item.priceUSD, "USD", "en", false, {
                significantFigures: 5,
              })}
              tokenSymbol={
                item?.nativeToken ? item.nativeToken.symbol : item.token.symbol
              }
            />
          ))}
        </div>
      ) : (
        <div className="w-full flex items-center justify-center min-h-64">
          No assets found
        </div>
      )}
    </div>
  );
}
