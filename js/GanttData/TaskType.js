/**
 * A task type within a Gantt chart.
 */
class TaskType {

    constructor(typeId, name, color) {

        this.typeId = typeId;

        this.name = name;

        this.color = color;

        this.colorHex = rgbToHex(color)
    }
}

function rgbToHex(rgb) {
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

function componentToHex(c) {
    c = Math.round(c * 100);
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

export {TaskType};