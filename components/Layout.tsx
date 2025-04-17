// components/Layout.tsx
import { useUser, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { FaBook, FaPlus, FaListAlt } from 'react-icons/fa';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <span className="flex items-center text-blue-600 font-bold text-xl">
                  <FaBook className="mr-2" />
                  <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">読書記録</span>
                </span>
              </Link>
              <nav className="hidden md:flex ml-8 space-x-6">
                <SignedIn>
                  <Link href="/books">
                    <span className="group flex items-center px-1 py-2 text-gray-700 hover:text-blue-600 transition-colors">
                      <FaListAlt className="mr-2 group-hover:text-blue-500" />
                      書籍一覧
                    </span>
                  </Link>
                  <Link href="/books/add">
                    <span className="group flex items-center px-1 py-2 text-gray-700 hover:text-blue-600 transition-colors">
                      <FaPlus className="mr-2 group-hover:text-blue-500" />
                      書籍登録
                    </span>
                  </Link>
                </SignedIn>
              </nav>
            </div>
            <div className="flex items-center">
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <Link href="/sign-in">
                  <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-colors">
                    ログイン
                  </span>
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      </header>
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} 読書記録アプリ
          </p>
        </div>
      </footer>
    </div>
  );
}