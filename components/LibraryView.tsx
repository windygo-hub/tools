
import React, { useState, useEffect } from 'react';
import { LibraryItem } from '../types';
import { storageService } from '../services/storageService';

interface LibraryViewProps {
  onBack: () => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ onBack }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setItems(storageService.getItems());
  }, []);

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const copy = prompt("请输入此素材的描述或品牌调性文案：") || "品牌素材";
        // Fixed: The property name in LibraryItem is 'category', not 'persona'
        const newItem = storageService.saveItem({
          type: 'manual',
          copy,
          imageUrl: reader.result as string,
          category: '手动上传'
        });
        setItems(prev => [newItem, ...prev]);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这条创意参考吗？")) {
      storageService.deleteItem(id);
      setItems(items.filter(i => i.id !== id));
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-2">
          <i className="fas fa-arrow-left"></i> 返回工作台
        </button>
        <div className="relative">
          <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:scale-105 transition-transform">
            <i className="fas fa-plus"></i> 添加品牌素材
          </button>
          <input type="file" onChange={handleManualUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-200">
          <i className="fas fa-folder-open text-slate-200 text-6xl mb-4"></i>
          <h3 className="text-xl font-bold text-slate-400">您的灵感库空空如也</h3>
          <p className="text-slate-400 mt-2">保存满意的 AI 成果或上传已有资产来喂养您的 Agent</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group relative">
              {item.imageUrl && (
                <img src={item.imageUrl} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                    item.type === 'manual' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {item.type === 'manual' ? '手动素材' : 'AI 成果'}
                  </span>
                  <span className="text-[10px] text-slate-300 font-bold">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic line-clamp-4">
                  “{item.copy}”
                </p>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 bg-white/80 backdrop-blur text-red-500 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-50"
              >
                <i className="fas fa-trash-can text-xs"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryView;
