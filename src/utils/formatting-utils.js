export const shortenId = (id, prefixLength = 6, suffixLength = 4) => {
  try {
    const prefix = id.slice(0, prefixLength);
    const suffix = id.slice(id.length - suffixLength, id.length);

    return `${prefix}...${suffix}`;
  } catch (error) {
    console.log(error);
    return id;
  }
};
