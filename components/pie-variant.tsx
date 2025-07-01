import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { formatPercentage } from '@/lib/utils';
import { CategoryTooltip } from '@/components/category-tooltip';

const COLORS = ['#0062FF', '#12C6FF', '#FF647F', '#FF9354', '#FFD600', '#00C49F', '#FFBB28', '#FF8042', '#A28EFF', '#FFB6B9', '#B0BEC5'];
const OTHER_COLOR = '#B0BEC5';

type Props = {
  data: {
    name: string;
    value: number;
  }[];
};

export const PieVariant = ({ data }: Props) => {
  const filteredData = data.filter((d) => d.value > 0);
  const otherIndex = filteredData.findIndex((d) => d.name === 'Other');
  const n = filteredData.length;
  const outerRadius = n <= 5 ? 100 : 120;
  const innerRadius = n <= 5 ? 60 : 80;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="right"
          iconType="circle"
          content={({ payload }: any) => {
            return (
              <ul className="flex flex-col space-y-2">
                {payload.map((entry: any, index: number) => (
                  <li
                    key={`item-${index}`}
                    className="flex items-center space-x-2"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="space-x-1">
                      <span className="text-sm text-muted-foreground" title={entry.value}>
                        {entry.value.length > 18 ? entry.value.slice(0, 15) + '…' : entry.value}
                      </span>
                      <span className="text-sm">
                        {formatPercentage(entry.payload.percent * 100)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            );
          }}
        />
        <Tooltip content={<CategoryTooltip />} />
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          paddingAngle={2}
          fill="#8884d8"
          dataKey="value"
          label={false}
          labelLine={false}
        >
          {filteredData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.name === 'Other'
                ? OTHER_COLOR
                : COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
