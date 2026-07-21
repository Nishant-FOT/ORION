// ORION Resizable Panel — drag-to-resize + drag-to-reorder with persistent state

import { resolvePanelSize, type PanelSizeConfig, type PanelCategory } from '@/config/panel-registry';

const SIZE_STORAGE_KEY = 'orion-panel-sizes';
const POSITION_STORAGE_KEY = 'orion-panel-positions';

export interface PanelSize {
  width: number;   // grid column span (1–4)
  height: number;  // grid row span (1–4)
}

export interface PanelPosition {
  order: number;   // index within the category grid
}

export interface ResizablePanelOptions {
  panelId: string;
  category: PanelCategory;
  sizeConfig: PanelSizeConfig;
  onResize?: (size: PanelSize) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

/**
 * Static drag state shared across ALL panel instances.
 * Needed because HTML5 DnD only lets us read dataTransfer in the `drop`
 * handler, not in `dragover`. So we track the dragged panel globally.
 */
let _draggingPanelId: string | null = null;
let _draggingElement: HTMLElement | null = null;

export class ResizablePanel {
  private element: HTMLElement;
  private panelId: string;
  private size: PanelSize;
  private sizeConfig: Required<PanelSizeConfig>;
  private resizeHandle: HTMLElement;
  private isResizing = false;
  private startX = 0;
  private startY = 0;
  private startW = 0;
  private startH = 0;
  private onResize?: (size: PanelSize) => void;

  // Bound handlers for cleanup
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: (() => void) | null = null;

  constructor(element: HTMLElement, opts: ResizablePanelOptions) {
    this.element = element;
    this.panelId = opts.panelId;
    this.onResize = opts.onResize;
    this.sizeConfig = resolvePanelSize(opts.sizeConfig, opts.category);
    this.size = this.loadSize();
    this.resizeHandle = this.createResizeHandle();
    this.applySize();
    this.bindResizeEvents();
    this.bindDragEvents();
  }

  // ───── Persistence ─────

  private loadSize(): PanelSize {
    try {
      const stored = JSON.parse(localStorage.getItem(SIZE_STORAGE_KEY) || '{}');
      // Keep the world map visible above the fold while preserving its full width.
      if (this.panelId === 'map-container') {
        delete stored[this.panelId];
        localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(stored));
        return { width: 4, height: 2 };
      }
      const saved = stored[this.panelId];
      if (saved && typeof saved.width === 'number' && typeof saved.height === 'number') {
        return {
          width: Math.max(this.sizeConfig.minWidth, Math.min(this.sizeConfig.maxWidth, saved.width)),
          height: Math.max(this.sizeConfig.minHeight, Math.min(this.sizeConfig.maxHeight, saved.height)),
        };
      }
    } catch { /* ignore */ }
    return { width: this.sizeConfig.defaultWidth, height: this.sizeConfig.defaultHeight };
  }

  private saveSize(): void {
    try {
      const stored = JSON.parse(localStorage.getItem(SIZE_STORAGE_KEY) || '{}');
      stored[this.panelId] = this.size;
      localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(stored));
    } catch { /* ignore */ }
  }

  static loadPosition(panelId: string): PanelPosition | null {
    try {
      const stored = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || '{}');
      return stored[panelId] ?? null;
    } catch { return null; }
  }

  static savePosition(panelId: string, pos: PanelPosition): void {
    try {
      const stored = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || '{}');
      stored[panelId] = pos;
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(stored));
    } catch { /* ignore */ }
  }

  static loadAllPositions(_category: string): Record<string, PanelPosition> {
    try {
      const all = JSON.parse(localStorage.getItem(POSITION_STORAGE_KEY) || '{}');
      const result: Record<string, PanelPosition> = {};
      for (const [key, val] of Object.entries(all)) {
        if (val && typeof val === 'object' && 'order' in (val as PanelPosition)) {
          result[key] = val as PanelPosition;
        }
      }
      return result;
    } catch { return {}; }
  }

  // ───── Size Application ─────

  private applySize(): void {
    const colSpan = Math.max(1, Math.min(4, this.size.width));
    const rowSpan = Math.max(1, Math.min(4, this.size.height));

    this.element.style.gridColumn = `span ${colSpan}`;
    this.element.style.gridRow = `span ${rowSpan}`;

    // Sync breakpoint class for child content responsiveness
    this.element.classList.remove('panel-sm', 'panel-md', 'panel-lg', 'panel-xl');
    if (colSpan >= 3 || rowSpan >= 3) {
      this.element.classList.add('panel-xl');
    } else if (colSpan >= 2 || rowSpan >= 2) {
      this.element.classList.add('panel-lg');
    } else {
      this.element.classList.add('panel-sm');
    }

    this.element.dispatchEvent(new CustomEvent('panel:resize', {
      detail: { width: colSpan, height: rowSpan },
      bubbles: true,
    }));

    this.onResize?.(this.size);
  }

  // ───── Resize Handle ─────

  private createResizeHandle(): HTMLElement {
    const h = document.createElement('div');
    h.className = 'resize-handle';
    h.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="10" cy="10" r="1.5" fill="currentColor" opacity="0.5"/>
        <circle cx="6" cy="10" r="1.5" fill="currentColor" opacity="0.3"/>
        <circle cx="10" cy="6" r="1.5" fill="currentColor" opacity="0.3"/>
        <circle cx="2" cy="10" r="1.5" fill="currentColor" opacity="0.15"/>
        <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.15"/>
        <circle cx="10" cy="2" r="1.5" fill="currentColor" opacity="0.15"/>
      </svg>
    `;
    h.title = 'Drag to resize';
    this.element.style.position = 'relative';
    this.element.appendChild(h);
    return h;
  }

  private bindResizeEvents(): void {
    this.boundMouseMove = (e: MouseEvent) => this.onMouseMove(e);
    this.boundMouseUp = () => this.onMouseUp();

    this.resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.isResizing = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      const rect = this.element.getBoundingClientRect();
      this.startW = rect.width;
      this.startH = rect.height;
      document.body.style.cursor = 'nwse-resize';
      document.body.style.userSelect = 'none';
      this.element.classList.add('is-resizing');
      document.addEventListener('mousemove', this.boundMouseMove!);
      document.addEventListener('mouseup', this.boundMouseUp!);
    });
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isResizing) return;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    const gridEl = this.element.parentElement;
    if (!gridEl) return;

    // Compute the pixel size of one grid cell from the actual computed columns
    const computedStyle = getComputedStyle(gridEl);
    const gap = parseFloat(computedStyle.gap) || 24;
    const gridWidth = gridEl.clientWidth;
    const totalCols = this.detectColumnCount(gridWidth, gap);
    const colWidth = (gridWidth - gap * (totalCols - 1)) / totalCols;

    // Estimate row height: use the grid's auto-rows minmax value or fall back to element measurement
    const autoRows = computedStyle.gridAutoRows;
    let rowHeight = this.startH / Math.max(1, this.size.height);
    const minmatch = autoRows?.match(/minmax\((\d+)px/);
    if (minmatch?.[1]) {
      rowHeight = parseFloat(minmatch[1]);
    }

    const newCols = Math.max(
      this.sizeConfig.minWidth,
      Math.min(this.sizeConfig.maxWidth, Math.round((this.startW + dx) / (colWidth + gap * 0.1)))
    );
    const newRows = Math.max(
      this.sizeConfig.minHeight,
      Math.min(this.sizeConfig.maxHeight, Math.round((this.startH + dy) / (rowHeight + gap * 0.1)))
    );

    if (newCols !== this.size.width || newRows !== this.size.height) {
      this.size.width = newCols;
      this.size.height = newRows;
      this.applySize();
    }
  }

  private onMouseUp(): void {
    if (!this.isResizing) return;
    this.isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    this.element.classList.remove('is-resizing');
    document.removeEventListener('mousemove', this.boundMouseMove!);
    document.removeEventListener('mouseup', this.boundMouseUp!);
    this.saveSize();
  }

  private detectColumnCount(_containerWidth: number, _gap: number): number {
    const gridEl = this.element.parentElement;
    if (!gridEl) return 4;

    const cols = getComputedStyle(gridEl).gridTemplateColumns;
    if (!cols || cols === 'none') return 4;

    // Split on spaces — each entry is one column track (e.g. "250.5px 250.5px ...")
    const tracks = cols.split(/\s+/).filter(Boolean);
    return tracks.length > 0 ? tracks.length : 4;
  }

  // ───── Drag-and-Drop Reorder ─────

  private bindDragEvents(): void {
    // Enable dragging from anywhere on the panel (except resize handle)
    this.element.setAttribute('draggable', 'true');

    this.element.addEventListener('dragstart', (e) => {
      // Don't start drag if clicking on resize handle
      if ((e.target as HTMLElement).closest('.resize-handle')) {
        e.preventDefault();
        return;
      }

      // Don't start drag if clicking on interactive elements
      if ((e.target as HTMLElement).closest('button, input, select, a, [data-no-drag]')) {
        e.preventDefault();
        return;
      }

      e.stopPropagation();

      // Store in the shared static tracker so the grid's drop handler can read it
      _draggingPanelId = this.panelId;
      _draggingElement = this.element;

      e.dataTransfer!.effectAllowed = 'move';
      // setData is required for Firefox, even though we use the static tracker
      e.dataTransfer!.setData('text/plain', this.panelId);

      // Visual feedback after a frame (so the drag image isn't the handle itself)
      requestAnimationFrame(() => {
        this.element.classList.add('is-dragging');
      });
    });

    this.element.addEventListener('dragend', () => {
      this.element.classList.remove('is-dragging');
      _draggingPanelId = null;
      _draggingElement = null;
      // Clean up any stale drop indicators on all panels
      document.querySelectorAll('.drop-before, .drop-after').forEach(el => {
        el.classList.remove('drop-before', 'drop-after');
      });
    });
  }

  // ───── Public API ─────

  destroy(): void {
    this.resizeHandle.remove();
    this.element.classList.remove(
      'panel-sm', 'panel-md', 'panel-lg', 'panel-xl',
      'is-resizing', 'is-dragging', 'drop-before', 'drop-after',
    );
    this.element.style.gridColumn = '';
    this.element.style.gridRow = '';
    this.element.removeAttribute('draggable');
    if (this.boundMouseMove) document.removeEventListener('mousemove', this.boundMouseMove);
    if (this.boundMouseUp) document.removeEventListener('mouseup', this.boundMouseUp);
  }

  getSize(): PanelSize { return { ...this.size }; }

  setSize(size: PanelSize): void {
    this.size = {
      width: Math.max(this.sizeConfig.minWidth, Math.min(this.sizeConfig.maxWidth, size.width)),
      height: Math.max(this.sizeConfig.minHeight, Math.min(this.sizeConfig.maxHeight, size.height)),
    };
    this.applySize();
    this.saveSize();
  }

  getSizeConfig(): Required<PanelSizeConfig> { return { ...this.sizeConfig }; }

  /** Expose static drag state for the grid-level drop handler. */
  static getDraggingId(): string | null { return _draggingPanelId; }
  static getDraggingElement(): HTMLElement | null { return _draggingElement; }
  static clearDragState(): void {
    _draggingPanelId = null;
    _draggingElement = null;
  }
}
