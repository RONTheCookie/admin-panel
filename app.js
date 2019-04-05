const express = require("express");
const app = express();
const child = require("mz/child_process");
const port = process.env.PORT || 3000;
require("log-node")();
const log = require("log"); 
const dbOpts = {
    db: process.env.db || `sdab`,
};
if (process.env.DB_ADDR) dbOpts.servers = [{ host: process.env.DB_ADDR.split(":")[0], port: parseInt(process.env.DB_ADDR.split(":")[1], 10) }]
const r = require(`rethinkdbdash`)(dbOpts); // Connect to RethinkDB
app.use(express.static("assets"));
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
    async function getWatchtower() {
        try {
            return (await child.exec("docker logs new_watchtower_1 --tail 10")).map(a => a.toString()).join("");
        } catch (err) {
            return "ERROR: couldn't get watchtower logs."
        }
    }
    const builds = await r.table("builds").orderBy(r.desc("createdAt")).limit(10).run();
    const watchtowerLogs = await getWatchtower();
    res.render("index", { builds, watchtowerLogs });
});

app.listen(port, () => log(`Listening on port ${port}`));