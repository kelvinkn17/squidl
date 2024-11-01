import { Button, Modal, ModalContent } from "@nextui-org/react";
import { Icons } from "../shared/Icons.jsx";
import toast from "react-hot-toast";
import Chains from "../shared/Chains.jsx";
import { QRCode } from "react-qrcode-logo";
import useSWR from "swr";
import { squidlAPI } from "../../api/squidl.js";
import { useRef } from "react";

export default function QrDialog({ open, setOpen, qrUrl }) {
  const { data: user, isLoading } = useSWR("/auth/me", async (url) => {
    const { data } = await squidlAPI.get(url);
    return data;
  });

  const qrRef = useRef(null);

  const onCopy = (text) => {
    toast.success("Copied to clipboard", {
      id: "copy",
      duration: 1000,
      position: "bottom-center",
    });
    navigator.clipboard.writeText(text);
  };

  const handleShare = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const file = new File([blob], "image.png", { type: blob.type });

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "Share Image",
          text: "Check out this image!",
          files: [file],
        });
        console.log("Image shared successfully!");
      } else {
        alert("Web Share API is not supported in your browser.");
      }
    } catch (error) {
      console.error("Error sharing the image:", error);
    }
  };

  const handleDownload = async () => {
    try {
      await qrRef.current.download();
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  };

  if (isLoading) return null;

  return (
    <Modal
      isOpen={open}
      onOpenChange={setOpen}
      size="md"
      placement="center"
      hideCloseButton
    >
      <ModalContent className="relative flex flex-col rounded-4xl items-center justify-center gap-5 p-6">
        <button
          onClick={() => setOpen(false)}
          className="absolute right-6 top-6 bg-[#F8F8F8] rounded-full p-3"
        >
          <Icons.close className="text-black size-6" />
        </button>

        <img
          src="/assets/squidl-logo.svg"
          alt="logo"
          className="object-contain w-auto h-10"
        />

        <h1 className="font-medium text-xl text-[#19191B]">Your QR Code</h1>

        <div className="px-5 md:px-12">
          <div className="bg-primary-600 rounded-[24px] px-5 py-4 flex flex-col items-center justify-center w-full">
            <div className="w-full h-full bg-white p-5 rounded-[24px]">
              <QRCode
                ref={qrRef}
                value={`${user?.username}.squidl.me`}
                qrStyle="dots"
                logoImage="/assets/nouns.png"
                logoWidth={30}
                logoHeight={30}
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </div>

            <div className="flex flex-row items-center gap-2.5 mt-3">
              <h1 className="font-medium text-lg text-[#F4F4F4]">
                {user?.username}.squidl.me
              </h1>
              <button onClick={() => onCopy(`${user?.username}.squidl.me`)}>
                <Icons.copy className="text-primary-200" />
              </button>
            </div>
          </div>
        </div>

        <Chains />

        <div className="flex w-full items-center gap-4 mt-2">
          <Button
            onClick={handleDownload}
            className="bg-primary rounded-4xl h-14 text-white text-sm w-full"
          >
            Download
          </Button>
          <Button
            onClick={handleShare}
            className="bg-light rounded-4xl h-14 text-primary text-sm w-full"
          >
            Share
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
