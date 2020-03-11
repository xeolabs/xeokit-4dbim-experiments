import {Viewer} from "@xeokit/xeokit-sdk/src/viewer/Viewer.js";
import {XKTLoaderPlugin} from "@xeokit/xeokit-sdk/src/plugins/XKTLoaderPlugin/XKTLoaderPlugin.js";
import {GanttData} from "./GanttData/GanttData.js";

class BIM4D {

    constructor(cfg = {}) {

        if (!cfg.canvasElement) {
            throw "Argument expected: canvasElement";
        }

        if (!cfg.ganttContainerElement) {
            throw "Argument expected: ganttContainerElement";
        }

        if (!cfg.currentTimeElement) {
            throw "Argument expected: currentTimeElement";
        }

        if (!cfg.modelId) {
            throw "Argument expected: modelId";
        }

        this._ganttContainerElement = cfg.ganttContainerElement;
        this._currentTimeElement = cfg.currentTimeElement;
        this._modelId = cfg.modelId;

        this.viewer = new Viewer({
            canvasElement: cfg.canvasElement,
            transparent: true
        });

        const viewer = this.viewer;

        viewer.camera.eye = [-2.56, 8.38, 8.27];
        viewer.camera.look = [13.44, 3.31, -14.83];
        viewer.camera.up = [0.10, 0.98, -0.14];

        viewer.scene.xrayMaterial.fillColor = [0.5, 0.5, 0.5];
        viewer.scene.xrayMaterial.fillAlpha = 0.1;
        viewer.scene.xrayMaterial.edgeColor = [0, 0, 0];
        viewer.scene.xrayMaterial.edgeAlpha = 0.3;

        this._xktLoader = new XKTLoaderPlugin(viewer);

        this._data = new GanttData();

        this._updates = [];
        this._numUpdates = 0;

        this._loadModel(() => {

            this.viewer.cameraFlight.jumpTo(this.viewer.scene.aabb);

            this._buildData();

            this._buildUI();

            this.setTime(0);

            done();
        });
    }

    _loadModel(done) {

        const xktLoader = this._xktLoader;

        switch (this._modelId) {

            case "duplex":
                xktLoader.load({
                    src: "./data/duplex/geometry.xkt",
                    metaModelSrc: "./data/duplex/metadata.json",
                    edges: true
                }).on("loaded", done);
                break;

            case "schependomlaan":
                xktLoader.load({
                    src: "./data/schependomlaan/geometry.xkt",
                    metaModelSrc: "./data/schependomlaan/metadata.json",
                    edges: true
                }).on("loaded", done);
                break;

            case "hospital":
                xktLoader.load({
                    src: "./data/WestRiverSideHospital/mechanical/geometry.xkt",
                    metaModelSrc: "./data/WestRiverSideHospital/mechanical/metadata.json",
                    edges: true
                }).on("loaded", () => {
                    xktLoader.load({
                        src: "./data/WestRiverSideHospital/plumbing/geometry.xkt",
                        metaModelSrc: "./data/WestRiverSideHospital/plumbing/metadata.json",
                        edges: true
                    }).on("loaded", () => {
                        xktLoader.load({
                            src: "./data/WestRiverSideHospital/electrical/geometry.xkt",
                            metaModelSrc: "./data/WestRiverSideHospital/electrical/metadata.json",
                            edges: true
                        }).on("loaded", () => {
                            xktLoader.load({
                                src: "./data/WestRiverSideHospital/fireAlarms/geometry.xkt",
                                metaModelSrc: "./data/WestRiverSideHospital/fireAlarms/metadata.json",
                                edges: true
                            }).on("loaded", () => {
                                xktLoader.load({
                                    src: "./data/WestRiverSideHospital/sprinklers/geometry.xkt",
                                    metaModelSrc: "./data/WestRiverSideHospital/sprinklers/metadata.json",
                                    edges: true
                                }).on("loaded", () => {
                                    xktLoader.load({
                                        src: "./data/WestRiverSideHospital/structure/geometry.xkt",
                                        metaModelSrc: "./data/WestRiverSideHospital/structure/metadata.json",
                                        edges: true
                                    }).on("loaded", () => {
                                        xktLoader.load({
                                            src: "./data/WestRiverSideHospital/architectural/geometry.xkt",
                                            metaModelSrc: "./data/WestRiverSideHospital/architectural/metadata.json",
                                            edges: true
                                        }).on("loaded", done);
                                    });
                                });
                            });
                        });
                    });
                });
                break;
            default:
                throw "modelId not recognized - accepted values are 'duplex', 'schependomlaan' and 'hospital'";
        }
    }

    _buildData() {

        const viewer = this.viewer;
        const data = this._data;
        const scene = viewer.scene;
        const metaScene = viewer.metaScene;
        const camera = scene.camera;

        // Get a list of IfcBuildingStoreys, sorted from bottom to top

        const storeyMetaObjects = metaScene.metaObjectsByType["IfcBuildingStorey"];
        const storeyMetaObjectsList = [];

        for (let objectId in storeyMetaObjects) {

            const storeyMetaObject = storeyMetaObjects[objectId];

            const storeyItem = {
                metaObject: storeyMetaObject,
                aabb: scene.getAABB(metaScene.getObjectIDsInSubtree(storeyMetaObject.id)),
                subObjectBins: {}
            };

            storeyMetaObjectsList.push(storeyItem);

            const subObjectIds = storeyMetaObject.getObjectIDsInSubtree();
            for (var i = 0, len = subObjectIds.length; i < len; i++) {
                const subObjectId = subObjectIds[i];
                const entity = scene.objects[subObjectId];
                if (!entity) {
                    continue;
                }
                const subMetaObject = metaScene.metaObjects[subObjectId];
                const subMetaObjectType = subMetaObject.type;
                if (!storeyItem.subObjectBins[subMetaObjectType]) {
                    storeyItem.subObjectBins[subMetaObjectType] = [];
                }
                storeyItem.subObjectBins[subMetaObjectType].push({
                    entity: entity
                });
            }
        }

        storeyMetaObjectsList.sort((item1, item2) => {
            let idx = 0;
            if (camera.xUp) {
                idx = 0;
            } else if (camera.yUp) {
                idx = 1;
            } else {
                idx = 2;
            }
            if (item1.aabb[idx] < item2.aabb[idx]) {
                return -1;
            }
            if (item1.aabb[idx] > item2.aabb[idx]) {
                return 1;
            }
            return 0;
        });

        for (var i = 0, len = storeyMetaObjectsList.length; i < len; i++) {
            const storeyMetaObject = storeyMetaObjectsList[i];
            for (var type in storeyMetaObject.subObjectBins) {
                const bin = storeyMetaObject.subObjectBins[type];

                bin.sort((item1, item2) => {
                    let idx = 0;
                    if (camera.xUp) {
                        idx = 1;
                    } else if (camera.yUp) {
                        idx = 2;
                    } else {
                        idx = 0;
                    }
                    if (item1.entity.aabb[idx] < item2.entity.aabb[idx]) {
                        return -1;
                    }
                    if (item1.entity.aabb[idx] > item2.entity.aabb[idx]) {
                        return 1;
                    }
                    return 0;
                });
            }
        }


        //--------------------------------------------------------------------------------
        // Create Gantt data
        //--------------------------------------------------------------------------------

        const trackNames = ["Track 1", "Track 2", "Track 3", "Track 4", "Track 5"];
        const tracks = [];

        for (var i = 0, len = 10; i < len; i++) {
            const track = data.createTrack(trackNames[i]);
            tracks.push(track);
        }

        data.createTaskType("construct", "construct", "#00FF00");
        data.createTaskType("verify", "verify", "#00FF00");

        let time = 0;
        let trackIdx = 0;

        for (var i = 0, len = storeyMetaObjectsList.length; i < len; i++) {
            const storeyMetaObject = storeyMetaObjectsList[i];

            for (var type in storeyMetaObject.subObjectBins) {
                const bin = storeyMetaObject.subObjectBins[type];

                let trackTime = time;

                for (var j = 0, lenj = bin.length; j < lenj; j++) {

                    const track = tracks[trackIdx];
                    const trackId = track.trackId;
                    const item = bin[j];
                    const entity = item.entity;
                    const objectId = entity.id;

                    trackTime += Math.floor(Math.random() * 10);

                    const duration1 = Math.floor(Math.random() * 20) + 10;
                    const task = data.createTask("construct", trackId, "construct", trackTime, trackTime + duration1);
                    trackTime += duration1;

                    data.linkTask(task.taskId, objectId);

                    // trackTime += Math.floor(Math.random() * 10);
                    // const duration2 = Math.floor(Math.random() * 20) + 1;
                    // const task2 = data.createTask("verify", trackId, "verify", trackTime, trackTime + duration2);
                    //
                    // trackTime += duration2;
                    //
                    // data.linkTask(task2.taskId, objectId);

                    trackIdx++;

                    if (trackIdx >= tracks.length) {
                        trackIdx = 0;
                    }
                }

                time = Math.floor(trackTime / 2);
            }
        }
    }

    _buildUI() {

        const data = this._data;
        const ganttContainerElement = this._ganttContainerElement;
        const totalDuration = (data.endTime - data.startTime);
        const tracks = data.tracks;
        const taskTypes = data.taskTypes;
        const widthTimePixels = 2;

        // Build times track at the top

        {
            const timesTable = document.createElement("table");
            timesTable.style["width"] = "" + (totalDuration * widthTimePixels) + "px";
            timesTable.classList.add("ganttTimesTable");

            ganttContainerElement.appendChild(timesTable);

            const timesRow = document.createElement("tr");
            timesRow.style["padding"] = "0";
            timesTable.appendChild(timesRow);

            for (var time = data.startTime, timeInc = 100; time <= data.endTime; time += timeInc) {
                const timesCell = document.createElement("td");
                timesCell.style["width"] = "" + ((widthTimePixels * timeInc)) + "px";
                timesRow.appendChild(timesCell);
                const timesSpan = document.createElement("span");
                timesCell.appendChild(timesSpan);
                timesSpan.innerText = "" + time;
            }
        }

        // Build task tracks

        const taskClicked = (e) => {
            const td = e.currentTarget;
            const taskId = td.id;
            const task = this._data.tasks[taskId];
            this.setTime(task.startTime);
        };

        for (var trackId in tracks) {

            const track = tracks[trackId];
            const trackTasks = track.tasks;

            const tasksTable = document.createElement("table");
            tasksTable.classList.add("ganttTasksTable");
            tasksTable.style["width"] = "" + (totalDuration * widthTimePixels) + "px";

            ganttContainerElement.appendChild(tasksTable);

            const tasksRow = document.createElement("tr");
            tasksRow.style["padding"] = "0";
            tasksRow["cellspacing"] = "0";
            tasksTable.appendChild(tasksRow);

            for (let j = 0, lenj = trackTasks.length; j < lenj; j++) {

                const task = trackTasks[j];
                const taskType = taskTypes[task.typeId];
                const taskDuration = (task.endTime - task.startTime);
                const durationSinceLast = (j === 0) ? (task.startTime - data.startTime) : (task.startTime - trackTasks[j - 1].endTime);

                if (durationSinceLast > 0) {
                    const tasksSpacerCell = document.createElement("td");
                    const spacerWidth = (Math.floor(durationSinceLast * widthTimePixels));
                    tasksSpacerCell.style["width"] = "" + spacerWidth + "px";
                    tasksSpacerCell.classList.add("taskSpacerCell");
                    tasksRow.appendChild(tasksSpacerCell);
                }

                const tasksCell = document.createElement("td");
                tasksCell.id = "" + task.taskId;
                tasksCell.classList.add("taskCell");
                tasksCell.style["width"] = "" + (Math.floor(taskDuration * widthTimePixels)) + "px";
                tasksCell.style["background-color"] = taskType.color;
                tasksCell.onclick = taskClicked;
                tasksRow.appendChild(tasksCell);
            }
        }
    }

    /**
     * Gets the minimum task time.
     * @returns {*}
     */
    getFirstTime() {
        return this._data.startTime;
    }

    /**
     * Gets the maximum task time.
     * @returns {number}
     */
    getLastTime() {
        return this._data.endTime;
    }

    /**
     * Sets object states according to the given time on the Gantt timeline.
     * @param time
     */
    setTime(time) {

        if (time < this._data.startTime) {
            time = this._data.startTime;
        }

        if (time > this._data.endTime) {
            time = this._data.endTime;
        }

        const viewer = this.viewer;
        const scene = viewer.scene;
        const data = this._data;
        const objects = viewer.scene.objects;
        const tasks = data.tasks;
        const tasksList = data.tasksList;
        const taskTypes = data.taskTypes;
        const linksList = data.linksList;

        //scene.setObjectsXRayed(scene.xrayedObjectIds, true);

        const objectIds = scene.objectIds;

        // Set object visibilities according to the time instant

        for (var i = 0, len = objectIds.length; i < len; i++) {
            const objectId = objectIds[i];
            const object = scene.objects[objectId];
            const objectCreationTime = data.objectCreationTimes[objectId];
            const visible = (objectCreationTime !== null && objectCreationTime !== undefined && objectCreationTime <= time);
            object.xrayed = !visible;
            //object.highlighted = false;
        }

        // Set object colors according to the time instant

        // for (let i = 0, len = tasksList.length; i < len; i++) {
        //     const task = tasksList[i];
        //     if (task.startTime <= time && time <= task.endTime) {
        //         for (let j = 0, lenj = linksList.length; j < lenj; j++) {
        //             const link = linksList[j];
        //             if (task.taskId === link.taskId) {
        //                 const typeId = task.typeId;
        //                 const taskType = taskTypes[typeId];
        //                 if (!taskType) {
        //                     continue;
        //                 }
        //                 const color = taskType.color;
        //                 const objectId = link.objectId;
        //                 const entity = objects[objectId];
        //                 if (!entity) {
        //                     console.error("Object not found: " + objectId);
        //                     continue;
        //                 }
        //                 entity.colorize = color;
        //                 entity.highlighted = true;
        //             }
        //         }
        //     }
        // }

        this._currentTimeElement.innerText = "t = " + time;
    }
}

export {BIM4D};
