import {
  XAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import useSWR from "swr";
import { squidlAPI } from "../../../api/squidl";
import { useUser } from "../../../providers/UserProvider";
import { Spinner } from "@nextui-org/react";
import dayjs from "dayjs";

// default data for chart

const data = [
  {
    date: "2021-09-01",
    balance: 0,
  },
  {
    date: "2021-09-02",
    balance: 0,
  },
];

export default function BalanceChart() {
  const { userData } = useUser();

  const { data: chartData, isLoading: isChartLoading } = useSWR(
    userData
      ? `/user/wallet-assets/${userData.username}/charts-new?isTestnet=false`
      : null,
    async (url) => {
      const { data } = await squidlAPI.get(url);
      return data;
    },
    {
      refreshInterval: 10000,
    }
  );

  console.log("chartData", chartData);

  const isEmpty = chartData?.length === 0 || chartData?.length === 1;

  if (isChartLoading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={isEmpty ? data : chartData || data}
          margin={{
            bottom: 10,
            left: 0,
            right: 0,
            top: 10,
          }}
        >
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1816ff" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#1816ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#1816ff"
            fill="url(#balanceGradient)"
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const date = data.payload.date;
    const balance = data.payload.balance;

    return (
      <div className="bg-white border rounded-2xl p-4 max-w-xl flex flex-col items-start">
        <p className="bg-primary-50 text-primary px-3 py-2 rounded-xl text-xs">
          {dayjs(date).format("YYYY-MM-DD")}
        </p>
        <p className="mt-4 text-lg font-medium">${balance.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};
