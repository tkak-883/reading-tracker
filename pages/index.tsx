// pages/index.tsx
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <Layout>
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              あなたの読書をスマートに管理
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              本の記録・レビュー・評価を簡単に管理できます
            </p>
            <SignedIn>
              <div className="mt-8">
                <Link href="/books">
                  <span className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    書籍一覧を見る
                  </span>
                </Link>
              </div>
            </SignedIn>
            <SignedOut>
              <div className="mt-8">
                <Link href="/sign-in">
                  <span className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    始めましょう
                  </span>
                </Link>
              </div>
            </SignedOut>
          </div>
        </div>
      </div>
    </Layout>
  );
}