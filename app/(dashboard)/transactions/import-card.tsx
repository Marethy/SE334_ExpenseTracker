import { useState } from 'react';
import { format, parse, parseISO, isValid } from 'date-fns';

import { ImportTable } from './import-table';
import { convertAmountToMilliUnits } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const dateFormat = 'yyyy-MM-dd HH:mm:ss';
const outputFormat = 'yyyy-MM-dd';

const requiredOptions = ['amount', 'date', 'payee'];

interface SelectdColumnsState {
  [key: string]: string | null;
}

type Props = {
  data: string[][];
  onCancel: () => void;
  onSubmit: (data: any) => void;
};

export const ImportCard = ({ data, onCancel, onSubmit }: Props) => {
  const [selectedColumns, setSelectedColumns] = useState<SelectdColumnsState>(
    {}
  );

  // Separate headers from the data array as first element of array is the headers
  const headers = data[0];
  const body = data.slice(1);

  const onTableHeadSelectChange = (
    columnIndex: number,
    value: string | null
  ) => {
    setSelectedColumns((prev) => {
      const newSelectedColumns = { ...prev };

      for (const key in newSelectedColumns) {
        if (newSelectedColumns[key] === value) {
          newSelectedColumns[key] = null;
        }
      }

      if (value === 'skip') {
        value = null;
      }

      newSelectedColumns[`column_${columnIndex}`] = value;
      return newSelectedColumns;
    });
  };

  const progress = Object.values(selectedColumns).filter(Boolean).length;

  const handleContinue = () => {
    const getColumnIndex = (column: string) => {
      return column.split('_')[1];
    };

    // Just converting [][] to [{}, {}]
    const mappedData = {
      headers: headers.map((_header, index) => {
        const columnIndex = getColumnIndex(`column_${index}`);
        return selectedColumns[`column_${columnIndex}`] || null;
      }),
      body: body
        .map((row) => {
          const transformedRow = row.map((cell, index) => {
            const columnIndex = getColumnIndex(`column_${index}`);
            return selectedColumns[`column_${columnIndex}`] ? cell : null;
          });

          return transformedRow.every((item) => item === null)
            ? []
            : transformedRow;
        })
        .filter((row) => row.length > 0),
    };

    // console.log({ mappedData });

    // transform this mappedData, so we can send it to backend to create bulk transactions endpoint
    const arrayOfData = mappedData.body.map((row) => {
      return row.reduce((acc: any, cell, index) => {
        const header = mappedData.headers[index];
        if (header !== null) {
          acc[header] = cell;
        }

        return acc;
      }, {});
    });

    // Debug nhanh keys của mỗi item
    if (arrayOfData.length > 0) {
      console.log('Sample item keys:', Object.keys(arrayOfData[0]));
    }

    // Kiểm tra xem có row nào thiếu date không
    const missingDates = arrayOfData.filter(i => i.date == null || i.date === '').length;
    if (missingDates > 0) {
      alert(`Có ${missingDates} dòng chưa được map cột Date. Vui lòng kiểm tra lại bước Mapping.`);
      return;
    }

    const formattedData = arrayOfData.map((item) => {
      let dateObj: Date;

      if (typeof item.date === 'string') {
        dateObj = item.date.includes('T')
          ? parseISO(item.date)
          : parse(item.date, dateFormat, new Date());
      } else if (item.date instanceof Date) {
        dateObj = item.date;
      } else {
        dateObj = new Date(item.date);
      }

      if (!isValid(dateObj)) {
        console.error('Invalid date:', item.date);
        throw new Error(`Cannot parse date: ${item.date}`);
      }

      return {
        ...item,
        amount: convertAmountToMilliUnits(parseFloat(item.amount)),
        date: format(dateObj, outputFormat),
      };
    });

    onSubmit(formattedData);
  };

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Import Transaction
          </CardTitle>
          <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
            <Button className="w-full lg:w-auto" onClick={onCancel} size="sm">
              Cancel
            </Button>
            <Button
              size="sm"
              className="w-full lg:w-auto"
              disabled={progress < requiredOptions.length}
              onClick={handleContinue}
            >
              Continue ({progress}/ {requiredOptions.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ImportTable
            headers={headers}
            body={body}
            selectedColumns={selectedColumns}
            onTableHeadSelectChange={onTableHeadSelectChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};
