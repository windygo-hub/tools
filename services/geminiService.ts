
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedConcept, AspectRatio, ImageSize, LibraryItem, ContentCategory, UserPersona } from "../types";

async function compressImage(base64Str: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 800;
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
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
  });
}

export async function generateCreativeConcept(
  scenario: string, 
  category: ContentCategory,
  userPersona: UserPersona,
  imageBase64?: string | null,
  contextItems: LibraryItem[] = []
): Promise<GeneratedConcept> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const isPersonal = ['LIFE_AESTHETIC', 'LIFE_THOUGHT', 'LIFE_DAILY'].includes(category);

  const categoryMap = {
    'PRO': '【品牌视角-专业价值】：黄酒知识、鉴别技巧、行业内幕。强调利他。',
    'TESTIMONIAL': '【品牌视角-信任见证】：晒单好评、客户故事。建立背书。',
    'PROMO': '【品牌视角-硬广促销】：新品、福利。侧重转化。',
    'LIFE_AESTHETIC': '【个人视角-审美生活】：看书、插花、艺术、摄影。不一定要提酒，重点是展现主理人的格调。',
    'LIFE_THOUGHT': '【个人视角-创业碎碎念】：感悟、纠结、奋斗。展现一个真实、有血有肉的创业者，重在真诚。',
    'LIFE_DAILY': '【个人视角-烟火日常】：美食、亲情、幽默段子。纯粹的生活分享，为了增加互动和亲近感。'
  };

  const systemInstruction = `你是由“黄酒生活美学传播者”打造的专属私域文案助手。

【双重角色融合定义】：
你的灵魂由“黄酒主理人专业度”和“用户个人身份”融合而成。
用户画像：${userPersona.identity}（特质：${userPersona.traits.join('、')}）。背景：${userPersona.background}。

【核心任务】：
当前内容维度：${isPersonal ? '个人视角（重真人感、重情绪共鸣，甚至可以完全不提酒）' : '品牌视角（重黄酒美学、重专业传播）'}。
必须遵守准则：
1. **${isPersonal ? '去商业化，重共情' : '去说教感，重利他'}**。
2. **去完美人设，重真实瑕疵**：生活中的小迷糊或创业的小挫折反而能拉近距离。
3. **场景诱导**：${isPersonal ? '描述主理人的个人真实生活片段' : '描述黄酒饮用的美好场景'}。
4. **文案风格**：语气温暖、真诚、温和，像发给多年老友。

【内容分类细则】：
${categoryMap[category]}

【输出要求】：
生成 2-3 个不同版本的草稿。每个草稿包含：版本标签、文案、具体的配图拍摄建议（英文Prompt）、以及配套的【评论区脚本】。`;

  let prompt = `【当前输入场景/事件】：${scenario}`;
  if (contextItems.length > 0) {
    prompt += `\n【往期参考】：\n${contextItems.map((item, i) => `参考${i+1}: ${item.copy}`).join('\n')}`;
  }

  const parts: any[] = [{ text: prompt }];

  if (imageBase64) {
    const compressed = await compressImage(imageBase64);
    parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        data: compressed
      }
    });
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
    throw new Error("生成失败，请再试一次。");
  }
}

export async function generateVisual(
  prompt: string, 
  referenceImageBase64?: string,
  highQuality: boolean = false,
  aspectRatio: AspectRatio = "1:1",
  imageSize: ImageSize = "1K"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const modelName = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  const aestheticPrompt = `Authentic photography style. Soft natural lighting, film grain texture, high-end but warm domestic atmosphere, candid shot. Detailed content: ${prompt}`;
  
  const parts: any[] = [{ text: aestheticPrompt }];

  if (referenceImageBase64) {
    const compressed = await compressImage(referenceImageBase64);
    parts.unshift({
      inlineData: {
        mimeType: 'image/jpeg',
        data: compressed
      }
    });
  }

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

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("生成中断。");
  } catch (e: any) {
    console.error("Visual Error:", e);
    throw new Error("图像生成失败。");
  }
}
