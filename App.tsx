
import React, { useState } from 'react';
import { WorkflowStep, GeneratedConcept, AspectRatio, ImageSize, LibraryItem, ContentCategory, UserPersona } from './types';
import { generateCreativeConcept, generateVisual } from './services/geminiService';
import StepProgressBar from './components/StepProgressBar';
import ScenarioInput from './components/ScenarioInput';
import ConceptReview from './components/ConceptReview';
import FinalOutput from './components/FinalOutput';
import LibraryView from './components/LibraryView';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  var aistudio: AIStudio;
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(WorkflowStep.SCENARIO_INPUT);
  const [concept, setConcept] = useState<GeneratedConcept | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [finalCopy, setFinalCopy] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('日常');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{message: string, type: 'retry' | 'fatal'} | null>(null);

  const handleScenarioSubmit = async (text: string, refImage: string | null, category: ContentCategory, userPersona: UserPersona, contextItems: LibraryItem[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateCreativeConcept(text, category, userPersona, refImage, contextItems);
      setConcept({ ...result, referenceImage: refImage, selectedCategory: category, userPersona });
      setSelectedCategory(category);
      setCurrentStep(WorkflowStep.CONCEPT_REVIEW);
    } catch (err: any) {
      setError({ message: err.message || '生成方案失败，请稍后重试。', type: 'fatal' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualGeneration = async (
    prompt: string, 
    copy: string,
    refImage: string | null, 
    isHighQuality: boolean,
    aspectRatio: AspectRatio,
    imageSize: ImageSize
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isHighQuality) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) await window.aistudio.openSelectKey();
      }
      const imageUrl = await generateVisual(prompt, refImage || undefined, isHighQuality, aspectRatio, imageSize);
      setFinalImage(imageUrl);
      setFinalCopy(copy);
      setCurrentStep(WorkflowStep.FINAL_GENERATION);
    } catch (err: any) {
      if (err.message && err.message.includes('Requested entity was not found')) {
        await window.aistudio.openSelectKey();
      } else {
        setError({ message: '图像生成失败，请重试。', type: 'fatal' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      <header className="bg-white border-b border-amber-50 py-6 sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentStep(WorkflowStep.SCENARIO_INPUT)}>
            <div className="w-10 h-10 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-200">
              <i className="fas fa-wine-glass-empty text-xl"></i>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">黄酒生活美学 <span className="text-amber-600">Assistant</span></h1>
              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">私域文案与视觉定制专家</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-12">
        {currentStep !== WorkflowStep.LIBRARY && <StepProgressBar currentStep={currentStep} />}
        
        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold animate-shake flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="fas fa-circle-exclamation"></i>
              {error.message}
            </div>
          </div>
        )}

        <div className="relative pb-20">
          {currentStep === WorkflowStep.SCENARIO_INPUT && (
            <ScenarioInput 
              onGenerate={handleScenarioSubmit} 
              isLoading={isLoading} 
              onOpenLibrary={() => setCurrentStep(WorkflowStep.LIBRARY)}
            />
          )}

          {currentStep === WorkflowStep.LIBRARY && (
            <LibraryView onBack={() => setCurrentStep(WorkflowStep.SCENARIO_INPUT)} />
          )}

          {currentStep === WorkflowStep.CONCEPT_REVIEW && concept && (
            <ConceptReview 
              concept={concept} 
              onGenerateImage={handleVisualGeneration}
              isLoading={isLoading}
              onBack={() => setCurrentStep(WorkflowStep.SCENARIO_INPUT)}
            />
          )}

          {currentStep === WorkflowStep.FINAL_GENERATION && finalImage && (
            <FinalOutput 
              imageUrl={finalImage} 
              copy={finalCopy} 
              persona={selectedCategory}
              onReset={() => setCurrentStep(WorkflowStep.SCENARIO_INPUT)} 
            />
          )}
        </div>
      </main>

      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-xs w-full">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-amber-600 rounded-full animate-spin"></div>
            <h3 className="mt-8 text-xl font-black text-slate-800">正在酝酿灵感...</h3>
            <p className="mt-2 text-slate-400 text-xs font-medium text-center">正在为您构思有黄酒温度、有生活美学的专属内容。</p>
          </div>
        </div>
      )}

      <footer className="py-8 text-center border-t border-slate-100 bg-white">
        <p className="text-xs text-slate-400 font-bold">© 2024 黄酒生活美学传播者 | 私域文案助手</p>
      </footer>
    </div>
  );
};

export default App;
