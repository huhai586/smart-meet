import { message } from 'antd';
import { InfoOutlined } from '@ant-design/icons';
import React from 'react';

/**
 * 全局消息管理器
 * 确保同一时间只显示一个消息，避免多个消息同时弹出
 */
class MessageManager {
  private static instance: MessageManager;
  private messageApi: typeof message = message;
  private currentMessageKey: string | null = null;

  private constructor() {
    // 使用全局message实例
    this.messageApi = message;
  }

  public static getInstance(): MessageManager {
    if (!MessageManager.instance) {
      MessageManager.instance = new MessageManager();
    }
    return MessageManager.instance;
  }

  /**
   * 显示成功消息
   */
  public success(content: string, duration: number = 5): void {
    this.destroyCurrentMessage();
    this.messageApi.success({
      content,
      icon: React.createElement(InfoOutlined),
      duration,
    });
  }

  /**
   * 显示错误消息
   */
  public error(content: string, duration: number = 5): void {
    this.destroyCurrentMessage();
    this.messageApi.error({
      content,
      duration,
    });
  }

  /**
   * 显示警告消息
   */
  public warning(content: string, duration: number = 5): void {
    this.destroyCurrentMessage();
    this.messageApi.warning({
      content,
      duration,
    });
  }

  /**
   * 显示信息消息
   */
  public info(content: string, duration: number = 5): void {
    this.destroyCurrentMessage();
    this.messageApi.info({
      content,
      duration,
    });
  }

  /**
   * 显示加载消息
   */
  public loading(content: string, duration: number = 0): void {
    this.destroyCurrentMessage();
    this.messageApi.loading({
      content,
      duration,
    });
  }

  /**
   * 销毁当前消息
   */
  private destroyCurrentMessage(): void {
    // 销毁所有消息，确保清理干净
    this.messageApi.destroy();
    this.currentMessageKey = null;
  }

  /**
   * 销毁所有消息
   */
  public destroyAll(): void {
    this.messageApi.destroy();
    this.currentMessageKey = null;
  }
}

// 导出单例实例
export const messageManager = MessageManager.getInstance();
export default messageManager; 