export class Settings {
    static masksPer10Cm = 12;
    static maskHeight = 36;
    static maskWidth = 32;
    static canvasWidth = -1; //4096 => 106 cm
    static canvasHeight = -1;
    static gridSize = 90
    static updateCanvasDimensions() {
        Settings.canvasWidth = 4096 * Settings.masksPer10Cm / 10
        Settings.canvasHeight = 4096 * Settings.masksPer10Cm / 10
    }
}
Settings.updateCanvasDimensions()