import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../../lib/supabase';
import Layout from '../../../components/Layout';

// バリデーションスキーマ
const bookSchema = z.object({
  title: z.string().min(1, '書籍名は必須です'),
  author: z.string().min(1, '著者名は必須です'),
  published_year: z.string().optional()
    .refine(val => !val || (Number(val) >= 1000 && Number(val) <= new Date().getFullYear()), {
      message: `出版年は1000年から${new Date().getFullYear()}年の間で入力してください`
    })
    .transform(val => val ? Number(val) : undefined),
  genre: z.string().optional(),
  isbn: z.string().optional(),
  cover_url: z.string().optional(),
});

export default function EditBook() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: '',
      author: '',
      published_year: '',
      genre: '',
      isbn: '',
      cover_url: '',
    },
  });

  // 書籍データの取得
  useEffect(() => {
    const fetchBookData = async () => {
      if (!id || !user) return;
      setIsLoading(true);

      try {
        // ユーザーIDでSupabaseのユーザーを検索
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single();

        if (userData) {
          // 書籍データを取得
          const { data: bookData, error: bookError } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .eq('user_id', userData.id)
            .single();

          if (bookError) throw bookError;

          // フォームに値をセット
          reset({
            title: bookData.title,
            author: bookData.author,
            published_year: bookData.published_year ? String(bookData.published_year) : '',
            genre: bookData.genre || '',
            isbn: bookData.isbn || '',
            cover_url: bookData.cover_url || '',
          });
        }
      } catch (error) {
        console.error('Error fetching book data:', error);
        setError('書籍データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookData();
  }, [id, user, reset]);

  const onSubmit = async (data) => {
    if (!user || !id) return;
    setIsSubmitting(true);
    setError('');

    try {
      // ユーザーIDでSupabaseのユーザーを検索
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError) throw userError;

      // 書籍データを更新
      const { error: updateError } = await supabase
        .from('books')
        .update({
          title: data.title,
          author: data.author,
          published_year: data.published_year,
          genre: data.genre,
          isbn: data.isbn,
          cover_url: data.cover_url,
        })
        .eq('id', id)
        .eq('user_id', userData.id);

      if (updateError) throw updateError;

      // 更新成功後、詳細ページへリダイレクト
      router.push(`/books/${id}`);
    } catch (error) {
      console.error('Error updating book:', error);
      setError(error.message || '書籍の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">書籍情報の編集</h1>
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                書籍名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                {...register('title')}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                著者名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="author"
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  errors.author ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                {...register('author')}
              />
              {errors.author && (
                <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="published_year" className="block text-sm font-medium text-gray-700">
                出版年
              </label>
              <input
                type="number"
                id="published_year"
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  errors.published_year ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                {...register('published_year')}
              />
              {errors.published_year && (
                <p className="mt-1 text-sm text-red-600">{errors.published_year.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-gray-700">
                ジャンル
              </label>
              <input
                type="text"
                id="genre"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('genre')}
              />
            </div>

            <div>
              <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
                ISBN
              </label>
              <input
                type="text"
                id="isbn"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                {...register('isbn')}
              />
            </div>

            <div>
              <label htmlFor="cover_url" className="block text-sm font-medium text-gray-700">
                表紙画像URL
              </label>
              <input
                type="text"
                id="cover_url"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://example.com/book-cover.jpg"
                {...register('cover_url')}
              />
            </div>

            <div className="pt-5">
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
                  {isSubmitting ? '更新中...' : '更新'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}