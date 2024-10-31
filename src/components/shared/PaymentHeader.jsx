import {
  DynamicUserProfile,
  useDynamicContext,
  useUserWallets,
} from "@dynamic-labs/sdk-react-core";
import { useSession } from "../../hooks/use-session.js";
import Nounsies from "./Nounsies.jsx";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@nextui-org/react";
import { useSetAtom } from "jotai";
import { isCreateLinkDialogAtom } from "../../store/dialog-store.js";
import { Icons } from "./Icons.jsx";

export default function PaymentHeader() {
  const { isSignedIn } = useSession();
  const setCreateLinkModal = useSetAtom(isCreateLinkDialogAtom);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 z-50 flex items-center px-5 md:px-12 h-20 justify-between bg-white md:bg-transparent w-full">
      <div className="flex flex-row items-center gap-12">
        <Link to={"/"} className="w-24">
          <img
            src="/assets/squidl-logo.svg"
            alt="squidl-logo"
            className="w-full h-full object-contain"
          />
        </Link>
      </div>

      <div className="flex gap-4 items-center justify-center">
        <Button
          onClick={() => {
            if (isSignedIn) {
              setCreateLinkModal(true);
            } else {
              navigate("/");
            }
          }}
          className={"bg-primary h-12 rounded-[24px] px-4"}
        >
          <Icons.link className="text-white" />
          <h1 className={"text-sm font-medium text-white"}>
            {isSignedIn ? "Create Link" : "Create your Squidl"}
          </h1>
        </Button>

        {isSignedIn && <UserProfileButton />}
      </div>
    </nav>
  );
}

const UserProfileButton = () => {
  const userWallets = useUserWallets();
  const { setShowDynamicUserProfile } = useDynamicContext();

  return (
    <div className={"flex flex-col"}>
      <button
        onClick={() => setShowDynamicUserProfile(true)}
        className="size-12 rounded-full overflow-hidden relative border-[4px] border-[#563EEA]"
      >
        <Nounsies address={userWallets[0]?.address || ""} />
      </button>

      <DynamicUserProfile variant={"dropdown"} />
    </div>
  );
};
