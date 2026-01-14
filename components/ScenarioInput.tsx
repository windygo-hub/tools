
import React, { useState, useEffect } from 'react';
import { PersonaCategory, LibraryItem, ContentCategory, UserPersona } from '../types';
import { storageService } from '../services/storageService';

interface ScenarioInputProps {
  onGenerate: (scenario: string, refImage: string | null, category: ContentCategory, userPersona: UserPersona, selectedContext: LibraryItem[]) => void;
  isLoading: boolean;
  onOpenLibrary: () => void;
}

const BRAND_CATEGORIES: PersonaCategory[] = [
  { id: 'PRO', name: '专业价值', description: '知识、内幕', icon: 'fa-graduation-cap', group: 'BRAND' },
  { id: 'TESTIMONIAL', name: '信任见证', description: '晒单、合伙人', icon: 'fa-award', group: 'BRAND' },
  { id: 'PROMO', name: '品牌促销', description: '福利、新品', icon: 'fa-tags', group: 'BRAND' },
];

const PERSONAL_CATEGORIES: PersonaCategory[] = [
  { id: 'LIFE_AESTHETIC', name: '审美格调', description: '看书、插花、美照', icon: 'fa-camera-retro', group: 'PERSONAL' },
  { id: 'LIFE_THOUGHT', name: '创业碎碎念', description: '感悟、真诚、奋斗', icon: 'fa-lightbulb', group: 'PERSONAL' },
  { id: 'LIFE_DAILY', name: '烟火气日常', description: '美食、幽默、生活', icon: 'fa-mug-hot', group: 'PERSONAL' },
];

const SYSTEM_PERSONAS: (UserPersona & { icon: string })[] = [
  { name: '艺术主理人', icon: 'fa-palette', identity: '女性，艺术设计背景的黄酒创业者', traits: ['审美敏感', '知性', '追求极致细节'], background: '曾在上海从事平面设计多年，如今回到家乡绍兴，希望用现代审美重塑黄酒。', isSystem: true },
  { name: '儒雅文化商', icon: 'fa-book', identity: '男性，热爱传统文化的跨界创业者', traits: ['稳重', '博学', '讲究仪式感'], background: '半辈子在商海打拼，收藏古籍，认为黄酒是中国人血液里的诗意。', isSystem: true },
  { name: '真诚生活家', icon: 'fa-house-chimney-window', identity: '不限性别，热爱慢生活的社群达人', traits: ['随性', '有幽默感', '接地气'], background: '喜欢折腾各种美食，家里有个小酒窖，相信好酒是拉近人与人距离的最好媒介。', isSystem: true },
];

const ScenarioInput: React.FC<ScenarioInputProps> = ({ onGenerate, isLoading, onOpenLibrary }) => {
  const [scenario, setScenario] = useState('');
  const [refImage, setRefImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>('PRO');
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(new Set());

  // Persona State
  const [userPersona, setUserPersona] = useState<UserPersona>(SYSTEM_PERSONAS[0]);
  const [savedPersonas, setSavedPersonas] = useState<UserPersona[]>([]);
  const [isCustomPersona, setIsCustomPersona] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setLibraryItems(storageService.getItems());
    const saved = storageService.getSavedPersonas();
    setSavedPersonas(saved);
    // 如果已有保存的人设，默认选中第一个保存的；否则选中第一个系统预设
    if (saved.length > 0) {
      setUserPersona(saved[0]);
    } else {
      setUserPersona(SYSTEM_PERSONAS[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRefImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSavePersona = () => {
    if (!userPersona.name?.trim() || !userPersona.identity?.trim() || !userPersona.background?.trim()) {
      alert("请完整填写人设名称、核心身份和背景经历。");
      return;
    }
    setSaveStatus('saving');
    
    const toSave = { 
      ...userPersona, 
      name: userPersona.name.trim(),
      isSystem: false 
    };
    const saved = storageService.savePersona(toSave);
    
    setSavedPersonas(storageService.getSavedPersonas());
    setUserPersona(saved);
    setSaveStatus('saved');
    setIsEditingExisting(false);
    
    setTimeout(() => {
      setSaveStatus('idle');
      setIsCustomPersona(false);
    }, 1500);
  };

  const handleEditPersona = (e: React.MouseEvent, persona: UserPersona) => {
    e.stopPropagation();
    setUserPersona({...persona}); // 使用副本避免直接修改状态
    setIsCustomPersona(true);
    setIsEditingExisting(true);
  };

  const handleDeletePersona = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("确定要删除这个人设模板吗？")) {
      storageService.deletePersona(id);
      const updated = storageService.getSavedPersonas();
      setSavedPersonas(updated);
      // 如果删除的是当前选中的，回退到默认系统人设
      if (userPersona.id === id) {
        setUserPersona(SYSTEM_PERSONAS[0]);
      }
    }
  };

  const handleGenerateClick = () => {
    const contextItems = libraryItems.filter(item => selectedContextIds.has(item.id));
    onGenerate(scenario, refImage, selectedCategory, userPersona, contextItems);
  };

  // 合并人设列表用于展示
  const allPersonas = [...savedPersonas, ...SYSTEM_PERSONAS];

  // 关键修复：人设比对逻辑
  const checkIsSelected = (p: UserPersona) => {
    if (p.id) {
      return userPersona.id === p.id;
    }
    // 对于没有 ID 的系统人设，通过名称比对，且确保当前选中的也没有 ID
    return !userPersona.id && userPersona.name === p.name;
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* 1. User Identity Module */}
      <div className="bg-amber-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-800/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-3">
              <i className="fas fa-id-card text-amber-400"></i>
              {isEditingExisting ? '正在优化画像模板' : (isCustomPersona ? '自定义私域画像' : '我的私域画像')}
            </h2>
            <div className="flex bg-amber-800/50 p-1 rounded-xl">
              <button 
                onClick={() => { setIsCustomPersona(false); setIsEditingExisting(false); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isCustomPersona ? 'bg-amber-500 text-white' : 'text-amber-200 hover:text-white'}`}
              >
                快速选择
              </button>
              <button 
                onClick={() => {
                  if (!isCustomPersona) {
                    // 进入新建模式时重置
                    setUserPersona({ name: '', identity: '', traits: [], background: '' });
                  }
                  setIsCustomPersona(true);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isCustomPersona ? 'bg-amber-500 text-white' : 'text-amber-200 hover:text-white'}`}
              >
                {isEditingExisting ? '正在编辑' : '深度定义'}
              </button>
            </div>
          </div>

          {!isCustomPersona ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {allPersonas.map((p, idx) => {
                const isSelected = checkIsSelected(p);
                return (
                  <button
                    key={p.id || `sys-${idx}`}
                    onClick={() => {
                      setUserPersona(p);
                      setIsEditingExisting(false);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all text-left group relative cursor-pointer ${
                      isSelected 
                      ? 'bg-white border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-[1.02]' 
                      : 'bg-amber-800/30 border-amber-700/50 hover:border-amber-500 hover:bg-amber-800/40'
                    }`}
                  >
                    <i className={`fas ${p.isSystem ? (p as any).icon : 'fa-user-tag'} mb-3 block text-xl ${isSelected ? 'text-amber-600' : 'text-amber-400'}`}></i>
                    <div className={`text-sm font-black truncate ${isSelected ? 'text-slate-900' : 'text-white'}`}>{p.name}</div>
                    <div className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-slate-500' : 'text-amber-200/60'}`}>{p.identity}</div>
                    
                    {!p.isSystem && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <div 
                          onClick={(e) => handleEditPersona(e, p)}
                          className="bg-amber-500/90 p-1.5 rounded-lg text-white hover:bg-amber-400 shadow-lg"
                        >
                          <i className="fas fa-pen-to-square text-[10px]"></i>
                        </div>
                        <div 
                          onClick={(e) => handleDeletePersona(e, p.id!)}
                          className="bg-red-500/90 p-1.5 rounded-lg text-white hover:bg-red-400 shadow-lg"
                        >
                          <i className="fas fa-trash-can text-[10px]"></i>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Persona Name input for clear naming */}
              <div className="bg-amber-800/20 p-5 rounded-2xl border border-amber-700/50">
                <label className="block text-[10px] font-bold text-amber-200/60 mb-2 uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-tag"></i> 人设模板名称
                </label>
                <input 
                  type="text" 
                  placeholder="起个好记的名字，如：秋季知性版、创业日常版..."
                  value={userPersona.name || ''}
                  onChange={(e) => setUserPersona({...userPersona, name: e.target.value})}
                  className="w-full bg-amber-800/30 border border-amber-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none text-white placeholder:text-amber-700/80 transition-all font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-[10px] font-bold text-amber-200/60 mb-2 uppercase tracking-widest">
                      1. 核心身份定义
                    </label>
                    <input 
                      type="text" 
                      placeholder="例如：95后海归、绍兴女儿、退休建筑师..."
                      value={userPersona.identity}
                      onChange={(e) => setUserPersona({...userPersona, identity: e.target.value})}
                      className="w-full bg-amber-800/30 border border-amber-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none text-white placeholder:text-amber-700/80 transition-all"
                    />
                    <p className="text-[9px] text-amber-400/40 mt-1.5 ml-1">💡 填写建议：[性别/年龄段] + [职业标签] + [特定背景]</p>
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold text-amber-200/60 mb-2 uppercase tracking-widest">
                      2. 性格标签
                    </label>
                    <input 
                      type="text" 
                      placeholder="例如：温婉、硬核、追求极致、接地气..."
                      value={userPersona.traits.join('、')}
                      onChange={(e) => setUserPersona({...userPersona, traits: e.target.value.split(/[、,，;；]/).filter(t => t.trim())})}
                      className="w-full bg-amber-800/30 border border-amber-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none text-white placeholder:text-amber-700/80 transition-all"
                    />
                    <p className="text-[9px] text-amber-400/40 mt-1.5 ml-1">💡 填写建议：描述你的处事风格和谈吐基调</p>
                  </div>
                </div>
                <div className="group flex flex-col">
                  <label className="block text-[10px] font-bold text-amber-200/60 mb-2 uppercase tracking-widest">
                    3. 详细背景经历
                  </label>
                  <textarea 
                    placeholder="描述你的故事，越具体AI越能写出你的灵魂..."
                    value={userPersona.background}
                    onChange={(e) => setUserPersona({...userPersona, background: e.target.value})}
                    className="w-full flex-1 min-h-[120px] bg-amber-800/30 border border-amber-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none text-white placeholder:text-amber-700/80 resize-none transition-all leading-relaxed"
                  />
                  <p className="text-[9px] text-amber-400/40 mt-1.5 ml-1">💡 填写建议：过往经历如何影响了你对黄酒/生活的看法</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <button 
                  onClick={() => { setIsCustomPersona(false); setIsEditingExisting(false); }}
                  className="text-amber-200/50 hover:text-white text-xs font-bold transition-colors"
                >
                  放弃编辑
                </button>
                <button 
                  onClick={handleSavePersona}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-xs transition-all shadow-xl ${
                    saveStatus === 'saved' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-amber-500 text-white hover:bg-amber-400 active:scale-95'
                  }`}
                >
                  <i className={`fas ${saveStatus === 'saved' ? 'fa-check' : (saveStatus === 'saving' ? 'fa-circle-notch animate-spin' : 'fa-floppy-disk')}`}></i>
                  {saveStatus === 'saved' ? '保存成功' : (isEditingExisting ? '保存修改' : '存为常用人设')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-slate-800">内容工作台</h2>
        <button 
          onClick={onOpenLibrary}
          className="flex items-center gap-2 text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors"
        >
          <i className="fas fa-box-archive"></i>
          灵感库 ({libraryItems.length})
        </button>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-10">
        {/* Dual Track Category Selector */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
            <i className="fas fa-layer-group text-amber-500"></i>
            1. 确定本次创作的维度
          </label>
          
          <div className="space-y-8">
            {/* BRAND GROUP */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">维度 A：黄酒主理人身份 (Brand)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {BRAND_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                      selectedCategory === c.id 
                      ? 'bg-amber-50 border-amber-500 ring-4 ring-amber-500/10' 
                      : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <i className={`fas ${c.icon} text-lg ${selectedCategory === c.id ? 'text-amber-600' : 'text-slate-400'}`}></i>
                    <div className={`text-xs font-bold ${selectedCategory === c.id ? 'text-amber-900' : 'text-slate-700'}`}>{c.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* PERSONAL GROUP */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">维度 B：真实生活者面貌 (Persona)</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {PERSONAL_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                      selectedCategory === c.id 
                      ? 'bg-orange-50 border-orange-500 ring-4 orange-500/10' 
                      : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <i className={`fas ${c.icon} text-lg ${selectedCategory === c.id ? 'text-orange-600' : 'text-slate-400'}`}></i>
                    <div className={`text-xs font-bold ${selectedCategory === c.id ? 'text-orange-900' : 'text-slate-700'}`}>{c.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <i className="fas fa-feather-pointed text-amber-500"></i>
              2. 发生了什么好玩的？
            </label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder={PERSONAL_CATEGORIES.some(c => c.id === selectedCategory) ? "聊聊今天的生活细节（如：清晨的咖啡、路边的夕阳、创业的小纠结...）" : "描述黄酒相关的场景（如：给客户寄样、研发新品的口感调试、分享黄酒干货...）"}
              className="w-full h-44 p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none text-slate-700 leading-relaxed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <i className="fas fa-image text-amber-500"></i>
              3. 视觉捕捉
            </label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-3xl h-44 hover:border-amber-400 transition-all flex items-center justify-center overflow-hidden bg-slate-50 group">
              {refImage ? (
                <div className="relative w-full h-full">
                  <img src={refImage} alt="Reference" className="w-full h-full object-cover" />
                  <button onClick={() => setRefImage(null)} className="absolute top-3 right-3 bg-red-500/80 backdrop-blur text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"><i className="fas fa-times text-xs"></i></button>
                </div>
              ) : (
                <div className="text-center p-4">
                  <i className="fas fa-camera-retro text-slate-300 text-3xl mb-3 group-hover:scale-110 transition-transform"></i>
                  <p className="text-[10px] text-slate-400 font-bold">点击上传灵感原图</p>
                  <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerateClick}
          disabled={!scenario.trim() || isLoading}
          className="w-full py-5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-[2rem] font-black shadow-xl shadow-amber-100 transition-all flex items-center justify-center gap-3 text-lg"
        >
          {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
          开始定制创作
        </button>
      </div>
    </div>
  );
};

export default ScenarioInput;
