import toast from "react-hot-toast";

export const handleKeyDown = (e) => {
  if (
    !/[0-9.]/.test(e.key) &&
    e.key !== "Backspace" &&
    e.key !== "Tab" &&
    e.key !== "ArrowLeft" &&
    e.key !== "ArrowRight" &&
    e.key !== "Delete"
  ) {
    e.preventDefault();
  }
};

export const onCopy = (text) => {
  toast.success("Copied to clipboard", {
    id: "copy",
    duration: 1000,
    position: "bottom-center",
  });
  navigator.clipboard.writeText(text);
};


export const confirmTransaction = async ({
  txHash,
  provider,
  interval = 2000,
  timeout = 30000,
}) => {
  const startTime = Date.now();

  // Helper function to check if timeout has occurred
  const hasTimedOut = () => Date.now() - startTime >= timeout;

  // Polling function to check transaction status
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(async () => {
      try {
        // Check if the transaction has been confirmed
        const receipt = await provider.getTransactionReceipt(txHash);
        console.log("receipt", receipt);

        if (receipt && receipt.status === 1) {
          clearInterval(intervalId); // Stop polling if confirmed
          resolve(receipt); // Return the transaction receipt
        } else if (hasTimedOut()) {
          clearInterval(intervalId); // Stop polling if timeout reached
          reject(new Error(`Transaction ${txHash} not confirmed within timeout.`));
        }
      } catch (error) {
        clearInterval(intervalId); // Stop polling in case of error
        reject(new Error(`Error while checking transaction ${txHash}: ${error.message}`));
      }
    }, interval);
  });
}
