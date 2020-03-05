/**
 * Loads the West RiverSide Hospital Model
 * @param xktLoader
 * @param done
 */
function loadHospitalModel(xktLoader, done) {

    const mechanical = xktLoader.load({
        id: "mechanical",
        src: "./data/WestRiverSideHospital/mechanical/geometry.xkt",
        metaModelSrc: "./data/WestRiverSideHospital/mechanical/metadata.json",
        edges: true
    });

    // mechanical.on("loaded", () => {
    //
    //     const plumbing = xktLoader.load({
    //         id: "plumbing",
    //         src: "./data/WestRiverSideHospital/plumbing/geometry.xkt",
    //         metaModelSrc: "./data/WestRiverSideHospital/plumbing/metadata.json",
    //         edges: true
    //     });
    //
    //     plumbing.on("loaded", () => {
    //
    //         const electrical = xktLoader.load({
    //             id: "electrical",
    //             src: "./data/WestRiverSideHospital/electrical/geometry.xkt",
    //             metaModelSrc: "./data/WestRiverSideHospital/electrical/metadata.json",
    //             edges: true
    //         });
    //
    //         electrical.on("loaded", () => {
    //
    //             const fireAlarms = xktLoader.load({
    //                 id: "fireAlarms",
    //                 src: "./data/WestRiverSideHospital/fireAlarms/geometry.xkt",
    //                 metaModelSrc: "./data/WestRiverSideHospital/fireAlarms/metadata.json",
    //                 edges: true
    //             });
    //
    //             fireAlarms.on("loaded", () => {
    //
    //                 const sprinklers = xktLoader.load({
    //                     id: "sprinklers",
    //                     src: "./data/WestRiverSideHospital/sprinklers/geometry.xkt",
    //                     metaModelSrc: "./data/WestRiverSideHospital/sprinklers/metadata.json",
    //                     edges: true
    //                 });
    //
    //                 sprinklers.on("loaded", () => {

                        const structure = xktLoader.load({
                            id: "structure",
                            src: "./data/WestRiverSideHospital/structure/geometry.xkt",
                            metaModelSrc: "./data/WestRiverSideHospital/structure/metadata.json",
                            edges: true,
                            Zxrayed: true
                        });

                        structure.on("loaded", () => {

                            const architectural = xktLoader.load({
                                id: "architectural",
                                src: "./data/WestRiverSideHospital/architectural/geometry.xkt",
                                metaModelSrc: "./data/WestRiverSideHospital/architectural/metadata.json",
                                edges: true
                            });

                            architectural.on("loaded", () => {

                                done();
                            });
                        });
                //    });
           //     });
    //         });
    //     });
    // });
}

export {loadHospitalModel};