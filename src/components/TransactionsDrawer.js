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
      <div className="pointer-events-none fixed bottom-4 right-4 z-30">
        <DrawerTrigger asChild>
          <button
            aria-label="Open transactions drawer"
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:bg-slate-50"
          >
            <span>Transactions</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <RiArrowUpSFill className="h-6 w-6" />
            </span>
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
