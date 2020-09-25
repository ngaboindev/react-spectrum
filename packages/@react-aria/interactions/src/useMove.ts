/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {HTMLAttributes, useMemo, useRef} from 'react';

interface BaseMoveEvent {
  pointerType: 'mouse' | 'pen' | 'touch' | 'keyboard'
}

interface MoveStartEvent extends BaseMoveEvent{
  type: 'movestart'
}

interface MoveEvent extends BaseMoveEvent{
  type: 'move',
  deltaX: number,
  deltaY: number
}

interface MoveEndEvent extends BaseMoveEvent{
  type: 'moveend'
}

interface MoveProps {
  onMoveStart: (e: MoveStartEvent) => void,
  onMove?: (e: MoveEvent) => void,
  onMoveEnd?: (e: MoveEndEvent) => void
}

const currentTargets: Set<HTMLElement> = new Set();

export function useMove(props: MoveProps): HTMLAttributes<HTMLElement> {
  let {onMoveStart, onMove, onMoveEnd} = props;

  let state = useRef({movedAfterDown: false, previousPosition: null});

  let moveProps = useMemo(() => {
    let moveProps: HTMLAttributes<HTMLElement> = {};

    let start = (target?: any) => {
      // Only move innermost element that is using useMove, not potential parents.
      if (target) {
        if ([...currentTargets].some(e => e.contains(target))) {
          return false;
        }
        currentTargets.add(target);
      }
      state.current.movedAfterDown = false;
      return true;
    };
    let move = (pointerType: BaseMoveEvent['pointerType'], deltaX: number, deltaY: number) => {
      if (!state.current.movedAfterDown) {
        state.current.movedAfterDown = true;
        onMoveStart({
          type: 'movestart',
          pointerType
        });
      }
      onMove({
        type: 'move',
        pointerType,
        deltaX: deltaX,
        deltaY: deltaY
      });
    };
    let end = (pointerType: BaseMoveEvent['pointerType'], target?: any) => {
      if (target) {
        for (let e of currentTargets) {
          // The cursor might be let go on some parent element.
          if (target.contains(e)) {
            currentTargets.delete(e);
          }
        }
      }
      if (state.current.movedAfterDown) {
        onMoveEnd({
          type: 'moveend',
          pointerType
        });
      }
    };

    if (typeof PointerEvent === 'undefined') {
      let onMouseMove = (e: MouseEvent) => {
        move('mouse', e.movementX, e.movementY);
      };
      let onMouseUp = (e: MouseEvent) => {
        end('mouse', e.target);
        window.removeEventListener('mousemove', onMouseMove, false);
        window.removeEventListener('mouseup', onMouseUp, false);
      };
      moveProps.onMouseDown = (e: React.MouseEvent) => {
        if (start(e.target)) {
          window.addEventListener('mousemove', onMouseMove, false);
          window.addEventListener('mouseup', onMouseUp, false);
        }
      };

      let onTouchMove = (e: TouchEvent) => {
        // TODO which touch?
        let {pageX, pageY} = e.targetTouches[0];
        move('touch', pageX - state.current.previousPosition.pageX, pageY - state.current.previousPosition.pageY);
        state.current.previousPosition = {pageX, pageY};
      };
      let onTouchEnd = (e: TouchEvent) => {
        end('touch', e.target);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };
      moveProps.onTouchStart = (e: React.TouchEvent) => {
        if (start(e.target)) {
          let {pageX, pageY} = e.targetTouches[0];
          state.current.previousPosition = {pageX, pageY};
          window.addEventListener('touchmove', onTouchMove, {passive: true});
          window.addEventListener('touchend', onTouchEnd, {passive: true});
          window.addEventListener('touchcancel', onTouchEnd, {passive: true});
        }
      };
    } else {
      let onPointerMove = (e: PointerEvent) => {
        // @ts-ignore
        let pointerType: BaseMoveEvent['pointerType'] = e.pointerType || 'mouse';

        // Problems with PointerEvent#movementX/movementY:
        // 1. it is always 0 on macOS Safari.
        // 2. On Chrome Android, it's scaled by devicePixelRatio, but not on Chrome macOS
        move(pointerType, e.pageX - state.current.previousPosition.pageX, e.pageY - state.current.previousPosition.pageY);
        state.current.previousPosition = {pageX: e.pageX, pageY: e.pageY};
      };

      let onPointerUp = (e: PointerEvent) => {
        // @ts-ignore
        let pointerType: BaseMoveEvent['pointerType'] = e.pointerType || 'mouse';

        end(pointerType, e.target);
        window.removeEventListener('pointermove', onPointerMove, false);
        window.removeEventListener('pointerup', onPointerUp, false);
        window.removeEventListener('pointercancel', onPointerUp, false);
      };

      moveProps.onPointerDown = (e: React.PointerEvent) => {
        if (start(e.target)) {
          state.current.previousPosition = {pageX: e.pageX, pageY: e.pageY};
          window.addEventListener('pointermove', onPointerMove, false);
          window.addEventListener('pointerup', onPointerUp, false);
          window.addEventListener('pointercancel', onPointerUp, false);
        }
      };
    }

    let triggetKeyboardMove = (deltaX: number, deltaY: number) => {
      start();
      move('keyboard', deltaX, deltaY);
      end('keyboard');
    };

    moveProps.onKeyDown = (e) => {
      if (e.currentTarget !== e.target) {
        return;
      }
      switch (e.key) {
        case 'Left':
        case 'ArrowLeft':
          triggetKeyboardMove(-1, 0);
          break;
        case 'Right':
        case 'ArrowRight':
          triggetKeyboardMove(1, 0);
          break;
        case 'Up':
        case 'ArrowUp':
          triggetKeyboardMove(0, -1);
          break;
        case 'Down':
        case 'ArrowDown':
          triggetKeyboardMove(0, 1);
          break;
      }
    };

    return moveProps;
  }, [state, onMoveStart, onMove, onMoveEnd]);

  return moveProps;
}
