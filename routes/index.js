const express = require('express');
const path = require('path');
const fs = require('fs')
const router = express.Router();

// Home Route
router.get('/', (req, res) => {
    res.render("yt");
});

//Work in Progress
router.get('/playlist', (req, res) => {
    res.render("yt-playlist");
});

router.get('/clear', (req, res) => {
    const dirPath = 'files';

    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return res.status(500).send('Internal Server Error');
        }

        if (files.length === 0) {
            console.log('Empty Folder');
            return res.redirect('/');
        }

        // Create an array of deletion promises
        const deletePromises = files.map(file => {
            return new Promise((resolve, reject) => {
                fs.unlink(path.join(dirPath, file), (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting file:', unlinkErr);
                        return reject(unlinkErr);
                    }
                    resolve();
                });
            });
        });

        // Wait for all deletions to complete
        Promise.all(deletePromises)
            .then(() => {
                console.log('All files PURGED');
                return res.redirect('/');
            })
            .catch(() => {
                res.status(500).send('Error clearing some files.');
            });
    });
});

module.exports = router;
