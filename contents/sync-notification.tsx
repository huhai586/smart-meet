/**
 * 同步通知组件
 * 在 Google Meet 页面上显示同步状态通知（纯 CSS/DOM 实现，不依赖 antd）
 */

import type { PlasmoCSConfig } from "plasmo";
import { useEffect } from "react";

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"],
    all_frames: false
}

const TOAST_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string; duration: number }> = {
    success: { icon: '✓', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f', duration: 4000 },
    error:   { icon: '✕', color: '#ff4d4f', bg: '#fff2f0', border: '#ffccc7', duration: 5000 },
    warning: { icon: '⚠', color: '#faad14', bg: '#fffbe6', border: '#ffe58f', duration: 4000 },
    info:    { icon: 'ℹ', color: '#1677ff', bg: '#e6f7ff', border: '#91d5ff', duration: 3000 },
};

function getContainer(): HTMLElement {
    let el = document.getElementById('sm-toast-container');
    if (!el) {
        el = document.createElement('div');
        el.id = 'sm-toast-container';
        el.style.cssText = [
            'position:fixed', 'top:16px', 'right:16px',
            'z-index:2147483647', 'display:flex', 'flex-direction:column',
            'gap:8px', 'pointer-events:none',
        ].join(';');
        document.body.appendChild(el);
    }
    return el;
}

function showToast(type: string, title: string, content: string) {
    const cfg = TOAST_CONFIG[type] ?? TOAST_CONFIG.info;
    const container = getContainer();

    const toast = document.createElement('div');
    toast.style.cssText = [
        'pointer-events:auto',
        `background:${cfg.bg}`,
        `border:1px solid ${cfg.border}`,
        'border-radius:8px', 'padding:12px 16px',
        'min-width:280px', 'max-width:380px',
        'box-shadow:0 6px 16px rgba(0,0,0,0.12)',
        'display:flex', 'gap:10px', 'align-items:flex-start',
        'opacity:0', 'transform:translateX(20px)',
        'transition:opacity 0.25s ease,transform 0.25s ease',
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        'font-size:14px', 'line-height:1.5', 'cursor:pointer',
    ].join(';');

    const iconEl = document.createElement('span');
    iconEl.textContent = cfg.icon;
    iconEl.style.cssText = `color:${cfg.color};font-size:16px;font-weight:bold;flex-shrink:0;margin-top:1px`;

    const body = document.createElement('div');
    body.style.cssText = 'flex:1;min-width:0';

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.cssText = 'font-weight:600;color:#1f1f1f;margin-bottom:2px';

    const descEl = document.createElement('div');
    descEl.textContent = content;
    descEl.style.cssText = 'color:#555';

    body.appendChild(titleEl);
    body.appendChild(descEl);
    toast.appendChild(iconEl);
    toast.appendChild(body);
    container.appendChild(toast);

    const dismiss = () => {
        clearTimeout(timer);
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) container.remove();
        }, 250);
    };

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    const timer = setTimeout(dismiss, cfg.duration);
    toast.addEventListener('click', dismiss);
}

// 监听来自 background 的通知消息
const SyncNotification = () => {
    useEffect(() => {
        console.log('同步通知组件已加载');

        const messageListener = (msg: any) => {
            if (msg.action === 'show-sync-notification') {
                const { type, title, content } = msg.data;
                console.log('收到通知请求:', { type, title, content });
                showToast(type, title, content);
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    return null;
};

export default SyncNotification;
