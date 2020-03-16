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

        if (!cfg.playButton) {
            throw "Argument expected: playButton";
        }

        if (!cfg.pauseButton) {
            throw "Argument expected: pauseButton";
        }

        if (!cfg.resetButton) {
            throw "Argument expected: resetButton";
        }

        if (!cfg.modelId) {
            throw "Argument expected: modelId";
        }

        this._ganttContainerElement = cfg.ganttContainerElement;
        this._currentTimeElement = cfg.currentTimeElement;
        this._playButton = cfg.playButton;
        this._pauseButton = cfg.pauseButton;
        this._resetButton = cfg.resetButton;

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
        viewer.scene.xrayMaterial.fillAlpha = 0.01;
        viewer.scene.xrayMaterial.edgeColor = [0, 0, 0];
        viewer.scene.xrayMaterial.edgeAlpha = 0.1;

        viewer.cameraControl.panToPointer = true;
        viewer.cameraControl.pivoting = true;

        this._xktLoader = new XKTLoaderPlugin(viewer);

        this._data = new GanttData();

        this._updates = [];
        this._numUpdates = 0;

        this._time = -1;
        this._playing = false;

        this._setStatus("Loading model & building UI..");

        this._loadModel(() => {

            this.viewer.cameraFlight.jumpTo(this.viewer.scene.aabb);

            this._buildData();

            this._buildUI();

            this.setTime(0);

            viewer.scene.on("tick", (e) => {
                if (!this._playing) {
                    return;
                }
                const elapsedTimeSecs = (e.deltaTime);
                this.setTime(this._time + elapsedTimeSecs);
            });

            this._playButton.onclick = () => {
                this.play();
            };

            this._pauseButton.onclick = () => {
                this.pause();
            };

            this._resetButton.onclick = () => {
                this.reset();
            };
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

            case "tower":
                xktLoader.load({
                    src: "./data/HolterTower/geometry.xkt",
                    metaModelSrc: "./data/HolterTower/metadata.json",
                    edges: true
                }).on("loaded", done);
                break;

            case "conferenceCenter":
                xktLoader.load({
                    src: "./data/OTCConferenceCenter/geometry.xkt",
                    metaModelSrc: "./data/OTCConferenceCenter/metadata.json",
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
                throw "modelId not recognized - accepted values are 'duplex', 'schependomlaan', 'towaer', 'conferenceCenter'  and 'hospital'";
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

        const numTracks = 20;
        const tracks = [];

        for (var i = 0; i < numTracks; i++) {
            const track = data.createTrack("Track " + i);
            tracks.push(track);
        }

        data.createTaskType("construct", "construct", [0, 1, 0]);

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

                    // Create time between tasks

                    // const intervalDuration = Math.round(Math.random() * 10);
                    //
                    // trackTime += intervalDuration;

                    // Create construction task

                    const constructionTaskDuration = Math.round(Math.random() * 50) + 40;
                    const task = data.createTask("construct", trackId, "construct", trackTime, trackTime + constructionTaskDuration);
                    data.linkTask(task.taskId, objectId);

                    trackTime += constructionTaskDuration;

                    trackIdx++;

                    if (trackIdx >= tracks.length) {
                        trackIdx = 0;
                    }
                }

                time = trackTime;
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
            this.pause();
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

            tasksTable.appendChild(tasksRow);

            for (let trackTaskIdx = 0, lenTrackTasks = trackTasks.length; trackTaskIdx < lenTrackTasks; trackTaskIdx++) {

                const task = trackTasks[trackTaskIdx];
                const taskType = taskTypes[task.typeId];
                const taskDuration = (task.endTime - task.startTime);
                const durationSinceLast = (trackTaskIdx === 0) ? (task.startTime - data.startTime) : (task.startTime - trackTasks[trackTaskIdx - 1].endTime);

                if (durationSinceLast > 0) {
                    const tasksSpacerCell = document.createElement("td");
                    const spacerWidth = (Math.round(durationSinceLast * widthTimePixels));
                    tasksSpacerCell.style["width"] = "" + spacerWidth + "px";
                    tasksSpacerCell.classList.add("taskSpacerCell");
                    tasksRow.appendChild(tasksSpacerCell);
                }

                const tasksCell = document.createElement("td");
                tasksCell.id = "" + task.taskId;
                tasksCell.classList.add("taskCell");
                tasksCell.style["width"] = "" + (Math.round(taskDuration * widthTimePixels)) + "px";
                tasksCell.style["background-color"] = taskType.colorHex;
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

        time = Math.round(time);

        if (time < this._data.startTime) {
            time = this._data.startTime;
        }

        if (time > this._data.endTime) {
            time = this._data.endTime;
        }

        if (time === this._time) {
            return;
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

        scene.setObjectsColorized(scene.colorizedObjectIds, null);

        const objectIds = scene.objectIds;

        // Set object visibilities according to the time instant


        for (var i = 0, len = objectIds.length; i < len; i++) {
            const objectId = objectIds[i];
            const object = objects[objectId];
            const objectCreationTime = data.objectCreationTimes[objectId];
            const created = (objectCreationTime !== null && objectCreationTime !== undefined && objectCreationTime <= time);
            object.visible = created;

            //object.highlighted = false;
        }

        for (let i = 0, len = tasksList.length; i < len; i++) {
            const task = tasksList[i];
            if (task.startTime <= time && time <= task.endTime) {
                const taskCell = document.getElementById(task.taskId);
                if (taskCell) {
                    taskCell.scrollIntoView();
                }
                break;
            }
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
                    }
                }
            }
        }

        this._setStatus("t = " + time);

        this._time = time;
    }

    play() {
        this._playing = true;
    }

    pause() {
        this._playing = false;
    }

    reset() {
        this.setTime(0);
        this._playing = false;
    }

    _setStatus(msg) {
        this._currentTimeElement.innerText = msg;
    }
}


export {BIM4D};
