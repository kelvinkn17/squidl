import { Button } from "@nextui-org/react";
import { Link } from "react-router-dom";
import { Icons } from "./Icons.jsx";
import Nounsies from "./Nounsies.jsx";
import {
  DynamicUserProfile,
  useDynamicContext,
  useUserWallets,
} from "@dynamic-labs/sdk-react-core";
import { useSetAtom } from "jotai";
import { isCreateLinkDialogAtom } from "../../store/dialog-store.js";

export default function Header() {
  const setCreateLinkModal = useSetAtom(isCreateLinkDialogAtom);

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
          onClick={() => setCreateLinkModal(true)}
          className={"bg-primary h-12 rounded-[24px] px-4"}
        >
          <Icons.link className="text-white" />
          <h1 className={"text-sm font-medium text-white"}>Create Link</h1>
        </Button>

        <UserProfileButton />
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
