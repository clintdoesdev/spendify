import { FileDown, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { transactions } from "@/lib/mockData";

const categoryPillStyles: Record<string, string> = {
  Income: "bg-accent2/10 text-accent2",
  "Food & Dining": "bg-accent/10 text-accent",
  Transport: "bg-accent2/10 text-accent2",
  Entertainment: "bg-yellow/10 text-yellow",
  Utilities: "bg-danger/10 text-danger",
  Shopping: "bg-orange/10 text-orange",
  Health: "bg-accent2/10 text-accent2",
  Savings: "bg-white/10 text-text",
};

export default function TransactionsPage() {
  const rows = transactions.slice(0, 20);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 xl:flex-row">
        <div className="surface-card relative flex-1 p-0">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            className="h-12 w-full rounded-[20px] bg-transparent pl-11 pr-4 text-sm text-text placeholder:text-muted focus:outline-none"
            placeholder="Search merchants, categories, or amounts"
          />
        </div>

        <Select defaultValue="all">
          <SelectTrigger className="h-12 min-w-[170px] rounded-xl border-border bg-surface text-text">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="border border-border bg-bg2 text-text">
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="food">Food & Dining</SelectItem>
            <SelectItem value="transport">Transport</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="june">
          <SelectTrigger className="h-12 min-w-[150px] rounded-xl border-border bg-surface text-text">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent className="border border-border bg-bg2 text-text">
            <SelectItem value="june">June 2025</SelectItem>
            <SelectItem value="may">May 2025</SelectItem>
            <SelectItem value="april">April 2025</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          className="h-12 rounded-xl border border-border bg-surface px-4 text-text hover:bg-white/5"
        >
          <FileDown className="size-4" />
          Export
        </Button>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-sm text-muted">Total In</p>
          <p className="mt-2 font-display text-3xl font-bold text-accent2">+₦850,000</p>
          <div className="mt-3 inline-flex rounded-full bg-accent2/10 px-3 py-1 text-xs text-accent2">
            Healthy inflow
          </div>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm text-muted">Total Out</p>
          <p className="mt-2 font-display text-3xl font-bold text-danger">-₦423,750</p>
          <div className="mt-3 inline-flex rounded-full bg-danger/10 px-3 py-1 text-xs text-danger">
            Controlled spend
          </div>
        </div>
        <div className="surface-card p-5">
          <p className="text-sm text-muted">Net</p>
          <p className="mt-2 font-display text-3xl font-bold text-accent">+₦426,250</p>
          <div className="mt-3 inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
            Positive month
          </div>
        </div>
      </section>

      <section className="surface-card p-4 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted">Date</TableHead>
              <TableHead className="text-muted">Merchant</TableHead>
              <TableHead className="text-muted">Category</TableHead>
              <TableHead className="text-muted">Amount</TableHead>
              <TableHead className="text-muted">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((transaction) => (
              <TableRow key={transaction.id} className="border-border/60 hover:bg-white/3">
                <TableCell className="text-muted">{transaction.date}</TableCell>
                <TableCell className="font-medium text-text">{transaction.merchant}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs ${categoryPillStyles[transaction.category]}`}
                  >
                    {transaction.category}
                  </span>
                </TableCell>
                <TableCell
                  className={
                    transaction.amount > 0 ? "font-medium text-accent2" : "font-medium text-danger"
                  }
                >
                  {transaction.amount > 0 ? "+" : "-"}₦
                  {Math.abs(transaction.amount).toLocaleString("en-NG")}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      transaction.status === "Completed"
                        ? "rounded-full border-0 bg-accent2/10 px-2 py-1 text-accent2"
                        : "rounded-full border-0 bg-yellow/10 px-2 py-1 text-yellow"
                    }
                  >
                    {transaction.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6">
          <Pagination className="justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </section>
    </div>
  );
}
