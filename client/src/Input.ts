export class Input {
  private targetAngle: number = 0;
  private canvas: HTMLCanvasElement;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isMobile: boolean;
  private joystickActive: boolean = false;
  private joystickCenter: { x: number; y: number } = { x: 0, y: 0 };
  
  // Bound handlers для правильного удаления
  private boundMouseMove: (e: MouseEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchMove = this.onTouchMove.bind(this);
    this.boundTouchEnd = this.onTouchEnd.bind(this);
    
    this.setupListeners();
  }
  
  private setupListeners(): void {
    if (this.isMobile) {
      this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
      this.canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      this.canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    } else {
      this.canvas.addEventListener('mousemove', this.boundMouseMove);
    }
  }
  
  private onMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.updateAngle();
  }
  
  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    
    // Виртуальный джойстик - центр там где коснулись
    this.joystickActive = true;
    this.joystickCenter = { x: touch.clientX, y: touch.clientY };
    this.mouseX = touch.clientX;
    this.mouseY = touch.clientY;
  }
  
  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    
    if (this.joystickActive) {
      // Вычисляем угол от центра джойстика
      const dx = touch.clientX - this.joystickCenter.x;
      const dy = touch.clientY - this.joystickCenter.y;
      
      // Минимальное расстояние для регистрации
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        this.targetAngle = Math.atan2(dy, dx);
      }
    } else {
      this.mouseX = touch.clientX;
      this.mouseY = touch.clientY;
      this.updateAngle();
    }
  }
  
  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    // Джойстик остаётся активным, направление сохраняется
  }
  
  private updateAngle(): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.targetAngle = Math.atan2(
      this.mouseY - centerY,
      this.mouseX - centerX
    );
  }
  
  getTargetAngle(): number {
    return this.targetAngle;
  }
  
  destroy(): void {
    if (this.isMobile) {
      this.canvas.removeEventListener('touchstart', this.boundTouchStart);
      this.canvas.removeEventListener('touchmove', this.boundTouchMove);
      this.canvas.removeEventListener('touchend', this.boundTouchEnd);
    } else {
      this.canvas.removeEventListener('mousemove', this.boundMouseMove);
    }
  }
}
