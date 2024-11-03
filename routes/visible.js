const express = require('express');
const router = express.Router();
//const{ exec }=require('child_process');  // 'exec' is how we execute codes in command line applications.
const { exec } = require('youtube-dl-exec');    //Node Module youtube-dl-exec
const path = require('path');

//const { promisify } = require('util');
//const execPromise = promisify(exec);

function checkyt(url){
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|.+\?.+v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    if (youtubeRegex.test(url)){
        return true}
    else{
        false}
}

async function getVideoTitle(videoUrl) {
    // Module function
    let info = ['title', ''];
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|.+\?.+v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    
    if (checkyt(videoUrl)) {
        // Extract video ID from the URL
        const match = videoUrl.match(youtubeRegex);
        
        const options = {
            getTitle: true,
            cookies: 'cook.txt',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        const { stdout } = await exec(videoUrl, options);
        info[0] = stdout;  

        const vidId = match[5]; // The video ID is captured in the regex
        info[1] = `https://www.youtube-nocookie.com/embed/${vidId}`;
        return info
    } else {
        try {
            const { stdout } = await exec(videoUrl, { dumpSingleJson: true, noWarnings: true });

            const videoInfo = JSON.parse(stdout); // Parsing the JSON output
            info[0] = videoInfo.title;
            info[1] = videoInfo.url;
            return info;

    } catch (error) {
        console.error('Error fetching YouTube title:', error);
    }}

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

function decode(vidId){
    let decodedVidId = vidId.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if necessary
    const padding = decodedVidId.length % 4;
    if (padding > 0) {
        decodedVidId += '='.repeat(4 - padding);
    }

    return atob(decodedVidId);
}

// Pages
router.get('/video/', (req, res) => {
    res.render("yt-video", { vidUrl: "", title: "",embedURL: "" });
});

router.get('/video/:vidId', async (req, res) => {
    const vidId = req.params.vidId;
    const vidUrl = decode(vidId);
    const info = await getVideoTitle(vidUrl);

    try {
        const title = info[0];
        const embedURL = info[1]||'';
        console.log("Title: ", title)
        res.render("yt-video", { vidUrl, title, embedURL});
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
        embedThumbnail: true,
        output: outputPath,
        embedSubs  : sub,
        embedChapters: chap
    };

    if (checkyt(link)) {
        const options={
            format: `${qual}+140`,
            embedThumbnail: true,
            output: outputPath,
            embedSubs  : sub,
            embedChapters: chap,
            cookies: 'cook.txt',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
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

