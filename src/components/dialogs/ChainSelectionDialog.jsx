import { Button, Modal, ModalContent } from "@nextui-org/react";
import { Icons } from "../shared/Icons.jsx";
import { motion } from "framer-motion";
import { cnm } from "../../utils/style.js";

export default function ChainSelectionDialog({
  open,
  setOpen,
  chains,
  selectedChain,
  isPrivate,
  onSelectToken,
  setSelectedChain,
}) {
  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: open ? "100%" : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
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

        <h1 className="mt-2 text-[#161618] font-bold">Select Chain</h1>
      </div>

      <div className="relative flex flex-col w-full flex-grow min-h-0">
        <div className="flex flex-col w-full mt-4 overflow-y-auto flex-grow min-h-0 px-6 pb-6">
          {chains.map((chain, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedChain(chain);
                setOpen(false);
              }}
              className={cnm(
                "px-4 py-2 ",
                selectedChain &&
                  selectedChain.id === chain.id &&
                  "bg-neutral-100 rounded-xl"
              )}
            >
              <Chain
                key={idx}
                tokenImg={chain.tokenLogoUrl}
                chainImg={chain.imageUrl}
                title={chain.nativeToken}
                isPrivate={isPrivate}
                subtitle={chain.name}
                value={"0.512"}
                subValue={"$124.29"}
              />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Chain({
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
      <div className="flex items-center w-full gap-3">
        <div className="relative size-12">
          <img
            src={chainImg}
            alt="ic"
            className="object-contain w-full h-full"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex ">
            <h1 className="font-bold text-[#161618]">{subtitle}</h1>
          </div>

          {isPrivate && (
            <div className="bg-oasis-blue h-6 flex items-center justify-center text-white font-bold text-xs px-2.5 rounded-full">
              Private Transfer
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
