
import React, { useState } from 'react';
import { GeneratedConcept, AspectRatio, ImageSize, Draft } from '../types';

interface ConceptReviewProps {
  concept: GeneratedConcept;
  onGenerateImage: (prompt: string, copy: string, refImage: string | null, isHighQuality: boolean, aspectRatio: AspectRatio, imageSize: ImageSize) => void;
  isLoading: boolean;
  onBack: () => void;
}

const ConceptReview: React.FC<ConceptReviewProps> = ({ concept, onGenerateImage, isLoading, onBack }) => {
  const [selectedDraftIndex, setSelectedDraftIndex] = useState(0);
  const currentDraft = concept.drafts[selectedDraftIndex];
  
  const [editedCopy, setEditedCopy] = useState(currentDraft.copy);
  const [editedPrompt, setEditedPrompt] = useState(currentDraft.visualSuggestion);
  const [refImage, setRefImage] = useState<string | null>(concept.referenceImage || null);
  
  const [isHighQuality, setIsHighQuality] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("3:4");
  const [imageSize, setImageSize] = useState<ImageSize>("1K");

  // 当切换草稿时，同步更新编辑区域
  const handleDraftSelect = (index: number) => {
    setSelectedDraftIndex(index);
    setEditedCopy(concept.drafts[index].copy);
    setEditedPrompt(concept.drafts[index].visualSuggestion);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRefImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const ratios: {id: AspectRatio, label: string}[] = [
    {id: "1:1", label: "正方形"},
    {id: "3:4", label: "人像 (推荐)"},
    {id: "4:3", label: "经典 (4:3)"},
    {id: "16:9", label: "横屏"},
    {id: "9:16", label: "全屏"}
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-file-signature text-amber-500 text-xl"></i>
            文案方案确认
          </h2>
          <div className="flex gap-2">
            {concept.drafts.map((d, idx) => (
              <button
                key={idx}
                onClick={() => handleDraftSelect(idx)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedDraftIndex === idx 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-100' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                方案 {idx + 1}: {d.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-wider">朋友圈文案 (立体人设版)</label>
              <textarea
                value={editedCopy}
                onChange={(e) => setEditedCopy(e.target.value)}
                className="w-full h-48 p-5 bg-amber-50/30 border border-amber-100 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none text-slate-700 leading-relaxed font-medium"
              />
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-wider flex items-center gap-2">
                <i className="fas fa-comment-dots text-amber-500"></i>
                配套评论区脚本 (激活互动)
              </label>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed italic">
                {currentDraft.commentScript}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-3 tracking-wider">配图建议 (AI 提示词)</label>
              <textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none text-slate-500 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">构图比例</label>
                <div className="grid grid-cols-2 gap-2">
                  {ratios.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setAspectRatio(r.id)}
                      className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all ${
                        aspectRatio === r.id 
                        ? 'bg-amber-600 text-white border-amber-600' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">色调参考</label>
                <div className="relative border border-slate-200 rounded-2xl h-[100px] flex items-center justify-center bg-slate-50 overflow-hidden">
                  {refImage ? (
                    <img src={refImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <p className="text-[10px] text-slate-400">风格参考</p>
                      <input type="file" onChange={handleFileChange} className="mt-1 text-[8px] text-slate-500" accept="image/*" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-amber-900 block">高级摄影模式</span>
                <span className="text-[10px] text-amber-700">启用专业级光影渲染</span>
              </div>
              <button 
                onClick={() => setIsHighQuality(!isHighQuality)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isHighQuality ? 'bg-amber-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isHighQuality ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-8 mt-8 border-t border-slate-100">
          <button onClick={onBack} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-colors">重置场景</button>
          <button
            onClick={() => onGenerateImage(editedPrompt, editedCopy, refImage, isHighQuality, aspectRatio, imageSize)}
            disabled={isLoading}
            className="flex-[3] py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-2xl font-bold shadow-xl shadow-amber-100 transition-all flex items-center justify-center gap-2 group"
          >
            {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-camera group-hover:scale-110 transition-transform"></i>}
            生成此方案配图
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConceptReview;
