import Link from 'next/link';
import { FaStar } from 'react-icons/fa';

// ステータスラベルのカラー設定
const statusColors = {
  unread: 'bg-gray-100 text-gray-800',
  reading: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

// ステータスラベルの日本語表示
const statusLabels = {
  unread: '未読',
  reading: '読書中',
  completed: '読了',
};

export default function BookCard({ book }) {
  // 読書ステータスの取得（配列の最初の要素を使用）
  const status = book.reading_status?.[0] || null;
  
  return (
    <Link href={`/books/${book.id}`}>
      <div className="bg-white overflow-hidden shadow rounded-lg transition duration-300 hover:shadow-md">
        {/* 書籍カバー画像（ある場合） */}
        {book.cover_url ? (
          <div className="h-48 w-full bg-gray-200">
            <img
              src={book.cover_url}
              alt={`${book.title}のカバー`}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 w-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-500 text-lg font-medium">{book.title}</span>
          </div>
        )}
        
        {/* 書籍情報 */}
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 truncate">{book.title}</h3>
          <p className="mt-1 text-sm text-gray-500 truncate">{book.author}</p>
          
          {/* 読書ステータス */}
          <div className="mt-4 flex items-center justify-between">
            {status ? (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status.status]}`}>
                {statusLabels[status.status]}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                未登録
              </span>
            )}
            
            {/* 評価（ある場合） */}
            {status?.rating > 0 && (
              <div className="flex items-center">
                <FaStar className="text-yellow-400 mr-1" />
                <span className="text-sm text-gray-600">{status.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}