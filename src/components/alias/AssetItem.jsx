export default function AssetItem({
  logoImg,
  balance,
  tokenSymbol,
  chainName,
  chainLogo,
  priceUSD,
}) {
  return (
    <div className="flex gap-4 w-full py-3">
      <div className="relative size-12">
        <img src={logoImg} alt="ic" className="object-contain w-full h-full" />

        <img
          src={chainLogo}
          alt="ic"
          className="absolute top-0 -right-2 object-contain size-6"
        />
      </div>

      <div className="flex items-start justify-between w-full">
        <div className="flex flex-col">
          <h1 className="font-bold text-[#161618]">{tokenSymbol}</h1>
          <p className="font-medium text-[#A1A1A3] text-sm">{chainName}</p>
        </div>
        <div className="flex flex-col items-end">
          <h1 className="font-bold text-[#161618]">{balance}</h1>
          <p className="font-medium text-[#A1A1A3] text-sm">{priceUSD}</p>
        </div>
      </div>
    </div>
  );
}
