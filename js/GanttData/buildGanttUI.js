function buildGanttUI(ganttData, ganttElement) {

    if (!ganttData) {
        throw "Argument expected: ganttData";
    }

    if (!ganttElement) {
        throw "Argument expected: containerElement";
    }

    const totalDuration = (ganttData.endTime - ganttData.startTime);
    const tracks = ganttData.tracks;
    const taskTypes = ganttData.taskTypes;
    for (var trackId in tracks) {

        const track = tracks[trackId];
        const tasks = track.tasks;

        const table = document.createElement("table");
        table.style["border"] = "1px solid black";
        table.style["padding"] = "0";
        table.style["margin"] = "0";

        ganttElement.appendChild(table);

        const tr = document.createElement("tr");
        tr.style["padding"] = "0";
        table.appendChild(tr);

        for (let j = 0, lenj = tasks.length; j < lenj; j++) {

            const task = tasks[j];
            const taskType = taskTypes[task.typeId];
            const taskDuration = (task.endTime - task.startTime);

            console.log("taskDuration = " + taskDuration);
            console.log("totalDuration = " + totalDuration);

            const durationSinceLast = (j === 0) ? (task.startTime - ganttData.startTime) : (task.startTime - tasks[j - 1].endTime);

            if (durationSinceLast > 0) {
                const tdSpacer = document.createElement("td");
                const spacerWidth = ((durationSinceLast / totalDuration) * 100);
             //   console.log("spacerWidth = " + spacerWidth);
                tdSpacer.style["width"] = "" + spacerWidth + "%";
                tr.appendChild(tdSpacer);
                const spanSpacer = document.createElement("span");
                tdSpacer.appendChild(spanSpacer);

                spanSpacer.innerText = "--";
            }

            const td = document.createElement("td");
            const taskWidth = ((taskDuration / totalDuration) * 100);
       //     console.log("taskWidth = " + taskWidth);
            td.style["width"] = "" + taskWidth + "%";
            td.style["background-color"] = taskType.color;
            td.style["padding"] = "0";
            tr.appendChild(td);

            const span = document.createElement("span");
            td.appendChild(span);

            span.innerText = "-";

        }
    }
}

export {buildGanttUI};