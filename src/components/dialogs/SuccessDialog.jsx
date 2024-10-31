import { Button, Modal, ModalContent, Spinner } from "@nextui-org/react";
import { Icons } from "../shared/Icons.jsx";

const confettiConfig = {
  angle: 90, // Angle at which the confetti will explode
  spread: 300, // How much area the confetti will cover
  startVelocity: 20, // Starting speed of the particles
  elementCount: 60, // Number of confetti pieces
  dragFriction: 0.1, // Drag friction applied to particles
  duration: 3000, // How long the confetti effect lasts
  stagger: 3, // Delay between confetti particle launch
  width: "8px", // Width of confetti pieces
  height: "8px", // Height of confetti pieces
  perspective: "500px", // Perspective value for 3D effect
};
import Confetti from "react-dom-confetti";
import { useEffect, useState } from "react";
import { shortenAddress } from "../../utils/string.js";
import SuccessLottie from "../../assets/lottie/success.json";
import Lottie from "react-lottie";

export default function SuccessDialog({
  open,
  setOpen,
  title,
  caption,
  topButtonHandler,
  topButtonTitle,
  botButtonHandler,
  botButtonTitle,
  successData
}) {
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  useEffect(() => {
    setConfettiTrigger((_) => open);
  }, [open]);

  const successLottieOptions = {
    loop: false,
    autoplay: true,
    animationData: SuccessLottie,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    }
  }


  return (
    <>
      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        size="md"
        placement="center"
        hideCloseButton
        isDismissable={false}
      >
        <ModalContent className="relative flex flex-col rounded-4xl items-center justify-center gap-6 p-6">
          {successData ?
            <div className="flex flex-col gap-6 w-full">
              <div className="flex items-center justify-between gap-3 w-full">
                <h1 className="font-bold text-xl">
                  {successData.type === "PRIVATE_TRANSFER" && "🕵️‍♂️ Private Transfer Successful!"}
                  {successData.type === "PUBLIC_TRANSFER" && "💸 Transfer Successful!"}
                </h1>
                <button
                  onClick={() => setOpen(false)}
                  className="bg-[#F8F8F8] rounded-full p-3"
                >
                  <Icons.close className="text-black size-6" />
                </button>
              </div>

              {successData.type === "PRIVATE_TRANSFER" &&
                <video
                  src={"/assets/spy.mp4"}
                  loop
                  autoPlay
                  muted
                  playsInline
                  controls={false}
                  className="object-contain w-full h-full rounded-full overflow-hidden"
                  style={{
                    pointerEvents: "none",
                    userSelect: "none",
                    touchAction: "none",
                  }}
                />
              }

              {successData.type === "PUBLIC_TRANSFER" &&
                <Lottie
                  options={successLottieOptions}
                  height={200}
                  width={200}
                />
              }

              <div
                className="bg-white p-2 py-4 rounded-xl shadow-xl shadow-black/10 w-full flex flex-col items-center border border-black/5"
              >
                <div className="font-light text-sm">
                  Your transfer of
                </div>

                <div className="flex flex-row items-center gap-2 mt-2">
                  <div className="text-xl font-medium">
                    {successData.amount}
                  </div>

                  <div className="flex flex-row items-center gap-1">
                    <img
                      src={successData.token?.nativeToken ? successData.token.nativeToken.logo : successData.token.token.logo}
                      alt=""
                      className="w-6 h-6 -mt-1 rounded-full"
                    />
                    <div className="font-medium text-xl">
                      {successData.token?.nativeToken ? successData.token.nativeToken.symbol : successData.token.token.symbol}
                    </div>
                  </div>

                </div>

                <div className="font-light mt-2 text-sm">
                  Was successfully sent to
                </div>

                <div className="flex flex-row items-center">
                  <div>
                    {shortenAddress(successData.destinationAddress)}&nbsp;
                  </div>

                  <div>
                    on {successData.chain.name}
                  </div>
                </div>

                {successData.type === "PRIVATE_TRANSFER" &&
                  <p className="text-xs opacity-60 mt-4">
                    Bridged through Celer, the process may take up to 20 minutes.
                  </p>
                }
              </div>

              {successData.type === "PRIVATE_TRANSFER" &&
                <p className="text-xs text-center opacity-60">
                  Your token is now private, secured with iluminneX{"'"}s private wrapped token. Enjoy unmatched privacy without any ties back to you.
                </p>
              }

              <div className="flex flex-col gap-2 w-full">
                {topButtonHandler && (
                  <Button
                    onClick={topButtonHandler}
                    className="text-[#19191B] font-sm h-14 w-full rounded-4xl bg-light-white"
                  >
                    {topButtonTitle}
                  </Button>
                )}
                <Button
                  onClick={botButtonHandler}
                  className="text-white font-sm h-14 w-full rounded-4xl bg-primary"
                >
                  {botButtonTitle}
                </Button>
              </div>
              <div className="absolute inset-0 overflow-hidden flex flex-col items-center mx-auto pointer-events-none">
                <Confetti
                  active={confettiTrigger}
                  config={confettiConfig}
                  className="-translate-y-[4rem] translate-x-[0.4rem]"
                />
              </div>
            </div>
            :
            <div>
              <Spinner color="primary" size="lg" />
            </div>
          }
        </ModalContent>
      </Modal>
    </>
  );
}
