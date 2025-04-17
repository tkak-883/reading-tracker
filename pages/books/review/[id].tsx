import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { supabase } from '../../../lib/supabase';
import Layout from '../../../components/Layout';
import { FaStar, FaRegStar } from 'react-icons/fa';

export default function BookReview() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [book, setBook] = useState(null);
  const [readingStatus, setReadingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      review: '',
    },
  });

  useEffect(() => {
    if (user && id) {
      fetchBookAndStatus();
    }
  }, [user, id]);

  const fetchBookAndStatus = async () => {
    setIsLoading(true);
    try {
      // ユーザーIDでSupabaseのユーザーを検索
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userData) {
        // 書籍情報を取得
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('*')
          .eq('id', id)
          .eq('user_id', userData.id)
          .single();

        if (bookError) throw bookError;
        setBook(bookData);

        // 読書ステータスを取得
        const { data: statusData, error: statusError } = await supabase
          .from('reading_status')
          .select('*')
          .eq('book_id', id)
          .eq('user_id', userData.id)
          .single();

        if (statusError && statusError.code !== 'PGRST116') throw statusError;
        
        if (statusData) {
          setReadingStatus(statusData);
          setValue('review', statusData.review || '');
          setRating(statusData.rating || 0);
        } else {
          // ステータスがない場合は新規作成
          const { data: newStatus, error: insertError } = await supabase
            .from('reading_status')
            .insert([{
              book_id: id,
              user_id: userData.id,
              status: 'unread', // デフォルトステータス
            }])
            .select();

          if (insertError) throw insertError;
          setReadingStatus(newStatus[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching book and status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!readingStatus) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reading_status')
        .update({
          review: data.review,
          rating,
          updated_at: new Date().toISOString(),
        })
        .eq('id', readingStatus.id);

      if (error) throw error;

      // 詳細ページに戻る
      router.push(`/books/${id}`);
    } catch (error) {
      console.error('Error saving review:', error);
      alert('レビューの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">レビューを{readingStatus?.review ? '編集' : '追加'}</h1>
          {book && (
            <div className="mt-2">
              <h2 className="text-xl text-gray-700">{book.title}</h2>
              <p className="text-sm text-gray-500">著者: {book.author}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow-md rounded-lg p-6">
          {/* 評価 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              評価
            </label>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-2xl mr-1 focus:outline-none"
                >
                  {star <= rating ? (
                    <FaStar className="text-yellow-400" />
                  ) : (
                    <FaRegStar className="text-yellow-400" />
                  )}
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500">
                {rating ? `${rating}点` : '未評価'}
              </span>
            </div>
          </div>

          {/* レビュー・感想 */}
          <div className="mb-6">
            <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
              レビュー・感想
            </label>
            <textarea
              id="review"
              rows={8}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="この本の感想や印象に残った点などを自由に書いてください..."
              {...register('review')}
            />
          </div>

          {/* 送信ボタン */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}