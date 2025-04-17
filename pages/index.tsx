import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import Link from 'next/link';
import { FaBook, FaFilter, FaPlus, FaSearch } from 'react-icons/fa';

// インターフェースを定義
interface Book {
  id: string;
  title: string;
  author: string;
  published_year?: string | number;
  genre?: string;
  cover_url?: string;
  user_id: string;
  reading_status?: ReadingStatus[];
}

interface ReadingStatus {
  id: string;
  book_id: string;
  user_id: string;
  status: string;
  rating?: number;
  review?: string;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
}

export default function BooksList() {
  const { user } = useUser();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchBooks();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      // userが存在するか確認
      if (!user) {
        setIsLoading(false);
        return;
      }

      // ユーザーIDでSupabaseのユーザーを検索
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userData) {
        // 書籍一覧を取得
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select(`
            *,
            reading_status(*)
          `)
          .eq('user_id', userData.id)
          .order('title', { ascending: true });

        if (booksError) throw booksError;
        setBooks(booksData || []);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 検索フィルター機能
  const filteredBooks = books.filter((book) => {
    // 検索条件
    const matchesSearch =
      searchTerm === '' ||
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.genre && book.genre.toLowerCase().includes(searchTerm.toLowerCase()));

    // ステータスフィルター
    const matchesStatus =
      statusFilter === 'all' ||
      (book.reading_status &&
        book.reading_status.length > 0 &&
        book.reading_status[0].status === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // ローディング表示
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  // ログインしていない場合は、スタート画面を表示
  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <FaBook className="h-20 w-20 text-blue-500 mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">さあ、始めよう</h1>
            <p className="text-xl text-gray-600 max-w-2xl mb-8">
              あなたの読書体験を記録し、管理するための最適なツールです。読んだ本を記録し、レビューを書いて、読書の旅を追跡しましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up">
                <span className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  新規登録
                </span>
              </Link>
              <Link href="/sign-in">
                <span className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto">
                  ログイン
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">あなたの書籍</h1>
          <Link href="/books/add">
            <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              <FaPlus className="mr-2" /> 書籍を追加
            </span>
          </Link>
        </div>

        {/* 検索・フィルター */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="タイトル、著者、ジャンルで検索..."
              className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-full md:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべてのステータス</option>
                <option value="unread">未読</option>
                <option value="reading">読書中</option>
                <option value="completed">読了</option>
              </select>
            </div>
          </div>
        </div>

        {/* 書籍一覧 */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaBook className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">書籍がありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              書籍を追加して読書記録を始めましょう
            </p>
            <div className="mt-6">
              <Link href="/books/add">
                <span className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  <FaPlus className="mr-2 -ml-1" /> 最初の書籍を追加
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <Link key={book.id} href={`/books/${book.id}`}>
                <div className="group relative bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                  {/* カバー画像（あれば表示） */}
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={`${book.title}のカバー`}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaBook className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{book.author}</p>
                    {/* 読書ステータス */}
                    {book.reading_status && book.reading_status.length > 0 && (
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            book.reading_status[0].status === 'unread'
                              ? 'bg-gray-100 text-gray-800'
                              : book.reading_status[0].status === 'reading'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {book.reading_status[0].status === 'unread'
                            ? '未読'
                            : book.reading_status[0].status === 'reading'
                            ? '読書中'
                            : '読了'}
                        </span>
                        {/* 評価 */}
                        {book.reading_status[0].rating && (
                          <span className="ml-2 text-yellow-500">
                            {'★'.repeat(book.reading_status[0].rating)}
                            {'☆'.repeat(5 - book.reading_status[0].rating)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}