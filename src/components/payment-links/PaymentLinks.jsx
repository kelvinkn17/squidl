import { motion } from "framer-motion";
import { cnm } from "../../utils/style.js";
import { useNavigate } from "react-router-dom";
import {
  AVAILABLE_CARDS_BG,
  CARDS_SCHEME,
} from "../home/dashboard/PaymentLinksDashboard.jsx";
import useSWR from "swr";
import { squidlAPI } from "../../api/squidl.js";
import { Button } from "@nextui-org/react";
import { useAtom } from "jotai";
import SquidLogo from "../../assets/squidl-logo.svg?react";
import { isCreateLinkDialogAtom } from "../../store/dialog-store.js";
import { useUser } from "../../providers/UserProvider.jsx";

export default function PaymentLinks() {
  const navigate = useNavigate();
  const [, setOpen] = useAtom(isCreateLinkDialogAtom);

  const { userData: user, assets } = useUser();

  return (
    <div
      className={
        "relative flex flex-col gap-9 w-full max-w-md items-start justify-center bg-light-white rounded-[32px] pb-6"
      }
    >
      <h1 className="text-[#19191B] font-medium text-lg px-6 pt-6">
        Recently Created
      </h1>

      <div className="w-full flex flex-col px-6">
        {assets && assets.aliasesList.length > 0 ? (
          assets.aliasesList.map((alias, idx) => {
            const bgImage = AVAILABLE_CARDS_BG[idx % AVAILABLE_CARDS_BG.length];
            const colorScheme = CARDS_SCHEME[idx % CARDS_SCHEME.length];

            const userAlias = alias.alias
              ? `${alias.alias}.${user?.username}`
              : user?.username;

            let cardName = "";
            if (alias.alias === "") {
              cardName = `${user?.username}.squidl.me`;
            } else {
              cardName = `${alias.alias}.${user?.username}.squidl.me`;
            }

            return (
              <motion.div
                key={idx}
                onClick={() =>
                  navigate(
                    `/${userAlias}/detail/1?scheme=${colorScheme}&id=${alias.id}`,
                    {
                      state: { layoutId: `payment-card-${userAlias}-1` },
                      preventScrollReset: false,
                    }
                  )
                }
                layout
                layoutId={`payment-card-${userAlias}-2`}
                transition={{ duration: 0.4 }}
                className={cnm(
                  "relative rounded-2xl h-52 md:h-60 w-full cursor-pointer overflow-hidden",
                  idx > 0 && "-mt-36 md:-mt-44"
                )}
                whileHover={{ rotate: -5, y: -20 }}
              >
                <img
                  src={bgImage}
                  alt="card-bg"
                  className="absolute w-full h-full object-cover rounded-[24px] inset-0"
                />

                <div
                  className={cnm(
                    "relative  px-6 py-5 w-full flex items-center justify-between",
                    `${bgImage === "/assets/card-2.png"
                      ? "text-black"
                      : "text-white"
                    }`
                  )}
                >
                  <p className="font-medium">
                    {cardName}
                  </p>
                  <p>${alias.balanceUSD.toLocaleString("en-US")}</p>
                </div>

                <div className="absolute left-5 bottom-6 flex items-center justify-between">
                  <h1
                    className={cnm(
                      "text-[#484B4E] font-bold text-2xl",

                      bgImage === "/assets/card-2.png"
                        ? "text-black"
                        : "text-white"
                    )}
                  >
                    SQUIDL
                  </h1>
                </div>

                <div className="absolute right-5 bottom-6 flex items-center justify-between">
                  <SquidLogo
                    className={cnm(
                      "w-12 ",
                      bgImage === "/assets/card-2.png"
                        ? "fill-black"
                        : "fill-white"
                    )}
                  />
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="w-full min-h-64 flex flex-col items-center justify-center gap-2 font-medium">
            <p>No payment links available yet</p>
            <Button
              onClick={() => {
                setOpen(true);
              }}
              className="px-4 py-2 rounded-full bg-primary text-white"
            >
              Create Payment Link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
