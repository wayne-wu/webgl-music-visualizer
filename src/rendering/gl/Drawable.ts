import {gl} from '../../globals';

abstract class Drawable {
  count: number = 0;

  bufIdx: WebGLBuffer;
  bufPos: WebGLBuffer;
  bufNor: WebGLBuffer;

  idxBound: boolean = false;
  posBound: boolean = false;
  norBound: boolean = false;

  abstract create() : void;

  destory() {
    gl.deleteBuffer(this.bufIdx);
    gl.deleteBuffer(this.bufPos);
    gl.deleteBuffer(this.bufNor);
  }

  generateIdx() {
    this.idxBound = true;
    this.bufIdx = gl.createBuffer();
  }

  generatePos() {
    this.posBound = true;
    this.bufPos = gl.createBuffer();
  }

  generateNor() {
    this.norBound = true;
    this.bufNor = gl.createBuffer();
  }

  bindIdx(): boolean {
    if (this.idxBound) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    }
    return this.idxBound;
  }

  bindPos(): boolean {
    if (this.posBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    }
    return this.posBound;
  }

  bindNor(): boolean {
    if (this.norBound) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    }
    return this.norBound;
  }

  elemCount(): number {
    return this.count;
  }

  drawMode(): GLenum {
    return gl.TRIANGLES;
  }
};

export default Drawable;
