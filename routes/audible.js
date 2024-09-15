const express = require('express');
const router = express.Router();
//const{ exec }=require('child_process');  // 'exec' is how we execute codes in command line applications.
const { exec } = require('youtube-dl-exec');    //Node Module youtube-dl-exec
const path = require('path');
const NodeID3 = require('node-id3');


//const { promisify } = require('util');
//const execPromise = promisify(exec);


async function getVideoTitle(videoUrl) {
    // Module function
    try {
        /*const { stdout } = await exec(videoUrl, {dumpSingleJson: true,noWarnings: true});

        const videoInfo = JSON.parse(stdout); // Parsing the JSON output
        return videoInfo.title; 
        */
        const { stdout } = await exec(videoUrl, {getTitle: true});

        return stdout; 
    } catch (error) {
        console.error('Error fetching YouTube title:', error);
    }

    // Application
    /*
    try {
        const { stdout, stderr } = await execPromise(`yt-dlp --get-title --no-warnings ${videoUrl}`);
        if (stderr) {
            console.error('Error fetching YouTube title:', stderr);
            return null;
        }
        return stdout.trim(); 
    } catch (error) {
        console.error('Error fetching YouTube title:', error);
        return null;
    }
    */
}

// Pages
router.get('/audio/', (req, res) => {
    res.render("yt-audio", { vidId: "", title: "" });
});

router.get('/audio/:vidId', async (req, res) => {
    const vidId = req.params.vidId;
    const videoUrl = `https://www.youtube.com/watch?v=${vidId}`;

    try {
        const title = await getVideoTitle(videoUrl);
        console.log("Title: ",title)
        res.render("yt-audio", { vidId, title:title});
    } catch (error) {
        console.error('Error rendering video details:', error);
        res.status(500).send('Error fetching video details');
    }
});

router.post('/audio/convert', (req, res) => {
    const fileName = req.body.fileName;
    const link = req.body.link;
    const qual = req.body.quality;
    const id3 = req.body.id3;

    let tags = {};
    if (id3 !== '0') {
        tags = {
            title: req.body.title,
            artist: req.body.artist,
            album: req.body.album,
            year: req.body.year,
            comment: req.body.comment
        };
    }

    // Using the node module

    const options = {
        output: `/files/${fileName}`,
        audioQuality: qual,
        embedThumbnail: true,
        extractAudio: true,
        audioFormat: 'mp3',
        cookies: 'cook.txt'
    };

    exec(link, options)
        .then(output => {
            if (id3!=0){
                console.log("writing id3...")
                NodeID3.write(tags, `./files/${fileName}.mp3`)
            }
            res.download(`./files/${fileName}.mp3`);
        })
        .catch(error => {
            console.error('Error:', error);
        });

    /*
    // Using the application using child process
    const outputPath = path.join('files', `${fileName}.mp3`);
    const cmd = `yt-dlp -x --audio-format mp3 --audio-quality ${qual} -o "${outputPath}" ${link}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing command:', stderr);
            res.status(500).send('Error converting audio');
            return;
        }
        if (id3 !== '0') {
            console.log("Writing ID3 tags...");
            NodeID3.write(tags, outputPath);
        }
        res.download(outputPath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Error sending file');
            }
        });
    });
    */
});


module.exports = router;
