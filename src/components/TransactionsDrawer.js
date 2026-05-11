import React from "react";
import TransactionsTable from "./TransactionsTable";
import { RiArrowUpSFill, RiCloseLine } from "react-icons/ri";
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3">
        <DrawerTrigger asChild>
          <button className="pointer-events-auto flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-left shadow-lg shadow-slate-900/10 backdrop-blur">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                Data
              </div>
              <div className="text-lg font-semibold text-slate-900">
                Transactions
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <RiArrowUpSFill className="h-6 w-6" />
            </div>
          </button>
        </DrawerTrigger>
      </div>

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
          <div className="h-full overflow-auto rounded-2xl border border-slate-200 bg-white">
            <TransactionsTable />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
