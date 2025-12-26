/**
 * Cesium - https://github.com/CesiumGS/cesium
 *
 * Copyright 2011-2020 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/master/LICENSE.md for full licensing details.
 */

define(['./pako_inflate-07bdc64d', './createTaskProcessorWorker'], (function (pako_inflate, createTaskProcessorWorker) { 'use strict';

  /**
   * 解压缩数据线程
   * @param {*} parameters
   * @param {*} transferableObjects
   */
  function inflateRawWorker(parameters, transferableObjects) {
    var rawdata = new Uint8Array(parameters.rawData);
    var uncompressedPacket = pako_inflate.pako.inflateRaw(rawdata);
    transferableObjects.push(uncompressedPacket.buffer);
    return {
      uncompressedData: uncompressedPacket.buffer,
    };
  }

  var inflateRawWorker$1 = createTaskProcessorWorker(inflateRawWorker);

  return inflateRawWorker$1;

}));