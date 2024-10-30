import { Skeleton, Spinner } from "@nextui-org/react";
import axios from "axios";
import { squidlAPI } from "../../../api/squidl";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Rectangle,
} from "recharts";
import useSWR from "swr";

const GRID_SIZE = 8;
const CHART_HEIGHT = 350;

const interpolateData = (data, gridHeight) => {
  const interpolated = [];

  for (let i = 0; i < data.length - 1; i++) {
    const current = data[i];
    const next = data[i + 1];

    // Add the current data point
    interpolated.push(current);

    const deltaY = next.y - current.y;

    // Fill vertical gaps if deltaY is greater than 1
    if (Math.abs(deltaY) > 1) {
      const steps = Math.abs(deltaY); // Number of steps to interpolate between points
      for (let j = 1; j <= steps; j++) {
        const interpolatedY = current.y + (deltaY / Math.abs(deltaY)) * j; // Interpolate Y
        interpolated.push({
          x: current.x, // Keep X constant
          y: interpolatedY,
          usd: current.usd + (next.usd - current.usd) * (j / steps), // Interpolate USD value
          dates: [...current.dates], // Keep the same date
        });
      }
    }
  }

  // Add the last data point
  interpolated.push(data[data.length - 1]);
  return interpolated;
};

export default function BalanceChart() {
  const chartContainerRef = useRef(null); // To get the actual width of the chart
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.offsetWidth);
      }
    };
    window.addEventListener("resize", updateWidth);
    updateWidth();
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const { data: chartData, isLoading } = useSWR(
    "/stealth-address/chart/0x278A2d5B5C8696882d1D2002cE107efc74704ECf?chainIds=1,137",
    async (url) => {
      const { data } = await squidlAPI.get(url);
      const chartData = data.chart.map((chart) => ({
        date: dayjs.unix(chart.timestamp).format("DD/MM/YYYY"),
        usd: chart.value_usd,
      }));
      return chartData;
    }
  );

  const { pixelData, gridHeight } = useMemo(() => {
    const gridHeight = Math.floor(CHART_HEIGHT / GRID_SIZE);

    const pixelData = [...Array.from({ length: 57 })].map((point, idx) => {
      return {
        x: idx + 2,
        y: gridHeight + 0,
        usd: 0,
        dates: "",
      };
    });

    // Apply interpolation to fill vertical gaps only (not horizontal)

    return { pixelData, gridHeight };
  }, []);

  if (isLoading) {
    return (
      <Spinner
        size="lg"
        color="primary"
        className="flex items-center justify-center w-full h-72"
      />
    );
  }

  return (
    <div ref={chartContainerRef} className="relative w-full h-full">
      <div
        style={{
          mask: `linear-gradient(0deg, transparent, #000 20%, #000 80%, transparent 100%)`,
        }}
        className="w-full h-full relative"
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          className="scale-[1.2] -translate-y-5"
        >
          <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <pattern
                id="pixelGrid"
                width={GRID_SIZE}
                height={GRID_SIZE}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  width={GRID_SIZE - 2}
                  height={GRID_SIZE - 2}
                  fill="rgba(128, 0, 255, 0.025)"
                />
              </pattern>
              <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9b5de5" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#9b5de5" stopOpacity={0} />
              </linearGradient>
              <filter
                id="smoothGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                {/* Gaussian blur for the glow */}
                <feGaussianBlur stdDeviation="6" result="coloredGlow" />
                {/* Subtle drop shadow */}
                <feDropShadow
                  dx="2"
                  dy="2"
                  stdDeviation="3"
                  floodColor="#000"
                  floodOpacity="0.2"
                />
                <feMerge>
                  <feMergeNode in="coloredGlow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Background Grid */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#pixelGrid)"
            />
            {/* Axes Configuration */}
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, pixelData.length - 1]}
              tick={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, gridHeight - 1]}
              tick={false}
              axisLine={false}
              reversed={true} // Origin at the top-left corner
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Scatter Pixels with Extended Rectangles */}

            <Scatter
              data={pixelData}
              className="-translate-x-10"
              shape={(props) => {
                const { cx, cy, payload } = props;
                const size = GRID_SIZE - 2;
                const x = Math.floor(cx / GRID_SIZE) * GRID_SIZE;
                const y = Math.floor(cy / GRID_SIZE) * GRID_SIZE;

                const rectangles = [];
                rectangles.push(
                  <Rectangle
                    key={`${payload.x}-${payload.y}-main`}
                    x={x}
                    y={y}
                    width={size}
                    height={size}
                    fill="#7b61ff"
                    stroke="none"
                  />
                );

                return <g>{rectangles}</g>;
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="w-full bottom-0 absolute bg-gradient-to-t from-purply-500/15 to-purply/0 h-[150px]"></div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const dates = data.payload.dates || [];
    const usd = data.payload.usd;

    return (
      <div className="bg-white border rounded-2xl p-4 max-w-xl flex flex-col items-start">
        <p className="bg-purply-50 text-purply px-3 py-2 rounded-xl text-xs">
          {dates.length > 1
            ? `${dates[0]} - ${dates[dates.length - 1]}`
            : dates[0]}
        </p>
        <p className="mt-4 text-lg font-medium">${usd.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};
