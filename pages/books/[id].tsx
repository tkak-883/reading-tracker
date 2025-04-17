import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';
import { FaStar, FaRegStar, FaEdit, FaTrash } from 'react-icons/fa';
import Link from 'next/link';

export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [book, setBook] = useState(null);
  const [readingStatus, setReadingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchBookDetail();
    }
  }, [user, id]);

  const fetchBookDetail = async () => {
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
        // book_idの処理：undefinedやstring[]の可能性に対応
        const bookId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : null;
        if (!bookId) {
          setIsLoading(false);
          return;
        }

        // 書籍の詳細情報を取得
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', bookId)
          .eq('user_id', userData.id)
          .single();

        if (bookError) throw bookError;
        setBook(bookData);

        // 読書ステータスを取得
        const { data: statusData, error: statusError } = await supabase
          .from('reading_status')
          .select('*')
          .eq('book_id', bookId)
          .eq('user_id', userData.id)
          .single();

        if (statusError && statusError.code !== 'PGRST116') throw statusError;
        setReadingStatus(statusData || null);
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReadingStatus = async (status) => {
    try {
      // userが存在するか確認
      if (!user) return;
      
      // idが存在するか確認
      if (!id) return;

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (!userData) return;

      // TypeScriptが理解できる型を明示的に指定
      const bookId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : null;
      
      // bookIdがnullの場合は処理を中止
      if (!bookId) return;

      interface StatusUpdate {
        status: string;
        user_id: any;
        book_id: string;
        updated_at: string;
        started_at?: string;
        completed_at?: string;
      }

      const updates: StatusUpdate = { 
        status,
        user_id: userData.id,
        book_id: bookId, // 安全になった変数を使用
        updated_at: new Date().toISOString()
      };

      if (status === 'reading' && !readingStatus?.started_at) {
        updates.started_at = new Date().toISOString();
      }

      if (status === 'completed' && !readingStatus?.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      // 既存のステータスがあれば更新、なければ新規作成
      if (readingStatus) {
        const { error } = await supabase
          .from('reading_status')
          .update(updates)
          .eq('id', readingStatus.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reading_status')
          .insert([updates]);

        if (error) throw error;
      }

      // データを再取得
      fetchBookDetail();
    } catch (error) {
      console.error('Error updating reading status:', error);
    }
  };

  const updateRating = async (rating) => {
    try {
      // 読書ステータスが存在するか確認
      if (!readingStatus) return;

      const { error } = await supabase
        .from('reading_status')
        .update({ 
          rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', readingStatus.id);

      if (error) throw error;

      // データを再取得
      fetchBookDetail();
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const deleteBook = async () => {
    if (!confirm('本当にこの書籍を削除しますか？')) return;

    try {
      // book が存在するか確認
      if (!book) return;
      
      // 関連する読書ステータスを削除
      if (readingStatus) {
        await supabase
          .from('reading_status')
          .delete()
          .eq('id', readingStatus.id);
      }

      // 書籍を削除
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id);

      if (error) throw error;

      // 一覧ページにリダイレクト
      router.push('/books');
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

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

  // 書籍が見つからない場合
  if (!book) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-gray-900">書籍が見つかりません</h1>
          <Link href="/books">
            <span className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              書籍一覧に戻る
            </span>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
            <p className="mt-2 text-xl text-gray-600">{book.author}</p>
            {book.published_year && (
              <p className="mt-1 text-sm text-gray-500">出版年: {book.published_year}</p>
            )}
            {book.genre && (
              <p className="mt-1 text-sm text-gray-500">ジャンル: {book.genre}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Link href={`/books/edit/${book.id}`}>
              <span className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <FaEdit className="mr-2" /> 編集
              </span>
            </Link>
            <button
              onClick={deleteBook}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <FaTrash className="mr-2" /> 削除
            </button>
          </div>
        </div>

        {/* 書籍カバー（ある場合） */}
        {book.cover_url && (
          <div className="mt-6">
            <img
              src={book.cover_url}
              alt={`${book.title}のカバー`}
              className="h-64 w-auto object-cover rounded shadow-md"
            />
          </div>
        )}

        {/* 読書ステータス */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">読書ステータス</h2>
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => updateReadingStatus('unread')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                readingStatus?.status === 'unread'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              未読
            </button>
            <button
              onClick={() => updateReadingStatus('reading')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                readingStatus?.status === 'reading'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              読書中
            </button>
            <button
              onClick={() => updateReadingStatus('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                readingStatus?.status === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              読了
            </button>
          </div>

          {/* 開始日・完了日 */}
          {readingStatus?.started_at && (
            <p className="mt-2 text-sm text-gray-500">
              開始日: {new Date(readingStatus.started_at).toLocaleDateString()}
            </p>
          )}
          {readingStatus?.completed_at && (
            <p className="mt-1 text-sm text-gray-500">
              完了日: {new Date(readingStatus.completed_at).toLocaleDateString()}
            </p>
          )}

          {/* 評価 */}
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900">評価</h3>
            <div className="flex items-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => updateRating(star)}
                  className="text-2xl text-yellow-400 focus:outline-none"
                >
                  {star <= (readingStatus?.rating || 0) ? (
                    <FaStar />
                  ) : (
                    <FaRegStar />
                  )}
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500">
                {readingStatus?.rating ? `${readingStatus.rating}点` : '未評価'}
              </span>
            </div>
          </div>

          {/* レビュー */}
          <div className="mt-6">
            <h3 className="text-md font-medium text-gray-900">レビュー・感想</h3>
            {readingStatus?.review ? (
              <div className="mt-2 p-4 bg-gray-50 rounded-md text-gray-800">
                {readingStatus.review}
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-500">
                レビューはまだありません
              </div>
            )}
            <div className="mt-4">
              <Link href={`/books/review/${book.id}`}>
                <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  レビューを{readingStatus?.review ? '編集' : '追加'}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}