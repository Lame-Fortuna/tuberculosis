const express = require('express');
const router = express.Router();
//const{ exec }=require('child_process');  // 'exec' is how we execute codes in command line applications.
const { exec } = require('youtube-dl-exec');    //Node Module youtube-dl-exec
const path = require('path');
const NodeID3 = require('node-id3');


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
router.get('/audio/', (req, res) => {
    res.render("yt-audio", { vidUrl: "", title: "",embedURL: "" });
});

router.get('/audio/:vidId', async (req, res) => {
    const vidId = req.params.vidId;
    
    try {
        const vidUrl = decode(vidId);
        const info = await getVideoTitle(vidUrl);
        
        console.log("Title: ", info[0])
        res.render("yt-audio", { vidUrl, title: info[0], embedURL: info[1]});
    } catch (error) {
        console.error('Error rendering video details:', error);
        //res.status(500).send('Error fetching video details');
    }
    
    
});

// Conversion
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
        cookies: 'cook.txt',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
