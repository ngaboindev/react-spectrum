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

/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

import {action} from '@storybook/addon-actions';
import React, {useState} from 'react';
import {storiesOf} from '@storybook/react';
import {useMove} from '../';

storiesOf('useMove', module)
  .add(
    'Log',
    () => {
      let props = useMove({
        onMoveStart(e) { action('onMoveStart')(JSON.stringify(e)); },
        onMove(e) { action('onMove')(JSON.stringify(e)); },
        onMoveEnd(e) { action('onMoveEnd')(JSON.stringify(e)); }
      });

      return <div {...props} style={{width: '200px', height: '200px', background: 'white', border: '1px solid black', touchAction: 'none'}} />;
    }
  )
  .add(
    'Ball',
    () => {
      let [state, setState] = useState({x: 0, y: 0, color: 'black'});

      let props = useMove({
        onMoveStart() { setState((state) => ({...state, color: 'red'})); },
        onMove(e) { setState((state) => ({...state, x: state.x + e.deltaX, y: state.y + e.deltaY})); },
        onMoveEnd() { setState((state) => ({...state, color: 'black'})); }
      });

      return (<div style={{width: '200px', height: '200px', background: 'white', border: '1px solid black', position: 'relative', touchAction: 'none'}}>
        <div tabIndex={0} {...props} style={{width: '30px', height: '30px', borderRadius: '100%', position: 'absolute', left: state.x + 'px', top: state.y + 'px', background: state.color}} />
      </div>);
    }
  )
  .add(
    'Ball nested',
    () => {
      let [ballState, setBallState] = useState({x: 0, y: 0, color: 'black'});
      let [boxState, setBoxState] = useState({x: 100, y: 100, color: 'grey'});

      let ballProps = useMove({
        onMoveStart() { setBallState((state) => ({...state, color: 'red'})); },
        onMove(e) { setBallState((state) => ({...state, x: state.x + e.deltaX, y: state.y + e.deltaY})); },
        onMoveEnd() { setBallState((state) => ({...state, color: 'black'})); }
      });
      let boxProps = useMove({
        onMoveStart() { setBoxState((state) => ({...state, color: 'orange'})); },
        onMove(e) { setBoxState((state) => ({...state, x: state.x + e.deltaX, y: state.y + e.deltaY})); },
        onMoveEnd() { setBoxState((state) => ({...state, color: 'grey'})); }
      });

      return (
        <div tabIndex={0} {...boxProps} style={{width: '100px', height: '100px', touchAction: 'none', position: 'absolute', left: boxState.x + 'px', top: boxState.y + 'px', background: boxState.color}}>
          <div tabIndex={0} {...ballProps} style={{width: '30px', height: '30px', borderRadius: '100%', position: 'absolute', left: ballState.x + 'px', top: ballState.y + 'px', background: ballState.color}} />
        </div>
      );
    }
  );
