import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/Layout';
import BookCard from '../../components/BookCard';
import { FaSearch } from 'react-icons/fa';

export default function BooksList() {
  const { user } = useUser();
  const [books, setBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [user]);

  useEffect(() => {
    filterBooks();
  }, [books, searchTerm, statusFilter]);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      // ユーザーIDでSupabaseのユーザーを検索
      if (!user) return;
      
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userData) {
        // ユーザーの書籍と読書ステータスを取得
        const { data, error } = await supabase
          .from('books')
          .select(`
            *,
            reading_status(*)
          `)
          .eq('user_id', userData.id);

        if (error) throw error;
        setBooks(data || []);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBooks = () => {
    if (!books.length) {
      setFilteredBooks([]);
      return;
    }

    let result = [...books];

    // テキスト検索
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        book => 
          book.title.toLowerCase().includes(term) || 
          book.author.toLowerCase().includes(term)
      );
    }

    // ステータスフィルター
    if (statusFilter !== 'all') {
      result = result.filter(
        book => book.reading_status && 
        book.reading_status[0]?.status === statusFilter
      );
    }

    setFilteredBooks(result);
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">書籍一覧</h1>
            <p className="mt-2 text-sm text-gray-700">
              登録した書籍の一覧です。検索やフィルタリングが可能です。
            </p>
          </div>
        </div>
        
        {/* 検索とフィルター */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="タイトルや著者名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">すべてのステータス</option>
            <option value="unread">未読</option>
            <option value="reading">読書中</option>
            <option value="completed">読了</option>
          </select>
        </div>

        {/* 書籍リスト */}
        {isLoading ? (
          <div className="flex justify-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center mt-8 py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">表示する書籍がありません</p>
          </div>
        )}
      </div>
    </Layout>
  );
}