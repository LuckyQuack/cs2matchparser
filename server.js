const express = require('express');
const fileUpload = require('express-fileupload');
const { parseEvent, parseTicks } = require('@laihoe/demoparser2');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(fileUpload());

app.post('/upload', (req, res) => {
    console.log('Received a file upload request');
    
    if (!req.files || Object.keys(req.files).length === 0) {
        console.log('No files were uploaded');
        return res.status(400).send('No files were uploaded.');
    }

    const demoFile = req.files.demoFile;
    const tempFilePath = path.join(__dirname, demoFile.name);
    
    demoFile.mv(tempFilePath, (err) => {
        if (err) {
            console.error('Error saving the file:', err);
            return res.status(500).send('Error saving the file');
        }

        try {
            const roundEndEvents = parseEvent(tempFilePath, "round_end");
            const maxTick = Math.max(...roundEndEvents.map(event => event.tick));

            const fields = ["player_name", "kills_total", "deaths_total", "headshot_kills_total", "mvps", "team_name"];
            const scoreboardData = parseTicks(tempFilePath, fields, [maxTick]);

            console.log('Parsed data:', scoreboardData);

            const scoreboard = { CT: {}, TERRORIST: {} };

            scoreboardData.forEach(player => {
                const { player_name, kills_total, deaths_total, headshot_kills_total, mvps, team_name } = player;

                // Deduce team if team_name is null
                let team = team_name;
                if (!team || !scoreboard[team]) {
                    if (Object.keys(scoreboard.CT).length < 5) {
                        team = 'CT';
                    } else if (Object.keys(scoreboard.TERRORIST).length < 5) {
                        team = 'TERRORIST';
                    } else {
                        console.warn(`Player ${player_name} cannot be assigned to a team`);
                        return;
                    }
                }

                if (!scoreboard[team][player_name]) {
                    scoreboard[team][player_name] = { kills: 0, deaths: 0, headshots: 0, mvps: 0 };
                }

                scoreboard[team][player_name].kills = kills_total;
                scoreboard[team][player_name].deaths = deaths_total;
                scoreboard[team][player_name].headshots = headshot_kills_total;
                scoreboard[team][player_name].mvps = mvps;
            });

            // Calculate KDR and HS%
            Object.keys(scoreboard).forEach(team => {
                Object.keys(scoreboard[team]).forEach(player => {
                    const stats = scoreboard[team][player];
                    stats.kdr = stats.deaths === 0 ? stats.kills : (stats.kills / stats.deaths).toFixed(2);
                    stats.hsPercentage = stats.kills === 0 ? 0 : ((stats.headshots / stats.kills) * 100).toFixed(2);
                });
                scoreboard[team] = Object.fromEntries(
                    Object.entries(scoreboard[team]).sort(([, a], [, b]) => b.kills - a.kills)
                );
            });

            fs.unlinkSync(tempFilePath); // Clean up the temporary file
            res.json(scoreboard);
        } catch (error) {
            console.error('Error parsing demo file:', error);
            res.status(500).send('Error parsing demo file');
        }
    });
});

app.listen(5000, () => console.log('Server started on port 5000'));
