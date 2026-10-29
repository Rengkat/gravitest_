import { AlertTriangle } from "lucide-react";
import Link from "next/link";

/** Explicit error state when a session's configuration can't be loaded or is invalid. */
export default function SessionProblem({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div role="alert" className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
        <AlertTriangle size={36} className="mx-auto mb-3 text-red-600" aria-hidden="true" />
        <h1 className="mb-2 text-lg font-bold text-gray-900">We can&apos;t start this session</h1>
        <p className="mb-6 text-sm text-gray-700">{message}</p>
        <Link
          href="/dashboard/practice"
          className="inline-block rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700">
          Back to Practice
        </Link>
      </div>
    </div>
  );
}
