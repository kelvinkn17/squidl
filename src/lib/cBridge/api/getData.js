import axios from "axios";

export async function getTransferConfigsForAll({ baseUrl }) {
  try {
    const response = await axios.get(`${baseUrl}/v2/getTransferConfigsForAll`);

    if (response.status === 200 && !response.data.err) {
      return response.data;
    } else {
      throw new Error(`API Error: ${response.data.err || "Unknown error"}`);
    }
  } catch (e) {
    console.error("Error fetching transfer configs:", e.message);
    return [];
  }
}

export async function getTransferStatus({ baseUrl, transferId }) {
  try {
    const url = `${baseUrl}/v2/getTransferStatus`;

    const response = await axios.post(
      url,
      { transfer_id: transferId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error in getTransferStatus:", error);
    throw error;
  }
}
