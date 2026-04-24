import { useState, useRef, useEffect } from "react";
import "./StickerNote.scss";

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
);

interface StickerNoteProps {
    onClose: () => void;
}

const StickerNote: React.FC<StickerNoteProps> = ({ onClose }) => {
    const [content, setContent] = useState("");
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ width: 280, height: 320 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const noteRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains('sticker-note-header')) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
            if (isResizing) {
                const deltaX = e.clientX - resizeStart.x;
                const deltaY = e.clientY - resizeStart.y;
                setSize({
                    width: Math.max(200, resizeStart.width + deltaX),
                    height: Math.max(200, resizeStart.height + deltaY)
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset, resizeStart]);

    return (
        <div
            ref={noteRef}
            className="sticker-note"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="sticker-note-header">
                <span className="sticker-note-title">📝 Meeting Note</span>
                <span
                    className="sticker-note-close"
                    onClick={onClose}
                >
                    <CloseIcon />
                </span>
            </div>
            <textarea
                className="sticker-note-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your meeting notes here..."
                onClick={(e) => e.stopPropagation()}
            />
            <div 
                className="sticker-note-resize-handle"
                onMouseDown={handleResizeStart}
            />
        </div>
    );
};

export default StickerNote;
