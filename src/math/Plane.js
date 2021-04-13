import { Matrix3 } from './Matrix3.js';
import { Vector3 } from './Vector3.js';

const _vector1 = /*@__PURE__*/ new Vector3();
const _vector2 = /*@__PURE__*/ new Vector3();
const _normalMatrix = /*@__PURE__*/ new Matrix3();

/**
 * class简介：
 * Plane描述在三维空间中无限延伸的二维平面
 * 平面方程用单位长度的法向量和常数表示为海塞范式(Hessian normal form)，即这个平面通过其法向量和坐标原点到这个平面的最短距离来表示。
 *
 * */  


/** 平面   */
class Plane {
  
    /**
     * 构造函数
     * @param {*} normal 该平面的法向量
     * @param {*} constant 该平面到坐标系原点的距离
     */
	constructor( normal = new Vector3( 1, 0, 0 ), constant = 0 ) {

		// 假定normal已经被归一化处理了

		this.normal = normal;
		this.constant = constant;

	}

    /**
     * 设置平面的参数
     * @param {*} normal 该平面的法向量
     * @param {*} constant  该平面到坐标系原点的距离
     * @returns 
     */
	set( normal, constant ) {

		this.normal.copy( normal );
		this.constant = constant;

		return this;

	}

    /**
     * 设置平面的各个参数
     * @param {*} x 该平面法向量的x分量
     * @param {*} y 该平面法向量的y分量
     * @param {*} z 该平面法向量的z分量
     * @param {*} w 该平面到坐标系原点的距离
     * @returns 
     */
	setComponents( x, y, z, w ) {

		this.normal.set( x, y, z );
		this.constant = w;

		return this;

	}

    /**
     * 通过平面上的一点以及法线确定原点到平面的最短距离（常量）
     * @param {*} normal 该平面的归一化法向量
     * @param {*} point  该平面上的一个点
     * @returns 
     * 
     */
	setFromNormalAndCoplanarPoint( normal, point ) {

		this.normal.copy( normal );
        
        // 从坐标原点指向平面上点的向量在normal负方向上的投影
		this.constant = - point.dot( this.normal );

		return this;

	}

    /**
     * 通过传入平面上的3个点确定该平面
     * @param {*} a 
     * @param {*} b 
     * @param {*} c 
     * @returns 
     * 
     * 注意
     * 1. 三个点不能在一条直线上
     * 2. normal的方向不可控
     */
	setFromCoplanarPoints( a, b, c ) {

        // 叉乘的结果是一个和已有两个向量都垂直的向量
        // 通过叉乘得到即垂直于cb又垂直于ab的向量，平面的法向量
		const normal = _vector1.subVectors( c, b ).cross( _vector2.subVectors( a, b ) ).normalize();

        // 通过法向量和平面上任意一个点求得平面
		this.setFromNormalAndCoplanarPoint( normal, a );

		return this;

	}

    /**
     * 将自己设置为一个指定面的复制
     * @param {*} plane 待拷贝面
     * @returns 
     */
	copy( plane ) {

		this.normal.copy( plane.normal );
		this.constant = plane.constant;

		return this;

	}

    /**
     * 归一化法线并相应的调整constant常数
     * @returns 
     * 注意：（如果传入的normal值没有归一化，很多函数会出错）
     */
	normalize() {

		// Note: will lead to a divide by zero if the plane is invalid.

		const inverseNormalLength = 1.0 / this.normal.length();
		this.normal.multiplyScalar( inverseNormalLength );
		this.constant *= inverseNormalLength;

		return this;

	}

    /**
     * 将法向量与常量求反（乘以-1）。
     * @returns 
     */
	negate() {

		this.constant *= - 1;
		this.normal.negate();

		return this;

	}

    /**
     * 求该点到本平面的最短距离（垂线距离）
     * @param {*} point 
     * @returns 
     */
	distanceToPoint( point ) {
        // 该点在normal方向上的投影长度 + 平面到坐标系原点距离
		return this.normal.dot( point ) + this.constant;

	}

    /**
     * 返回球面 sphere 的边缘到平面的最短距离
     * @param {*} sphere 
     * @returns 
     */
	distanceToSphere( sphere ) {

		return this.distanceToPoint( sphere.center ) - sphere.radius;

	}

    /**
     * 获取指定点在平面上的投影点
     * @param {*} point 
     * @param {*} target 
     * @returns 
     */
	projectPoint( point, target ) {

		if ( target === undefined ) {

			console.warn( 'THREE.Plane: .projectPoint() target is now required' );
			target = new Vector3();

		}

		return target.copy( this.normal ).multiplyScalar( - this.distanceToPoint( point ) ).add( point );

	}

    /**
     * 给定线段和平面的交点。如果不相交则返回null。如果线与平面共面，则返回该线段的起始点。
     * @param {*} line line3线段
     * @param {*} target 输出结果保存在这个Vector3对象中
     * @returns 
     */
	intersectLine( line, target ) {

		if ( target === undefined ) {

			console.warn( 'THREE.Plane: .intersectLine() target is now required' );
			target = new Vector3();

		}

        // 获取line线段start点到end点的offset向量
		const direction = line.delta( _vector1 );

        // 获取direction在normal方向上分量的长度
		const denominator = this.normal.dot( direction );

        // 如果该线段所在直线与本平面平行，那denominator就等于0
		if ( denominator === 0 ) {

            // 如果线上一点到平面的距离等于0，说明该线段所在直线在本平面上
            if ( this.distanceToPoint( line.start ) === 0 ) {

				return target.copy( line.start );

			}

			// Unsure if this is the correct method to handle this case.
			return null;

		}

		const t = - ( line.start.dot( this.normal ) + this.constant ) / denominator;

		if ( t < 0 || t > 1 ) {

			return null;

		}

		return target.copy( direction ).multiplyScalar( t ).add( line.start );

	}

    /**
     * 判断一个线段是否与本平面相交
     * @param {*} line 
     * @returns 
     */
	intersectsLine( line ) {

		// Note: 这测试一条线段是否与平面相交，而不是它（或它的端点）是否与其共面。

		const startSign = this.distanceToPoint( line.start );
		const endSign = this.distanceToPoint( line.end );

		return ( startSign < 0 && endSign > 0 ) || ( endSign < 0 && startSign > 0 );

	}

    /**
     * 判断该平面是否和一个box3相交
     * @param {*} box 
     * @returns 
     */
	intersectsBox( box ) {

		return box.intersectsPlane( this );

	}

    /**
     * 判断该平面是否和一个圆相交
     * @param {*} sphere 
     * @returns 
     */
	intersectsSphere( sphere ) {

		return sphere.intersectsPlane( this );

	}

    /**
     * 返回坐标系原点在本平面上的投影
     * @param {*} target 返回值会被放入这个vector3对象
     * @returns 
     */
	coplanarPoint( target ) {

		if ( target === undefined ) {

			console.warn( 'THREE.Plane: .coplanarPoint() target is now required' );
			target = new Vector3();

		}

		return target.copy( this.normal ).multiplyScalar( - this.constant );

	}

    /**
     * 应用四维矩阵对面进行变换
     * @param {*} matrix 要应用的四维矩阵
     * @param {*} optionalNormalMatrix (可选参数) 预先计算好的上述Matrix4参数的法线矩阵
     * @returns 
     * 在平面上应用矩阵。矩阵必须是仿射齐次变换。
     */
	applyMatrix4( matrix, optionalNormalMatrix ) {

        // 先求出正规矩阵
		const normalMatrix = optionalNormalMatrix || _normalMatrix.getNormalMatrix( matrix );

        // 求出坐标系原点在本平面上投影, 再将这个点进行矩阵变换
		const referencePoint = this.coplanarPoint( _vector1 ).applyMatrix4( matrix );

        // 利用正规矩阵求出变换后的法向量
		const normal = this.normal.applyMatrix3( normalMatrix ).normalize();

        // 通过变化后的法向量和平面上一点计算出  左边系原点到平面的距离
		this.constant = - referencePoint.dot( normal );

		return this;

	}

    /**
     * 将平面朝一个方向平移
     * @param {*} offset 移动的向量
     * @returns 
     */
	translate( offset ) {
        // 因为plane是在三维空间中无限延伸的二维平面，所以他的offset仅仅可以是距离坐标原点的距离，是一个标量。
        // 求该offset在normal负方向上的投影
		this.constant -= offset.dot( this.normal );

		return this;

	}

    /**
     * 判断传入的平面是否和自身相等
     * @param {*} plane 
     * @returns 
     */
	equals( plane ) {

		return plane.normal.equals( this.normal ) && ( plane.constant === this.constant );

	}

    /**
     * 返回一个自身的备份
     * @returns 
     */
	clone() {

		return new this.constructor().copy( this );

	}

}

Plane.prototype.isPlane = true;

export { Plane };
