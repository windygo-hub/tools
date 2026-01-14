
import React, { useState } from 'react';
import { storageService } from '../services/storageService';

interface FinalOutputProps {
  imageUrl: string;
  copy: string;
  persona: string;
  onReset: () => void;
}

const FinalOutput: React.FC<FinalOutputProps> = ({ imageUrl, copy, persona, onReset }) => {
  const [isSaved, setIsSaved] = useState(false);

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `黄酒生活美学-${new Date().getTime()}.png`;
    link.click();
  };

  const handleSaveToLibrary = () => {
    storageService.saveItem({
      type: 'generated',
      copy,
      imageUrl,
      category: persona
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 max-w-xl mx-auto">
        <div className="relative group">
          <img src={imageUrl} alt="Generated Visual" className="w-full h-auto object-cover" />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button 
              onClick={downloadImage}
              className="bg-black/60 backdrop-blur-md text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/80 transition-all"
            >
              <i className="fas fa-download text-sm"></i>
            </button>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-xs font-bold">
              主理
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-800">黄酒生活美学传播者</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Lifestyle Sharing · Just Now</span>
            </div>
          </div>
          <p className="text-lg text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
            {copy}
          </p>
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
            <div className="flex gap-6 text-slate-300">
              <i className="far fa-heart hover:text-red-500 cursor-pointer transition-colors text-lg"></i>
              <i className="far fa-comment hover:text-amber-500 cursor-pointer transition-colors text-lg"></i>
              <i className="far fa-share-from-square hover:text-amber-500 cursor-pointer transition-colors text-lg"></i>
            </div>
            <button 
              onClick={handleSaveToLibrary}
              disabled={isSaved}
              className={`text-xs font-bold px-5 py-2.5 rounded-full transition-all flex items-center gap-2 ${
                isSaved ? 'bg-green-100 text-green-600' : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'
              }`}
            >
              <i className={`fas ${isSaved ? 'fa-check' : 'fa-bookmark'}`}></i>
              {isSaved ? '已归档' : '存入灵感库'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onReset}
          className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-xl shadow-amber-100 flex items-center gap-2"
        >
          <i className="fas fa-rotate-left"></i>
          记录下一刻
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(copy);
          }}
          className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <i className="fas fa-copy"></i>
          复制文案
        </button>
      </div>
    </div>
  );
};

export default FinalOutput;
