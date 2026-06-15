import type { ProjectType } from '../types';
import { FLEX_CANVAS_WIDTH, PIN_EVO_CANVAS_WIDTH } from '../types';
import { measureText } from './measureText';

export function getAvailableWidth(projectType: ProjectType | undefined, x: number) {
  const canvasWidth = projectType === 'flex' ? FLEX_CANVAS_WIDTH : PIN_EVO_CANVAS_WIDTH;
  return Math.max(1, canvasWidth - x);
}

export function measureWrappedText(text: string, font: string, maxWidth: number) {
  const normalizedMaxWidth = Math.max(1, Math.floor(maxWidth));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return { width: 0, height: 0, lineCount: 0 };
  }

  context.font = font;
  const lineHeight = Math.max(1, measureText('Mg', font).height + 2);
  const lines: string[] = [];

  const pushWordWrappedLine = (input: string) => {
    if (!input) {
      lines.push('');
      return;
    }

    const words = input.split(/\s+/).filter(Boolean);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (context.measureText(candidate).width <= normalizedMaxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }

      // Break long token when no spaces can fit in the available width.
      let chunk = '';
      for (const ch of word) {
        const next = `${chunk}${ch}`;
        if (context.measureText(next).width <= normalizedMaxWidth || chunk.length === 0) {
          chunk = next;
        } else {
          lines.push(chunk);
          chunk = ch;
        }
      }
      currentLine = chunk;
    }

    lines.push(currentLine);
  };

  for (const paragraph of (text || '').split('\n')) {
    pushWordWrappedLine(paragraph);
  }

  const contentWidth = lines.reduce((max, line) => Math.max(max, Math.ceil(context.measureText(line).width)), 0);
  return {
    width: Math.min(Math.max(1, contentWidth), normalizedMaxWidth),
    height: Math.max(1, lines.length * lineHeight),
    lineCount: lines.length,
  };
}
