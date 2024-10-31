import { Button } from "@nextui-org/react";
import { Icons } from "../components/shared/Icons.jsx";
import Transactions from "../components/transactions/transactions";
import { useNavigate } from "react-router-dom";
import Assets from "../components/assets/assets.jsx";

export default function MainBalancePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full items-start justify-center py-20 px-4 md:px-10">
      <div
        className={
          "relative flex flex-col gap-6 w-full max-w-md items-start justify-center bg-[#F9F9FA] rounded-[32px] p-4 md:p-6"
        }
      >
        <div className="flex items-center justify-between w-full">
          <Button
            onClick={() => {
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
        </div>

        <div className="flex flex-col w-full gap-3">
          <h1 className="font-bold text-[#19191B] text-lg">Assets</h1>
          <Assets />
        </div>

        <div className="flex flex-col w-full gap-3">
          <h1 className="font-bold text-[#19191B] text-lg">Transactions</h1>
          <Transactions />
        </div>
      </div>
    </div>
  );
}
