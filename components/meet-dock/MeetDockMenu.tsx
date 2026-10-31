import { useRef, useState } from "react";
import { t } from "~utils/i18n";
import type { DockAnchor } from "~hooks/useMeetDockAnchor";

const HOVER_CLOSE_DELAY_MS = 160;

const ToolsIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="md-icon">
        {/* edit_note */}
        <path d="M3 10h11v2H3zm0-4h11v2H3zm0 8h7v2H3zm15.01-3.13.71-.71a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1 0 1.41l-.71.71-2.12-2.12zm-.71.71-5.3 5.3V21h2.12l5.3-5.3-2.12-2.12z" />
    </svg>
);

const NoteIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="md-icon">
        <path d="M17 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h9l6-6V4c0-1.1-.9-2-2-2zm0 13h-4v4H5V4h12v11z" />
    </svg>
);

const CaptionsIcon = ({ off }: { off: boolean }) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="md-icon">
        <path opacity={off ? 0.45 : 1} d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 14h2v2H6zm4 0h8v2h-8zm-4-4h4v2H6zm6 0h6v2h-6z" />
        {off && <path d="M1.62 3.38 20.62 22.38 22.38 20.62 3.38 1.62Z" />}
    </svg>
);

interface MeetDockMenuProps {
    /** Slot next to Meet's control bar; null falls back to a fixed corner. */
    anchor: DockAnchor | null;
    noteEnabled: boolean;
    captionToggleEnabled: boolean;
    captionsHidden: boolean;
    onNote: () => void;
    onToggleCaptions: () => void;
}

/** One round button next to Meet's control bar; hovering it lists our tools above it. */
const MeetDockMenu: React.FC<MeetDockMenuProps> = ({
    anchor,
    noteEnabled,
    captionToggleEnabled,
    captionsHidden,
    onNote,
    onToggleCaptions,
}) => {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout>>();

    const show = () => {
        clearTimeout(closeTimer.current);
        setOpen(true);
    };
    const hideSoon = () => {
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY_MS);
    };
    const run = (action: () => void) => () => {
        action();
        setOpen(false);
    };

    const docked = anchor !== null;
    const style = docked
        ? { left: anchor.left, top: anchor.top, width: anchor.size, height: anchor.size }
        : undefined;
    const classes = [
        'meet-dock-menu',
        docked ? 'docked' : 'fallback',
        docked && !anchor.visible ? 'dock-hidden' : '',
        open ? 'open' : '',
    ].join(' ');

    return (
        <div
            className={classes}
            style={style}
            onMouseEnter={show}
            onMouseLeave={hideSoon}
            onFocus={show}
            onBlur={hideSoon}
        >
            <button
                type="button"
                className="md-trigger"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={t('meet_dock_menu_label')}
                onClick={() => (open ? setOpen(false) : show())}
            >
                <ToolsIcon />
            </button>
            {open && (
                <div className="md-panel" role="menu">
                    {noteEnabled && (
                        <button type="button" role="menuitem" className="md-item" onClick={run(onNote)}>
                            <NoteIcon />
                            <span>{t('add_note')}</span>
                        </button>
                    )}
                    {captionToggleEnabled && (
                        <button type="button" role="menuitem" className="md-item" onClick={run(onToggleCaptions)}>
                            <CaptionsIcon off={captionsHidden} />
                            <span>{captionsHidden ? t('show_captions') : t('hide_captions')}</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MeetDockMenu;
