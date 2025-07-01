import { format } from 'date-fns';
import {
  Tooltip,
  XAxis,
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import { CustomTooltip } from '@/components/custom-tooltip';

type Props = {
  data: {
    date: string;
    income: number;
    expenses: number;
  }[];
  animationEnabled?: boolean;
};

export const LineVariant = ({ data, animationEnabled = true }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          axisLine={false}
          tickLine={false}
          dataKey="date"
          tickFormatter={(value) => format(value, 'dd MMM')}
          style={{ fontSize: '12px' }}
          tickMargin={16}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          dot={false}
          dataKey="income"
          stroke="#3b82f6"
          strokeWidth={2}
          className="drop-shadow-sm"
          isAnimationActive={animationEnabled}
          animationDuration={500}
          animationEasing="ease-in-out"
        />
        <Line
          dot={false}
          dataKey="expenses"
          stroke="#f43f5e"
          strokeWidth={2}
          className="drop-shadow-sm"
          isAnimationActive={animationEnabled}
          animationDuration={500}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
