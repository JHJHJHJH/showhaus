import React from "react";
import TransactionsTable from "./TransactionsTable";
import { RiCloseLine, RiTableLine } from "react-icons/ri";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

export default function TransactionsDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <button
          aria-label="Open transactions drawer"
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-md transition-all hover:bg-white hover:shadow-lg"
        >
          <span>Transactions Table</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700">
            <RiTableLine className="h-5 w-5" />
          </span>
        </button>
      </DrawerTrigger>

      <DrawerContent className="h-[min(78vh,40rem)]">
        <DrawerHeader>
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
              Market activity
            </div>
            <DrawerTitle className="mt-1 text-xl">Transactions</DrawerTitle>
          </div>
          <DrawerClose asChild>
            <button
              aria-label="Close transactions drawer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <RiCloseLine className="h-5 w-5" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="min-h-0 flex-1 px-4 pb-4">
          <div className="h-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-inner">
            <TransactionsTable />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
