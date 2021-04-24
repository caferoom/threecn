import { Vector3 } from './Vector3.js';

const _vector = /*@__PURE__*/ new Vector3();
const _segCenter = /*@__PURE__*/ new Vector3();
const _segDir = /*@__PURE__*/ new Vector3();
const _diff = /*@__PURE__*/ new Vector3();

const _edge1 = /*@__PURE__*/ new Vector3();
const _edge2 = /*@__PURE__*/ new Vector3();
const _normal = /*@__PURE__*/ new Vector3();

/**
 * class简介：
 * Ray描述在三维空间中一个射线
 * 射线用一个Vector3表示空间的一个起始点
 * 一个Vector3表示射线方向
 * 
 * 注意direction应该是一个归一化的值，否则内部计算会出问题
 * */  
class Ray {

    /**
     * 构造函数
     * @param {*} origin 射线起始点
     * @param {*} direction 射线方向
     */
	constructor( origin = new Vector3(), direction = new Vector3( 0, 0, - 1 ) ) {

		this.origin = origin;
		this.direction = direction;

	}

    /**
     * 设置该射线的参数
     * @param {*} origin 射线起始点
     * @param {*} direction 射线方向
     * @returns 
     */
	set( origin, direction ) {

		this.origin.copy( origin );
		this.direction.copy( direction );

		return this;

	}

    /**
     * 将自身设置为该传入ray的复制
     * @param {*} ray 
     * @returns 
     */
	copy( ray ) {

		this.origin.copy( ray.origin );
		this.direction.copy( ray.direction );

		return this;

	}

    /**
     * 获得这一Ray上给定距离处的3d坐标
     * @param {*} t 指定距离
     * @param {*} target 结果将被复制到这个3d坐标中
     * @returns 
     */
	at( t, target ) {

		if ( target === undefined ) {

			console.warn( 'THREE.Ray: .at() target is now required' );
			target = new Vector3();

		}

		return target.copy( this.direction ).multiplyScalar( t ).add( this.origin );

	}

    /**
     * 改变该射线的direction方向为从射线起始点指向指定3d坐标
     * @param {*} v 指定的3d坐标
     * @returns 
     */
	lookAt( v ) {

		this.direction.copy( v ).sub( this.origin ).normalize();

		return this;

	}

    /**
     * 将Ray（射线）的原点沿着其方向移动给定的距离
     * @param {*} t 移动的距离
     * @returns 
     */
	recast( t ) {

		this.origin.copy( this.at( t, _vector ) );

		return this;

	}

    /**
     * 沿着Ray，获得与所传入3d坐标最接近的点
     * @param {*} point 指定3d位置
     * @param {*} target 结果将被复制到这个3d坐标中
     * @returns 
     */
	closestPointToPoint( point, target ) {

		if ( target === undefined ) {

			console.warn( 'THREE.Ray: .closestPointToPoint() target is now required' );
			target = new Vector3();

		}

		target.subVectors( point, this.origin );

		const directionDistance = target.dot( this.direction );

		if ( directionDistance < 0 ) {

			return target.copy( this.origin );

		}

		return target.copy( this.direction ).multiplyScalar( directionDistance ).add( this.origin );

	}

    /**
     * 获得Ray到所传入3d坐标之间最接近的距离
     * @param {*} point 指定的3d坐标
     * @returns 
     */
	distanceToPoint( point ) {

		return Math.sqrt( this.distanceSqToPoint( point ) );

	}

    /**
     * 获得Ray与传入的3d坐标之间最近的平方距离
     * @param {*} point 指定的3d坐标
     * @returns 
     */
	distanceSqToPoint( point ) {

		const directionDistance = _vector.subVectors( point, this.origin ).dot( this.direction );

		// point在射线的后方

		if ( directionDistance < 0 ) {

			return this.origin.distanceToSquared( point );

		}

		_vector.copy( this.direction ).multiplyScalar( directionDistance ).add( this.origin );

		return _vector.distanceToSquared( point );

	}

    /**
     * 获取Ray（射线）与线段之间的平方距离
     * @param {*} v0 线段的起点
     * @param {*} v1 线段的终点
     * @param {*} optionalPointOnRay （可选）若这个值被给定，它将接收在Ray（射线）上距离线段最近的点
     * @param {*} optionalPointOnSegment （可选）若这个值被给定，它将接收在线段上距离Ray（射线）最近的点
     * @returns 
     */
	distanceSqToSegment( v0, v1, optionalPointOnRay, optionalPointOnSegment ) {

		// from http://www.geometrictools.com/GTEngine/Include/Mathematics/GteDistRaySegment.h
		// 返回线段和射线之间最小的距离
		// 线段使用v0和v1来定义线段的起点和终点
		// 也可以设置两个可选的参数 :
		// - 射线上到线段v0-v1最近的点
		// - 线段v0-v1上到射线最近的点

		_segCenter.copy( v0 ).add( v1 ).multiplyScalar( 0.5 );
		_segDir.copy( v1 ).sub( v0 ).normalize();
		_diff.copy( this.origin ).sub( _segCenter );

		const segExtent = v0.distanceTo( v1 ) * 0.5;
		const a01 = - this.direction.dot( _segDir );
		const b0 = _diff.dot( this.direction );
		const b1 = - _diff.dot( _segDir );
		const c = _diff.lengthSq();
		const det = Math.abs( 1 - a01 * a01 );
		let s0, s1, sqrDist, extDet;

		if ( det > 0 ) {

			// The ray and segment are not parallel.

			s0 = a01 * b1 - b0;
			s1 = a01 * b0 - b1;
			extDet = segExtent * det;

			if ( s0 >= 0 ) {

				if ( s1 >= - extDet ) {

					if ( s1 <= extDet ) {

						// region 0
						// Minimum at interior points of ray and segment.

						const invDet = 1 / det;
						s0 *= invDet;
						s1 *= invDet;
						sqrDist = s0 * ( s0 + a01 * s1 + 2 * b0 ) + s1 * ( a01 * s0 + s1 + 2 * b1 ) + c;

					} else {

						// region 1

						s1 = segExtent;
						s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					}

				} else {

					// region 5

					s1 = - segExtent;
					s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
					sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

				}

			} else {

				if ( s1 <= - extDet ) {

					// region 4

					s0 = Math.max( 0, - ( - a01 * segExtent + b0 ) );
					s1 = ( s0 > 0 ) ? - segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
					sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

				} else if ( s1 <= extDet ) {

					// region 3

					s0 = 0;
					s1 = Math.min( Math.max( - segExtent, - b1 ), segExtent );
					sqrDist = s1 * ( s1 + 2 * b1 ) + c;

				} else {

					// region 2

					s0 = Math.max( 0, - ( a01 * segExtent + b0 ) );
					s1 = ( s0 > 0 ) ? segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
					sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

				}

			}

		} else {

			// Ray and segment are parallel.

			s1 = ( a01 > 0 ) ? - segExtent : segExtent;
			s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
			sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

		}

		if ( optionalPointOnRay ) {

			optionalPointOnRay.copy( this.direction ).multiplyScalar( s0 ).add( this.origin );

		}

		if ( optionalPointOnSegment ) {

			optionalPointOnSegment.copy( _segDir ).multiplyScalar( s1 ).add( _segCenter );

		}

		return sqrDist;

	}

  /**
   * 将Ray（射线）与一个Sphere（球）相交，并返回交点，倘若没有交点将返回null。
   * @param {*} sphere 将会与之相交的Sphere
   * @param {*} target 结果将会被复制到这一Vector3中
   */
	intersectSphere( sphere, target ) {

		_vector.subVectors( sphere.center, this.origin );
    const tca = _vector.dot( this.direction );
		const d2 = _vector.dot( _vector ) - tca * tca;
		const radius2 = sphere.radius * sphere.radius;

    // 如果射线和圆不相交返回null
		if ( d2 > radius2 ) return null;

		const thc = Math.sqrt( radius2 - d2 );

		// t0 = first intersect point - entrance on front of sphere
		const t0 = tca - thc;

		// t1 = second intersect point - exit point on back of sphere
		const t1 = tca + thc;

    // 检测 t0 和 t1 是否都在射线的背面，如果是这样，返回null
		if ( t0 < 0 && t1 < 0 ) return null;

    // 检测是否t0 在射线的背后
    // 如果t0在射线背后，说明这个射线在球体中间，所以返回使用t2计算的第二个点
		// 这是为了总是返回存在于射线前方的第一个点
		if ( t0 < 0 ) return this.at( t1, target );

    // 如果 t0 在射线的前方，那么返回t0这个相交点
		return this.at( t0, target );

	}

    /**
     * 射线是否和传入的圆球相交
     * @param {*} sphere 
     * @returns 
     */
	intersectsSphere( sphere ) {

		return this.distanceSqToPoint( sphere.center ) <= ( sphere.radius * sphere.radius );

	}

    /**
     * 获取射线原点（origin）到平面（Plane）之间的距离。若射线（Ray）不与平面（Plane）相交，则将返回null。
     * @param {*} plane 
     * @returns 
     */
	distanceToPlane( plane ) {

		const denominator = plane.normal.dot( this.direction );

        // 如果平面和射线平行
		if ( denominator === 0 ) {

			// 如果线和平面共平面
			if ( plane.distanceToPoint( this.origin ) === 0 ) {

				return 0;

			}

			// Null比undefined更好，因为undefined表示他是没有定义的

			return null;

		}

		const t = - ( this.origin.dot( plane.normal ) + plane.constant ) / denominator;

		// 如果ray永远不会与平面相交返回 null

		return t >= 0 ? t : null;

	}

    /**
     * 将Ray（射线）与一个Plane相交，并返回交点，倘若没有交点将返回null。
     * @param {*} plane 
     * @param {*} target 结果将被复制到这个3d坐标中
     * @returns 
     */
	intersectPlane( plane, target ) {

		const t = this.distanceToPlane( plane );

		if ( t === null ) {

			return null;

		}

		return this.at( t, target );

	}

  /**
   * 若这一射线与Plane相交，则将返回true
   * @param {*} plane 将被检查是否与之相交的Plane
   */
	intersectsPlane( plane ) {

		// 检测射线是否在该平面上

		const distToPoint = plane.distanceToPoint( this.origin );

		if ( distToPoint === 0 ) {

			return true;

		}

		const denominator = plane.normal.dot( this.direction );

    // 如果平面的normal 与 direction方向超过90°，那么denominator就是负的
    // 如果射线原点在plane的正面，distToPoint是正的，否则是负向
		if ( denominator * distToPoint < 0 ) {

			return true;

		}

    // 射线原点在平面的后方并且指向也背对该平面
    // (如果与平面平行， denominator === 0 也会返回false)
		return false;

	}

  
  /**
   * 将Ray（射线）与一个Box3相交，并返回交点，倘若没有交点将返回null
   * @param {*} box 将会与之相交的Box3
   * @param {*} target 结果将会被复制到这一Vector3中
   */
	intersectBox( box, target ) {

		let tmin, tmax, tymin, tymax, tzmin, tzmax;

		const invdirx = 1 / this.direction.x,
			invdiry = 1 / this.direction.y,
			invdirz = 1 / this.direction.z;

		const origin = this.origin;

		if ( invdirx >= 0 ) {

			tmin = ( box.min.x - origin.x ) * invdirx;
			tmax = ( box.max.x - origin.x ) * invdirx;

		} else {

			tmin = ( box.max.x - origin.x ) * invdirx;
			tmax = ( box.min.x - origin.x ) * invdirx;

		}

		if ( invdiry >= 0 ) {

			tymin = ( box.min.y - origin.y ) * invdiry;
			tymax = ( box.max.y - origin.y ) * invdiry;

		} else {

			tymin = ( box.max.y - origin.y ) * invdiry;
			tymax = ( box.min.y - origin.y ) * invdiry;

		}

		if ( ( tmin > tymax ) || ( tymin > tmax ) ) return null;

		// These lines also handle the case where tmin or tmax is NaN
		// (result of 0 * Infinity). x !== x returns true if x is NaN

		if ( tymin > tmin || tmin !== tmin ) tmin = tymin;

		if ( tymax < tmax || tmax !== tmax ) tmax = tymax;

		if ( invdirz >= 0 ) {

			tzmin = ( box.min.z - origin.z ) * invdirz;
			tzmax = ( box.max.z - origin.z ) * invdirz;

		} else {

			tzmin = ( box.max.z - origin.z ) * invdirz;
			tzmax = ( box.min.z - origin.z ) * invdirz;

		}

		if ( ( tmin > tzmax ) || ( tzmin > tmax ) ) return null;

		if ( tzmin > tmin || tmin !== tmin ) tmin = tzmin;

		if ( tzmax < tmax || tmax !== tmax ) tmax = tzmax;

		//return point closest to the ray (positive side)

		if ( tmax < 0 ) return null;

		return this.at( tmin >= 0 ? tmin : tmax, target );

	}

  /**
   * 若这一射线与Box3相交，则将返回true
   * @param {*} box 将被检查是否与之相交的Box3
   */
	intersectsBox( box ) {


		return this.intersectBox( box, _vector ) !== null;

	}

  /**
   * 将Ray（射线）与一个三角形相交，并返回交点，倘若没有交点将返回null
   * @param {*} a 组成三角形的三个Vector3。
   * @param {*} b 组成三角形的三个Vector3
   * @param {*} c 组成三角形的三个Vector3
   * @param {*} backfaceCulling 结果将会被复制到这一Vector3中
   * @param {*} target 结果将会被复制到这一Vector3中
   */
	intersectTriangle( a, b, c, backfaceCulling, target ) {

		// Compute the offset origin, edges, and normal.

		// from http://www.geometrictools.com/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

		_edge1.subVectors( b, a );
		_edge2.subVectors( c, a );
		_normal.crossVectors( _edge1, _edge2 );

		// Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
		// E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
		//   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
		//   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
		//   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
		let DdN = this.direction.dot( _normal );
		let sign;

		if ( DdN > 0 ) {

			if ( backfaceCulling ) return null;
			sign = 1;

		} else if ( DdN < 0 ) {

			sign = - 1;
			DdN = - DdN;

		} else {

			return null;

		}

		_diff.subVectors( this.origin, a );
		const DdQxE2 = sign * this.direction.dot( _edge2.crossVectors( _diff, _edge2 ) );

		// b1 < 0, no intersection
		if ( DdQxE2 < 0 ) {

			return null;

		}

		const DdE1xQ = sign * this.direction.dot( _edge1.cross( _diff ) );

		// b2 < 0, no intersection
		if ( DdE1xQ < 0 ) {

			return null;

		}

		// b1+b2 > 1, no intersection
		if ( DdQxE2 + DdE1xQ > DdN ) {

			return null;

		}

		// Line intersects triangle, check if ray does.
		const QdN = - sign * _diff.dot( _normal );

		// t < 0, no intersection
		if ( QdN < 0 ) {

			return null;

		}

		// Ray intersects triangle.
		return this.at( QdN / DdN, target );

	}


  /**
   * 对该射线进行矩阵转换
   * @param {*} matrix4 
   */
	applyMatrix4( matrix4 ) {

		this.origin.applyMatrix4( matrix4 );
		this.direction.transformDirection( matrix4 );

		return this;

	}

    /**
     * 判断本射线是否和传入的射线相同
     * @param {*} ray 
     * @returns 
     */
	equals( ray ) {

		return ray.origin.equals( this.origin ) && ray.direction.equals( this.direction );

	}

    /**
     * 返回一个自身的备份
     * @returns 
     */
	clone() {

		return new this.constructor().copy( this );

	}

}

export { Ray };
