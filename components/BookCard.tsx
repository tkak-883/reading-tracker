import Link from 'next/link';
import { FaStar, FaBook, FaBookOpen, FaCheckCircle } from 'react-icons/fa';

// ステータスに関連するアイコンとスタイルの設定
const statusConfig = {
  unread: {
    icon: FaBook,
    colors: 'bg-gray-100 text-gray-800 border-gray-200',
    label: '未読'
  },
  reading: {
    icon: FaBookOpen,
    colors: 'bg-blue-50 text-blue-700 border-blue-200',
    label: '読書中'
  },
  completed: {
    icon: FaCheckCircle,
    colors: 'bg-green-50 text-green-700 border-green-200',
    label: '読了'
  }
};

export default function BookCard({ book }) {
  // 読書ステータスの取得（配列の最初の要素を使用）
  const status = book.reading_status?.[0] || null;
  const statusType = status?.status || 'unread';
  const StatusIcon = statusConfig[statusType]?.icon || FaBook;
  
  // 本のタイトルと著者から頭文字を取得（カバー画像がない場合に使用）
  const initials = book.title.charAt(0);
  
  return (
    <Link href={`/books/${book.id}`}>
      <div className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full border border-gray-100">
        {/* 書籍カバー画像 */}
        <div className="relative h-56 bg-gray-100 overflow-hidden">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={`${book.title}のカバー`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
              <span className="text-5xl font-serif font-bold text-blue-400/80">{initials}</span>
            </div>
          )}
          
          {/* ステータスバッジ - 右上に配置 */}
          {status && (
            <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium border flex items-center ${statusConfig[statusType].colors}`}>
              <StatusIcon className="mr-1" size={12} />
              {statusConfig[statusType].label}
            </div>
          )}
        </div>
        
        {/* 書籍情報 */}
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {book.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-1">{book.author}</p>
          
          {/* 評価 - 下部に配置 */}
          <div className="mt-auto pt-3 flex items-center">
            {status?.rating > 0 ? (
              <div className="flex items-center">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < status.rating ? "text-yellow-400" : "text-gray-300"}
                      size={16}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">未評価</span>
            )}
            
            {/* 読了日（完了している場合） */}
            {status?.status === 'completed' && status?.completed_at && (
              <span className="ml-auto text-xs text-gray-500">
                {new Date(status.completed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}