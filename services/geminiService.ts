
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedConcept, AspectRatio, ImageSize, LibraryItem, ContentCategory, UserPersona, SellingPoint, ProductPhoto } from "../types";

async function compressImage(base64Str: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 1536; 
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]);
    };
  });
}

export async function generateCreativeConcept(
  scenario: string, 
  category: ContentCategory,
  userPersona: UserPersona,
  imageBase64?: string | null,
  contextItems: LibraryItem[] = [],
  sellingPoints: SellingPoint[] = [],
  productPhotos: ProductPhoto[] = []
): Promise<GeneratedConcept> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  // 注入历史记忆：从 contextItems 中提取过往风格
  const pastSuccesses = contextItems
    .filter(i => i.type === 'generated')
    .slice(0, 3)
    .map(i => i.copy)
    .join('\n---\n');

  const systemInstruction = `你是一位真实的“黄酒生活分享家”。

【核心任务】：为黄酒品牌“黄关”创作朋友圈文案。
【调性参考】：${pastSuccesses ? `请参考该用户过往喜欢的文案风格：\n${pastSuccesses}` : '风格应干练、有质感、充满生活温情。'}
【创作核心】：文案 60-100 字，多用大白话，拒绝空洞术语。
【输出要求】：返回 JSON 格式。`;

  let prompt = `【当前创作场景】：${scenario}\n【分类维度】：${category}`;
  const parts: any[] = [{ text: prompt }];

  if (imageBase64) {
    const compressed = await compressImage(imageBase64);
    parts.unshift({
      inlineData: { mimeType: 'image/jpeg', data: compressed }
    });
  }

  if (sellingPoints.length > 0) {
    parts.push({ text: `必须融入的品牌记忆点：${sellingPoints.map(s => s.text).join('、')}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drafts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  copy: { type: Type.STRING },
                  visualSuggestion: { type: Type.STRING },
                  commentScript: { type: Type.STRING }
                },
                required: ["label", "copy", "visualSuggestion", "commentScript"]
              }
            }
          },
          required: ["drafts"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e: any) {
    console.error("Gemini Error:", e);
    throw new Error("方案生成失败，请稍后重试。");
  }
}

export async function generateVisual(
  prompt: string, 
  copy: string,
  referenceImageBase64?: string, 
  styleRefBase64?: string, 
  productImageBase64s: string[] = [], 
  highQuality: boolean = false,
  aspectRatio: AspectRatio = "1:1",
  imageSize: ImageSize = "1K"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const modelName = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const parts: any[] = [];

  if (productImageBase64s.length > 0) {
    const mainProduct = await compressImage(productImageBase64s[0]);
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: mainProduct } });
    parts.push({ text: `[STRICT ASSET REPLICATION] Replicate this EXACT bottle.` });
  }

  if (referenceImageBase64) {
    const sceneContext = await compressImage(referenceImageBase64);
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: sceneContext } });
  }

  if (styleRefBase64) {
    const styleContext = await compressImage(styleRefBase64);
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: styleContext } });
  }

  const finalComposition = `VISUAL PROMPT: ${prompt}\nBRAND STORY: ${copy}`;
  parts.push({ text: finalComposition });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio,
          ...(highQuality ? { imageSize } : {})
        }
      }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart?.inlineData?.data) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }
    throw new Error("图像生成失败。");
  } catch (e: any) {
    throw new Error("视觉资产生成异常。");
  }
}
