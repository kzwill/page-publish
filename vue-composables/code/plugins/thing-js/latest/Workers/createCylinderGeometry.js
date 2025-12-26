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
 * See https://github.com/CesiumGS/cesium/blob/main/LICENSE.md for full licensing details.
 */

define(['./CylinderGeometry-be9fd7db', './defaultValue-69ee94f4', './GeometryOffsetAttribute-4d39b441', './RuntimeError-ac440aa5', './Transforms-c444c5a1', './Matrix2-2baea4e7', './ComponentDatatype-07fbb0d4', './WebGLConstants-f63312fc', './_commonjsHelpers-3aae1032-15991586', './combine-0259f56f', './CylinderGeometryLibrary-3c958a1d', './GeometryAttribute-715c53e3', './GeometryAttributes-1b4134a9', './IndexDatatype-0b020dfb', './VertexFormat-e68722dd'], (function (CylinderGeometry, defaultValue, GeometryOffsetAttribute, RuntimeError, Transforms, Matrix2, ComponentDatatype, WebGLConstants, _commonjsHelpers3aae1032, combine, CylinderGeometryLibrary, GeometryAttribute, GeometryAttributes, IndexDatatype, VertexFormat) { 'use strict';

  function createCylinderGeometry(cylinderGeometry, offset) {
    if (defaultValue.defined(offset)) {
      cylinderGeometry = CylinderGeometry.CylinderGeometry.unpack(cylinderGeometry, offset);
    }
    return CylinderGeometry.CylinderGeometry.createGeometry(cylinderGeometry);
  }

  return createCylinderGeometry;

}));
