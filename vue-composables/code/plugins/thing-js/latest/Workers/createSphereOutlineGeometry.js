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

define(['./defaultValue-69ee94f4', './Matrix2-2baea4e7', './RuntimeError-ac440aa5', './EllipsoidOutlineGeometry-c386bccc', './ComponentDatatype-07fbb0d4', './WebGLConstants-f63312fc', './GeometryOffsetAttribute-4d39b441', './Transforms-c444c5a1', './_commonjsHelpers-3aae1032-15991586', './combine-0259f56f', './GeometryAttribute-715c53e3', './GeometryAttributes-1b4134a9', './IndexDatatype-0b020dfb'], (function (defaultValue, Matrix2, RuntimeError, EllipsoidOutlineGeometry, ComponentDatatype, WebGLConstants, GeometryOffsetAttribute, Transforms, _commonjsHelpers3aae1032, combine, GeometryAttribute, GeometryAttributes, IndexDatatype) { 'use strict';

  /**
   * A description of the outline of a sphere.
   *
   * @alias SphereOutlineGeometry
   * @constructor
   *
   * @param {Object} [options] Object with the following properties:
   * @param {Number} [options.radius=1.0] The radius of the sphere.
   * @param {Number} [options.stackPartitions=10] The count of stacks for the sphere (1 greater than the number of parallel lines).
   * @param {Number} [options.slicePartitions=8] The count of slices for the sphere (Equal to the number of radial lines).
   * @param {Number} [options.subdivisions=200] The number of points per line, determining the granularity of the curvature .
   *
   * @exception {DeveloperError} options.stackPartitions must be greater than or equal to one.
   * @exception {DeveloperError} options.slicePartitions must be greater than or equal to zero.
   * @exception {DeveloperError} options.subdivisions must be greater than or equal to zero.
   *
   * @example
   * const sphere = new Cesium.SphereOutlineGeometry({
   *   radius : 100.0,
   *   stackPartitions : 6,
   *   slicePartitions: 5
   * });
   * const geometry = Cesium.SphereOutlineGeometry.createGeometry(sphere);
   */
  function SphereOutlineGeometry(options) {
    const radius = defaultValue.defaultValue(options.radius, 1.0);
    const radii = new Matrix2.Cartesian3(radius, radius, radius);
    const ellipsoidOptions = {
      radii: radii,
      stackPartitions: options.stackPartitions,
      slicePartitions: options.slicePartitions,
      subdivisions: options.subdivisions,
    };

    this._ellipsoidGeometry = new EllipsoidOutlineGeometry.EllipsoidOutlineGeometry(ellipsoidOptions);
    this._workerName = "createSphereOutlineGeometry";
  }

  /**
   * The number of elements used to pack the object into an array.
   * @type {Number}
   */
  SphereOutlineGeometry.packedLength = EllipsoidOutlineGeometry.EllipsoidOutlineGeometry.packedLength;

  /**
   * Stores the provided instance into the provided array.
   *
   * @param {SphereOutlineGeometry} value The value to pack.
   * @param {Number[]} array The array to pack into.
   * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
   *
   * @returns {Number[]} The array that was packed into
   */
  SphereOutlineGeometry.pack = function (value, array, startingIndex) {

    return EllipsoidOutlineGeometry.EllipsoidOutlineGeometry.pack(
      value._ellipsoidGeometry,
      array,
      startingIndex
    );
  };

  const scratchEllipsoidGeometry = new EllipsoidOutlineGeometry.EllipsoidOutlineGeometry();
  const scratchOptions = {
    radius: undefined,
    radii: new Matrix2.Cartesian3(),
    stackPartitions: undefined,
    slicePartitions: undefined,
    subdivisions: undefined,
  };

  /**
   * Retrieves an instance from a packed array.
   *
   * @param {Number[]} array The packed array.
   * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
   * @param {SphereOutlineGeometry} [result] The object into which to store the result.
   * @returns {SphereOutlineGeometry} The modified result parameter or a new SphereOutlineGeometry instance if one was not provided.
   */
  SphereOutlineGeometry.unpack = function (array, startingIndex, result) {
    const ellipsoidGeometry = EllipsoidOutlineGeometry.EllipsoidOutlineGeometry.unpack(
      array,
      startingIndex,
      scratchEllipsoidGeometry
    );
    scratchOptions.stackPartitions = ellipsoidGeometry._stackPartitions;
    scratchOptions.slicePartitions = ellipsoidGeometry._slicePartitions;
    scratchOptions.subdivisions = ellipsoidGeometry._subdivisions;

    if (!defaultValue.defined(result)) {
      scratchOptions.radius = ellipsoidGeometry._radii.x;
      return new SphereOutlineGeometry(scratchOptions);
    }

    Matrix2.Cartesian3.clone(ellipsoidGeometry._radii, scratchOptions.radii);
    result._ellipsoidGeometry = new EllipsoidOutlineGeometry.EllipsoidOutlineGeometry(scratchOptions);
    return result;
  };

  /**
   * Computes the geometric representation of an outline of a sphere, including its vertices, indices, and a bounding sphere.
   *
   * @param {SphereOutlineGeometry} sphereGeometry A description of the sphere outline.
   * @returns {Geometry|undefined} The computed vertices and indices.
   */
  SphereOutlineGeometry.createGeometry = function (sphereGeometry) {
    return EllipsoidOutlineGeometry.EllipsoidOutlineGeometry.createGeometry(
      sphereGeometry._ellipsoidGeometry
    );
  };

  function createSphereOutlineGeometry(sphereGeometry, offset) {
    if (defaultValue.defined(offset)) {
      sphereGeometry = SphereOutlineGeometry.unpack(sphereGeometry, offset);
    }
    return SphereOutlineGeometry.createGeometry(sphereGeometry);
  }

  return createSphereOutlineGeometry;

}));
