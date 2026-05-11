import * as React from "react";
import { useSelector } from "react-redux";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

const columns = [
  { key: "project", label: "Project", className: "min-w-[14rem]" },
  { key: "street", label: "Street", className: "min-w-[12rem]" },
  { key: "price_psf", label: "$/psf", className: "text-right" },
  { key: "floor_range", label: "Storey", className: "text-center" },
  { key: "area", label: "Area (sqm)", className: "text-right" },
  { key: "price", label: "Price", className: "text-right" },
  { key: "contract_date", label: "Date", className: "text-center" },
  { key: "property_type", label: "Type", className: "min-w-[8rem]" },
  { key: "type_of_sale", label: "Sale", className: "min-w-[8rem]" },
];

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);
  if (Number.isNaN(number)) {
    return value;
  }

  return number.toLocaleString();
}

function renderCell(columnKey, value) {
  if (columnKey === "price" || columnKey === "price_psf" || columnKey === "area") {
    return formatNumber(value);
  }

  return value || "—";
}

export default function TransactionsTable() {
  const transactions = useSelector(
    (state) => state.transactionState.transactions || []
  );

  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
          <TableRow className="hover:bg-slate-50/95">
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map((row, index) => (
              <TableRow key={row.id || `${row.project || "transaction"}-${index}`}>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={`${column.className} whitespace-pre-wrap text-xs`}
                  >
                    {renderCell(column.key, row[column.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="h-28 text-center text-sm text-slate-500"
                colSpan={columns.length}
              >
                No transactions available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
