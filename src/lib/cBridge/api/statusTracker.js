import { getTransferStatus } from "./getData.js";

export const statusTracker = ({
  baseUrl,
  transferId,
  callback,
  statusCode,
}) => {
  let observerdStatus = statusCode || 0;

  return new Promise((resolve, reject) => {
    const handleStatusUpdate = (res) => {
      observerdStatus = res.status;

      switch (res.status) {
        case 1:
          console.info("cBRIDGE => TRANSFER_SUBMITTING");
          break;
        case 2:
          console.error("cBRIDGE => TRANSFER_FAILED");
          console.log("Tx Details: ", res);
          clearInterval(interval);
          reject(new Error("TRANSFER_FAILED"));
          break;
        case 3:
          console.info("cBRIDGE => TRANSFER_WAITING_FOR_SGN_CONFIRMATION");
          break;
        case 4:
          console.info("cBRIDGE => TRANSFER_WAITING_FOR_FUND_RELEASE");
          break;
        case 5:
          console.log("cBRIDGE => TRANSFER_COMPLETED");
          console.log("Tx Details: ", res);
          clearInterval(interval);
          resolve(res); // Resolve promise on success
          break;
        case 6:
          console.warn("cBRIDGE => TRANSFER_TO_BE_REFUNDED");
          console.log("Initiate the Refund process.");
          console.log("Tx Details: ", res);
          clearInterval(interval);
          callback?.(res);
          reject(new Error("TRANSFER_TO_BE_REFUNDED"));
          break;
        case 7:
          console.info("cBRIDGE => TRANSFER_REQUESTING_REFUND");
          break;
        case 8:
          console.warn("cBRIDGE => TRANSFER_REFUND_TO_BE_CONFIRMED");
          callback?.(res);
          break;
        case 9:
          console.info("cBRIDGE => TRANSFER_CONFIRMING_YOUR_REFUND");
          break;
        case 10:
          console.log("cBRIDGE => TRANSFER_REFUNDED");
          console.log("Tx Details: ", res);
          clearInterval(interval);
          reject(new Error("TRANSFER_REFUNDED"));
          break;
        default:
          console.warn("Unknown status received:", res.status);
      }
    };

    const transferStatusResponse = async () => {
      try {
        const res = await getTransferStatus({
          baseUrl: baseUrl,
          transferId: transferId,
        });
        if (res.status !== observerdStatus) {
          handleStatusUpdate(res);
        }
      } catch (error) {
        console.error("Error fetching transfer status:", error);
        clearInterval(interval);
        reject(error);
      }
    };

    const interval = setInterval(transferStatusResponse, 10000);
    transferStatusResponse();
  });
};
