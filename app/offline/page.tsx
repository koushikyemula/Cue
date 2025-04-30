import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-6">You&apos;re Offline</h1>
      <p className="text-xl mb-6">
        It looks like you&apos;re not connected to the internet right now.
      </p>
      <p className="mb-8">
        Don&apos;t worry, you can still access cached content.
      </p>
      <Link
        href="/"
        className="px-6 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Go to Home Page
      </Link>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-6 py-3 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
