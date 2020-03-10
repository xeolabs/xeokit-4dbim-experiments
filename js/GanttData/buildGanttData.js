import {math} from "@xeokit/xeokit-sdk/src/viewer/scene/math/math.js";

/** Populates a GanttData with random data for whatever is in the given xeokit Viewer.
 */
function buildGanttData(viewer, ganttData) {

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

            if (i > 10) {
                break;
            }
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
        const track = ganttData.createTrack(trackNames[i]);
        tracks.push(track);
    }

    ganttData.createTaskType("construct", "construct", "#FF0000");
    ganttData.createTaskType("verify", "verify", "#00FF00");

    let time = 0;
    let trackIdx = 0;

    for (var i = 0, len = storeyMetaObjectsList.length; i < len; i++) {
        const storeyMetaObject = storeyMetaObjectsList[i];
        for (var type in storeyMetaObject.subObjectBins) {
            const bin = storeyMetaObject.subObjectBins[type];

            time = 0;

            for (var j = 0, lenj = bin.length; j < lenj; j++) {

                const track = tracks[trackIdx];
                const trackId = track.trackId;

                const item = bin[j];
                const entity = item.entity;
                const objectId = entity.id;

                time += Math.floor(Math.random() * 10);

                const duration1 = Math.floor(Math.random() * 20) + 1;
                const task = ganttData.createTask("construct", trackId, "construct", time, time + duration1);

                console.log("duration1 = " + duration1);
                time += duration1;

                ganttData.linkTask(task.taskId, objectId);

                time += Math.floor(Math.random() * 10);
                const duration2 = Math.floor(Math.random() * 20) + 1;
                console.log("duration2 = " + duration2);
                const task2 = ganttData.createTask("verify", trackId, "verify", time, time + duration2);

                time += duration2;

                ganttData.linkTask(task2.taskId, objectId);

                trackIdx++;

                if (trackIdx >= tracks.length) {
                    trackIdx = 0;
                }
            }
        }
    }
}


export {buildGanttData};

