const express = require('express');
const router = express.Router();
//const{ exec }=require('child_process');  // 'exec' is how we execute codes in command line applications.
const { exec } = require('youtube-dl-exec');    //Node Module youtube-dl-exec
const path = require('path');

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
router.get('/video/', (req, res) => {
    res.render("yt-video", { vidId: "", title: "" });
});

router.get('/video/:vidId', async (req, res) => {
    const vidId = req.params.vidId;
    const videoUrl = `https://www.youtube.com/watch?v=${vidId}`;

    try {
        const title = await getVideoTitle(videoUrl);
        console.log("Title: ",title)
        res.render("yt-video", { vidId, title: title || '' });
    } catch (error) {
        console.error('Error rendering video details:', error);
        res.status(500).send('Error fetching video details');
    }
});

router.post('/video/convert', async (req, res) => {
    const fileName = req.body.fileName;
    const link = req.body.link;
    const qual = req.body.quality;
    let sub = req.body.sub;
    let chap = req.body.chap;

    const outputPath = path.join('files', `${fileName}.mp4`);

    // Module
    
    if(sub>0){ sub = true } else{sub = false}
    if(chap>0){ chap = true } else{chap = false}

    const options={
        format: `${qual}+140`,
        embedThumbnail: true,
        output: outputPath,
        embedSubs  : sub,
        embedChapters: chap,
        cookies: 'cook.txt'
    }

    exec(link, options)
        .then(output => {
            res.download(`./files/${fileName}.mp4`);
        })
        .catch(error => {
            console.error('Error:', error);
        });

    // Using the application using child process
    /*
    if(sub>0){ sub = true } else{sub = "--embed-subs"}
    if(chap>0){ chap = true } else{chap = "--embed-chapters"}

    const cmd = `yt-dlp -f "${qual}+140" ${sub} ${chap} -o "${outputPath}" ${link}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing command:', stderr);
            res.status(500).send('Error converting audio');
            return;
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

