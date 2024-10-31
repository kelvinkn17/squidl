import { Link, useLocation } from "react-router-dom";
import { DollarSign, LayoutDashboard, Wallet } from "lucide-react";
import { cnm } from "../../utils/style.js";

export default function Navbar() {
  const location = useLocation();

  return (
    <div className="fixed z-50 bottom-0 left-0 w-full py-5 flex items-center justify-center">
      <div className="bg-light-white shadow-xl shadow-black/10 border border-black/20 rounded-full p-1 flex text-sm gap-2 font-medium">
        <Link
          to={"/"}
          className={cnm(
            "px-3 py-2 rounded-full flex items-center gap-1 transition-all duration-300",
            `${location.pathname == "/" ? "bg-primary text-white" : ""}`
          )}
        >
          <LayoutDashboard className="size-3" />
          Dashboard
        </Link>

        <Link
          to={"/payment-links"}
          className={cnm(
            "px-3 py-2 rounded-full flex items-center gap-1 transition-all duration-300",
            `${
              location.pathname == "/payment-links"
                ? "bg-primary text-white"
                : ""
            }`
          )}
        >
          <Wallet className="size-3" />
          Payment Links
        </Link>
        <Link
          to={"/transactions"}
          className={cnm(
            "px-3 py-2 rounded-full flex items-center gap-1 transition-all duration-300",
            `${
              location.pathname == "/transactions"
                ? "bg-primary text-white"
                : ""
            }`
          )}
        >
          <DollarSign className="size-3" />
          Transactions
        </Link>
      </div>
    </div>
  );
}
