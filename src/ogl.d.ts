declare module "ogl" {
  export class Renderer {
    [x: string]: any;
    constructor(options?: any);
    gl: WebGLRenderingContext | WebGL2RenderingContext;
    setSize(width: number, height: number): void;
  }

  export class Program {
    constructor(
      gl: WebGLRenderingContext | WebGL2RenderingContext,
      options: any,
    );
    uniforms: any;
  }

  export class Mesh {
    constructor(
      gl: WebGLRenderingContext | WebGL2RenderingContext,
      options: any,
    );
  }

  export class Triangle {
    constructor(gl: WebGLRenderingContext | WebGL2RenderingContext);
  }

  export class Vec2 {
    constructor(x?: number, y?: number);
    set(x: number, y: number): void;
  }
}
