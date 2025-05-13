// 导出接口
export type { IAIService, IAIServiceFactory, AIServiceConfig } from './AIServiceInterface';

// 导出基础类
export { BaseAIService } from './BaseAIService';

// 导出具体服务实现
export { GeminiAIService } from './GeminiAIService';
export { OpenAIService } from './OpenAIService';
export { XAIService } from './XAIService';

// 导出工厂类
export { 
  GeminiAIServiceFactory, 
  OpenAIServiceFactory, 
  XAIServiceFactory,
  AIServiceFactoryManager 
} from './AIServiceFactory';

// 导出服务管理类
export { AIServiceManager } from './AIServiceManager';

// 提供默认导出 - 服务管理器实例
import { AIServiceManager } from './AIServiceManager';
export default AIServiceManager.getInstance(); 