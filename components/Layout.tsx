// components/Layout.tsx
import { useUser, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <span className="text-blue-600 font-bold text-xl">読書記録</span>
                </Link>
              </div>
              <nav className="ml-6 flex space-x-8">
                <SignedIn>
                  <Link href="/books">
                    <span className="inline-flex items-center px-1 pt-1 text-gray-900">
                      書籍一覧
                    </span>
                  </Link>
                  <Link href="/books/add">
                    <span className="inline-flex items-center px-1 pt-1 text-gray-900">
                      書籍登録
                    </span>
                  </Link>
                </SignedIn>
              </nav>
            </div>
            <div className="flex items-center">
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <Link href="/sign-in">
                  <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    ログイン
                  </span>
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}