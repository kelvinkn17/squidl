import { Button, Modal, ModalContent } from "@nextui-org/react";
import { Icons } from "../shared/Icons.jsx";
import { motion } from "framer-motion";
import { cnm } from "../../utils/style.js";
import { formatCurrency } from "@coingecko/cryptoformat";
import { useUser } from "../../providers/UserProvider.jsx";

export default function TokenSelectionDialog({
  open,
  setOpen,
  assets,
  selectedToken,
  setSelectedToken,
  setAmount,
}) {
  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: open ? "100%" : 0 }}
      className="absolute z-50 bottom-0 left-0 w-full bg-light-white overflow-hidden rounded-[32px] flex flex-col items-center justify-start"
    >
      <div className="flex flex-col items-center justify-center w-full bg-light-white rounded-[32px] p-6">
        <Button
          onClick={() => setOpen(false)}
          className="absolute left-6 top-6 flex items-center gap-1 bg-white rounded-[21px] h-10 pl-3 pr-4"
        >
          <Icons.back className="text-black" />
          <p className="font-bold text-sm text-[#19191B]">Back</p>
        </Button>

        <h1 className="mt-2 text-[#161618] font-bold">Select Token</h1>
      </div>

      <div className="relative flex flex-col w-full flex-grow min-h-0">
        <div className="mt-2 px-6">
          <input
            className="flex h-16 px-6 w-full border-[2px] rounded-[16px] border-[#E4E4E4] bg-white transition-colors placeholder:text-[#A1A1A3] focus-visible:outline-none focus-visible:ring-none disabled:cursor-not-allowed disabled:opacity-50"
            // value={search}
            placeholder="Search by name or token symbol"
          />
        </div>
        <div className="flex flex-col w-full mt-4 overflow-y-auto flex-grow min-h-0 px-6 pb-6">
          {assets?.aggregatedBalances &&
            assets.aggregatedBalances.native.map((token, index) => {
              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedToken(token);
                    setOpen(false);
                    setAmount(token.balance);
                  }}
                  className={cnm(
                    "px-4 py-2 ",
                    selectedToken &&
                      selectedToken.id === token.id &&
                      "bg-neutral-100 rounded-xl"
                  )}
                >
                  <Token
                    tokenImg={token.nativeToken.logo}
                    chainImg={token.chainLogo}
                    title={token.nativeToken.name}
                    // isPrivate={isPrivate}
                    subtitle={token.chainName}
                    value={formatCurrency(
                      parseFloat(token.balance.toFixed(5)),
                      token.nativeToken.symbol,
                      "de",
                      false,
                      { significantFigures: 5 }
                    )}
                    subValue={formatCurrency(
                      token.priceUSD,
                      "USD",
                      "en",
                      false,
                      { significantFigures: 5 }
                    )}
                  />
                </button>
              );
            })}

          {assets?.aggregatedBalances &&
            assets.aggregatedBalances.erc20.map((token, index) => {
              return (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedToken(token);
                    setOpen(false);
                    setAmount(token.balance);
                  }}
                  className={cnm(
                    "px-4 py-2 ",
                    selectedToken &&
                      selectedToken.id === token.id &&
                      "bg-neutral-100 rounded-xl"
                  )}
                >
                  <Token
                    tokenImg={token.token.logo}
                    chainImg={token.chainLogo}
                    title={token.token.name}
                    // isPrivate={isPrivate}
                    subtitle={token.chainName}
                    value={formatCurrency(
                      parseFloat(token.balance.toFixed(5)),
                      token.token.symbol,
                      "de",
                      false,
                      { significantFigures: 5 }
                    )}
                    subValue={formatCurrency(
                      token.priceUSD,
                      "USD",
                      "en",
                      false,
                      { significantFigures: 5 }
                    )}
                  />
                </button>
              );
            })}
        </div>
      </div>
    </motion.div>
  );
}

function Token({
  tokenImg,
  chainImg,
  title,
  subtitle,
  isPrivate,
  value,
  subValue,
}) {
  return (
    <div className="flex gap-4 w-full py-3">
      <div className="relative size-12">
        <img src={tokenImg} alt="ic" className="object-contain w-full h-full" />
        <img
          src={chainImg}
          alt="ic"
          className="absolute top-0 -right-2 object-contain size-6"
        />
      </div>

      <div className="flex items-start justify-between w-full">
        <div className="flex gap-3">
          <div className="flex flex-col items-start">
            <h1 className="font-bold text-[#161618]">{title}</h1>
            {subtitle && (
              <p className="font-medium text-[#A1A1A3] text-sm">{subtitle}</p>
            )}
          </div>

          {isPrivate && (
            <div className="bg-oasis-blue h-6 flex items-center justify-center text-white font-bold text-xs px-2.5 rounded-full">
              Private Transfer
            </div>
          )}
        </div>

        <div className="flex flex-col text-end items-end">
          <h1 className="font-bold text-[#161618]">{value}</h1>
          {subValue && (
            <p className="font-medium text-[#A1A1A3] text-sm">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}
