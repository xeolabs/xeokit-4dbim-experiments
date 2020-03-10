import {Viewer} from "@xeokit/xeokit-sdk/src/viewer/Viewer.js";
import {XKTLoaderPlugin} from "@xeokit/xeokit-sdk/src/plugins/XKTLoaderPlugin/XKTLoaderPlugin.js";
import {loadHospitalModel} from "./loadHospitalModel.js";
import {GanttData} from "./GanttData/GanttData.js";
import {buildGanttData} from "./GanttData/buildGanttData.js";
import {buildGanttUI} from "./GanttData/buildGanttUI.js";
import {loadDuplexModel} from "./loadDuplexModel.js";

class BIM4D {

    constructor(cfg = {}) {

        if (!cfg.canvasElement) {
            throw "Argument expected: canvasElement";
        }

        if (!cfg.ganttElement) {
            throw "Argument expected: ganttElement";
        }

        this.ganttElement = cfg.ganttElement;

        this.viewer = new Viewer({
            canvasElement: cfg.canvasElement,
            transparent: true
        });

        const viewer = this.viewer;

        viewer.camera.eye = [-2.56, 8.38, 8.27];
        viewer.camera.look = [13.44, 3.31, -14.83];
        viewer.camera.up = [0.10, 0.98, -0.14];

        viewer.scene.xrayMaterial.fillColor = [0, 0, 0];
        viewer.scene.xrayMaterial.fillAlpha = 0.0;
        viewer.scene.xrayMaterial.edgeColor = [0, 0, 0];
        viewer.scene.xrayMaterial.edgeAlpha = 0.2;

        this._xktLoader = new XKTLoaderPlugin(viewer);

        this.ganttData = new GanttData();

        this._updates = [];
        this._numUpdates = 0;

        this._initialized = false;
    }

    init(done) {

        if (this._initialized) {
            throw "Already initialized";
        }

        if (!done) {
            throw "Argument expected: done()";
        }

        this._initialized = true;

        loadDuplexModel(this._xktLoader, () => {

            this.viewer.cameraFlight.jumpTo(this.viewer.scene.aabb);

            buildGanttData(this.viewer, this.ganttData);

            buildGanttUI(this.ganttData, this.ganttElement);

            done();
        });
    }

    /**
     * Sets object states according to the given time on the Gantt timeline.
     * @param time
     */
    setTime(time) {

        const viewer = this.viewer;
        const scene = viewer.scene;
        const ganttData = this.ganttData;
        const objects = viewer.scene.objects;
        const tasks = ganttData.tasks;
        const tasksList = ganttData.tasksList;
        const taskTypes = ganttData.taskTypes;
        const linksList = ganttData.linksList;

        scene.setObjectsColorized(scene.colorizedObjectIds, null);

        const objectIds = scene.objectIds;

        // Set object visibilities according to the time instant

        for (var i = 0, len = objectIds.length; i < len; i++) {
            const objectId = objectIds[i];
            const object = scene.objects[objectId];
            const objectCreationTime = ganttData.objectCreationTimes[objectId];
            const visible = (objectCreationTime !== null && objectCreationTime !== undefined && objectCreationTime <= time);
            object.visible = visible;
            //object.highlighted = false;
        }

        // Set object colors according to the time instant

        for (let i = 0, len = tasksList.length; i < len; i++) {
            const task = tasksList[i];
            if (task.startTime <= time && time <= task.endTime) {
                for (let j = 0, lenj = linksList.length; j < lenj; j++) {
                    const link = linksList[j];
                    if (task.taskId === link.taskId) {
                        const typeId = task.typeId;
                        const taskType = taskTypes[typeId];
                        if (!taskType) {
                            continue;
                        }
                        const color = taskType.color;
                        const objectId = link.objectId;
                        const entity = objects[objectId];
                        if (!entity) {
                            console.error("Object not found: " + objectId);
                            continue;
                        }
                        entity.colorize = color;
                        entity.highlighted = true;
                    }
                }
            }
        }
    }
}

export {BIM4D};
