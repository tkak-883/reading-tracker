import { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';

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

export default function AddBook() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
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

  const onSubmit = async (data) => {
    if (!user) return;
    setIsSubmitting(true);
    setError('');

    try {
      console.log('Submitting with user ID:', user.id);
      
      // ステップ1: ユーザーを作成または取得
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();
      
      console.log('Existing user check:', existingUser, findError);
      
      let userId;
      
      if (findError && findError.code === 'PGRST116') {
        // ユーザーが存在しない場合は作成
        console.log('Creating new user');
        const email = user.primaryEmailAddress?.emailAddress;
        
        if (!email) {
          throw new Error('ユーザーのメールアドレスが取得できません');
        }
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            clerk_id: user.id,
            email: email,
            username: email.split('@')[0]
          }])
          .select();
          
        console.log('New user created:', newUser, createError);
        
        if (createError) throw createError;
        if (!newUser || newUser.length === 0) {
          throw new Error('ユーザーの作成に失敗しました');
        }
        userId = newUser[0].id;
      } else if (findError) {
        throw findError;
      } else {
        userId = existingUser.id;
      }

      console.log('Using user ID:', userId);
      
      // ステップ2: 書籍を登録
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .insert([{
          ...data,
          user_id: userId,
        }])
        .select();

      console.log('Book insert result:', bookData, bookError);
      
      if (bookError) throw bookError;
      if (!bookData || bookData.length === 0) {
        throw new Error('書籍の登録に失敗しました');
      }

      // ステップ3: 未読ステータスで登録
      const { error: statusError } = await supabase
        .from('reading_status')
        .insert([{
          book_id: bookData[0].id,
          user_id: userId,
          status: 'unread',
        }]);
        
      console.log('Status insert result:', statusError);

      if (statusError) throw statusError;

      // 登録成功後、詳細ページへリダイレクト
      router.push(`/books/${bookData[0].id}`);
    } catch (error) {
      console.error('Error adding book:', error);
      setError(error.message || '書籍の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">書籍登録</h1>
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* フォームフィールド */}
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
                {isSubmitting ? '登録中...' : '登録'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}