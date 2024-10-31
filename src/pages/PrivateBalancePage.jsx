import TxItem from "../components/alias/TxItem.jsx";
import { Icons } from "../components/shared/Icons.jsx";
import { shortenAddress } from "../utils/string";

export default function PrivateBalancePage() {
  return (
    <div className="flex min-h-screen w-full items-start justify-center py-32 px-4 md:px-10">
      <Transactions />
    </div>
  );
}

function Transactions() {
  return (
    <div className="overflow-hidden rounded-4xl bg-oasis-blue ">
      <div className="w-full rounded-2xl h-14 p flex items-center justify-center gap-2 text-sm text-white">
        <div className="bg-white size-6 rounded-xl">
          <img
            src="/assets/oasis-logo.png"
            alt="oasis-logo"
            className="w-full h-full object-contain"
          />
        </div>
        This transactions benefit oasis privacy protocol
      </div>
      <div
        className={
          "relative flex flex-col gap-2 w-full max-w-md items-start justify-center bg-light-white rounded-[32px] p-4 md:p-6"
        }
      >
        <div className="flex items-center justify-between w-full">
          <h1 className="font-bold text-lg text-[#19191B]">Transactions</h1>
          <div className="size-10 p-2 bg-white rounded-full flex items-center justify-center">
            <Icons.allChain className="text-black" />
          </div>
        </div>

        <p className="text-[#A1A1A3] font-medium text-sm mt-1">09/20/2024</p>

        <div className="flex flex-col w-full">
          <TxItem
            tokenImg={"/assets/eth-logo.png"}
            chainImg={"/assets/eth-logo.png"}
            title={"trivial.jane.squidl.me - Deposit"}
            isNounsies
            addressNounsies={"0x02919065a8Ef7A7826b3D9f3DEFef2FA0a4d1f34"}
            subtitle={`from ${shortenAddress(
              "0x19065a8Ef7A782Bb3D9f3DEFef2FA0a4d1f34"
            )}`}
            value={"0.512 USDC"}
            subValue={"$332"}
          />

          <TxItem
            tokenImg={"/assets/eth-logo.png"}
            chainImg={"/assets/eth-logo.png"}
            title={"xx.jane.squidl.me - Deposit"}
            isNounsies
            addressNounsies={"0x02919065a8Ef7A782Bb3D9f3DEFef2F230a4d1f34"}
            subtitle={`from ${shortenAddress(
              "0x02234065a8Ef7A782Bb3D9f3DEFef2FA0a4d1f32"
            )}`}
            value={"0.512 USDC"}
            subValue={"$3912"}
          />

          <TxItem
            tokenImg={"/assets/eth-logo.png"}
            chainImg={"/assets/eth-logo.png"}
            title={"zes.hui.squidl.me - Deposit"}
            isNounsies
            addressNounsies={"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}
            subtitle={`from ${shortenAddress(
              "0x06419065a8Ef7A782Bb3D9f3DEFef2FA0a4d1f35"
            )}`}
            value={"0.512 USDC"}
            subValue={"$12313"}
          />

          <TxItem
            tokenImg={"/assets/eth-logo.png"}
            chainImg={"/assets/eth-logo.png"}
            title={"pol.manda.squidl.me - Deposit"}
            isNounsies
            addressNounsies={"0x02919065a8Ef7A782Bb3D9f3134Fef2FA0a4d1f34"}
            subtitle={`from ${shortenAddress(
              "0x053249065a8Ef7A782Bb3D9f3DEFef2FA0a4d1f35"
            )}`}
            value={"0.512 USDC"}
            subValue={"$12313"}
          />

          <TxItem
            tokenImg={"/assets/eth-logo.png"}
            chainImg={"/assets/eth-logo.png"}
            title={"joi.mike.squidl.me - Deposit"}
            isNounsies
            addressNounsies={"0x49048044d57e1c92a77f79988d21fa8faf74e97e"}
            subtitle={`from ${shortenAddress(
              "0x09519065a8Ef7A782Bb3D9f3DEFef2FA0a4d1f35"
            )}`}
            value={"0.512 USDC"}
            subValue={"$12313"}
          />
        </div>
      </div>
    </div>
  );
}
