import type { CanvasComponent, ProjectType } from '../types';
import { PIN_EVO_CANVAS_WIDTH, PIN_EVO_CANVAS_HEIGHT, FLEX_CANVAS_WIDTH, FLEX_CANVAS_HEIGHT } from '../types';

interface SizeHint {
  width?: number;
  height?: number;
}

function getCanvasBounds(projectType: ProjectType | undefined) {
  if (projectType === 'flex') {
    return { width: FLEX_CANVAS_WIDTH, height: FLEX_CANVAS_HEIGHT };
  }

  return { width: PIN_EVO_CANVAS_WIDTH, height: PIN_EVO_CANVAS_HEIGHT };
}

export function resolveComponentSize(
  component: CanvasComponent,
  projectType: ProjectType | undefined,
  hint?: SizeHint,
): { width: number; height: number } {
  const canvas = getCanvasBounds(projectType);

  const widthMode = component.widthMode || 'fixed';
  const heightMode = component.heightMode || 'fixed';

  const fixedWidth = Math.max(1, component.width || 1);
  const fixedHeight = Math.max(1, component.height || 1);

  const wrapWidth = Math.max(1, Math.ceil(hint?.width || fixedWidth));
  const wrapHeight = Math.max(1, Math.ceil(hint?.height || fixedHeight));

  const width = widthMode === 'match_parent'
    ? canvas.width
    : (widthMode === 'wrap_content' ? wrapWidth : fixedWidth);

  const height = heightMode === 'match_parent'
    ? canvas.height
    : (heightMode === 'wrap_content' ? wrapHeight : fixedHeight);

  return { width, height };
}
