const webpack = require('webpack');
const config = require('./webpack.config');
const {getJson} = require('./getLocalIdent');
const path = require('path');
const fs = require('fs');

webpack(config, (err, stats) => {
    if (err || stats.hasErrors()) {
        console.error(err || stats);
        return;
    }

    const json = getJson();
    const htmlpath = config.output.path+'/index.html';
    let html = fs.readFileSync(htmlpath, 'utf8');
    html = html.replaceAll(/class="(.+?)"/g, (match, names) => {
        console.log(match,names);
        let classnames = names.split(/\s+/).map(n => json[n] || n).join(' ');
        console.log(classnames);
        return `class="${classnames}"`
    });
    fs.writeFileSync(htmlpath, html);

    console.log('build done');

});
