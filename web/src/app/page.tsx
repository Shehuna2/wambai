import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome to Wambai</h1>
      <p className="text-slate-700">Buyer-first web frontend for browsing shops, managing cart, wallet, and checkout.</p>
      <div className="flex gap-3">
        <Link href="/shops" className="rounded bg-blue-700 px-4 py-2 text-white">
          Browse shops
        </Link>
        <Link href="/wallet" className="rounded border border-blue-700 px-4 py-2">
          View wallet
        </Link>
      </div>
    </div>
  );
}
